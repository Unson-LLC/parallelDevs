package notify

import (
	"context"
	"flag"
	"fmt"
	"strings"

	"github.com/devflowinc/uzi/pkg/notification"
	"github.com/charmbracelet/log"
	"github.com/peterbourgon/ff/v3/ffcli"
)

var (
	fs          = flag.NewFlagSet("uzi notify", flag.ExitOnError)
	sessionName = fs.String("session", "", "session name")
	agentName   = fs.String("agent", "", "agent name")
	notifType   = fs.String("type", "complete", "notification type (complete, error, progress)")
	port        = fs.Int("port", 9999, "manager notification port")
	CmdNotify   = &ffcli.Command{
		Name:       "notify",
		ShortUsage: "uzi notify --session=SESSION --agent=AGENT --type=TYPE [message]",
		ShortHelp:  "Send a notification to the manager",
		FlagSet:    fs,
		Exec:       executeNotify,
	}
)

func executeNotify(ctx context.Context, args []string) error {
	if *sessionName == "" || *agentName == "" {
		return fmt.Errorf("session and agent names are required")
	}

	// Join remaining args as message
	message := "Task completed"
	if len(args) > 0 {
		message = strings.Join(args, " ")
	}

	// Create notification client
	client := notification.NewNotificationClient(*port, *sessionName, *agentName)

	// Check if manager is healthy
	if err := client.CheckHealth(); err != nil {
		log.Warn("Manager notification server may not be running", "error", err)
	}

	// Send notification based on type
	var err error
	switch *notifType {
	case "complete":
		err = client.NotifyComplete(message)
	case "error":
		err = client.NotifyError(message, fmt.Errorf("agent error"))
	case "progress":
		err = client.NotifyProgress(message, 50) // Default to 50% progress
	default:
		return fmt.Errorf("unknown notification type: %s", *notifType)
	}

	if err != nil {
		return fmt.Errorf("failed to send notification: %w", err)
	}

	log.Info("Notification sent successfully",
		"type", *notifType,
		"session", *sessionName,
		"agent", *agentName)

	return nil
}