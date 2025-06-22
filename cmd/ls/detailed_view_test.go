package ls

import (
	"bytes"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/devflowinc/uzi/pkg/state"
)

// Test the detailed table format output
func TestDetailedTableFormat(t *testing.T) {
	tests := []struct {
		name             string
		sessions         []sessionInfo
		expectedContains []string
	}{
		{
			name: "Single session with all fields",
			sessions: []sessionInfo{
				{
					name: "agent-1-yuta",
					state: state.AgentState{
						Model:        "claude",
						Prompt:       "Translate dev docs to Japanese",
						Port:         3000,
						UpdatedAt:    time.Now().Add(-2 * time.Minute),
						WorktreePath: "/tmp/worktree",
					},
				},
			},
			expectedContains: []string{
				"AGENT",
				"STATUS",
				"DIFF",
				"FILES (+/~/-))",
				"LAST CHANGE",
				"PROMPT / ERROR",
				"yuta (claude)",
				"Translate dev docs",
			},
		},
		{
			name: "Multiple sessions",
			sessions: []sessionInfo{
				{
					name: "agent-1-yuta",
					state: state.AgentState{
						Model:        "claude",
						Prompt:       "Translate dev docs",
						UpdatedAt:    time.Now().Add(-1 * time.Minute),
						WorktreePath: "/tmp/worktree1",
					},
				},
				{
					name: "agent-2-shiro",
					state: state.AgentState{
						Model:        "claude",
						Prompt:       "Translate migration guide",
						UpdatedAt:    time.Now().Add(-30 * time.Second),
						WorktreePath: "/tmp/worktree2",
					},
				},
			},
			expectedContains: []string{
				"yuta (claude)",
				"shiro (claude)",
			},
		},
		{
			name: "Long prompt truncation",
			sessions: []sessionInfo{
				{
					name: "agent-1-test",
					state: state.AgentState{
						Model:        "claude",
						Prompt:       "This is a very long prompt that should be truncated to fit within the table column width so it doesn't break the formatting",
						UpdatedAt:    time.Now(),
						WorktreePath: "/tmp/worktree",
					},
				},
			},
			expectedContains: []string{
				"This is a very long prompt that should be truncated",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// This test will fail as printDetailedSessions doesn't exist yet
			t.Skip("printDetailedSessions not implemented yet")
		})
	}
}

// Test status icon formatting
func TestStatusIconFormatting(t *testing.T) {
	tests := []struct {
		name         string
		status       string
		expectedIcon string
		expectedText string
	}{
		{
			name:         "Ready status",
			status:       "ready",
			expectedIcon: "✅",
			expectedText: "ready",
		},
		{
			name:         "Running status",
			status:       "running",
			expectedIcon: "🏃",
			expectedText: "running",
		},
		{
			name:         "Stuck status",
			status:       "stuck",
			expectedIcon: "⚠️",
			expectedText: "stuck",
		},
		{
			name:         "Error status",
			status:       "error",
			expectedIcon: "❌",
			expectedText: "error",
		},
		{
			name:         "Unknown status",
			status:       "unknown",
			expectedIcon: "❓",
			expectedText: "unknown",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Test formatDetailedStatus function
			result := formatDetailedStatus(tt.status)

			if !strings.Contains(result, tt.expectedIcon) {
				t.Errorf("Expected icon %s in result, got: %s", tt.expectedIcon, result)
			}

			if !strings.Contains(result, tt.expectedText) {
				t.Errorf("Expected text %s in result, got: %s", tt.expectedText, result)
			}
		})
	}
}

// Test FILES column formatting
func TestFilesColumnFormatting(t *testing.T) {
	tests := []struct {
		name           string
		added          int
		modified       int
		deleted        int
		expectedFormat string
	}{
		{
			name:           "No changes",
			added:          0,
			modified:       0,
			deleted:        0,
			expectedFormat: "[ 0/0/0 ]",
		},
		{
			name:           "Only additions",
			added:          5,
			modified:       0,
			deleted:        0,
			expectedFormat: "[ 5/0/0 ]",
		},
		{
			name:           "Mixed changes",
			added:          3,
			modified:       5,
			deleted:        2,
			expectedFormat: "[ 3/5/2 ]",
		},
		{
			name:           "Large numbers",
			added:          100,
			modified:       250,
			deleted:        50,
			expectedFormat: "[ 100/250/50 ]",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := formatFileChanges(tt.added, tt.modified, tt.deleted)

			if result != tt.expectedFormat {
				t.Errorf("Expected %s, got %s", tt.expectedFormat, result)
			}
		})
	}
}

// Test LAST CHANGE column formatting
func TestLastChangeFormatting(t *testing.T) {
	tests := []struct {
		name           string
		lastChange     string
		expectedOutput string
	}{
		{
			name:           "Normal file path",
			lastChange:     "docs/development/BEST_PRACTICES_JP.md",
			expectedOutput: "docs/development/BEST_PRACTICES_JP.md",
		},
		{
			name:           "Empty (no changes)",
			lastChange:     "",
			expectedOutput: "-",
		},
		{
			name:           "Very long path",
			lastChange:     "very/long/path/that/should/be/truncated/to/fit/in/the/column/file.go",
			expectedOutput: "...to/fit/in/the/column/file.go",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := formatLastChange(tt.lastChange, 40) // 40 chars max width

			if len(result) > 40 && tt.lastChange != "" {
				t.Errorf("Result exceeds max width: %d chars", len(result))
			}

			if tt.lastChange == "" && result != "-" {
				t.Errorf("Expected '-' for empty input, got: %s", result)
			}
		})
	}
}

// Test table separator line
func TestTableSeparator(t *testing.T) {
	// Test that the separator line is correctly formatted
	separator := generateTableSeparator(130) // Typical terminal width

	if len(separator) != 130 {
		t.Errorf("Expected separator length 130, got %d", len(separator))
	}

	// Check that it's all dashes
	for _, ch := range separator {
		if ch != '─' {
			t.Errorf("Expected all dashes in separator, found: %c", ch)
		}
	}
}

// Test error message formatting in PROMPT / ERROR column
func TestErrorMessageFormatting(t *testing.T) {
	tests := []struct {
		name           string
		status         string
		prompt         string
		errorMsg       string
		expectedOutput string
	}{
		{
			name:           "Normal prompt display",
			status:         "ready",
			prompt:         "Translate documentation",
			errorMsg:       "",
			expectedOutput: "Translate documentation",
		},
		{
			name:           "Error status with message",
			status:         "error",
			prompt:         "Original task",
			errorMsg:       "Error: Infinite loop in tmux session.",
			expectedOutput: "Error: Infinite loop in tmux session.",
		},
		{
			name:           "Long error message truncation",
			status:         "error",
			prompt:         "Task",
			errorMsg:       "Error: This is a very long error message that should be truncated to fit within the column width",
			expectedOutput: "Error: This is a very long error message that sho...",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// This test will fail as the function doesn't exist yet
			t.Skip("formatPromptOrError not implemented yet")
		})
	}
}

// Helper functions have been moved to detailed_view.go
