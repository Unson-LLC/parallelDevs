package monitor

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"os"
	"strings"
)

// ParseFilterArgs はコマンドライン引数からフィルタを解析する
func ParseFilterArgs(args []string) (*EventFilter, error) {
	filter := &EventFilter{}
	
	// フラグセットを作成
	fs := flag.NewFlagSet("filter", flag.ContinueOnError)
	
	var categoryStr string
	var priorityStr string
	var agentStr string
	
	fs.StringVar(&categoryStr, "category", "", "Filter by categories (comma-separated)")
	fs.StringVar(&priorityStr, "priority", "", "Filter by minimum priority (low/medium/high)")
	fs.StringVar(&agentStr, "agent", "", "Filter by agent names (comma-separated)")
	
	if err := fs.Parse(args); err != nil {
		return nil, err
	}
	
	// カテゴリフィルタを解析
	if categoryStr != "" {
		filter.Categories = strings.Split(categoryStr, ",")
	}
	
	// 優先度フィルタを解析
	if priorityStr != "" {
		switch strings.ToLower(priorityStr) {
		case "low":
			filter.MinPriority = PriorityLow
		case "medium":
			filter.MinPriority = PriorityMedium
		case "high":
			filter.MinPriority = PriorityHigh
		default:
			return nil, fmt.Errorf("invalid priority: %s", priorityStr)
		}
	}
	
	// エージェントフィルタを解析
	if agentStr != "" {
		filter.Agents = strings.Split(agentStr, ",")
	}
	
	return filter, nil
}

// SaveFilterConfig はフィルタ設定をファイルに保存する
func SaveFilterConfig(filter *EventFilter, filename string) error {
	data, err := json.MarshalIndent(filter, "", "  ")
	if err != nil {
		return err
	}
	
	return os.WriteFile(filename, data, 0644)
}

// LoadFilterConfig はファイルからフィルタ設定を読み込む
func LoadFilterConfig(filename string) (*EventFilter, error) {
	data, err := os.ReadFile(filename)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			// ファイルが存在しない場合はデフォルトフィルタを返す
			return &EventFilter{
				Categories:  []string{},
				MinPriority: PriorityLow,
				Agents:      []string{},
			}, nil
		}
		return nil, err
	}
	
	filter := &EventFilter{}
	if err := json.Unmarshal(data, filter); err != nil {
		return nil, err
	}
	
	return filter, nil
}

// ToggleCategoryFilter はカテゴリフィルタをトグルする
func (m *Monitor) ToggleCategoryFilter(category string) {
	if m.eventFilter == nil {
		m.eventFilter = &EventFilter{}
	}
	
	// 既存のカテゴリを探す
	found := false
	newCategories := []string{}
	for _, cat := range m.eventFilter.Categories {
		if cat == category {
			found = true
		} else {
			newCategories = append(newCategories, cat)
		}
	}
	
	if found {
		// 削除
		m.eventFilter.Categories = newCategories
	} else {
		// 追加
		m.eventFilter.Categories = append(m.eventFilter.Categories, category)
	}
}

// CyclePriorityFilter は優先度フィルタを循環させる
func (m *Monitor) CyclePriorityFilter() {
	if m.eventFilter == nil {
		m.eventFilter = &EventFilter{}
	}
	
	switch m.eventFilter.MinPriority {
	case PriorityLow:
		m.eventFilter.MinPriority = PriorityMedium
	case PriorityMedium:
		m.eventFilter.MinPriority = PriorityHigh
	case PriorityHigh:
		m.eventFilter.MinPriority = PriorityLow
	}
}

// ResetFilters はすべてのフィルタをリセットする
func (m *Monitor) ResetFilters() {
	m.eventFilter = &EventFilter{
		Categories:  []string{},
		MinPriority: PriorityLow,
		Agents:      []string{},
	}
}