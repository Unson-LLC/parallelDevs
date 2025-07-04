package monitor

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestEventCategories(t *testing.T) {
	t.Run("event has correct category", func(t *testing.T) {
		// イベントが正しいカテゴリを持つことを確認
		event := Event{
			Category:    "ERROR",
			Agent:       "test-agent",
			Description: "Connection failed",
			Timestamp:   time.Now(),
		}
		
		assert.Equal(t, "ERROR", event.Category)
		assert.Equal(t, "test-agent", event.Agent)
		assert.Equal(t, "Connection failed", event.Description)
	})

	t.Run("supports all required categories", func(t *testing.T) {
		// 必要なすべてのカテゴリがサポートされていることを確認
		categories := []string{
			CategoryStatus,
			CategoryFile,
			CategoryError,
			CategoryHelp,
			CategoryProgress,
			CategoryComplete,
			CategoryGit,
			CategoryTest,
			CategoryWarning,
		}
		
		for _, cat := range categories {
			assert.NotEmpty(t, cat, "Category %s should not be empty", cat)
		}
	})
}

func TestEventPriority(t *testing.T) {
	t.Run("categories have correct priorities", func(t *testing.T) {
		// カテゴリが正しい優先度を持つことを確認
		testCases := []struct {
			category string
			priority Priority
		}{
			{CategoryError, PriorityHigh},
			{CategoryHelp, PriorityHigh},
			{CategoryComplete, PriorityMedium},
			{CategoryWarning, PriorityMedium},
			{CategoryTest, PriorityMedium},
			{CategoryStatus, PriorityLow},
			{CategoryFile, PriorityLow},
			{CategoryProgress, PriorityLow},
			{CategoryGit, PriorityLow},
		}
		
		for _, tc := range testCases {
			priority := GetCategoryPriority(tc.category)
			assert.Equal(t, tc.priority, priority, 
				"Category %s should have priority %s", tc.category, tc.priority)
		}
	})

	t.Run("unknown category has low priority", func(t *testing.T) {
		// 未知のカテゴリは低優先度になることを確認
		priority := GetCategoryPriority("UNKNOWN")
		assert.Equal(t, PriorityLow, priority)
	})
}

func TestEventFormatting(t *testing.T) {
	t.Run("formats event with priority indicator", func(t *testing.T) {
		// 優先度インジケータ付きでイベントがフォーマットされることを確認
		event := Event{
			Category:    CategoryError,
			Agent:       "test-agent",
			Description: "Build failed",
			Timestamp:   time.Date(2025, 6, 30, 10, 30, 0, 0, time.UTC),
		}
		
		formatted := FormatEvent(event)
		
		// 高優先度のエラーは特別なマーカーを持つ
		assert.Contains(t, formatted, "🔴")
		assert.Contains(t, formatted, "[10:30:00]")
		assert.Contains(t, formatted, "test-agent")
		assert.Contains(t, formatted, "ERROR")
		assert.Contains(t, formatted, "Build failed")
	})

	t.Run("uses different indicators for different priorities", func(t *testing.T) {
		testCases := []struct {
			category  string
			indicator string
		}{
			{CategoryError, "🔴"},    // 高優先度
			{CategoryHelp, "🔴"},     // 高優先度
			{CategoryComplete, "🟡"}, // 中優先度
			{CategoryWarning, "🟡"},  // 中優先度
			{CategoryStatus, "🟢"},   // 低優先度
			{CategoryFile, "🟢"},     // 低優先度
		}
		
		for _, tc := range testCases {
			event := Event{
				Category:    tc.category,
				Agent:       "test",
				Description: "test",
				Timestamp:   time.Now(),
			}
			
			formatted := FormatEvent(event)
			assert.Contains(t, formatted, tc.indicator,
				"Category %s should have indicator %s", tc.category, tc.indicator)
		}
	})
}

func TestEventFiltering(t *testing.T) {
	t.Run("filters events by category", func(t *testing.T) {
		events := []Event{
			{Category: CategoryError, Agent: "agent1", Description: "error"},
			{Category: CategoryStatus, Agent: "agent2", Description: "status"},
			{Category: CategoryHelp, Agent: "agent3", Description: "help"},
			{Category: CategoryFile, Agent: "agent4", Description: "file"},
		}
		
		// エラーとヘルプのみをフィルタ
		filter := EventFilter{
			Categories: []string{CategoryError, CategoryHelp},
		}
		
		filtered := filter.Apply(events)
		
		assert.Len(t, filtered, 2)
		assert.Equal(t, CategoryError, filtered[0].Category)
		assert.Equal(t, CategoryHelp, filtered[1].Category)
	})

	t.Run("filters events by priority", func(t *testing.T) {
		events := []Event{
			{Category: CategoryError, Agent: "agent1"},    // High
			{Category: CategoryComplete, Agent: "agent2"}, // Medium
			{Category: CategoryStatus, Agent: "agent3"},   // Low
			{Category: CategoryHelp, Agent: "agent4"},     // High
		}
		
		// 高優先度のみをフィルタ
		filter := EventFilter{
			MinPriority: PriorityHigh,
		}
		
		filtered := filter.Apply(events)
		
		assert.Len(t, filtered, 2)
		assert.Equal(t, CategoryError, filtered[0].Category)
		assert.Equal(t, CategoryHelp, filtered[1].Category)
	})
}