package monitor

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"strings"
	"time"
)

// AutoActionConfig は自動アクションの設定
type AutoActionConfig struct {
	Enabled bool             `json:"enabled"`
	Rules   []AutoActionRule `json:"rules"`
}

// AutoActionRule は自動アクションのルール
type AutoActionRule struct {
	EventCategory string     `json:"event_category"`
	AgentPattern  string     `json:"agent_pattern"`  // 特定エージェントのパターン
	StatePattern  string     `json:"state_pattern"`  // idle, merged, running等の状態パターン
	AllAgentsIdle bool       `json:"all_agents_idle"` // 全エージェントがidleの場合
	Action        AutoAction `json:"action"`
}

// AutoAction は実行するアクション
type AutoAction struct {
	Type     string            `json:"type"`     // command, notification, manager
	Command  string            `json:"command"`  // 実行するコマンド
	Message  string            `json:"message"`  // 通知メッセージ
	Timeout  int               `json:"timeout"`  // タイムアウト（秒）
	Env      map[string]string `json:"env"`      // 環境変数
}

// LoadAutoActionConfig はJSONファイルから自動アクション設定を読み込む
func LoadAutoActionConfig(filePath string) (*AutoActionConfig, error) {
	data, err := ioutil.ReadFile(filePath)
	if err != nil {
		return nil, err
	}
	
	var config AutoActionConfig
	err = json.Unmarshal(data, &config)
	if err != nil {
		return nil, err
	}
	
	return &config, nil
}

// ProcessEventWithIntegration はイベントを統合処理（表示、通知、自動アクション）
func (m *Monitor) ProcessEventWithIntegration(event Event) {
	// フィルタリング
	if m.eventFilter != nil {
		filtered := m.eventFilter.Apply([]Event{event})
		if len(filtered) == 0 {
			return // フィルタされた
		}
	}
	
	// イベント表示
	m.PrintEvent(event)
	
	// 通知送信（必要に応じて）
	if m.notificationConfig != nil && m.notificationConfig.Enabled {
		m.SendNotification(event)
	}
	
	// 自動アクション実行（必要に応じて）
	if m.autoActionConfig != nil && m.autoActionConfig.Enabled {
		m.ExecuteAutoActions(event)
	}
}

// ExecuteAutoActions は自動アクションを実行する
func (m *Monitor) ExecuteAutoActions(event Event) {
	for _, rule := range m.autoActionConfig.Rules {
		if m.ShouldExecuteAction(rule, event) {
			err := m.ExecuteAction(rule.Action, event)
			if err != nil {
				fmt.Fprintf(m.output, "Auto action failed: %v\n", err)
			}
		}
	}
}

// ShouldExecuteAction はアクションを実行すべきかどうかを判定
func (m *Monitor) ShouldExecuteAction(rule AutoActionRule, event Event) bool {
	// カテゴリのマッチング
	if rule.EventCategory != "" && rule.EventCategory != event.Category {
		return false
	}
	
	// エージェントパターンのマッチング
	if rule.AgentPattern != "" && !strings.Contains(event.Agent, rule.AgentPattern) {
		return false
	}
	
	// 状態パターンのマッチング（イベントの説明に含まれているかチェック）
	if rule.StatePattern != "" && !strings.Contains(event.Description, rule.StatePattern) {
		return false
	}
	
	// 全エージェントがidle状態かチェック
	if rule.AllAgentsIdle {
		return m.CheckAllAgentsIdle()
	}
	
	return true
}

// CheckAllAgentsIdle は全エージェントがidle状態かチェック
func (m *Monitor) CheckAllAgentsIdle() bool {
	agents := m.getAgentStates()
	
	flappyAgents := []string{}
	for _, agent := range agents {
		// Flappy Birdプロジェクトのエージェントのみチェック
		if strings.Contains(agent.Name, "jessica") || 
		   strings.Contains(agent.Name, "stephanie") || 
		   strings.Contains(agent.Name, "eric") || 
		   strings.Contains(agent.Name, "caroline") {
			flappyAgents = append(flappyAgents, agent.Name)
			// merged または idle 以外があれば false
			if agent.Status != "idle" && agent.Status != "merged" {
				return false
			}
		}
	}
	
	// Flappy Birdエージェントが1つ以上存在し、全てが idle/merged
	return len(flappyAgents) > 0
}

