package monitor

import (
	"context"
	"flag"
	"fmt"
	"io"
	"os"
	"strings"
	"time"

	"github.com/peterbourgon/ff/v3/ffcli"
)

// Monitor はエージェントの監視を行う構造体
type Monitor struct {
	output             io.Writer
	pollInterval       time.Duration
	eventFilter        *EventFilter
	getAgentStates     func() []AgentState // テスト用のモック可能な関数
	maxEventsPerCycle  int                  // 1サイクルあたりの最大イベント数
	claudeMDWatcher    *ClaudeMDWatcher     // CLAUDE.md監視用
	notificationConfig *NotificationConfig  // 通知設定
	autoActionConfig   *AutoActionConfig    // 自動アクション設定
	actionExecutor     func(AutoAction, Event) error // テスト用のアクション実行器
}

// ClaudeMDWatcher はCLAUDE.mdファイルの監視を行う
type ClaudeMDWatcher struct {
	paths map[string]string // agent名 -> CLAUDE.mdパス
}

// AgentState はエージェントの状態を表す構造体
type AgentState struct {
	Name         string
	Status       string
	WorktreeDir  string
	ClaudeMDPath string
	ClaudeMDInfo *ClaudeMDInfo
}

// ClaudeMDInfo はCLAUDE.mdファイルの情報を表す
type ClaudeMDInfo struct {
	Exists       bool
	LastModified time.Time
	Size         int64
}

// Change は状態変更を表す構造体
type Change struct {
	Type        string
	Description string
	Agent       string
	Timestamp   time.Time
}

// monitorフラグ
var (
	monitorCategory       string
	monitorPriority       string
	monitorAgent          string
	monitorNotifyURL      string
	monitorNotifyHigh     bool
	monitorAutoAction     string
	monitorAutoActionFile string
)

// CmdMonitor は monitor コマンドを定義
var CmdMonitor = &ffcli.Command{
	Name:       "monitor",
	ShortUsage: "uzi monitor [flags]",
	ShortHelp:  "Monitor all agent sessions in real-time",
	LongHelp: `Monitor all active agent sessions and display real-time updates about their status,
file changes, errors, and other events.

Filtering options:
  --category        Filter by event categories (comma-separated)
  --priority        Filter by minimum priority (low/medium/high)
  --agent           Filter by agent names (comma-separated)

Notification options:
  --notify-url      Notification server URL (e.g., http://localhost:9999)
  --notify-high     Send notifications only for high priority events

Auto action options:
  --auto-action     Simple auto action command (e.g., "echo Error: {agent}")
  --auto-config     Auto action configuration file (JSON)`,
	FlagSet: (func() *flag.FlagSet {
		fs := flag.NewFlagSet("monitor", flag.ExitOnError)
		fs.StringVar(&monitorCategory, "category", "", "Filter by categories (comma-separated)")
		fs.StringVar(&monitorPriority, "priority", "", "Filter by minimum priority (low/medium/high)")
		fs.StringVar(&monitorAgent, "agent", "", "Filter by agent names (comma-separated)")
		fs.StringVar(&monitorNotifyURL, "notify-url", "", "Notification server URL")
		fs.BoolVar(&monitorNotifyHigh, "notify-high", false, "Send notifications only for high priority events")
		fs.StringVar(&monitorAutoAction, "auto-action", "", "Simple auto action command")
		fs.StringVar(&monitorAutoActionFile, "auto-config", "", "Auto action configuration file")
		return fs
	})(),
	Exec: func(ctx context.Context, args []string) error {
		// フィルタを作成
		filter := &EventFilter{}
		
		// カテゴリフィルタ
		if monitorCategory != "" {
			filter.Categories = strings.Split(monitorCategory, ",")
		}
		
		// 優先度フィルタ
		if monitorPriority != "" {
			switch strings.ToLower(monitorPriority) {
			case "low":
				filter.MinPriority = PriorityLow
			case "medium":
				filter.MinPriority = PriorityMedium
			case "high":
				filter.MinPriority = PriorityHigh
			default:
				return fmt.Errorf("invalid priority: %s", monitorPriority)
			}
		}
		
		// エージェントフィルタ
		if monitorAgent != "" {
			filter.Agents = strings.Split(monitorAgent, ",")
		}
		
		// 通知設定を作成
		var notificationConfig *NotificationConfig
		if monitorNotifyURL != "" {
			notificationConfig = &NotificationConfig{
				Enabled:          true,
				ServerURL:        monitorNotifyURL,
				OnlyHighPriority: monitorNotifyHigh,
				Timeout:          30,
			}
		}
		
		// 自動アクション設定を作成
		var autoActionConfig *AutoActionConfig
		if monitorAutoAction != "" {
			// シンプルなコマンド設定
			autoActionConfig = &AutoActionConfig{
				Enabled: true,
				Rules: []AutoActionRule{
					{
						EventCategory: CategoryError,
						Action: AutoAction{
							Type:    "command",
							Command: monitorAutoAction,
							Timeout: 30,
						},
					},
				},
			}
		} else if monitorAutoActionFile != "" {
			// JSONファイルから設定を読み込み
			var err error
			autoActionConfig, err = LoadAutoActionConfig(monitorAutoActionFile)
			if err != nil {
				return fmt.Errorf("failed to load auto action config: %v", err)
			}
		}
		
		monitor := &Monitor{
			output:             os.Stdout,
			pollInterval:       1 * time.Second,
			eventFilter:        filter,
			notificationConfig: notificationConfig,
			autoActionConfig:   autoActionConfig,
		}
		return monitor.RunLoop(ctx)
	},
}

