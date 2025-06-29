package monitor

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCommandLineFiltering(t *testing.T) {
	t.Run("parse category filter from command line", func(t *testing.T) {
		// コマンドラインからカテゴリフィルタを解析できることを確認
		args := []string{"--category", "ERROR,HELP"}
		
		filter, err := ParseFilterArgs(args)
		assert.NoError(t, err)
		assert.NotNil(t, filter)
		assert.Equal(t, []string{"ERROR", "HELP"}, filter.Categories)
	})

	t.Run("parse priority filter from command line", func(t *testing.T) {
		// コマンドラインから優先度フィルタを解析できることを確認
		args := []string{"--priority", "high"}
		
		filter, err := ParseFilterArgs(args)
		assert.NoError(t, err)
		assert.NotNil(t, filter)
		assert.Equal(t, PriorityHigh, filter.MinPriority)
	})

	t.Run("parse agent filter from command line", func(t *testing.T) {
		// コマンドラインからエージェントフィルタを解析できることを確認
		args := []string{"--agent", "agent1,agent2"}
		
		filter, err := ParseFilterArgs(args)
		assert.NoError(t, err)
		assert.NotNil(t, filter)
		assert.Equal(t, []string{"agent1", "agent2"}, filter.Agents)
	})

	t.Run("parse multiple filters from command line", func(t *testing.T) {
		// 複数のフィルタを同時に解析できることを確認
		args := []string{
			"--category", "ERROR,WARNING",
			"--priority", "medium",
			"--agent", "test-agent",
		}
		
		filter, err := ParseFilterArgs(args)
		assert.NoError(t, err)
		assert.NotNil(t, filter)
		assert.Equal(t, []string{"ERROR", "WARNING"}, filter.Categories)
		assert.Equal(t, PriorityMedium, filter.MinPriority)
		assert.Equal(t, []string{"test-agent"}, filter.Agents)
	})

	t.Run("invalid priority returns error", func(t *testing.T) {
		// 無効な優先度でエラーを返すことを確認
		args := []string{"--priority", "invalid"}
		
		filter, err := ParseFilterArgs(args)
		assert.Error(t, err)
		assert.Nil(t, filter)
		assert.Contains(t, err.Error(), "invalid priority")
	})
}

func TestAgentFiltering(t *testing.T) {
	t.Run("filters events by agent name", func(t *testing.T) {
		// エージェント名でイベントをフィルタできることを確認
		events := []Event{
			{Category: CategoryStatus, Agent: "agent1", Description: "test1"},
			{Category: CategoryStatus, Agent: "agent2", Description: "test2"},
			{Category: CategoryStatus, Agent: "agent3", Description: "test3"},
		}
		
		filter := &EventFilter{
			Agents: []string{"agent1", "agent3"},
		}
		
		filtered := filter.Apply(events)
		
		assert.Len(t, filtered, 2)
		assert.Equal(t, "agent1", filtered[0].Agent)
		assert.Equal(t, "agent3", filtered[1].Agent)
	})

	t.Run("empty agent filter allows all agents", func(t *testing.T) {
		// エージェントフィルタが空の場合、すべてのエージェントを許可
		events := []Event{
			{Category: CategoryStatus, Agent: "agent1", Description: "test1"},
			{Category: CategoryStatus, Agent: "agent2", Description: "test2"},
		}
		
		filter := &EventFilter{
			Agents: []string{},
		}
		
		filtered := filter.Apply(events)
		assert.Len(t, filtered, 2)
	})
}

func TestFilterPersistence(t *testing.T) {
	t.Run("saves filter configuration to file", func(t *testing.T) {
		// フィルタ設定をファイルに保存できることを確認
		filter := &EventFilter{
			Categories:  []string{"ERROR", "WARNING"},
			MinPriority: PriorityMedium,
			Agents:      []string{"agent1"},
		}
		
		err := SaveFilterConfig(filter, "test-filter.json")
		assert.NoError(t, err)
		
		// ファイルが存在することを確認
		loaded, err := LoadFilterConfig("test-filter.json")
		assert.NoError(t, err)
		assert.Equal(t, filter.Categories, loaded.Categories)
		assert.Equal(t, filter.MinPriority, loaded.MinPriority)
		assert.Equal(t, filter.Agents, loaded.Agents)
	})

	t.Run("loads default filter if file not found", func(t *testing.T) {
		// ファイルが見つからない場合、デフォルトフィルタを読み込む
		filter, err := LoadFilterConfig("non-existent-filter.json")
		assert.NoError(t, err)
		assert.NotNil(t, filter)
		// デフォルトは制限なし
		assert.Empty(t, filter.Categories)
		assert.Equal(t, PriorityLow, filter.MinPriority)
		assert.Empty(t, filter.Agents)
	})
}

func TestInteractiveFilterCommands(t *testing.T) {
	t.Run("toggles category filter interactively", func(t *testing.T) {
		// インタラクティブにカテゴリフィルタを切り替えられることを確認
		monitor := &Monitor{
			eventFilter: &EventFilter{
				Categories: []string{"ERROR"},
			},
		}
		
		// ERRORカテゴリをトグル（削除）
		monitor.ToggleCategoryFilter("ERROR")
		assert.Empty(t, monitor.eventFilter.Categories)
		
		// ERRORカテゴリをトグル（追加）
		monitor.ToggleCategoryFilter("ERROR")
		assert.Contains(t, monitor.eventFilter.Categories, "ERROR")
	})

	t.Run("cycles through priority levels", func(t *testing.T) {
		// 優先度レベルを循環できることを確認
		monitor := &Monitor{
			eventFilter: &EventFilter{
				MinPriority: PriorityLow,
			},
		}
		
		// Low -> Medium
		monitor.CyclePriorityFilter()
		assert.Equal(t, PriorityMedium, monitor.eventFilter.MinPriority)
		
		// Medium -> High
		monitor.CyclePriorityFilter()
		assert.Equal(t, PriorityHigh, monitor.eventFilter.MinPriority)
		
		// High -> Low
		monitor.CyclePriorityFilter()
		assert.Equal(t, PriorityLow, monitor.eventFilter.MinPriority)
	})

	t.Run("resets all filters", func(t *testing.T) {
		// すべてのフィルタをリセットできることを確認
		monitor := &Monitor{
			eventFilter: &EventFilter{
				Categories:  []string{"ERROR", "WARNING"},
				MinPriority: PriorityHigh,
				Agents:      []string{"agent1"},
			},
		}
		
		monitor.ResetFilters()
		
		assert.Empty(t, monitor.eventFilter.Categories)
		assert.Equal(t, PriorityLow, monitor.eventFilter.MinPriority)
		assert.Empty(t, monitor.eventFilter.Agents)
	})
}