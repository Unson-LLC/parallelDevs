package monitor

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"
)

// NotificationConfig は通知設定を表す
type NotificationConfig struct {
	Enabled          bool   `json:"enabled"`
	ServerURL        string `json:"server_url"`
	OnlyHighPriority bool   `json:"only_high_priority"`
	Timeout          int    `json:"timeout"` // 秒
}

// NotificationPayload は通知ペイロードを表す
type NotificationPayload struct {
	Type      string    `json:"type"`
	Agent     string    `json:"agent"`
	Message   string    `json:"message"`
	Category  string    `json:"category"`
	Priority  string    `json:"priority"`
	Timestamp time.Time `json:"timestamp"`
}

// AutoActionConfig は自動アクション設定を表す
type AutoActionConfig struct {
	Enabled bool             `json:"enabled"`
	Rules   []AutoActionRule `json:"rules"`
}

// AutoActionRule は自動アクションルールを表す
type AutoActionRule struct {
	EventCategory string     `json:"event_category"`
	Action        AutoAction `json:"action"`
}

// AutoAction は自動アクションを表す
type AutoAction struct {
	Type    string `json:"type"`    // "command", "notification", "script"
	Command string `json:"command"` // 実行するコマンド
	Timeout int    `json:"timeout"` // タイムアウト（秒）
	Agent   string `json:"agent"`   // 実行時に設定されるエージェント名
}

// ProcessEventWithNotification はイベントを通知機能付きで処理する
func (m *Monitor) ProcessEventWithNotification(event Event) {
	// 通常の表示
	m.PrintEventWithFilter(event)
	
	// 通知設定をチェック
	if m.notificationConfig == nil || !m.notificationConfig.Enabled {
		return
	}
	
	// 優先度フィルタをチェック
	if m.notificationConfig.OnlyHighPriority {
		priority := GetCategoryPriority(event.Category)
		if priority != PriorityHigh {
			return
		}
	}
	
	// 通知を送信
	m.sendNotification(event)
}

// ProcessEventWithAutoAction はイベントを自動アクション機能付きで処理する
func (m *Monitor) ProcessEventWithAutoAction(event Event) {
	// 通常の表示
	m.PrintEventWithFilter(event)
	
	// 自動アクション設定をチェック
	if m.autoActionConfig == nil || !m.autoActionConfig.Enabled {
		return
	}
	
	// 該当するルールを探す
	for _, rule := range m.autoActionConfig.Rules {
		if rule.EventCategory == event.Category {
			// アクションを実行
			action := rule.Action
			action.Agent = event.Agent
			
			if m.actionExecutor != nil {
				// テスト用のモック実行器を使用
				m.actionExecutor(action, event)
			} else {
				// 実際のアクションを実行
				go m.executeAutoAction(action, event)
			}
		}
	}
}

// ProcessEventWithIntegration はイベントを通知と自動アクションの両方で処理する
func (m *Monitor) ProcessEventWithIntegration(event Event) {
	// 通常の表示
	m.PrintEventWithFilter(event)
	
	// 通知処理
	m.ProcessEventWithNotification(event)
	
	// 自動アクション処理
	m.ProcessEventWithAutoAction(event)
}

// sendNotification は通知を送信する
func (m *Monitor) sendNotification(event Event) {
	if m.notificationConfig.ServerURL == "" {
		return
	}
	
	// 通知ペイロードを作成
	payload := NotificationPayload{
		Type:      m.eventCategoryToNotificationType(event.Category),
		Agent:     event.Agent,
		Message:   event.Description,
		Category:  event.Category,
		Priority:  m.priorityToString(GetCategoryPriority(event.Category)),
		Timestamp: event.Timestamp,
	}
	
	// JSONに変換
	jsonData, err := json.Marshal(payload)
	if err != nil {
		fmt.Fprintf(m.output, "Failed to marshal notification payload: %v\n", err)
		return
	}
	
	// HTTP POST送信
	timeout := time.Duration(m.notificationConfig.Timeout) * time.Second
	if timeout == 0 {
		timeout = 30 * time.Second
	}
	
	client := &http.Client{Timeout: timeout}
	resp, err := client.Post(
		m.notificationConfig.ServerURL+"/notify",
		"application/json",
		bytes.NewBuffer(jsonData),
	)
	
	if err != nil {
		fmt.Fprintf(m.output, "Failed to send notification: %v\n", err)
		return
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		fmt.Fprintf(m.output, "Notification server returned status: %d\n", resp.StatusCode)
	}
}

// executeAutoAction は自動アクションを実行する
func (m *Monitor) executeAutoAction(action AutoAction, event Event) {
	timeout := time.Duration(action.Timeout) * time.Second
	if timeout == 0 {
		timeout = 30 * time.Second
	}
	
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	
	// プレースホルダーを置換
	command := strings.ReplaceAll(action.Command, "{agent}", event.Agent)
	command = strings.ReplaceAll(command, "{category}", event.Category)
	command = strings.ReplaceAll(command, "{description}", event.Description)
	
	// コマンドを実行
	var cmd *exec.Cmd
	if action.Type == "script" {
		cmd = exec.CommandContext(ctx, "bash", "-c", command)
	} else {
		parts := strings.Fields(command)
		if len(parts) > 0 {
			cmd = exec.CommandContext(ctx, parts[0], parts[1:]...)
		}
	}
	
	if cmd != nil {
		output, err := cmd.CombinedOutput()
		if err != nil {
			fmt.Fprintf(m.output, "Auto action failed for %s: %v\n", event.Agent, err)
		} else {
			fmt.Fprintf(m.output, "Auto action executed for %s: %s\n", event.Agent, string(output))
		}
	}
}

// eventCategoryToNotificationType はイベントカテゴリを通知タイプに変換する
func (m *Monitor) eventCategoryToNotificationType(category string) string {
	switch category {
	case CategoryError:
		return "error"
	case CategoryComplete:
		return "complete"
	case CategoryWarning:
		return "warning"
	case CategoryHelp:
		return "help"
	default:
		return "info"
	}
}

// priorityToString は優先度を文字列に変換する
func (m *Monitor) priorityToString(priority Priority) string {
	switch priority {
	case PriorityHigh:
		return "high"
	case PriorityMedium:
		return "medium"
	case PriorityLow:
		return "low"
	default:
		return "unknown"
	}
}

// SaveAutoActionConfig は自動アクション設定をファイルに保存する
func SaveAutoActionConfig(config *AutoActionConfig, filename string) error {
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}
	
	file, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer file.Close()
	
	_, err = file.Write(data)
	return err
}

// LoadAutoActionConfig はファイルから自動アクション設定を読み込む
func LoadAutoActionConfig(filename string) (*AutoActionConfig, error) {
	file, err := os.Open(filename)
	if err != nil {
		if os.IsNotExist(err) {
			// ファイルが存在しない場合はデフォルト設定を返す
			return &AutoActionConfig{
				Enabled: false,
				Rules:   []AutoActionRule{},
			}, nil
		}
		return nil, err
	}
	defer file.Close()
	
	config := &AutoActionConfig{}
	decoder := json.NewDecoder(file)
	if err := decoder.Decode(config); err != nil {
		return nil, err
	}
	
	return config, nil
}