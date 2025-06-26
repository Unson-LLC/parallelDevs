package status

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

// ステータス定数
const (
	StatusIdle    = "idle"
	StatusRunning = "running"
	StatusReady   = "ready"
	StatusMerged  = "merged"
	StatusError   = "error"
)

// DetailedStatus - 詳細モード用のステータス情報
type DetailedStatus struct {
	Status      string
	Icon        string
	LastChanged time.Time
	IsStuck     bool
}

// StatusManager - ステータス管理のインターフェース
type StatusManager interface {
	GetStatus(sessionName string) (string, error)
	GetDetailedStatus(sessionName string) (DetailedStatus, error)
	MarkAsMerged(sessionName string) error
	ClearMarkerFile(sessionName string) error
}

// statusManager - StatusManagerの実装
type statusManager struct {
	tmuxClient   TmuxClient
	stateManager StateManager
}

// TmuxClient - tmuxとの通信インターフェース
type TmuxClient interface {
	GetPaneContent(sessionName string) (string, error)
}

// StateManager - 状態管理インターフェース
type StateManager interface {
	GetWorktreeInfo(sessionName string) (*AgentState, error)
	MarkAsMerged(sessionName string) error
}

// AgentState - エージェントの状態
type AgentState struct {
	WorktreePath string
	UpdatedAt    time.Time
	IsMerged     bool
}

// NewStatusManager - StatusManagerのコンストラクタ
func NewStatusManager(tmux TmuxClient, state StateManager) StatusManager {
	return &statusManager{
		tmuxClient:   tmux,
		stateManager: state,
	}
}

// GetStatus - ステータス判定の実装
func (sm *statusManager) GetStatus(sessionName string) (string, error) {
	// 優先順位1: tmuxペイン内容を取得
	paneContent, err := sm.tmuxClient.GetPaneContent(sessionName)
	if err != nil {
		// tmuxエラーの場合はerror
		return StatusError, nil
	}
	
	// 優先順位2: エラーメッセージチェック
	if strings.Contains(paneContent, "Error:") || strings.Contains(paneContent, "error:") {
		return StatusError, nil
	}
	
	// 優先順位3: 実行中チェック
	if strings.Contains(paneContent, "esc to interrupt") || strings.Contains(paneContent, "Thinking") {
		return StatusRunning, nil
	}
	
	// 優先順位4: マージ済みチェック
	state, err := sm.stateManager.GetWorktreeInfo(sessionName)
	if err == nil && state.IsMerged {
		return StatusMerged, nil
	}
	
	// 優先順位5: マーカーファイルチェック
	if err == nil && hasMarkerFile(state.WorktreePath) {
		return StatusReady, nil
	}
	
	// デフォルト: idle
	return StatusIdle, nil
}

// GetDetailedStatus - 詳細ステータスの実装
func (sm *statusManager) GetDetailedStatus(sessionName string) (DetailedStatus, error) {
	status, err := sm.GetStatus(sessionName)
	if err != nil {
		return DetailedStatus{}, err
	}
	
	// アイコンのマッピング
	iconMap := map[string]string{
		StatusIdle:    "💤",
		StatusRunning: "🏃",
		StatusReady:   "✅",
		StatusMerged:  "🔀",
		StatusError:   "❌",
	}
	
	// UpdatedAtを取得してstuck判定
	state, err := sm.stateManager.GetWorktreeInfo(sessionName)
	lastChanged := time.Now()
	isStuck := false
	
	if err == nil {
		lastChanged = state.UpdatedAt
		// 5分以上更新がない場合はstuck
		if time.Since(state.UpdatedAt) > 5*time.Minute {
			isStuck = true
		}
	}
	
	return DetailedStatus{
		Status:      status,
		Icon:        iconMap[status],
		LastChanged: lastChanged,
		IsStuck:     isStuck,
	}, nil
}

// MarkAsMerged - マージ済みとしてマーク
func (sm *statusManager) MarkAsMerged(sessionName string) error {
	return sm.stateManager.MarkAsMerged(sessionName)
}

// ClearMarkerFile - マーカーファイルを削除
func (sm *statusManager) ClearMarkerFile(sessionName string) error {
	state, err := sm.stateManager.GetWorktreeInfo(sessionName)
	if err != nil {
		return err
	}
	
	markerPath := getMarkerFilePath(state.WorktreePath)
	return os.Remove(markerPath)
}

// defaultTmuxClient - デフォルトのTmuxClient実装
type defaultTmuxClient struct{}

func (c *defaultTmuxClient) GetPaneContent(sessionName string) (string, error) {
	cmd := exec.Command("tmux", "capture-pane", "-t", sessionName+":agent", "-p")
	output, err := cmd.Output()
	if err != nil {
		return "", err
	}
	return string(output), nil
}

// マーカーファイルのパスを取得
func getMarkerFilePath(worktreePath string) string {
	return filepath.Join(worktreePath, ".uzi-task-completed")
}

// マーカーファイルの存在確認
func hasMarkerFile(worktreePath string) bool {
	markerPath := getMarkerFilePath(worktreePath)
	_, err := os.Stat(markerPath)
	return err == nil
}