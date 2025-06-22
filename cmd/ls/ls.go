package ls

import (
	"bytes"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"os/exec"
	"regexp"
	"sort"
	"strings"
	"text/tabwriter"
	"time"

	"github.com/devflowinc/uzi/pkg/config"
	"github.com/devflowinc/uzi/pkg/state"

	"github.com/peterbourgon/ff/v3/ffcli"
)

var (
	fs           = flag.NewFlagSet("uzi ls", flag.ExitOnError)
	configPath   = fs.String("config", config.GetDefaultConfigPath(), "path to config file")
	allSessions  = fs.Bool("a", false, "show all sessions including inactive")
	watchMode    = fs.Bool("w", false, "watch mode - refresh output every second")
	detailedMode = fs.Bool("d", false, "show detailed information")
	CmdLs        = &ffcli.Command{
		Name:       "ls",
		ShortUsage: "uzi ls [-a] [-w] [-d]",
		ShortHelp:  "List active agent sessions",
		FlagSet:    fs,
		Exec:       executeLs,
	}
)

func getGitDiffTotals(sessionName string, stateManager *state.StateManager) (int, int) {
	// Get session state to find worktree path
	states := make(map[string]state.AgentState)
	if data, err := os.ReadFile(stateManager.GetStatePath()); err != nil {
		return 0, 0
	} else {
		if err := json.Unmarshal(data, &states); err != nil {
			return 0, 0
		}
	}

	sessionState, ok := states[sessionName]
	if !ok || sessionState.WorktreePath == "" {
		return 0, 0
	}

	shellCmdString := "git add -A . && git diff --cached --shortstat HEAD && git reset HEAD > /dev/null"

	cmd := exec.Command("sh", "-c", shellCmdString)
	cmd.Dir = sessionState.WorktreePath

	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return 0, 0
	}

	output := out.String()

	insertions := 0
	deletions := 0

	insRe := regexp.MustCompile(`(\d+) insertion(?:s)?\(\+\)`)
	delRe := regexp.MustCompile(`(\d+) deletion(?:s)?\(\-\)`)

	if m := insRe.FindStringSubmatch(output); len(m) > 1 {
		fmt.Sscanf(m[1], "%d", &insertions)
	}
	if m := delRe.FindStringSubmatch(output); len(m) > 1 {
		fmt.Sscanf(m[1], "%d", &deletions)
	}

	return insertions, deletions
}

func getPaneContent(sessionName string) (string, error) {
	cmd := exec.Command("tmux", "capture-pane", "-t", sessionName+":agent", "-p")
	output, err := cmd.Output()
	if err != nil {
		return "", err
	}
	return string(output), nil
}

func getAgentStatus(sessionName string) string {
	content, err := getPaneContent(sessionName)
	if err != nil {
		return "unknown"
	}

	if strings.Contains(content, "esc to interrupt") || strings.Contains(content, "Thinking") {
		return "running"
	}
	return "ready"
}

func formatStatus(status string) string {
	switch status {
	case "ready":
		return "\033[32mready\033[0m" // Green
	case "running":
		return "\033[33mrunning\033[0m" // Orange/Yellow
	default:
		return status
	}
}

func formatTime(t time.Time) string {
	now := time.Now()
	diff := now.Sub(t)

	if diff < time.Hour {
		return fmt.Sprintf("%2dm", int(diff.Minutes()))
	} else if diff < 24*time.Hour {
		return fmt.Sprintf("%2dh", int(diff.Hours()))
	} else if diff < 7*24*time.Hour {
		return fmt.Sprintf("%2dd", int(diff.Hours()/24))
	}
	return t.Format("Jan 02")
}

func getDetailedAgentStatus(sessionName string, lastUpdate time.Time) (string, string) {
	content, err := getPaneContent(sessionName)
	if err != nil {
		return "error", "❌"
	}

	// Check for error in pane content
	if strings.Contains(content, "Error:") || strings.Contains(content, "error:") {
		return "error", "❌"
	}

	// Check if stuck (no update for 5+ minutes)
	if time.Since(lastUpdate) > 5*time.Minute {
		return "stuck", "⚠️"
	}

	// Check if running
	if strings.Contains(content, "esc to interrupt") || strings.Contains(content, "Thinking") {
		return "running", "🏃"
	}

	return "ready", "✅"
}

// sessionInfo holds session information for sorting and display
type sessionInfo struct {
	name  string
	state state.AgentState
}

