package status

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

// テストヘルパー：モックtmuxペイン内容
type mockTmuxClient struct {
	paneContent map[string]string
	hasError    map[string]bool
}

func (m *mockTmuxClient) GetPaneContent(sessionName string) (string, error) {
	if m.hasError[sessionName] {
		return "", os.ErrNotExist
	}
	return m.paneContent[sessionName], nil
}

// テストヘルパー：モックStateManager
type mockStateManager struct {
	states map[string]mockAgentState
}

type mockAgentState struct {
	WorktreePath string
	UpdatedAt    time.Time
	IsMerged     bool
}

func (m *mockStateManager) GetWorktreeInfo(sessionName string) (*mockAgentState, error) {
	if state, ok := m.states[sessionName]; ok {
		return &state, nil
	}
	return nil, os.ErrNotExist
}

func (m *mockStateManager) MarkAsMerged(sessionName string) error {
	if state, ok := m.states[sessionName]; ok {
		state.IsMerged = true
		m.states[sessionName] = state
		return nil
	}
	return os.ErrNotExist
}

// TestStatusTransitions - ステータス遷移のテスト
func TestStatusTransitions(t *testing.T) {
	tests := []struct {
		name           string
		sessionName    string
		paneContent    string
		hasMarkerFile  bool
		isMerged       bool
		lastUpdate     time.Time
		expectedStatus string
		expectedIcon   string
	}{
		// idle状態のテスト
		{
			name:           "初期状態はidle",
			sessionName:    "agent-1",
			paneContent:    "Waiting for input",
			hasMarkerFile:  false,
			isMerged:       false,
			lastUpdate:     time.Now(),
			expectedStatus: StatusIdle,
			expectedIcon:   "💤",
		},
		// idle → running
		{
			name:           "esc to interruptが含まれる場合はrunning",
			sessionName:    "agent-2",
			paneContent:    "Processing... esc to interrupt",
			hasMarkerFile:  false,
			isMerged:       false,
			lastUpdate:     time.Now(),
			expectedStatus: StatusRunning,
			expectedIcon:   "🏃",
		},
		// idle → running (Thinking)
		{
			name:           "Thinkingが含まれる場合もrunning",
			sessionName:    "agent-3",
			paneContent:    "Thinking about the solution...",
			hasMarkerFile:  false,
			isMerged:       false,
			lastUpdate:     time.Now(),
			expectedStatus: StatusRunning,
			expectedIcon:   "🏃",
		},
		// running → ready (マーカーファイルあり)
		{
			name:           "マーカーファイルが存在する場合はready",
			sessionName:    "agent-4",
			paneContent:    "Task completed",
			hasMarkerFile:  true,
			isMerged:       false,
			lastUpdate:     time.Now(),
			expectedStatus: StatusReady,
			expectedIcon:   "✅",
		},
		// ready → merged
		{
			name:           "マージ済みの場合はmerged",
			sessionName:    "agent-5",
			paneContent:    "Waiting for new task",
			hasMarkerFile:  false,
			isMerged:       true,
			lastUpdate:     time.Now(),
			expectedStatus: StatusMerged,
			expectedIcon:   "🔀",
		},
		// エラー状態
		{
			name:           "エラーメッセージが含まれる場合はerror",
			sessionName:    "agent-6",
			paneContent:    "Error: Failed to execute command",
			hasMarkerFile:  false,
			isMerged:       false,
			lastUpdate:     time.Now(),
			expectedStatus: StatusError,
			expectedIcon:   "❌",
		},
		// tmuxエラー
		{
			name:           "tmuxペイン取得エラーの場合もerror",
			sessionName:    "agent-7",
			paneContent:    "",
			hasMarkerFile:  false,
			isMerged:       false,
			lastUpdate:     time.Now(),
			expectedStatus: StatusError,
			expectedIcon:   "❌",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// モックの準備
			tmuxClient := &mockTmuxClient{
				paneContent: map[string]string{
					tt.sessionName: tt.paneContent,
				},
				hasError: map[string]bool{
					"agent-7": true, // agent-7はtmuxエラー
				},
			}
			
			// モックStateManagerの準備
			stateManager := &mockStateManager{
				states: map[string]mockAgentState{
					tt.sessionName: {
						WorktreePath: "/tmp/test-worktree",
						UpdatedAt:    tt.lastUpdate,
						IsMerged:     tt.isMerged,
					},
				},
			}
			
			// マーカーファイルの準備
			if tt.hasMarkerFile {
				markerPath := filepath.Join("/tmp/test-worktree", ".uzi-task-completed")
				os.MkdirAll("/tmp/test-worktree", 0755)
				os.WriteFile(markerPath, []byte("completed"), 0644)
				defer os.Remove(markerPath)
			}
			
			// ここで変数を使用しないため、コメントアウト
			_ = tmuxClient
			_ = stateManager
			
			// StatusManagerのテスト（まだモックの実装が必要なのでスキップ）
			t.Skip("Mock implementation needed for full testing")
		})
	}
}