// NewMonitorCmd はテスト用にコマンドを作成（互換性のため）
func NewMonitorCmd() *ffcli.Command {
	return CmdMonitor
}

// Start は監視を開始する
func (m *Monitor) Start() error {
	fmt.Fprintln(m.output, "Monitoring agents...")
	return nil
}

// GetActiveAgents はアクティブなエージェントのリストを取得する
func (m *Monitor) GetActiveAgents() []AgentState {
	// 仮実装：空のリストを返す
	return []AgentState{}
}

// DetectChanges は状態の変更を検知する
func (m *Monitor) DetectChanges(oldStates, newStates []AgentState) []Change {
	changes := []Change{}
	
	// 古い状態をマップに変換
	oldStateMap := make(map[string]AgentState)
	for _, state := range oldStates {
		oldStateMap[state.Name] = state
	}
	
	// 新しい状態をマップに変換
	newStateMap := make(map[string]AgentState)
	for _, state := range newStates {
		newStateMap[state.Name] = state
	}
	
	// 新しいエージェントと状態変更を検出
	for name, newState := range newStateMap {
		if oldState, exists := oldStateMap[name]; exists {
			// 既存エージェントの状態変更をチェック
			if oldState.Status != newState.Status {
				changes = append(changes, Change{
					Type:        "STATUS",
					Description: fmt.Sprintf("%s → %s", oldState.Status, newState.Status),
					Agent:       name,
					Timestamp:   time.Now(),
				})
			}
		} else {
			// 新しいエージェント
			changes = append(changes, Change{
				Type:        "NEW",
				Description: "Agent started",
				Agent:       name,
				Timestamp:   time.Now(),
			})
		}
	}
	
	// 削除されたエージェントを検出
	for name, _ := range oldStateMap {
		if _, exists := newStateMap[name]; !exists {
			changes = append(changes, Change{
				Type:        "REMOVED",
				Description: "Agent stopped",
				Agent:       name,
				Timestamp:   time.Now(),
			})
		}
	}
	
	return changes
}

// PrintChange は変更を出力する
func (m *Monitor) PrintChange(change Change) {
	// タイムスタンプをフォーマット
	timestamp := change.Timestamp.Format("15:04:05")
	
	// 出力フォーマット: [タイムスタンプ] エージェント名: カテゴリ - 詳細
	fmt.Fprintf(m.output, "[%s] %s: %s - %s\n", 
		timestamp, 
		change.Agent, 
		change.Type,
		change.Description,
	)
}

// ChangesToEvents は変更をイベントに変換する
func (m *Monitor) ChangesToEvents(changes []Change) []Event {
	events := []Event{}
	
	for _, change := range changes {
		// Change.TypeをEvent.Categoryにマッピング
		category := CategoryStatus // デフォルト
		switch change.Type {
		case "STATUS":
			category = CategoryStatus
		case "NEW":
			category = CategoryStatus
		case "REMOVED":
			category = CategoryStatus
		case "ERROR":
			category = CategoryError
		case "FILE":
			category = CategoryFile
		case "GIT":
			category = CategoryGit
		case "TEST":
			category = CategoryTest
		case "WARNING":
			category = CategoryWarning
		case "COMPLETE":
			category = CategoryComplete
		case "HELP":
			category = CategoryHelp
		case "PROGRESS":
			category = CategoryProgress
		case "CLAUDE_MD":
			category = CategoryHelp // CLAUDE.mdの変更は高優先度のHELPカテゴリ
		}
		
		events = append(events, Event{
			Category:    category,
			Agent:       change.Agent,
			Description: change.Description,
			Timestamp:   change.Timestamp,
		})
	}
	
	return events
}

// PrintEvent はイベントを出力する
func (m *Monitor) PrintEvent(event Event) {
	formatted := FormatEvent(event)
	fmt.Fprintln(m.output, formatted)
}

