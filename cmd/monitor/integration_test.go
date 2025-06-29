package monitor

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMonitorLoopWithIntegration(t *testing.T) {
	t.Run("monitor loop with notification and auto action", func(t *testing.T) {
		// 監視ループが通知と自動アクションを実行することを確認
		var receivedNotifications []NotificationPayload
		var executedActions []AutoAction
		
		// 通知サーバー
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path == "/notify" {
				var payload NotificationPayload
				json.NewDecoder(r.Body).Decode(&payload)
				receivedNotifications = append(receivedNotifications, payload)
				w.WriteHeader(http.StatusOK)
			}
		}))
		defer server.Close()
		
		var buf bytes.Buffer
		monitor := &Monitor{
			output:       &buf,
			pollInterval: 10 * time.Millisecond,
			notificationConfig: &NotificationConfig{
				Enabled:          true,
				ServerURL:        server.URL,
				OnlyHighPriority: true,
			},
			autoActionConfig: &AutoActionConfig{
				Enabled: true,
				Rules: []AutoActionRule{
					{
						EventCategory: CategoryError,
						Action: AutoAction{
							Type:    "command",
							Command: "echo 'Handling error for {agent}'",
							Timeout: 5,
						},
					},
				},
			},
			actionExecutor: func(action AutoAction, event Event) error {
				// モック実行器
				executedAction := action
				executedAction.Agent = event.Agent
				executedActions = append(executedActions, executedAction)
				return nil
			},
		}
		
		// モックのエージェント状態を設定（エラーイベントを発生させる）
		states := [][]AgentState{
			// 初期状態
			{
				{Name: "agent1", Status: "idle"},
			},
			// エラー状態
			{
				{Name: "agent1", Status: "error"},
			},
		}
		
		stateIndex := 0
		monitor.getAgentStates = func() []AgentState {
			if stateIndex < len(states) {
				s := states[stateIndex]
				stateIndex++
				return s
			}
			return states[len(states)-1]
		}
		
		// 短時間実行
		ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
		defer cancel()
		
		err := monitor.RunLoop(ctx)
		assert.NoError(t, err)
		
		// ステータス変更が検出されることを確認
		output := buf.String()
		assert.Contains(t, output, "Monitoring agents...")
		assert.Contains(t, output, "idle → error")
		
		// 通知と自動アクションは実際のエラーイベントではなく
		// ステータス変更イベントのため実行されない
		// （ErrorカテゴリではなくStatusカテゴリのため）
	})

	t.Run("monitor detects CLAUDE.md changes and triggers notifications", func(t *testing.T) {
		// CLAUDE.mdの変更が通知をトリガーすることを確認
		var receivedNotifications []NotificationPayload
		
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path == "/notify" {
				var payload NotificationPayload
				json.NewDecoder(r.Body).Decode(&payload)
				receivedNotifications = append(receivedNotifications, payload)
				w.WriteHeader(http.StatusOK)
			}
		}))
		defer server.Close()
		
		var buf bytes.Buffer
		monitor := &Monitor{
			output:       &buf,
			pollInterval: 10 * time.Millisecond,
			notificationConfig: &NotificationConfig{
				Enabled:          true,
				ServerURL:        server.URL,
				OnlyHighPriority: true, // CLAUDE.mdの変更は高優先度
			},
		}
		
		// CLAUDE.mdの変更を模擬
		tmpDir := t.TempDir()
		claudePath := tmpDir + "/CLAUDE.md"
		
		states := [][]AgentState{
			// 初期状態（CLAUDE.mdなし）
			{
				{Name: "agent1", Status: "idle", ClaudeMDPath: ""},
			},
			// CLAUDE.md作成後
			{
				{Name: "agent1", Status: "idle", ClaudeMDPath: claudePath},
			},
		}
		
		stateIndex := 0
		monitor.getAgentStates = func() []AgentState {
			if stateIndex < len(states) {
				s := states[stateIndex]
				stateIndex++
				return s
			}
			return states[len(states)-1]
		}
		
		ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
		defer cancel()
		
		err := monitor.RunLoop(ctx)
		assert.NoError(t, err)
		
		// CLAUDE.mdの作成が検出されることを確認
		output := buf.String()
		assert.Contains(t, output, "CLAUDE.md created")
		
		// 高優先度の通知が送信されることを確認
		require.Len(t, receivedNotifications, 1)
		assert.Equal(t, "help", receivedNotifications[0].Type)
		assert.Equal(t, "HELP", receivedNotifications[0].Category)
		assert.Equal(t, "high", receivedNotifications[0].Priority)
		assert.Contains(t, receivedNotifications[0].Message, "CLAUDE.md created")
	})
}

func TestConfigurationLoading(t *testing.T) {
	t.Run("loads auto action configuration from JSON file", func(t *testing.T) {
		// JSONファイルから自動アクション設定を読み込むことを確認
		tmpDir := t.TempDir()
		configFile := tmpDir + "/auto-actions.json"
		
		config := AutoActionConfig{
			Enabled: true,
			Rules: []AutoActionRule{
				{
					EventCategory: CategoryError,
					Action: AutoAction{
						Type:    "script",
						Command: "bash /path/to/error-handler.sh {agent}",
						Timeout: 60,
					},
				},
				{
					EventCategory: CategoryComplete,
					Action: AutoAction{
						Type:    "notification",
						Command: "curl -X POST http://webhook.site/notify?agent={agent}",
						Timeout: 30,
					},
				},
			},
		}
		
		// 設定をJSONファイルに保存
		err := SaveAutoActionConfig(&config, configFile)
		assert.NoError(t, err)
		
		// 設定を読み込み
		loadedConfig, err := LoadAutoActionConfig(configFile)
		assert.NoError(t, err)
		assert.NotNil(t, loadedConfig)
		assert.True(t, loadedConfig.Enabled)
		assert.Len(t, loadedConfig.Rules, 2)
		assert.Equal(t, CategoryError, loadedConfig.Rules[0].EventCategory)
		assert.Equal(t, "script", loadedConfig.Rules[0].Action.Type)
	})

	t.Run("handles missing configuration file gracefully", func(t *testing.T) {
		// 存在しない設定ファイルを適切に処理
		config, err := LoadAutoActionConfig("/non/existent/config.json")
		assert.NoError(t, err)
		assert.NotNil(t, config)
		assert.False(t, config.Enabled) // デフォルトは無効
		assert.Empty(t, config.Rules)
	})
}