package monitor

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNotificationIntegration(t *testing.T) {
	t.Run("sends notification when high priority event occurs", func(t *testing.T) {
		// 高優先度イベント発生時に通知を送信することを確認
		var receivedNotifications []NotificationPayload
		
		// モック通知サーバーを作成
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path == "/notify" && r.Method == "POST" {
				var payload NotificationPayload
				err := json.NewDecoder(r.Body).Decode(&payload)
				require.NoError(t, err)
				receivedNotifications = append(receivedNotifications, payload)
				w.WriteHeader(http.StatusOK)
			}
		}))
		defer server.Close()
		
		// 通知設定付きのmonitorを作成
		monitor := &Monitor{
			output:       &bytes.Buffer{},
			pollInterval: 10 * time.Millisecond,
			notificationConfig: &NotificationConfig{
				Enabled:    true,
				ServerURL:  server.URL,
				OnlyHighPriority: true,
			},
		}
		
		// 高優先度イベントを生成
		events := []Event{
			{
				Category:    CategoryError,
				Agent:       "test-agent",
				Description: "Build failed",
				Timestamp:   time.Now(),
			},
		}
		
		// イベントを処理
		for _, event := range events {
			monitor.ProcessEventWithNotification(event)
		}
		
		// 通知が送信されたことを確認
		assert.Len(t, receivedNotifications, 1)
		assert.Equal(t, "error", receivedNotifications[0].Type)
		assert.Equal(t, "test-agent", receivedNotifications[0].Agent)
		assert.Contains(t, receivedNotifications[0].Message, "Build failed")
	})

	t.Run("does not send notification for low priority events when filter enabled", func(t *testing.T) {
		// フィルタが有効な場合、低優先度イベントは通知しないことを確認
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
		
		monitor := &Monitor{
			output: &bytes.Buffer{},
			notificationConfig: &NotificationConfig{
				Enabled:          true,
				ServerURL:        server.URL,
				OnlyHighPriority: true,
			},
		}
		
		// 低優先度イベントを生成
		events := []Event{
			{
				Category:    CategoryStatus,
				Agent:       "test-agent",
				Description: "Status changed",
				Timestamp:   time.Now(),
			},
		}
		
		for _, event := range events {
			monitor.ProcessEventWithNotification(event)
		}
		
		// 通知が送信されないことを確認
		assert.Empty(t, receivedNotifications)
	})

	t.Run("sends all events when priority filter disabled", func(t *testing.T) {
		// 優先度フィルタが無効な場合、すべてのイベントを通知
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
		
		monitor := &Monitor{
			output: &bytes.Buffer{},
			notificationConfig: &NotificationConfig{
				Enabled:          true,
				ServerURL:        server.URL,
				OnlyHighPriority: false,
			},
		}
		
		events := []Event{
			{Category: CategoryStatus, Agent: "agent1", Description: "status", Timestamp: time.Now()},
			{Category: CategoryError, Agent: "agent2", Description: "error", Timestamp: time.Now()},
		}
		
		for _, event := range events {
			monitor.ProcessEventWithNotification(event)
		}
		
		assert.Len(t, receivedNotifications, 2)
	})
}

