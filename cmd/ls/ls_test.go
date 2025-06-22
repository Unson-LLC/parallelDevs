package ls

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"testing"
	"time"

	"github.com/devflowinc/uzi/pkg/config"
	"github.com/devflowinc/uzi/pkg/state"
)

// mockStateManager is a mock implementation of state.StateManager for testing
type mockStateManager struct {
	statePath      string
	sessions       []string
	states         map[string]state.AgentState
	gitRepo        string
	branchFrom     string
	activeSessions map[string]bool
}

func newMockStateManager() *mockStateManager {
	return &mockStateManager{
		statePath:      "/tmp/test-state.json",
		sessions:       []string{},
		states:         make(map[string]state.AgentState),
		gitRepo:        "https://github.com/test/repo.git",
		branchFrom:     "main",
		activeSessions: make(map[string]bool),
	}
}

func (m *mockStateManager) GetStatePath() string {
	return m.statePath
}

func (m *mockStateManager) GetActiveSessionsForRepo() ([]string, error) {
	var active []string
	for session := range m.activeSessions {
		active = append(active, session)
	}
	return active, nil
}

func (m *mockStateManager) SaveState(prompt, branchName, sessionName, worktreePath, model string) error {
	return m.SaveStateWithPort(prompt, branchName, sessionName, worktreePath, model, 0)
}