// PrintEventWithFilter はフィルタを適用してイベントを出力する
func (m *Monitor) PrintEventWithFilter(event Event) {
	if m.eventFilter != nil {
		filtered := m.eventFilter.Apply([]Event{event})
		if len(filtered) == 0 {
			return // フィルタされた
		}
	}
	m.PrintEvent(event)
}

// RunLoop は監視ループを実行する
func (m *Monitor) RunLoop(ctx context.Context) error {
	// 初期メッセージを表示
	fmt.Fprintln(m.output, "Monitoring agents...")
	if m.eventFilter != nil {
		if len(m.eventFilter.Categories) > 0 {
			fmt.Fprintf(m.output, "Filtering categories: %v\n", m.eventFilter.Categories)
		}
		if m.eventFilter.MinPriority > PriorityLow {
			fmt.Fprintf(m.output, "Minimum priority: %s\n", priorityToString(m.eventFilter.MinPriority))
		}
		if len(m.eventFilter.Agents) > 0 {
			fmt.Fprintf(m.output, "Filtering agents: %v\n", m.eventFilter.Agents)
		}
	}
	
	// getAgentStatesが設定されていない場合はデフォルト実装を使用
	if m.getAgentStates == nil {
		m.getAgentStates = m.getDefaultAgentStates
	}
	
	// 初期状態を取得
	previousStates := m.getAgentStates()
	
	// ポーリングループ
	ticker := time.NewTicker(m.pollInterval)
	defer ticker.Stop()
	
	for {
		select {
		case <-ctx.Done():
			return nil
		case <-ticker.C:
			// 現在の状態を取得
			currentStates := m.getAgentStates()
			
			// エージェント状態の変更を検出
			changes := m.DetectChanges(previousStates, currentStates)
			
			// CLAUDE.mdの変更も検出
			claudeChanges := m.DetectClaudeMDChanges(previousStates, currentStates)
			changes = append(changes, claudeChanges...)
			
			// 変更をイベントに変換
			events := m.ChangesToEvents(changes)
			
			// イベントを統合処理（表示、通知、自動アクション）
			for _, event := range events {
				if m.notificationConfig != nil || m.autoActionConfig != nil {
					m.ProcessEventWithIntegration(event)
				} else {
					m.PrintEventWithFilter(event)
				}
			}
			
			// 状態を更新
			previousStates = currentStates
		}
	}
}

// getDefaultAgentStates はデフォルトのエージェント状態取得関数
func (m *Monitor) getDefaultAgentStates() []AgentState {
	// git worktreeからエージェント状態を取得
	return GetAgentStatesFromWorktree()
}

// GetAgentStatesFromWorktree はgit worktreeからエージェント状態を取得する
func GetAgentStatesFromWorktree() []AgentState {
	states := []AgentState{}
	
	// TODO: 実際のgit worktree listコマンドを実行してワークツリーを取得
	// 現在は仮実装として空のリストを返す
	
	return states
}

// priorityToString は優先度を文字列に変換する
func priorityToString(p Priority) string {
	switch p {
	case PriorityLow:
		return "low"
	case PriorityMedium:
		return "medium"
	case PriorityHigh:
		return "high"
	default:
		return "unknown"
	}
}

// ProcessEventsWithPriority は優先度に基づいてイベントを処理する
func (m *Monitor) ProcessEventsWithPriority(events []Event) []Event {
	// 優先度でソート（高優先度順）
	sortedEvents := make([]Event, len(events))
	copy(sortedEvents, events)
	
	// 優先度でソート
	for i := 0; i < len(sortedEvents)-1; i++ {
		for j := i + 1; j < len(sortedEvents); j++ {
			priI := GetCategoryPriority(sortedEvents[i].Category)
			priJ := GetCategoryPriority(sortedEvents[j].Category)
			
			// 高優先度を前に
			if priJ > priI {
				sortedEvents[i], sortedEvents[j] = sortedEvents[j], sortedEvents[i]
			}
		}
	}
	
	// 最大数で制限
	maxEvents := m.maxEventsPerCycle
	if maxEvents <= 0 {
		maxEvents = 100 // デフォルト値
	}
	
	if len(sortedEvents) > maxEvents {
		// 高優先度イベントは必ず含める
		result := []Event{}
		for _, event := range sortedEvents {
			if GetCategoryPriority(event.Category) == PriorityHigh {
				result = append(result, event)
			}
		}
		
		// 残りの枠を中・低優先度で埋める
		remaining := maxEvents - len(result)
		if remaining > 0 {
			for _, event := range sortedEvents {
				if GetCategoryPriority(event.Category) != PriorityHigh {
					result = append(result, event)
					remaining--
					if remaining <= 0 {
						break
					}
				}
			}
		}
		
		return result
	}
	
	return sortedEvents
}