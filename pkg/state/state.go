package state

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/charmbracelet/log"
)

type AgentState struct {
	GitRepo      string     `json:"git_repo"`
	BranchFrom   string     `json:"branch_from"`
	BranchName   string     `json:"branch_name"`
	Prompt       string     `json:"prompt"`
	WorktreePath string     `json:"worktree_path"`
	Port         int        `json:"port,omitempty"`
	Model        string     `json:"model"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	HasWorked    bool       `json:"has_worked"`              // 一度でも作業したかのフラグ
	WorkCount    int        `json:"work_count"`              // 作業回数カウント
	LastWorkedAt *time.Time `json:"last_worked_at,omitempty"` // 最後に作業した時刻
	LastMergedAt *time.Time `json:"last_merged_at,omitempty"` // 最後にマージした時刻
}

type StateManager struct {
	statePath string
}

func NewStateManager() *StateManager {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		log.Error("Error getting home directory", "error", err)
		return nil
	}

	statePath := filepath.Join(homeDir, ".local", "share", "uzi", "state.json")
	return &StateManager{statePath: statePath}
}

func (sm *StateManager) ensureStateDir() error {
	dir := filepath.Dir(sm.statePath)
	return os.MkdirAll(dir, 0755)
}

func (sm *StateManager) getGitRepo() string {
	cmd := exec.Command("git", "config", "--get", "remote.origin.url")
	output, err := cmd.Output()
	if err != nil {
		log.Debug("Could not get git remote URL", "error", err)
		return ""
	}
	return strings.TrimSpace(string(output))
}

func (sm *StateManager) getBranchFrom() string {
	// Get the main/master branch name
	cmd := exec.Command("git", "symbolic-ref", "refs/remotes/origin/HEAD")
	output, err := cmd.Output()
	if err != nil {
		// Fallback to main
		return "main"
	}

	ref := strings.TrimSpace(string(output))
	parts := strings.Split(ref, "/")
	if len(parts) > 0 {
		return parts[len(parts)-1]
	}
	return "main"
}

func (sm *StateManager) isActiveInTmux(sessionName string) bool {
	cmd := exec.Command("tmux", "has-session", "-t", sessionName)
	return cmd.Run() == nil
}

func (sm *StateManager) GetActiveSessionsForRepo() ([]string, error) {
	// Load existing state
	states := make(map[string]AgentState)
	if data, err := os.ReadFile(sm.statePath); err != nil {
		if os.IsNotExist(err) {
			return []string{}, nil
		}
		return nil, err
	} else {
		if err := json.Unmarshal(data, &states); err != nil {
			return nil, err
		}
	}

	currentRepo := sm.getGitRepo()
	if currentRepo == "" {
		return []string{}, nil
	}

	var activeSessions []string
	for sessionName, state := range states {
		if state.GitRepo == currentRepo && sm.isActiveInTmux(sessionName) {
			activeSessions = append(activeSessions, sessionName)
		}
	}

	return activeSessions, nil
}

func (sm *StateManager) SaveState(prompt, branchName, sessionName, worktreePath, model string) error {
	return sm.SaveStateWithPort(prompt, branchName, sessionName, worktreePath, model, 0)
}

func (sm *StateManager) SaveStateWithPort(prompt, branchName, sessionName, worktreePath, model string, port int) error {
	if err := sm.ensureStateDir(); err != nil {
		return err
	}

	// Load existing state
	states := make(map[string]AgentState)
	if data, err := os.ReadFile(sm.statePath); err == nil {
		json.Unmarshal(data, &states)
	}

	// Create new state entry
	now := time.Now()
	agentState := AgentState{
		GitRepo:      sm.getGitRepo(),
		BranchFrom:   sm.getBranchFrom(),
		BranchName:   branchName,
		Prompt:       prompt,
		WorktreePath: worktreePath,
		Port:         port,
		Model:        model,
		UpdatedAt:    now,
		HasWorked:    false, // 初期状態では作業未実施
		WorkCount:    0,     // 作業回数0で初期化
		LastWorkedAt: nil,   // 最後の作業時刻は未設定
	}

	// Set created time if this is a new entry
	if existing, exists := states[sessionName]; exists {
		agentState.CreatedAt = existing.CreatedAt
		// 既存エージェントの場合は作業履歴を保持
		agentState.HasWorked = existing.HasWorked
		agentState.WorkCount = existing.WorkCount
		agentState.LastWorkedAt = existing.LastWorkedAt
	} else {
		agentState.CreatedAt = now
	}

	states[sessionName] = agentState

	// Store the worktree branch in agent-specific file
	if err := sm.storeWorktreeBranch(sessionName); err != nil {
		log.Error("Error storing worktree branch", "error", err)
	}

	// Save to file
	data, err := json.MarshalIndent(states, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(sm.statePath, data, 0644)
}

func (sm *StateManager) getCurrentBranch() string {
	cmd := exec.Command("git", "branch", "--show-current")
	output, err := cmd.Output()
	if err != nil {
		log.Debug("Could not get current branch", "error", err)
		return ""
	}
	return strings.TrimSpace(string(output))
}

func (sm *StateManager) storeWorktreeBranch(sessionName string) error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return err
	}

	agentDir := filepath.Join(homeDir, ".local", "share", "uzi", "worktree", sessionName)
	if err := os.MkdirAll(agentDir, 0755); err != nil {
		return err
	}

	branchFile := filepath.Join(agentDir, "tree")
	currentBranch := sm.getCurrentBranch()
	if currentBranch == "" {
		return nil
	}

	return os.WriteFile(branchFile, []byte(currentBranch), 0644)
}

func (sm *StateManager) GetStatePath() string {
	return sm.statePath
}

func (sm *StateManager) RemoveState(sessionName string) error {
	// Load existing state
	states := make(map[string]AgentState)
	if data, err := os.ReadFile(sm.statePath); err != nil {
		if os.IsNotExist(err) {
			return nil // No state file, nothing to remove
		}
		return err
	} else {
		if err := json.Unmarshal(data, &states); err != nil {
			return err
		}
	}

	// Remove the session from the state
	delete(states, sessionName)

	// Save updated state to file
	data, err := json.MarshalIndent(states, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(sm.statePath, data, 0644)
}

// GetWorktreeInfo returns the worktree information for a given session
func (sm *StateManager) GetWorktreeInfo(sessionName string) (*AgentState, error) {
	// Load existing state
	states := make(map[string]AgentState)
	if data, err := os.ReadFile(sm.statePath); err != nil {
		return nil, fmt.Errorf("error reading state file: %w", err)
	} else {
		if err := json.Unmarshal(data, &states); err != nil {
			return nil, fmt.Errorf("error parsing state file: %w", err)
		}
	}

	state, ok := states[sessionName]
	if !ok {
		return nil, fmt.Errorf("no state found for session: %s", sessionName)
	}

	return &state, nil
}

// MarkWorkCompleted marks that an agent has completed work
func (sm *StateManager) MarkWorkCompleted(sessionName string) error {
	if err := sm.ensureStateDir(); err != nil {
		return err
	}

	// Load existing state
	states := make(map[string]AgentState)
	if data, err := os.ReadFile(sm.statePath); err != nil {
		if os.IsNotExist(err) {
			return fmt.Errorf("no state file found")
		}
		return err
	} else {
		if err := json.Unmarshal(data, &states); err != nil {
			return err
		}
	}

	// Update the specific session
	state, exists := states[sessionName]
	if !exists {
		return fmt.Errorf("session %s not found", sessionName)
	}

	now := time.Now()
	state.HasWorked = true
	state.WorkCount++
	state.LastWorkedAt = &now
	state.UpdatedAt = now

	states[sessionName] = state

	// Save to file
	data, err := json.MarshalIndent(states, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(sm.statePath, data, 0644)
}

// MarkAsMerged marks that an agent's changes have been merged
func (sm *StateManager) MarkAsMerged(sessionName string) error {
	if err := sm.ensureStateDir(); err != nil {
		return err
	}

	// Load existing state
	states := make(map[string]AgentState)
	if data, err := os.ReadFile(sm.statePath); err != nil {
		if os.IsNotExist(err) {
			return fmt.Errorf("no state file found")
		}
		return err
	} else {
		if err := json.Unmarshal(data, &states); err != nil {
			return err
		}
	}

	// Update the specific session
	state, exists := states[sessionName]
	if !exists {
		return fmt.Errorf("session %s not found", sessionName)
	}

	now := time.Now()
	state.LastMergedAt = &now
	state.UpdatedAt = now

	states[sessionName] = state

	// Save to file
	data, err := json.MarshalIndent(states, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(sm.statePath, data, 0644)
}