func printDetailedSessions(stateManager *state.StateManager, activeSessions []string) error {
	// Load all states to sort by UpdatedAt
	states := make(map[string]state.AgentState)
	if data, err := os.ReadFile(stateManager.GetStatePath()); err == nil {
		if err := json.Unmarshal(data, &states); err != nil {
			return fmt.Errorf("error parsing state file: %w", err)
		}
	}

	// Create a slice of sessions with their states for sorting
	var sessions []sessionInfo
	for _, sessionName := range activeSessions {
		if state, ok := states[sessionName]; ok {
			sessions = append(sessions, sessionInfo{name: sessionName, state: state})
		}
	}

	// Sort by UpdatedAt (most recent first)
	sort.Slice(sessions, func(i, j int) bool {
		return sessions[i].state.UpdatedAt.After(sessions[j].state.UpdatedAt)
	})

	// Print header with columns
	fmt.Printf("%-25s %-12s %-15s %-15s %-15s %s\n",
		"AGENT", "STATUS", "DIFF", "FILES (+/~/-)", "LAST CHANGE", "PROMPT / ERROR")
	fmt.Println(strings.Repeat("-", 100))

	// Print sessions
	for _, session := range sessions {
		sessionName := session.name
		state := session.state

		// Extract agent name from session name
		parts := strings.Split(sessionName, "-")
		agentName := sessionName
		if len(parts) >= 4 && parts[0] == "agent" {
			agentName = strings.Join(parts[3:], "-")
		}

		// Get detailed status with icon
		status, icon := getDetailedAgentStatus(sessionName, state.UpdatedAt)

		// Get git diff details
		var fileStats string
		var lastChangedFile string
		diffDetails, err := getGitDiffDetails(state.WorktreePath)
		if err == nil && len(diffDetails) > 0 {
			// Count file changes by type
			added := 0
			modified := 0
			deleted := 0

			for _, detail := range diffDetails {
				switch detail.Status {
				case "A":
					added++
				case "M":
					modified++
				case "D":
					deleted++
				}
			}

			// Format file stats
			fileStats = fmt.Sprintf("+%d/~%d/-%d", added, modified, deleted)

			// Get last changed file
			if len(diffDetails) > 0 {
				lastFile := diffDetails[len(diffDetails)-1].FilePath
				if len(lastFile) > 30 {
					lastFile = "..." + lastFile[len(lastFile)-27:]
				}
				lastChangedFile = lastFile
			}
		} else {
			fileStats = "+0/~0/-0"
			lastChangedFile = "-"
		}

		// Get diff totals
		insertions, deletions := getGitDiffTotals(sessionName, stateManager)
		diffStr := fmt.Sprintf("\033[32m+%d\033[0m/\033[31m-%d\033[0m", insertions, deletions)

		// Format agent info with model
		agentInfo := fmt.Sprintf("%s (%s)", agentName, state.Model)
		if len(agentInfo) > 24 {
			agentInfo = agentInfo[:21] + "..."
		}

		// Format status with icon
		statusStr := fmt.Sprintf("%s %s", icon, status)

		// Format last change time or file
		var lastChangeDisplay string
		if lastChangedFile != "-" {
			lastChangeDisplay = lastChangedFile
		} else {
			lastChangeDisplay = formatLastChange(state.UpdatedAt)
		}

		// Truncate prompt if too long
		prompt := state.Prompt
		if status == "error" && strings.Contains(prompt, "Error:") {
			// Show error message
			prompt = strings.TrimSpace(prompt)
		}
		if len(prompt) > 40 {
			prompt = prompt[:37] + "..."
		}

		// Print row
		fmt.Printf("%-25s %-12s %-15s %-15s %-15s %s\n",
			agentInfo, statusStr, diffStr, fileStats, lastChangeDisplay, prompt)
	}

	return nil
}