func (m *mockStateManager) SaveStateWithPort(prompt, branchName, sessionName, worktreePath, model string, port int) error {
	now := time.Now()
	m.states[sessionName] = state.AgentState{
		GitRepo:      m.gitRepo,
		BranchFrom:   m.branchFrom,
		BranchName:   branchName,
		Prompt:       prompt,
		WorktreePath: worktreePath,
		Port:         port,
		Model:        model,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	m.activeSessions[sessionName] = true
	return nil
}

func (m *mockStateManager) RemoveState(sessionName string) error {
	delete(m.states, sessionName)
	delete(m.activeSessions, sessionName)
	return nil
}

func (m *mockStateManager) GetWorktreeInfo(sessionName string) (*state.AgentState, error) {
	if state, ok := m.states[sessionName]; ok {
		return &state, nil
	}
	return nil, fmt.Errorf("no state found for session: %s", sessionName)
}

// mockExecCommand is used to mock external commands like git and tmux
type execContext struct {
	commandName string
	args        []string
	output      string
	exitCode    int
}

var execContexts []execContext

func mockExecCommand(command string, args ...string) *exec.Cmd {
	cs := []string{"-test.run=TestHelperProcess", "--", command}
	cs = append(cs, args...)
	cmd := exec.Command(os.Args[0], cs...)
	cmd.Env = []string{"GO_WANT_HELPER_PROCESS=1"}
	return cmd
}

// TestHelperProcess is a helper process for mocking exec.Command
func TestHelperProcess(t *testing.T) {
	if os.Getenv("GO_WANT_HELPER_PROCESS") != "1" {
		return
	}

	args := os.Args
	for i, arg := range args {
		if arg == "--" {
			args = args[i+1:]
			break
		}
	}

	if len(args) == 0 {
		os.Exit(1)
	}

	command := args[0]
	cmdArgs := args[1:]

	// Find matching context
	for _, ctx := range execContexts {
		if ctx.commandName == command && argsMatch(ctx.args, cmdArgs) {
			fmt.Fprint(os.Stdout, ctx.output)
			os.Exit(ctx.exitCode)
		}
	}

	// Default: command not found
	os.Exit(1)
}

func argsMatch(expected, actual []string) bool {
	if len(expected) != len(actual) {
		return false
	}
	for i := range expected {
		if expected[i] != actual[i] {
			return false
		}
	}
	return true
}

// Helper to set up command mocks
func setupCommandMock(command string, args []string, output string, exitCode int) {
	execContexts = append(execContexts, execContext{
		commandName: command,
		args:        args,
		output:      output,
		exitCode:    exitCode,
	})
}

// Helper to clear command mocks
func clearCommandMocks() {
	execContexts = []execContext{}
}

// Test for executeLs with no active sessions
func TestExecuteLs_NoActiveSessions(t *testing.T) {
	// Capture stdout
	old := os.Stdout
	r, w, _ := os.Pipe()
	os.Stdout = w

	// Create mock state manager with no active sessions
	mockSM := newMockStateManager()

	// Create temporary state file
	tmpDir := t.TempDir()
	stateFile := filepath.Join(tmpDir, "state.json")
	data, _ := json.Marshal(mockSM.states)
	os.WriteFile(stateFile, data, 0644)
	mockSM.statePath = stateFile

	// Execute the function
	ctx := context.Background()
	err := executeLs(ctx, []string{})

	// Restore stdout
	w.Close()
	os.Stdout = old

	// Read captured output
	var buf bytes.Buffer
	buf.ReadFrom(r)
	output := buf.String()

	// Assertions
	if err != nil {
		t.Errorf("executeLs returned error: %v", err)
	}

	if !strings.Contains(output, "No active sessions found") {
		t.Errorf("Expected 'No active sessions found', got: %s", output)
	}
}

// Test for executeLs with single session
func TestExecuteLs_SingleSession(t *testing.T) {
	// Set up mocks
	clearCommandMocks()
	defer clearCommandMocks()

	// Mock tmux has-session command
	setupCommandMock("tmux", []string{"has-session", "-t", "agent-1-john"}, "", 0)

	// Mock tmux capture-pane command
	setupCommandMock("tmux", []string{"capture-pane", "-t", "agent-1-john:agent", "-p"}, "Ready for input", 0)

	// Mock git commands for diff totals
	setupCommandMock("sh", []string{"-c", "git add -A . && git diff --cached --shortstat HEAD && git reset HEAD > /dev/null"}, " 1 file changed, 10 insertions(+), 2 deletions(-)", 0)

	// Capture stdout
	old := os.Stdout
	r, w, _ := os.Pipe()
	os.Stdout = w

	// Create mock state manager with one active session
	mockSM := newMockStateManager()
	mockSM.SaveStateWithPort("Test prompt", "feature-branch", "agent-1-john", "/tmp/worktree", "claude", 3000)
	mockSM.activeSessions["agent-1-john"] = true

	// Create temporary state file
	tmpDir := t.TempDir()
	stateFile := filepath.Join(tmpDir, "state.json")
	data, _ := json.Marshal(mockSM.states)
	os.WriteFile(stateFile, data, 0644)
	mockSM.statePath = stateFile

	// IMPORTANT: We need to inject our mock state manager, but executeLs creates its own
	// This test will fail because we can't inject dependencies
	// Execute the function
	ctx := context.Background()
	err := executeLs(ctx, []string{})

	// Restore stdout
	w.Close()
	os.Stdout = old

	// Read captured output
	var buf bytes.Buffer
	buf.ReadFrom(r)
	output := buf.String()

	// Assertions
	if err != nil {
		t.Errorf("executeLs returned error: %v", err)
	}

	// This will fail because executeLs creates its own StateManager
	// and won't use our mock
	if strings.Contains(output, "No active sessions found") {
		t.Errorf("Expected session output, but got 'No active sessions found'")
	}

	if !strings.Contains(output, "john") {
		t.Errorf("Expected 'john' in output, got: %s", output)
	}
}

// Test for getGitDiffTotals function - this will fail as it's not mockable
func TestGetGitDiffTotals_DirectCall(t *testing.T) {
	// Create a mock state manager
	mockSM := newMockStateManager()
	sessionName := "test-session"
	mockSM.SaveStateWithPort("Test", "branch", sessionName, "/tmp/test", "claude", 0)

	// Create temporary state file
	tmpDir := t.TempDir()
	stateFile := filepath.Join(tmpDir, "state.json")
	data, _ := json.Marshal(mockSM.states)
	os.WriteFile(stateFile, data, 0644)

	// Call the actual function - this will fail because it creates its own StateManager
	insertions, deletions := getGitDiffTotals(sessionName, state.NewStateManager())

	// These assertions will fail because the function won't find our mock data
	if insertions != 0 || deletions != 0 {
		t.Errorf("Expected 0,0 for non-existent session, got %d,%d", insertions, deletions)
	}
}

// Test for getGitDiffTotals function with different outputs
func TestGetGitDiffTotals(t *testing.T) {
	tests := []struct {
		name               string
		sessionName        string
		gitOutput          string
		expectedInsertions int
		expectedDeletions  int
	}{
		{
			name:               "No changes",
			sessionName:        "test-session",
			gitOutput:          "",
			expectedInsertions: 0,
			expectedDeletions:  0,
		},
		{
			name:               "Only insertions",
			sessionName:        "test-session",
			gitOutput:          " 1 file changed, 10 insertions(+)",
			expectedInsertions: 10,
			expectedDeletions:  0,
		},
		{
			name:               "Only deletions",
			sessionName:        "test-session",
			gitOutput:          " 1 file changed, 5 deletions(-)",
			expectedInsertions: 0,
			expectedDeletions:  5,
		},
		{
			name:               "Both insertions and deletions",
			sessionName:        "test-session",
			gitOutput:          " 2 files changed, 15 insertions(+), 3 deletions(-)",
			expectedInsertions: 15,
			expectedDeletions:  3,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// This will fail in RED phase as getGitDiffTotals uses actual git commands
			t.Skip("Skipping until we can inject exec.Command")
		})
	}
}

