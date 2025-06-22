package notification

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/charmbracelet/log"
)

// NotificationClient sends notifications to the manager
type NotificationClient struct {
	managerURL  string
	sessionName string
	agentName   string
	httpClient  *http.Client
}

// NewNotificationClient creates a new notification client
func NewNotificationClient(managerPort int, sessionName, agentName string) *NotificationClient {
	return &NotificationClient{
		managerURL:  fmt.Sprintf("http://localhost:%d", managerPort),
		sessionName: sessionName,
		agentName:   agentName,
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

// NotifyComplete sends a completion notification to the manager
func (nc *NotificationClient) NotifyComplete(message string) error {
	return nc.sendNotification(NotificationComplete, message, nil)
}

// NotifyError sends an error notification to the manager
func (nc *NotificationClient) NotifyError(message string, err error) error {
	metadata := map[string]any{}
	if err != nil {
		metadata["error"] = err.Error()
	}
	return nc.sendNotification(NotificationError, message, metadata)
}

// NotifyProgress sends a progress update to the manager
func (nc *NotificationClient) NotifyProgress(message string, progress int) error {
	metadata := map[string]any{
		"progress": progress,
	}
	return nc.sendNotification(NotificationProgress, message, metadata)
}

// sendNotification sends a notification to the manager
func (nc *NotificationClient) sendNotification(notifType NotificationType, message string, metadata map[string]any) error {
	notification := Notification{
		SessionName: nc.sessionName,
		AgentName:   nc.agentName,
		Type:        notifType,
		Message:     message,
		Timestamp:   time.Now(),
		Metadata:    metadata,
	}

	jsonData, err := json.Marshal(notification)
	if err != nil {
		return fmt.Errorf("failed to marshal notification: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, nc.managerURL+"/notify", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := nc.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send notification: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("notification rejected with status: %d", resp.StatusCode)
	}

	log.Debug("Notification sent successfully",
		"type", notifType,
		"session", nc.sessionName,
		"agent", nc.agentName)

	return nil
}

// CheckHealth checks if the manager's notification server is healthy
func (nc *NotificationClient) CheckHealth() error {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, nc.managerURL+"/health", nil)
	if err != nil {
		return fmt.Errorf("failed to create health check request: %w", err)
	}

	resp, err := nc.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("health check failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("health check returned status: %d", resp.StatusCode)
	}

	return nil
}