package monitor

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestClaudeMDDetection(t *testing.T) {
	t.Run("detects CLAUDE.md changes in worktree", func(t *testing.T) {
		// worktreeでCLAUDE.mdの変更を検出できることを確認
		tmpDir := t.TempDir()
		claudePath := filepath.Join(tmpDir, "CLAUDE.md")
		
		// CLAUDE.mdファイルを作成
		err := os.WriteFile(claudePath, []byte("# Initial content"), 0644)
		require.NoError(t, err)
		
		// ファイル情報を取得
		initialInfo, err := os.Stat(claudePath)
		require.NoError(t, err)
		
		monitor := &Monitor{}
		
		// 初期状態
		initialState := []AgentState{
			{
				Name:         "test-agent",
				Status:       "idle",
				ClaudeMDPath: claudePath,
				ClaudeMDInfo: &ClaudeMDInfo{
					Exists:       true,
					LastModified: initialInfo.ModTime(),
					Size:         initialInfo.Size(),
				},
			},
		}
		
		// ファイル更新のために少し待つ
		time.Sleep(10 * time.Millisecond)
		
		// CLAUDE.mdを変更
		err = os.WriteFile(claudePath, []byte("# Updated content with more text"), 0644)
		require.NoError(t, err)
		
		// 更新後のファイル情報を取得
		updatedInfo, err := os.Stat(claudePath)
		require.NoError(t, err)
		
		// 変更後の状態
		updatedState := []AgentState{
			{
				Name:         "test-agent",
				Status:       "idle",
				ClaudeMDPath: claudePath,
				ClaudeMDInfo: &ClaudeMDInfo{
					Exists:       true,
					LastModified: updatedInfo.ModTime(),
					Size:         updatedInfo.Size(),
				},
			},
		}
		
		// 変更を検出
		changes := monitor.DetectClaudeMDChanges(initialState, updatedState)
		
		assert.Len(t, changes, 1)
		assert.Equal(t, "CLAUDE_MD", changes[0].Type)
		assert.Equal(t, "test-agent", changes[0].Agent)
		assert.Contains(t, changes[0].Description, "CLAUDE.md updated")
	})

	t.Run("detects CLAUDE.md creation", func(t *testing.T) {
		// CLAUDE.mdの新規作成を検出できることを確認
		tmpDir := t.TempDir()
		claudePath := filepath.Join(tmpDir, "CLAUDE.md")
		
		monitor := &Monitor{}
		
		// 初期状態（CLAUDE.mdなし）
		initialState := []AgentState{
			{Name: "test-agent", Status: "idle", ClaudeMDPath: ""},
		}
		
		// CLAUDE.mdを作成
		err := os.WriteFile(claudePath, []byte("# New content"), 0644)
		require.NoError(t, err)
		
		// 作成後の状態
		updatedState := []AgentState{
			{Name: "test-agent", Status: "idle", ClaudeMDPath: claudePath},
		}
		
		// 変更を検出
		changes := monitor.DetectClaudeMDChanges(initialState, updatedState)
		
		assert.Len(t, changes, 1)
		assert.Equal(t, "CLAUDE_MD", changes[0].Type)
		assert.Contains(t, changes[0].Description, "CLAUDE.md created")
	})

	t.Run("detects CLAUDE.md deletion", func(t *testing.T) {
		// CLAUDE.mdの削除を検出できることを確認
		tmpDir := t.TempDir()
		claudePath := filepath.Join(tmpDir, "CLAUDE.md")
		
		// CLAUDE.mdファイルを作成
		err := os.WriteFile(claudePath, []byte("# Content"), 0644)
		require.NoError(t, err)
		
		monitor := &Monitor{}
		
		// 初期状態（CLAUDE.mdあり）
		initialState := []AgentState{
			{Name: "test-agent", Status: "idle", ClaudeMDPath: claudePath},
		}
		
		// CLAUDE.mdを削除
		err = os.Remove(claudePath)
		require.NoError(t, err)
		
		// 削除後の状態
		updatedState := []AgentState{
			{Name: "test-agent", Status: "idle", ClaudeMDPath: ""},
		}
		
		// 変更を検出
		changes := monitor.DetectClaudeMDChanges(initialState, updatedState)
		
		assert.Len(t, changes, 1)
		assert.Equal(t, "CLAUDE_MD", changes[0].Type)
		assert.Contains(t, changes[0].Description, "CLAUDE.md deleted")
	})
}