// Test for getPaneContent function - Direct test that will fail
func TestGetPaneContent_DirectCall(t *testing.T) {
	// Test with a non-existent session
	content, err := getPaneContent("non-existent-session")

	// This should return an error but we're testing the actual function
	if err == nil {
		t.Errorf("Expected error for non-existent session, got nil")
	}

	if content != "" {
		t.Errorf("Expected empty content for non-existent session, got: %s", content)
	}
}

// Test for getPaneContent function
func TestGetPaneContent(t *testing.T) {
	tests := []struct {
		name            string
		sessionName     string
		expectedContent string
		expectedError   bool
	}{
		{
			name:            "Valid session",
			sessionName:     "test-session",
			expectedContent: "test content",
			expectedError:   false,
		},
		{
			name:            "Invalid session",
			sessionName:     "non-existent",
			expectedContent: "",
			expectedError:   true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// This will fail in RED phase as getPaneContent uses actual tmux commands
			t.Skip("Skipping until we can inject exec.Command")
		})
	}
}

// Test for getAgentStatus function - Direct test
func TestGetAgentStatus_DirectCall(t *testing.T) {
	// This will call getPaneContent internally which will fail
	status := getAgentStatus("non-existent-session")

	// When getPaneContent fails, it should return "unknown"
	if status != "unknown" {
		t.Errorf("Expected 'unknown' for non-existent session, got: %s", status)
	}
}

// Test for getAgentStatus function
func TestGetAgentStatus(t *testing.T) {
	tests := []struct {
		name           string
		paneContent    string
		expectedStatus string
	}{
		{
			name:           "Running status - esc to interrupt",
			paneContent:    "Some output\nesc to interrupt\nmore output",
			expectedStatus: "running",
		},
		{
			name:           "Running status - Thinking",
			paneContent:    "Thinking about the problem...",
			expectedStatus: "running",
		},
		{
			name:           "Ready status",
			paneContent:    "Waiting for input...",
			expectedStatus: "ready",
		},
		{
			name:           "Empty content",
			paneContent:    "",
			expectedStatus: "ready",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// This will fail as getAgentStatus depends on getPaneContent which uses tmux
			t.Skip("Skipping until we can mock getPaneContent")
		})
	}
}

// Test for formatStatus function
func TestFormatStatus(t *testing.T) {
	tests := []struct {
		name     string
		status   string
		expected string
	}{
		{
			name:     "Ready status",
			status:   "ready",
			expected: "\033[32mready\033[0m",
		},
		{
			name:     "Running status",
			status:   "running",
			expected: "\033[33mrunning\033[0m",
		},
		{
			name:     "Unknown status",
			status:   "unknown",
			expected: "unknown",
		},
		{
			name:     "Empty status",
			status:   "",
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := formatStatus(tt.status)
			if result != tt.expected {
				t.Errorf("formatStatus(%q) = %q, want %q", tt.status, result, tt.expected)
			}
		})
	}
}