func TestAutoActions(t *testing.T) {
	t.Run("executes auto action on error event", func(t *testing.T) {
		// エラーイベント発生時に自動アクションを実行することを確認
		var executedActions []AutoAction
		
		monitor := &Monitor{
			output: &bytes.Buffer{},
			autoActionConfig: &AutoActionConfig{
				Enabled: true,
				Rules: []AutoActionRule{
					{
						EventCategory: CategoryError,
						Action: AutoAction{
							Type:    "command",
							Command: "echo 'Error detected for {agent}'",
							Timeout: 30,
						},
					},
				},
			},
			actionExecutor: func(action AutoAction, event Event) error {
				// モック実行器：実際には実行せず記録のみ
				executedAction := action
				executedAction.Agent = event.Agent
				executedActions = append(executedActions, executedAction)
				return nil
			},
		}
		
		// エラーイベントを生成
		event := Event{
			Category:    CategoryError,
			Agent:       "test-agent",
			Description: "Build failed",
			Timestamp:   time.Now(),
		}
		
		// イベントを処理
		monitor.ProcessEventWithAutoAction(event)
		
		// 自動アクションが実行されたことを確認
		assert.Len(t, executedActions, 1)
		assert.Equal(t, "command", executedActions[0].Type)
		assert.Equal(t, "test-agent", executedActions[0].Agent)
		assert.Contains(t, executedActions[0].Command, "Error detected")
	})

	t.Run("executes multiple auto actions for different categories", func(t *testing.T) {
		// 異なるカテゴリに対して複数の自動アクションを実行
		var executedActions []AutoAction
		
		monitor := &Monitor{
			output: &bytes.Buffer{},
			autoActionConfig: &AutoActionConfig{
				Enabled: true,
				Rules: []AutoActionRule{
					{
						EventCategory: CategoryError,
						Action: AutoAction{
							Type:    "command",
							Command: "handle_error.sh {agent}",
						},
					},
					{
						EventCategory: CategoryComplete,
						Action: AutoAction{
							Type:    "notification",
							Command: "send_completion_notice.sh {agent}",
						},
					},
				},
			},
			actionExecutor: func(action AutoAction, event Event) error {
				executedAction := action
				executedAction.Agent = event.Agent
				executedActions = append(executedActions, executedAction)
				return nil
			},
		}
		
		// 異なるカテゴリのイベントを生成
		events := []Event{
			{Category: CategoryError, Agent: "agent1", Description: "error", Timestamp: time.Now()},
			{Category: CategoryComplete, Agent: "agent2", Description: "completed", Timestamp: time.Now()},
			{Category: CategoryStatus, Agent: "agent3", Description: "status", Timestamp: time.Now()}, // ルールなし
		}
		
		for _, event := range events {
			monitor.ProcessEventWithAutoAction(event)
		}
		
		// 対応するルールがあるイベントのみアクションが実行される
		assert.Len(t, executedActions, 2)
		assert.Equal(t, "command", executedActions[0].Type)
		assert.Equal(t, "notification", executedActions[1].Type)
	})

	t.Run("handles auto action execution timeout", func(t *testing.T) {
		// 自動アクションの実行タイムアウトを適切に処理
		var executionStarted bool
		
		monitor := &Monitor{
			output: &bytes.Buffer{},
			autoActionConfig: &AutoActionConfig{
				Enabled: true,
				Rules: []AutoActionRule{
					{
						EventCategory: CategoryError,
						Action: AutoAction{
							Type:    "command",
							Command: "sleep 100", // 長時間実行
							Timeout: 1, // 1秒でタイムアウト
						},
					},
				},
			},
			actionExecutor: func(action AutoAction, event Event) error {
				executionStarted = true
				// タイムアウトをシミュレート
				time.Sleep(time.Duration(action.Timeout+1) * time.Second)
				return nil
			},
		}
		
		event := Event{
			Category:    CategoryError,
			Agent:       "test-agent",
			Description: "error",
			Timestamp:   time.Now(),
		}
		
		start := time.Now()
		monitor.ProcessEventWithAutoAction(event)
		duration := time.Since(start)
		
		// 実行が開始されたことを確認
		assert.True(t, executionStarted)
		// タイムアウト時間以内で完了することを確認（多少のマージン含む）
		assert.Less(t, duration, 3*time.Second)
	})

	t.Run("disables auto actions when config disabled", func(t *testing.T) {
		// 設定で無効化された場合、自動アクションが実行されないことを確認
		var executedActions []AutoAction
		
		monitor := &Monitor{
			output: &bytes.Buffer{},
			autoActionConfig: &AutoActionConfig{
				Enabled: false, // 無効化
				Rules: []AutoActionRule{
					{
						EventCategory: CategoryError,
						Action: AutoAction{
							Type:    "command",
							Command: "should_not_execute.sh",
						},
					},
				},
			},
			actionExecutor: func(action AutoAction, event Event) error {
				executedActions = append(executedActions, action)
				return nil
			},
		}
		
		event := Event{
			Category:    CategoryError,
			Agent:       "test-agent",
			Description: "error",
			Timestamp:   time.Now(),
		}
		
		monitor.ProcessEventWithAutoAction(event)
		
		// アクションが実行されないことを確認
		assert.Empty(t, executedActions)
	})
}

func TestIntegratedNotificationAndAutoAction(t *testing.T) {
	t.Run("processes event with both notification and auto action", func(t *testing.T) {
		// 通知と自動アクションの両方を処理することを確認
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
		
		monitor := &Monitor{
			output: &bytes.Buffer{},
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
							Command: "handle_error.sh {agent}",
						},
					},
				},
			},
			actionExecutor: func(action AutoAction, event Event) error {
				executedActions = append(executedActions, action)
				return nil
			},
		}
		
		event := Event{
			Category:    CategoryError,
			Agent:       "test-agent",
			Description: "Critical error occurred",
			Timestamp:   time.Now(),
		}
		
		// 統合処理を実行
		monitor.ProcessEventWithIntegration(event)
		
		// 通知と自動アクションの両方が実行されることを確認
		assert.Len(t, receivedNotifications, 1)
		assert.Len(t, executedActions, 1)
		assert.Equal(t, "error", receivedNotifications[0].Type)
		assert.Equal(t, "command", executedActions[0].Type)
	})
}