func printSessions(stateManager *state.StateManager, activeSessions []string, detailed bool) error {
	// Load all states to sort by UpdatedAt
	states := make(map[string]state.AgentState)
	if data, err := os.ReadFile(stateManager.GetStatePath()); err == nil {
		if err := json.Unmarshal(data, &states); err != nil {
			return fmt.Errorf("error parsing state file: %w", err)
		}
	}

	// Create a slice of sessions with their states for sorting
	var sessions []sessionInfo
	for _, sessionName := range activeSessions {
		if state, ok := states[sessionName]; ok {
			sessions = append(sessions, sessionInfo{name: sessionName, state: state})
		}
	}

	// Sort by UpdatedAt (most recent first)
	sort.Slice(sessions, func(i, j int) bool {
		return sessions[i].state.UpdatedAt.After(sessions[j].state.UpdatedAt)
	})

	// Long format with tabwriter for alignment
	w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)

	// Print header
	if detailed {
		fmt.Fprintf(w, "AGENT\tMODEL\tSTATUS    DIFF\tADDR\tWORKTREE\tUPDATED\tPROMPT\n")
	} else {
		fmt.Fprintf(w, "AGENT\tMODEL\tSTATUS    DIFF\tADDR\tPROMPT\n")
	}

	// Print sessions
	for _, session := range sessions {
		sessionName := session.name
		state := session.state

		// Extract agent name from session name
		parts := strings.Split(sessionName, "-")
		agentName := sessionName
		if len(parts) >= 4 && parts[0] == "agent" {
			agentName = strings.Join(parts[3:], "-")
		}

		status := getAgentStatus(sessionName)
		insertions, deletions := getGitDiffTotals(sessionName, stateManager)

		// Format diff stats with colors
		var changes string
		if insertions == 0 && deletions == 0 {
			changes = "\033[32m+0\033[0m/\033[31m-0\033[0m"
		} else {
			// ANSI color codes: green for additions, red for deletions
			changes = fmt.Sprintf("\033[32m+%d\033[0m/\033[31m-%d\033[0m", insertions, deletions)
		}

		// Get model name, default to "unknown" if empty (for backward compatibility)
		model := state.Model
		if model == "" {
			model = "unknown"
		}

		// Format: agent model status addr changes prompt
		addr := ""
		if state.Port != 0 {
			addr = fmt.Sprintf("http://localhost:%d", state.Port)
		}

		if detailed {
			// Show worktree path and updated time in detailed mode
			worktreePath := state.WorktreePath
			if worktreePath == "" {
				worktreePath = "-"
			}
			updatedTime := formatTime(state.UpdatedAt)

			fmt.Fprintf(w, "%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n",
				agentName,
				model,
				formatStatus(status),
				changes,
				addr,
				worktreePath,
				updatedTime,
				state.Prompt,
			)
		} else {
			fmt.Fprintf(w, "%s\t%s\t%s\t%s\t%s\t%s\n",
				agentName,
				model,
				formatStatus(status),
				changes,
				addr,
				state.Prompt,
			)
		}
	}
	w.Flush()

	return nil
}

func clearScreen() {
	fmt.Print("\033[H\033[2J")
}

func executeLs(ctx context.Context, args []string) error {
	stateManager := state.NewStateManager()
	if stateManager == nil {
		return fmt.Errorf("failed to create state manager")
	}

	if *watchMode {
		// Watch mode - refresh every second
		ticker := time.NewTicker(1 * time.Second)
		defer ticker.Stop()

		// Initial display
		clearScreen()
		activeSessions, err := stateManager.GetActiveSessionsForRepo()
		if err != nil {
			return fmt.Errorf("error getting active sessions: %w", err)
		}

		if len(activeSessions) == 0 {
			fmt.Println("No active sessions found")
		} else {
			if *detailedMode {
				if err := printDetailedSessions(stateManager, activeSessions); err != nil {
					return err
				}
			} else {
				if err := printSessions(stateManager, activeSessions, false); err != nil {
					return err
				}
			}
		}

		// Watch loop
		for {
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-ticker.C:
				clearScreen()
				activeSessions, err := stateManager.GetActiveSessionsForRepo()
				if err != nil {
					fmt.Printf("Error getting active sessions: %v\n", err)
					continue
				}

				if len(activeSessions) == 0 {
					fmt.Println("No active sessions found")
				} else {
					if *detailedMode {
						if err := printDetailedSessions(stateManager, activeSessions); err != nil {
							fmt.Printf("Error printing sessions: %v\n", err)
						}
					} else {
						if err := printSessions(stateManager, activeSessions, false); err != nil {
							fmt.Printf("Error printing sessions: %v\n", err)
						}
					}
				}
			}
		}
	} else {
		// Single run mode
		activeSessions, err := stateManager.GetActiveSessionsForRepo()
		if err != nil {
			return fmt.Errorf("error getting active sessions: %w", err)
		}

		if len(activeSessions) == 0 {
			fmt.Println("No active sessions found")
			return nil
		}

		if *detailedMode {
			return printDetailedSessions(stateManager, activeSessions)
		}
		return printSessions(stateManager, activeSessions, false)
	}
}
