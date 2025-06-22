package notification

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/charmbracelet/log"
)

// NotificationType represents the type of notification
type NotificationType string

const (
	NotificationComplete NotificationType = "complete"
	NotificationError    NotificationType = "error"
	NotificationProgress NotificationType = "progress"
)

// Notification represents a notification from a worker
type Notification struct {
	SessionName string           `json:"session_name"`
	AgentName   string           `json:"agent_name"`
	Type        NotificationType `json:"type"`
	Message     string           `json:"message"`
	Timestamp   time.Time        `json:"timestamp"`
	Metadata    map[string]any   `json:"metadata,omitempty"`
}

// NotificationServer manages incoming notifications from workers
type NotificationServer struct {
	port            int
	notifications   chan Notification
	server          *http.Server
	mu              sync.RWMutex
	receivedCount   int
	notificationLog []Notification
}

// NewNotificationServer creates a new notification server
func NewNotificationServer(port int) *NotificationServer {
	ns := &NotificationServer{
		port:            port,
		notifications:   make(chan Notification, 100),
		notificationLog: make([]Notification, 0),
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/notify", ns.handleNotification)
	mux.HandleFunc("/health", ns.handleHealth)

	ns.server = &http.Server{
		Addr:    fmt.Sprintf(":%d", port),
		Handler: mux,
	}

	return ns
}

// Start starts the notification server
func (ns *NotificationServer) Start(ctx context.Context) error {
	log.Info("Starting notification server", "port", ns.port)

	go func() {
		<-ctx.Done()
		log.Info("Shutting down notification server")
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		ns.server.Shutdown(shutdownCtx)
	}()

	go func() {
		if err := ns.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("Notification server error", "error", err)
		}
	}()

	return nil
}

// GetNotificationChannel returns the channel for receiving notifications
func (ns *NotificationServer) GetNotificationChannel() <-chan Notification {
	return ns.notifications
}

// handleNotification handles incoming notification requests
func (ns *NotificationServer) handleNotification(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var notification Notification
	if err := json.NewDecoder(r.Body).Decode(&notification); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Add timestamp if not provided
	if notification.Timestamp.IsZero() {
		notification.Timestamp = time.Now()
	}

	// Log and store the notification
	ns.mu.Lock()
	ns.receivedCount++
	ns.notificationLog = append(ns.notificationLog, notification)
	ns.mu.Unlock()

	log.Info("Received notification",
		"type", notification.Type,
		"session", notification.SessionName,
		"agent", notification.AgentName,
		"message", notification.Message)

	// Send to channel (non-blocking)
	select {
	case ns.notifications <- notification:
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "received"})
	default:
		// Channel is full
		log.Warn("Notification channel full, dropping notification")
		http.Error(w, "Server busy", http.StatusServiceUnavailable)
	}
}

// handleHealth provides a health check endpoint
func (ns *NotificationServer) handleHealth(w http.ResponseWriter, r *http.Request) {
	ns.mu.RLock()
	count := ns.receivedCount
	ns.mu.RUnlock()

	response := map[string]any{
		"status":             "healthy",
		"notifications_received": count,
		"timestamp":          time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetStats returns statistics about received notifications
func (ns *NotificationServer) GetStats() (int, []Notification) {
	ns.mu.RLock()
	defer ns.mu.RUnlock()
	
	// Return a copy of the log to avoid race conditions
	logCopy := make([]Notification, len(ns.notificationLog))
	copy(logCopy, ns.notificationLog)
	
	return ns.receivedCount, logCopy
}