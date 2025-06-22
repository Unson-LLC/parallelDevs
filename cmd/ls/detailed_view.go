package ls

import (
	"fmt"
	"strings"
	"time"
)

func formatDetailedStatus(status string, isRunning bool) string {
	if isRunning {
		return fmt.Sprintf("\033[33m%-10s\033[0m", "running")
	}

	switch status {
	case "ready":
		return fmt.Sprintf("\033[32m%-10s\033[0m", "ready")
	case "running":
		return fmt.Sprintf("\033[33m%-10s\033[0m", "running")
	case "error":
		return fmt.Sprintf("\033[31m%-10s\033[0m", "error")
	default:
		return fmt.Sprintf("%-10s", status)
	}
}

func formatFileChanges(additions, deletions int) string {
	if additions == 0 && deletions == 0 {
		return "\033[90m  no changes\033[0m"
	}

	addStr := fmt.Sprintf("\033[32m+%d\033[0m", additions)
	delStr := fmt.Sprintf("\033[31m-%d\033[0m", deletions)

	return fmt.Sprintf("%s / %s", addStr, delStr)
}

func formatLastChange(lastChanged time.Time) string {
	if lastChanged.IsZero() {
		return "\033[90mnever\033[0m"
	}

	now := time.Now()
	diff := now.Sub(lastChanged)

	switch {
	case diff < time.Minute:
		return fmt.Sprintf("%ds ago", int(diff.Seconds()))
	case diff < time.Hour:
		return fmt.Sprintf("%dm ago", int(diff.Minutes()))
	case diff < 24*time.Hour:
		return fmt.Sprintf("%dh ago", int(diff.Hours()))
	case diff < 7*24*time.Hour:
		return fmt.Sprintf("%dd ago", int(diff.Hours()/24))
	case diff < 30*24*time.Hour:
		weeks := int(diff.Hours() / (24 * 7))
		return fmt.Sprintf("%dw ago", weeks)
	default:
		return lastChanged.Format("Jan 02")
	}
}

func generateTableSeparator(columns []int) string {
	parts := make([]string, len(columns))
	for i, width := range columns {
		parts[i] = strings.Repeat("-", width)
	}
	return strings.Join(parts, "-+-")
}
