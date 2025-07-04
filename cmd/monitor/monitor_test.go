package monitor

import (
	"bytes"
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMonitorCommand(t *testing.T) {
	t.Run("monitor command exists", func(t *testing.T) {
		// uzi monitorコマンドが存在することを確認
		cmd := NewMonitorCmd()
		assert.NotNil(t, cmd)
		assert.Equal(t, "monitor", cmd.Name)
	})

	t.Run("monitor command has correct name", func(t *testing.T) {
		// 名前が正しく設定されているか確認
		cmd := NewMonitorCmd()
		assert.Equal(t, "monitor", cmd.Name)
	})

	t.Run("monitor outputs initial message", func(t *testing.T) {
		// 初期メッセージが出力されることを確認
		var buf bytes.Buffer
		monitor := &Monitor{
			output: &buf,
		}
		
		err := monitor.Start()
		require.NoError(t, err)
		
		output := buf.String()
		assert.Contains(t, output, "Monitoring agents...")
	})
}

func TestMonitorAgentDetection(t *testing.T) {
	t.Run("detects no agents", func(t *testing.T) {
		// エージェントがいない場合の動作を確認
		var buf bytes.Buffer
		monitor := &Monitor{
			output: &buf,
		}
		
		agents := monitor.GetActiveAgents()
		assert.Empty(t, agents)
	})

	t.Run("detects active agents", func(t *testing.T) {
		// アクティブなエージェントを検出できることを確認
		// このテストは後で実装時に詳細化します
		t.Skip("Implement after agent detection logic")
	})
}

func TestMonitorStatusChange(t *testing.T) {
	t.Run("detects status change", func(t *testing.T) {
		// ステータス変更を検知できることを確認
		var buf bytes.Buffer
		monitor := &Monitor{
			output:       &buf,
			pollInterval: 100 * time.Millisecond,
		}
		
		// 初期状態
		initialState := AgentState{
			Name:   "test-agent",
			Status: "idle",
		}
		
		// 変更後の状態
		changedState := AgentState{
			Name:   "test-agent",
			Status: "working",
		}
		
		// 状態変更を検知
		changes := monitor.DetectChanges([]AgentState{initialState}, []AgentState{changedState})
		
		assert.Len(t, changes, 1)
		assert.Equal(t, "STATUS", changes[0].Type)
		assert.Equal(t, "idle → working", changes[0].Description)
	})

	t.Run("detects multiple status changes", func(t *testing.T) {
		// 複数のエージェントの状態変更を検知
		monitor := &Monitor{}
		
		oldStates := []AgentState{
			{Name: "agent1", Status: "idle"},
			{Name: "agent2", Status: "working"},
			{Name: "agent3", Status: "ready"},
		}
		
		newStates := []AgentState{
			{Name: "agent1", Status: "working"},  // idle → working
			{Name: "agent2", Status: "ready"},    // working → ready
			{Name: "agent3", Status: "ready"},    // 変更なし
		}
		
		changes := monitor.DetectChanges(oldStates, newStates)
		
		assert.Len(t, changes, 2)
		assert.Equal(t, "agent1", changes[0].Agent)
		assert.Equal(t, "idle → working", changes[0].Description)
		assert.Equal(t, "agent2", changes[1].Agent)
		assert.Equal(t, "working → ready", changes[1].Description)
	})

	t.Run("detects no changes when states are same", func(t *testing.T) {
		// 状態に変更がない場合
		monitor := &Monitor{}
		
		states := []AgentState{
			{Name: "agent1", Status: "idle"},
			{Name: "agent2", Status: "working"},
		}
		
		changes := monitor.DetectChanges(states, states)
		assert.Empty(t, changes)
	})

	t.Run("detects new agents", func(t *testing.T) {
		// 新しいエージェントの追加を検知
		monitor := &Monitor{}
		
		oldStates := []AgentState{
			{Name: "agent1", Status: "idle"},
		}
		
		newStates := []AgentState{
			{Name: "agent1", Status: "idle"},
			{Name: "agent2", Status: "working"},
		}
		
		changes := monitor.DetectChanges(oldStates, newStates)
		
		assert.Len(t, changes, 1)
		assert.Equal(t, "NEW", changes[0].Type)
		assert.Equal(t, "agent2", changes[0].Agent)
		assert.Equal(t, "Agent started", changes[0].Description)
	})

	t.Run("detects removed agents", func(t *testing.T) {
		// エージェントの削除を検知
		monitor := &Monitor{}
		
		oldStates := []AgentState{
			{Name: "agent1", Status: "idle"},
			{Name: "agent2", Status: "working"},
		}
		
		newStates := []AgentState{
			{Name: "agent1", Status: "idle"},
		}
		
		changes := monitor.DetectChanges(oldStates, newStates)
		
		assert.Len(t, changes, 1)
		assert.Equal(t, "REMOVED", changes[0].Type)
		assert.Equal(t, "agent2", changes[0].Agent)
		assert.Equal(t, "Agent stopped", changes[0].Description)
	})
}

func TestMonitorOutput(t *testing.T) {
	t.Run("formats change output correctly", func(t *testing.T) {
		// 変更が正しくフォーマットされて出力されることを確認
		var buf bytes.Buffer
		monitor := &Monitor{
			output: &buf,
		}
		
		change := Change{
			Type:        "STATUS",
			Description: "idle → working",
			Agent:       "test-agent",
			Timestamp:   time.Date(2025, 6, 30, 10, 30, 0, 0, time.UTC),
		}
		
		monitor.PrintChange(change)
		
		output := buf.String()
		// タイムスタンプを含む出力を確認
		assert.Contains(t, output, "[10:30:00]")
		assert.Contains(t, output, "test-agent")
		assert.Contains(t, output, "STATUS")
		assert.Contains(t, output, "idle → working")
	})

	t.Run("uses different formatting for different change types", func(t *testing.T) {
		var buf bytes.Buffer
		monitor := &Monitor{
			output: &buf,
		}
		
		testCases := []struct {
			changeType string
			expected   string
		}{
			{"STATUS", "STATUS"},
			{"ERROR", "ERROR"},
			{"NEW", "NEW"},
			{"REMOVED", "REMOVED"},
		}
		
		for _, tc := range testCases {
			buf.Reset()
			change := Change{
				Type:        tc.changeType,
				Description: "test description",
				Agent:       "test-agent",
				Timestamp:   time.Now(),
			}
			
			monitor.PrintChange(change)
			output := buf.String()
			assert.Contains(t, output, tc.expected)
		}
	})
}

func TestMonitorEventIntegration(t *testing.T) {
	t.Run("converts changes to events", func(t *testing.T) {
		// 変更をイベントに変換できることを確認
		monitor := &Monitor{}
		
		changes := []Change{
			{
				Type:        "STATUS",
				Description: "idle → working",
				Agent:       "agent1",
				Timestamp:   time.Now(),
			},
			{
				Type:        "NEW",
				Description: "Agent started",
				Agent:       "agent2",
				Timestamp:   time.Now(),
			},
		}
		
		events := monitor.ChangesToEvents(changes)
		
		assert.Len(t, events, 2)
		assert.Equal(t, CategoryStatus, events[0].Category)
		assert.Equal(t, "idle → working", events[0].Description)
		assert.Equal(t, CategoryStatus, events[1].Category)
		assert.Equal(t, "Agent started", events[1].Description)
	})

	t.Run("prints events with formatting", func(t *testing.T) {
		var buf bytes.Buffer
		monitor := &Monitor{
			output: &buf,
		}
		
		event := Event{
			Category:    CategoryError,
			Agent:       "test-agent",
			Description: "Build failed",
			Timestamp:   time.Now(),
		}
		
		monitor.PrintEvent(event)
		
		output := buf.String()
		assert.Contains(t, output, "🔴") // 高優先度インジケータ
		assert.Contains(t, output, "ERROR")
		assert.Contains(t, output, "Build failed")
	})

	t.Run("applies event filter when printing", func(t *testing.T) {
		var buf bytes.Buffer
		monitor := &Monitor{
			output: &buf,
			eventFilter: &EventFilter{
				Categories: []string{CategoryError, CategoryHelp},
			},
		}
		
		events := []Event{
			{Category: CategoryError, Agent: "agent1", Description: "error", Timestamp: time.Now()},
			{Category: CategoryStatus, Agent: "agent2", Description: "status", Timestamp: time.Now()},
			{Category: CategoryHelp, Agent: "agent3", Description: "help", Timestamp: time.Now()},
		}
		
		for _, event := range events {
			monitor.PrintEventWithFilter(event)
		}
		
		output := buf.String()
		assert.Contains(t, output, "error")
		assert.NotContains(t, output, "status") // フィルタされて表示されない
		assert.Contains(t, output, "help")
	})
}

func TestMonitorLoop(t *testing.T) {
	t.Run("monitor loop detects and prints changes", func(t *testing.T) {
		// 監視ループが変更を検出して出力することを確認
		var buf bytes.Buffer
		monitor := &Monitor{
			output:       &buf,
			pollInterval: 10 * time.Millisecond,
		}
		
		// モックのエージェント状態を設定
		states := [][]AgentState{
			// 初期状態
			{
				{Name: "agent1", Status: "idle"},
			},
			// 次の状態（変更あり）
			{
				{Name: "agent1", Status: "working"},
				{Name: "agent2", Status: "idle"},
			},
		}
		
		ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
		defer cancel()
		
		stateIndex := 0
		monitor.getAgentStates = func() []AgentState {
			if stateIndex < len(states) {
				s := states[stateIndex]
				stateIndex++
				return s
			}
			return states[len(states)-1]
		}
		
		err := monitor.RunLoop(ctx)
		assert.NoError(t, err)
		
		output := buf.String()
		// ステータス変更が出力されることを確認
		assert.Contains(t, output, "idle → working")
		// 新しいエージェントが検出されることを確認
		assert.Contains(t, output, "Agent started")
		// イベント形式で出力されることを確認
		assert.Contains(t, output, "STATUS")
	})
}

func TestGetAgentStatesFromWorktree(t *testing.T) {
	t.Run("gets agent states from git worktree", func(t *testing.T) {
		// git worktreeからエージェント状態を取得できることを確認
		monitor := &Monitor{}
		
		// 実際のgit worktreeの代わりにモックデータを使用
		// この時点では仮実装として空のリストを返すことを確認
		states := monitor.getDefaultAgentStates()
		assert.NotNil(t, states)
		assert.IsType(t, []AgentState{}, states)
	})
}

func TestPriorityBasedDisplay(t *testing.T) {
	t.Run("shows only high priority events when many events occur", func(t *testing.T) {
		// 多数のイベントが発生した際に高優先度のみ表示
		var buf bytes.Buffer
		monitor := &Monitor{
			output:       &buf,
			pollInterval: 10 * time.Millisecond,
		}
		
		// 多数のイベントを生成
		events := []Event{}
		for i := 0; i < 20; i++ {
			events = append(events, Event{
				Category:    CategoryFile,
				Agent:       fmt.Sprintf("agent%d", i),
				Description: "File changed",
				Timestamp:   time.Now(),
			})
		}
		// 高優先度イベントを追加
		events = append(events, Event{
			Category:    CategoryError,
			Agent:       "important-agent",
			Description: "Build failed",
			Timestamp:   time.Now(),
		})
		
		// イベント数が多い場合の処理をテスト
		processedEvents := monitor.ProcessEventsWithPriority(events)
		
		// 高優先度イベントが含まれていることを確認
		hasHighPriority := false
		for _, e := range processedEvents {
			if GetCategoryPriority(e.Category) == PriorityHigh {
				hasHighPriority = true
				break
			}
		}
		assert.True(t, hasHighPriority, "高優先度イベントが含まれているべき")
	})
	
	t.Run("limits number of events displayed per cycle", func(t *testing.T) {
		// 1サイクルあたりの表示イベント数を制限
		monitor := &Monitor{
			maxEventsPerCycle: 10,
		}
		
		// 15個のイベントを生成
		events := []Event{}
		for i := 0; i < 15; i++ {
			events = append(events, Event{
				Category:    CategoryStatus,
				Agent:       fmt.Sprintf("agent%d", i),
				Description: "Status changed",
				Timestamp:   time.Now(),
			})
		}
		
		processed := monitor.ProcessEventsWithPriority(events)
		
		// 最大数以下に制限されていることを確認
		assert.LessOrEqual(t, len(processed), 10)
	})
}