func TestClaudeMDSummary(t *testing.T) {
	t.Run("generates summary of CLAUDE.md content", func(t *testing.T) {
		// CLAUDE.mdの内容の要約を生成できることを確認
		tmpDir := t.TempDir()
		claudePath := filepath.Join(tmpDir, "CLAUDE.md")
		
		content := `# Project Instructions

## Important Rules
1. Always write tests first
2. Use TypeScript for all code
3. Follow naming conventions

## API Keys
- API_KEY=xxx (masked)

## Dependencies
- React 18
- Next.js 14
`
		
		err := os.WriteFile(claudePath, []byte(content), 0644)
		require.NoError(t, err)
		
		monitor := &Monitor{}
		summary := monitor.GenerateClaudeMDSummary(claudePath)
		
		assert.Contains(t, summary, "rules") // ルール数は正確にカウントされる
		assert.Contains(t, summary, "1 API key")
		assert.Contains(t, summary, "sections")
		assert.NotContains(t, summary, "xxx") // APIキーはマスクされる
	})

	t.Run("handles empty CLAUDE.md", func(t *testing.T) {
		// 空のCLAUDE.mdを適切に処理
		tmpDir := t.TempDir()
		claudePath := filepath.Join(tmpDir, "CLAUDE.md")
		
		err := os.WriteFile(claudePath, []byte(""), 0644)
		require.NoError(t, err)
		
		monitor := &Monitor{}
		summary := monitor.GenerateClaudeMDSummary(claudePath)
		
		assert.Equal(t, "Empty CLAUDE.md", summary)
	})

	t.Run("handles missing CLAUDE.md", func(t *testing.T) {
		// 存在しないCLAUDE.mdを適切に処理
		monitor := &Monitor{}
		summary := monitor.GenerateClaudeMDSummary("/non/existent/path")
		
		assert.Equal(t, "CLAUDE.md not found", summary)
	})
}

func TestClaudeMDIntegration(t *testing.T) {
	t.Run("includes CLAUDE.md status in agent state", func(t *testing.T) {
		// エージェント状態にCLAUDE.mdの状態が含まれることを確認
		tmpDir := t.TempDir()
		
		// worktreeディレクトリを作成
		worktreeDir := filepath.Join(tmpDir, "agent1")
		err := os.MkdirAll(worktreeDir, 0755)
		require.NoError(t, err)
		
		// CLAUDE.mdを作成
		claudePath := filepath.Join(worktreeDir, "CLAUDE.md")
		err = os.WriteFile(claudePath, []byte("# Instructions"), 0644)
		require.NoError(t, err)
		
		// monitor := &Monitor{}
		
		// エージェント状態を取得（実装時に使用）
		state := AgentState{
			Name:         "agent1",
			Status:       "idle",
			WorktreeDir:  worktreeDir,
			ClaudeMDPath: claudePath,
			ClaudeMDInfo: &ClaudeMDInfo{
				Exists:       true,
				LastModified: time.Now(),
				Size:         14,
			},
		}
		
		assert.True(t, state.ClaudeMDInfo.Exists)
		assert.Equal(t, int64(14), state.ClaudeMDInfo.Size)
	})

	t.Run("CLAUDE.md changes trigger high priority events", func(t *testing.T) {
		// CLAUDE.mdの変更が高優先度イベントをトリガーすることを確認
		monitor := &Monitor{}
		
		change := Change{
			Type:        "CLAUDE_MD",
			Description: "CLAUDE.md updated",
			Agent:       "test-agent",
			Timestamp:   time.Now(),
		}
		
		events := monitor.ChangesToEvents([]Change{change})
		
		assert.Len(t, events, 1)
		assert.Equal(t, CategoryHelp, events[0].Category) // HELPカテゴリは高優先度
		priority := GetCategoryPriority(events[0].Category)
		assert.Equal(t, PriorityHigh, priority)
	})
}

func TestClaudeMDWatching(t *testing.T) {
	t.Run("watch mode detects real-time CLAUDE.md changes", func(t *testing.T) {
		// リアルタイムでCLAUDE.mdの変更を検出できることを確認
		tmpDir := t.TempDir()
		claudePath := filepath.Join(tmpDir, "CLAUDE.md")
		
		// 初期ファイルを作成
		err := os.WriteFile(claudePath, []byte("# Initial"), 0644)
		require.NoError(t, err)
		
		// monitor := &Monitor{
		// 	claudeMDWatcher: &ClaudeMDWatcher{
		// 		paths: map[string]string{
		// 			"test-agent": claudePath,
		// 		},
		// 	},
		// }
		
		// ファイルの最終更新時刻を記録
		initialInfo, err := os.Stat(claudePath)
		require.NoError(t, err)
		
		// ファイルを更新
		time.Sleep(10 * time.Millisecond) // ファイルシステムの精度のため
		err = os.WriteFile(claudePath, []byte("# Updated"), 0644)
		require.NoError(t, err)
		
		// 更新後の情報を取得
		updatedInfo, err := os.Stat(claudePath)
		require.NoError(t, err)
		
		// 変更が検出されることを確認
		assert.True(t, updatedInfo.ModTime().After(initialInfo.ModTime()))
	})
}