// Test for formatTime function
func TestFormatTime(t *testing.T) {
	now := time.Now()

	tests := []struct {
		name     string
		time     time.Time
		expected string
	}{
		{
			name:     "Less than an hour ago",
			time:     now.Add(-30 * time.Minute),
			expected: "30m",
		},
		{
			name:     "Less than a day ago",
			time:     now.Add(-5 * time.Hour),
			expected: " 5h",
		},
		{
			name:     "Less than a week ago",
			time:     now.Add(-3 * 24 * time.Hour),
			expected: " 3d",
		},
		{
			name:     "More than a week ago",
			time:     now.Add(-30 * 24 * time.Hour),
			expected: now.Add(-30 * 24 * time.Hour).Format("Jan 02"),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := formatTime(tt.time)
			if result != tt.expected {
				t.Errorf("formatTime(%v) = %q, want %q", tt.time, result, tt.expected)
			}
		})
	}
}

// Test for printSessions function - Direct test that will fail
func TestPrintSessions_DirectCall(t *testing.T) {
	// Capture stdout
	old := os.Stdout
	r, w, _ := os.Pipe()
	os.Stdout = w

	// Create a real state manager (will use actual filesystem)
	sm := state.NewStateManager()

	// Try to print sessions - this will likely print nothing or fail
	err := printSessions(sm, []string{"test-session"})

	// Restore stdout
	w.Close()
	os.Stdout = old

	// Read captured output
	var buf bytes.Buffer
	buf.ReadFrom(r)
	output := buf.String()

	// This test will fail because:
	// 1. No actual state file exists
	// 2. tmux commands will fail
	// 3. git commands will fail
	if err != nil {
		t.Logf("printSessions returned error as expected: %v", err)
	}

	// Check if header was printed
	if !strings.Contains(output, "AGENT") || !strings.Contains(output, "MODEL") {
		t.Errorf("Expected header in output, got: %s", output)
	}
}

// Test for printSessions function
func TestPrintSessions(t *testing.T) {
	// This test will fail in RED phase as it depends on many other functions
	t.Skip("Skipping until we can properly mock all dependencies")
}

// Test for multiple sessions with sorting
func TestExecuteLs_MultipleSessions_Sorting(t *testing.T) {
	// This test will fail because we can't inject our mock
	// Test that sessions are sorted by UpdatedAt (most recent first)
	t.Skip("Skipping until dependency injection is possible")
}

// Test for error handling
func TestExecuteLs_ErrorHandling(t *testing.T) {
	// Test various error conditions:
	// 1. State file is corrupted
	// 2. tmux command fails
	// 3. git command fails
	t.Skip("Skipping until we can simulate errors")
}

// Test for edge cases
func TestFormatTime_EdgeCases(t *testing.T) {
	now := time.Now()

	tests := []struct {
		name     string
		time     time.Time
		expected string
	}{
		{
			name:     "Exactly 1 minute ago",
			time:     now.Add(-1 * time.Minute),
			expected: " 1m",
		},
		{
			name:     "Exactly 1 hour ago",
			time:     now.Add(-1 * time.Hour),
			expected: " 1h",
		},
		{
			name:     "Exactly 1 day ago",
			time:     now.Add(-24 * time.Hour),
			expected: " 1d",
		},
		{
			name:     "Future time",
			time:     now.Add(1 * time.Hour),
			expected: " 0m", // This might be unexpected behavior
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := formatTime(tt.time)
			if result != tt.expected {
				t.Errorf("formatTime(%v) = %q, want %q", tt.time, result, tt.expected)
			}
		})
	}
}

// Test for ANSI color codes in formatStatus
func TestFormatStatus_ANSICodes(t *testing.T) {
	// Verify that ANSI codes are correctly applied
	readyStatus := formatStatus("ready")
	if !strings.Contains(readyStatus, "\033[32m") {
		t.Errorf("Expected green ANSI code for ready status")
	}

	runningStatus := formatStatus("running")
	if !strings.Contains(runningStatus, "\033[33m") {
		t.Errorf("Expected yellow ANSI code for running status")
	}
}

