package status

import (
	"encoding/json"
	"os"
	"time"

	"github.com/devflowinc/uzi/pkg/state"
)

// StateAdapter - state.StateManagerをStatusManagerのStateManagerインターフェースに適合させる
type StateAdapter struct {
	stateManager *state.StateManager
}

// NewStateAdapter - StateAdapterのコンストラクタ
func NewStateAdapter(sm *state.StateManager) StateManager {
	return &StateAdapter{stateManager: sm}
}

// GetWorktreeInfo - state.AgentStateをAgentStateに変換
func (sa *StateAdapter) GetWorktreeInfo(sessionName string) (*AgentState, error) {
	// stateファイルを読み込む
	states := make(map[string]state.AgentState)
	if data, err := os.ReadFile(sa.stateManager.GetStatePath()); err != nil {
		return nil, err
	} else {
		if err := json.Unmarshal(data, &states); err != nil {
			return nil, err
		}
	}

	if agentState, ok := states[sessionName]; ok {
		// マージ状態を判定（LastMergedAtフィールドが追加されるまでは仮の判定）
		isMerged := false
		
		return &AgentState{
			WorktreePath: agentState.WorktreePath,
			UpdatedAt:    agentState.UpdatedAt,
			IsMerged:     isMerged,
		}, nil
	}

	return nil, os.ErrNotExist
}

// MarkAsMerged - エージェントをマージ済みとしてマーク
func (sa *StateAdapter) MarkAsMerged(sessionName string) error {
	// 現在のMarkWorkCompletedを使用（将来的にはマージ専用のフィールドを追加）
	return sa.stateManager.MarkWorkCompleted(sessionName)
}

// DefaultTmuxClient - デフォルトのTmuxClient実装を取得
func DefaultTmuxClient() TmuxClient {
	return &defaultTmuxClient{}
}