package status

import (
	"encoding/json"
	"os"

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
		// マージ状態を判定（LastMergedAtが存在すればマージ済み）
		isMerged := agentState.LastMergedAt != nil
		
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
	// 新しいMarkAsMergedメソッドを使用
	return sa.stateManager.MarkAsMerged(sessionName)
}

// DefaultTmuxClient - デフォルトのTmuxClient実装を取得
func DefaultTmuxClient() TmuxClient {
	return &defaultTmuxClient{}
}