// ExecuteAction はアクションを実行する
func (m *Monitor) ExecuteAction(action AutoAction, event Event) error {
	if m.actionExecutor != nil {
		// テスト用のアクション実行器が設定されている場合
		return m.actionExecutor(action, event)
	}
	
	switch action.Type {
	case "command":
		return m.ExecuteCommand(action, event)
	case "notification":
		return m.SendNotificationMessage(action.Message)
	case "manager":
		return m.CallManager(action, event)
	default:
		return fmt.Errorf("unknown action type: %s", action.Type)
	}
}

// ExecuteCommand はコマンドを実行する
func (m *Monitor) ExecuteCommand(action AutoAction, event Event) error {
	// プレースホルダーを置換
	command := action.Command
	command = strings.ReplaceAll(command, "{agent}", event.Agent)
	command = strings.ReplaceAll(command, "{category}", event.Category)
	command = strings.ReplaceAll(command, "{description}", event.Description)
	command = strings.ReplaceAll(command, "{timestamp}", event.Timestamp.Format("15:04:05"))
	
	// コマンド実行
	cmd := exec.Command("sh", "-c", command)
	
	// 環境変数設定
	if action.Env != nil {
		for key, value := range action.Env {
			cmd.Env = append(cmd.Env, fmt.Sprintf("%s=%s", key, value))
		}
	}
	
	// タイムアウト設定
	timeout := time.Duration(action.Timeout) * time.Second
	if timeout == 0 {
		timeout = 30 * time.Second
	}
	
	// コマンド実行（タイムアウト付き）
	done := make(chan error, 1)
	go func() {
		done <- cmd.Run()
	}()
	
	select {
	case err := <-done:
		return err
	case <-time.After(timeout):
		cmd.Process.Kill()
		return fmt.Errorf("command timeout after %v", timeout)
	}
}

// CallManager はマネージャーを呼び出す
func (m *Monitor) CallManager(action AutoAction, event Event) error {
	message := action.Message
	if message == "" {
		message = fmt.Sprintf("全エージェントがidle/merged状態です。次の作業を指示してください。\n\nイベント: %s\nエージェント: %s\n説明: %s", 
			event.Category, event.Agent, event.Description)
	}
	
	// Uziマネージャーエージェントを呼び出すコマンド
	command := fmt.Sprintf(`echo "%s" | ./uzi prompt --count 1`, message)
	
	cmd := exec.Command("sh", "-c", command)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	
	fmt.Fprintf(m.output, "🤖 Calling Uzi Manager: %s\n", message)
	
	return cmd.Run()
}

// SendNotificationMessage は通知メッセージを送信する
func (m *Monitor) SendNotificationMessage(message string) error {
	if m.notificationConfig == nil || !m.notificationConfig.Enabled {
		return fmt.Errorf("notification not configured")
	}
	
	// HTTP POST で通知を送信
	return SendHTTPNotification(m.notificationConfig.ServerURL, message)
}

// CreateDefaultAutoActionConfig はデフォルトの自動アクション設定を作成
func CreateDefaultAutoActionConfig() *AutoActionConfig {
	return &AutoActionConfig{
		Enabled: true,
		Rules: []AutoActionRule{
			{
				EventCategory: CategoryStatus,
				StatePattern:  "idle",
				AllAgentsIdle: true,
				Action: AutoAction{
					Type:    "manager",
					Message: "全Flappy Birdエージェントがidle状態です。checkpoint実行とアプリ完成を確認してください。",
					Timeout: 60,
				},
			},
			{
				EventCategory: CategoryError,
				Action: AutoAction{
					Type:    "manager",
					Message: "エラーが発生しました: {description}",
					Timeout: 30,
				},
			},
		},
	}
}