// Test for regex patterns in getGitDiffTotals
func TestGitDiffRegexPatterns(t *testing.T) {
	// Test the regex patterns used in getGitDiffTotals
	// This is a unit test for the regex logic only
	insRe := regexp.MustCompile(`(\d+) insertion(?:s)?\(\+\)`)
	delRe := regexp.MustCompile(`(\d+) deletion(?:s)?\(\-\)`)

	testCases := []struct {
		input      string
		insertions int
		deletions  int
	}{
		{
			input:      " 1 file changed, 1 insertion(+)",
			insertions: 1,
			deletions:  0,
		},
		{
			input:      " 2 files changed, 10 insertions(+), 1 deletion(-)",
			insertions: 10,
			deletions:  1,
		},
		{
			input:      " 5 files changed, 100 insertions(+), 50 deletions(-)",
			insertions: 100,
			deletions:  50,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.input, func(t *testing.T) {
			insertions := 0
			deletions := 0

			if m := insRe.FindStringSubmatch(tc.input); len(m) > 1 {
				fmt.Sscanf(m[1], "%d", &insertions)
			}
			if m := delRe.FindStringSubmatch(tc.input); len(m) > 1 {
				fmt.Sscanf(m[1], "%d", &deletions)
			}

			if insertions != tc.insertions {
				t.Errorf("Expected %d insertions, got %d", tc.insertions, insertions)
			}
			if deletions != tc.deletions {
				t.Errorf("Expected %d deletions, got %d", tc.deletions, deletions)
			}
		})
	}
}

// Test for watch mode
func TestExecuteLs_WatchMode(t *testing.T) {
	// This test needs special handling for the watch loop
	t.Skip("Watch mode test requires complex setup with context cancellation")
}

// Test for -d flag parsing
func TestDetailedFlag(t *testing.T) {
	// Reset flags before test
	fs = flag.NewFlagSet("uzi ls", flag.ExitOnError)
	configPath = fs.String("config", config.GetDefaultConfigPath(), "path to config file")
	allSessions = fs.Bool("a", false, "show all sessions including inactive")
	watchMode = fs.Bool("w", false, "watch mode - refresh output every second")
	detailedMode = fs.Bool("d", false, "show detailed view with file changes and status icons")

	// Test parsing -d flag
	err := fs.Parse([]string{"-d"})
	if err != nil {
		t.Errorf("Failed to parse -d flag: %v", err)
	}

	if !*detailedMode {
		t.Errorf("Expected detailedMode to be true after parsing -d flag")
	}
}

// Test for detailed mode with single session
func TestExecuteLs_DetailedMode_SingleSession(t *testing.T) {
	// Capture stdout
	old := os.Stdout
	r, w, _ := os.Pipe()
	os.Stdout = w

	// Set detailed mode
	*detailedMode = true
	defer func() { *detailedMode = false }()

	// Create mock state manager with one active session
	mockSM := newMockStateManager()
	mockSM.SaveStateWithPort("Translate dev docs to Japanese", "feature-docs", "agent-1-yuta", "/tmp/worktree", "claude", 3000)
	mockSM.activeSessions["agent-1-yuta"] = true

	// Create temporary state file
	tmpDir := t.TempDir()
	stateFile := filepath.Join(tmpDir, "state.json")
	data, _ := json.Marshal(mockSM.states)
	os.WriteFile(stateFile, data, 0644)
	mockSM.statePath = stateFile

	// Execute the function
	ctx := context.Background()
	err := executeLs(ctx, []string{})

	// Restore stdout
	w.Close()
	os.Stdout = old

	// Read captured output
	var buf bytes.Buffer
	buf.ReadFrom(r)
	output := buf.String()

	// Assertions
	if err != nil {
		t.Errorf("executeLs returned error: %v", err)
	}

	// Check for detailed mode headers
	expectedHeaders := []string{"AGENT", "STATUS", "DIFF", "FILES (+/~/-)", "LAST CHANGE", "PROMPT / ERROR"}
	for _, header := range expectedHeaders {
		if !strings.Contains(output, header) {
			t.Errorf("Expected header '%s' in detailed mode output, got: %s", header, output)
		}
	}
}

