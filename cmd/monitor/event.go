package monitor

import (
	"fmt"
	"time"
)

// Event はシステムで発生したイベントを表す
type Event struct {
	Category    string
	Agent       string
	Description string
	Timestamp   time.Time
}

// Priority はイベントの優先度を表す
type Priority int

const (
	PriorityLow Priority = iota
	PriorityMedium
	PriorityHigh
)

// カテゴリ定数
const (
	CategoryStatus   = "STATUS"
	CategoryFile     = "FILE"
	CategoryError    = "ERROR"
	CategoryHelp     = "HELP"
	CategoryProgress = "PROGRESS"
	CategoryComplete = "COMPLETE"
	CategoryGit      = "GIT"
	CategoryTest     = "TEST"
	CategoryWarning  = "WARNING"
)

// GetCategoryPriority はカテゴリの優先度を返す
func GetCategoryPriority(category string) Priority {
	switch category {
	case CategoryError, CategoryHelp:
		return PriorityHigh
	case CategoryComplete, CategoryWarning, CategoryTest:
		return PriorityMedium
	default:
		return PriorityLow
	}
}

// FormatEvent はイベントをフォーマットして文字列で返す
func FormatEvent(event Event) string {
	// 優先度に応じたインジケータを取得
	priority := GetCategoryPriority(event.Category)
	indicator := ""
	switch priority {
	case PriorityHigh:
		indicator = "🔴"
	case PriorityMedium:
		indicator = "🟡"
	case PriorityLow:
		indicator = "🟢"
	}
	
	// タイムスタンプをフォーマット
	timestamp := event.Timestamp.Format("15:04:05")
	
	// フォーマット: インジケータ [タイムスタンプ] エージェント: カテゴリ - 説明
	return fmt.Sprintf("%s [%s] %s: %s - %s",
		indicator,
		timestamp,
		event.Agent,
		event.Category,
		event.Description,
	)
}

// EventFilter はイベントのフィルタリング条件を表す
type EventFilter struct {
	Categories  []string
	MinPriority Priority
	Agents      []string
}

// Apply はイベントのリストにフィルタを適用する
func (f *EventFilter) Apply(events []Event) []Event {
	filtered := []Event{}
	
	for _, event := range events {
		// カテゴリフィルタ
		if len(f.Categories) > 0 {
			found := false
			for _, cat := range f.Categories {
				if event.Category == cat {
					found = true
					break
				}
			}
			if !found {
				continue
			}
		}
		
		// 優先度フィルタ
		if GetCategoryPriority(event.Category) < f.MinPriority {
			continue
		}
		
		// エージェントフィルタ
		if len(f.Agents) > 0 {
			found := false
			for _, agent := range f.Agents {
				if event.Agent == agent {
					found = true
					break
				}
			}
			if !found {
				continue
			}
		}
		
		filtered = append(filtered, event)
	}
	
	return filtered
}