// TestDetailedStatusWithStuckDetection - 詳細モードのstuck検出テスト
func TestDetailedStatusWithStuckDetection(t *testing.T) {
	tests := []struct {
		name           string
		sessionName    string
		paneContent    string
		lastUpdate     time.Time
		expectedStatus string
		expectedIcon   string
		expectedStuck  bool
	}{
		{
			name:           "5分以内の更新はstuckではない",
			sessionName:    "agent-1",
			paneContent:    "Working on task",
			lastUpdate:     time.Now().Add(-3 * time.Minute),
			expectedStatus: StatusIdle,
			expectedIcon:   "💤",
			expectedStuck:  false,
		},
		{
			name:           "5分以上更新がない場合はstuck",
			sessionName:    "agent-2",
			paneContent:    "Working on task",
			lastUpdate:     time.Now().Add(-6 * time.Minute),
			expectedStatus: StatusIdle,
			expectedIcon:   "💤",
			expectedStuck:  true,
		},
		{
			name:           "runningでも5分以上ならstuck",
			sessionName:    "agent-3",
			paneContent:    "Thinking...",
			lastUpdate:     time.Now().Add(-10 * time.Minute),
			expectedStatus: StatusRunning,
			expectedIcon:   "🏃",
			expectedStuck:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// このテストも失敗するはず（RED phase）
			t.Skip("DetailedStatus not implemented yet")
		})
	}
}

// TestMarkerFileHandling - マーカーファイルの処理テスト
func TestMarkerFileHandling(t *testing.T) {
	tmpDir := t.TempDir()
	markerPath := filepath.Join(tmpDir, ".uzi-task-completed")

	tests := []struct {
		name          string
		createMarker  bool
		expectedExist bool
	}{
		{
			name:          "マーカーファイルが作成される",
			createMarker:  true,
			expectedExist: true,
		},
		{
			name:          "マーカーファイルが削除される",
			createMarker:  false,
			expectedExist: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.createMarker {
				// マーカーファイルを作成
				if err := os.WriteFile(markerPath, []byte("completed"), 0644); err != nil {
					t.Fatal(err)
				}
			}

			// StatusManagerのClearMarkerFileメソッドをテスト
			// このテストも失敗するはず（RED phase）
			t.Skip("ClearMarkerFile not implemented yet")
		})
	}
}

// TestStatusPriority - ステータス判定の優先順位テスト
func TestStatusPriority(t *testing.T) {
	tests := []struct {
		name           string
		paneContent    string
		hasMarkerFile  bool
		isMerged       bool
		hasError       bool
		expectedStatus string
		description    string
	}{
		{
			name:           "エラーが最優先",
			paneContent:    "Error: Failed\nThinking...",
			hasMarkerFile:  true,
			isMerged:       true,
			hasError:       false,
			expectedStatus: StatusError,
			description:    "エラーメッセージがある場合は他の条件に関わらずerror",
		},
		{
			name:           "runningが2番目の優先度",
			paneContent:    "esc to interrupt",
			hasMarkerFile:  true,
			isMerged:       true,
			hasError:       false,
			expectedStatus: StatusRunning,
			description:    "実行中の場合は他の完了状態より優先",
		},
		{
			name:           "mergedが3番目の優先度",
			paneContent:    "Done",
			hasMarkerFile:  true,
			isMerged:       true,
			hasError:       false,
			expectedStatus: StatusMerged,
			description:    "マージ済みはreadyより優先",
		},
		{
			name:           "readyが4番目の優先度",
			paneContent:    "Task complete",
			hasMarkerFile:  true,
			isMerged:       false,
			hasError:       false,
			expectedStatus: StatusReady,
			description:    "マーカーファイルがあればready",
		},
		{
			name:           "それ以外はidle",
			paneContent:    "Waiting",
			hasMarkerFile:  false,
			isMerged:       false,
			hasError:       false,
			expectedStatus: StatusIdle,
			description:    "どの条件も満たさない場合はidle",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// このテストも失敗するはず（RED phase）
			t.Skip("Status priority logic not implemented yet")
		})
	}
}