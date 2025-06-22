package notification

import (
	"context"
	"testing"
	"time"
)

func TestNotificationServerClient(t *testing.T) {
	// Start notification server
	port := 9998 // Use different port for testing
	server := NewNotificationServer(port)
	
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	
	if err := server.Start(ctx); err != nil {
		t.Fatalf("Failed to start server: %v", err)
	}
	
	// Give server time to start
	time.Sleep(100 * time.Millisecond)
	
	// Create client
	client := NewNotificationClient(port, "test-session", "test-agent")
	
	// Test health check
	if err := client.CheckHealth(); err != nil {
		t.Errorf("Health check failed: %v", err)
	}
	
	// Test sending completion notification
	if err := client.NotifyComplete("Test task completed"); err != nil {
		t.Errorf("Failed to send completion notification: %v", err)
	}
	
	// Test sending error notification
	if err := client.NotifyError("Test error occurred", nil); err != nil {
		t.Errorf("Failed to send error notification: %v", err)
	}
	
	// Test sending progress notification
	if err := client.NotifyProgress("Test in progress", 75); err != nil {
		t.Errorf("Failed to send progress notification: %v", err)
	}
	
	// Give some time for processing
	time.Sleep(100 * time.Millisecond)
	
	// Check received notifications
	count, logs := server.GetStats()
	if count != 3 {
		t.Errorf("Expected 3 notifications, got %d", count)
	}
	
	// Verify notification types
	expectedTypes := []NotificationType{
		NotificationComplete,
		NotificationError,
		NotificationProgress,
	}
	
	for i, notif := range logs {
		if i >= len(expectedTypes) {
			break
		}
		if notif.Type != expectedTypes[i] {
			t.Errorf("Expected notification type %s, got %s", expectedTypes[i], notif.Type)
		}
	}
}

func TestNotificationChannel(t *testing.T) {
	server := NewNotificationServer(9997)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	
	if err := server.Start(ctx); err != nil {
		t.Fatalf("Failed to start server: %v", err)
	}
	
	time.Sleep(100 * time.Millisecond)
	
	// Get notification channel
	notifChan := server.GetNotificationChannel()
	
	// Send a notification
	client := NewNotificationClient(9997, "channel-test", "test-agent")
	go func() {
		time.Sleep(50 * time.Millisecond)
		client.NotifyComplete("Channel test")
	}()
	
	// Wait for notification on channel
	select {
	case notif := <-notifChan:
		if notif.Type != NotificationComplete {
			t.Errorf("Expected complete notification, got %s", notif.Type)
		}
		if notif.SessionName != "channel-test" {
			t.Errorf("Expected session name 'channel-test', got %s", notif.SessionName)
		}
	case <-time.After(1 * time.Second):
		t.Error("Timeout waiting for notification on channel")
	}
}