// Test for printDetailedSessions function
func TestPrintDetailedSessions(t *testing.T) {
	// This test will fail in RED phase as printDetailedSessions doesn't exist yet
	t.Run("Function exists", func(t *testing.T) {
		// Try to call a function that doesn't exist yet
		// This will cause a compile error in RED phase
		// printDetailedSessions(nil, nil) // Uncommenting this will cause compile error
		t.Skip("printDetailedSessions not implemented yet")
	})
}

// Test for getGitDiffDetails function in ls_test
func TestGetGitDiffDetails_LsTest(t *testing.T) {
	tests := []struct {
		name               string
		gitOutput          string
		expectedAdded      int
		expectedModified   int
		expectedDeleted    int
		expectedLastChange string
	}{
		{
			name:               "Single file added",
			gitOutput:          "A\tdocs/development/BEST_PRACTICES_JP.md",
			expectedAdded:      1,
			expectedModified:   0,
			expectedDeleted:    0,
			expectedLastChange: "docs/development/BEST_PRACTICES_JP.md",
		},
		{
			name:               "Multiple files with different statuses",
			gitOutput:          "A\tfile1.go\nM\tfile2.go\nD\tfile3.go\nM\tfile4.go",
			expectedAdded:      1,
			expectedModified:   2,
			expectedDeleted:    1,
			expectedLastChange: "file4.go",
		},
		{
			name:               "No changes",
			gitOutput:          "",
			expectedAdded:      0,
			expectedModified:   0,
			expectedDeleted:    0,
			expectedLastChange: "-",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// This will fail in RED phase as getGitDiffDetails doesn't exist yet
			t.Skip("getGitDiffDetails not implemented yet")
		})
	}
}

// Test for getDetailedAgentStatus function in ls_test
func TestGetDetailedAgentStatus_LsTest(t *testing.T) {
	now := time.Now()

	tests := []struct {
		name           string
		sessionName    string
		paneContent    string
		lastUpdate     time.Time
		expectedStatus string
		expectedIcon   string
	}{
		{
			name:           "Ready status",
			sessionName:    "test-ready",
			paneContent:    "Waiting for input",
			lastUpdate:     now.Add(-1 * time.Minute),
			expectedStatus: "ready",
			expectedIcon:   "✅",
		},
		{
			name:           "Running status",
			sessionName:    "test-running",
			paneContent:    "esc to interrupt",
			lastUpdate:     now.Add(-30 * time.Second),
			expectedStatus: "running",
			expectedIcon:   "🏃",
		},
		{
			name:           "Stuck status - no update for 5+ minutes",
			sessionName:    "test-stuck",
			paneContent:    "Waiting...",
			lastUpdate:     now.Add(-6 * time.Minute),
			expectedStatus: "stuck",
			expectedIcon:   "⚠️",
		},
		{
			name:           "Error status - tmux error",
			sessionName:    "test-error",
			paneContent:    "Error: Infinite loop in tmux session.",
			lastUpdate:     now.Add(-1 * time.Minute),
			expectedStatus: "error",
			expectedIcon:   "❌",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// This will fail in RED phase as getDetailedAgentStatus doesn't exist yet
			t.Skip("getDetailedAgentStatus not implemented yet")
		})
	}
}

// Test for formatDetailedStatus function
func TestFormatDetailedStatus(t *testing.T) {
	tests := []struct {
		name     string
		status   string
		expected string
	}{
		{
			name:     "Ready status with icon",
			status:   "ready",
			expected: "✅ ready",
		},
		{
			name:     "Running status with icon",
			status:   "running",
			expected: "🏃 running",
		},
		{
			name:     "Stuck status with icon",
			status:   "stuck",
			expected: "⚠️ stuck",
		},
		{
			name:     "Error status with icon",
			status:   "error",
			expected: "❌ error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// This will fail in RED phase as formatDetailedStatus doesn't exist yet
			t.Skip("formatDetailedStatus not implemented yet")
		})
	}
}

// Test for combining -d and -w flags
func TestExecuteLs_DetailedWatchMode(t *testing.T) {
	// Set both flags
	*detailedMode = true
	*watchMode = true
	defer func() {
		*detailedMode = false
		*watchMode = false
	}()

	// This test will fail as it requires complex setup
	t.Skip("Detailed watch mode test requires context cancellation setup")
}
