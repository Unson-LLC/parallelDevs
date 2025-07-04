package monitor

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// DetectClaudeMDChanges はCLAUDE.mdの変更を検出する
func (m *Monitor) DetectClaudeMDChanges(oldStates, newStates []AgentState) []Change {
	changes := []Change{}
	
	// 古い状態をマップに変換
	oldStateMap := make(map[string]AgentState)
	for _, state := range oldStates {
		oldStateMap[state.Name] = state
	}
	
	// 新しい状態をチェック
	for _, newState := range newStates {
		oldState, exists := oldStateMap[newState.Name]
		
		if !exists {
			continue
		}
		
		// CLAUDE.mdの状態変更をチェック
		if oldState.ClaudeMDPath == "" && newState.ClaudeMDPath != "" {
			// CLAUDE.mdが作成された
			changes = append(changes, Change{
				Type:        "CLAUDE_MD",
				Description: "CLAUDE.md created",
				Agent:       newState.Name,
				Timestamp:   time.Now(),
			})
		} else if oldState.ClaudeMDPath != "" && newState.ClaudeMDPath == "" {
			// CLAUDE.mdが削除された
			changes = append(changes, Change{
				Type:        "CLAUDE_MD",
				Description: "CLAUDE.md deleted",
				Agent:       newState.Name,
				Timestamp:   time.Now(),
			})
		} else if oldState.ClaudeMDPath != "" && newState.ClaudeMDPath != "" {
			// 両方に存在する場合、ClaudeMDInfoを使って変更をチェック
			if oldState.ClaudeMDInfo != nil && newState.ClaudeMDInfo != nil {
				// タイムスタンプまたはサイズを比較
				if newState.ClaudeMDInfo.LastModified.After(oldState.ClaudeMDInfo.LastModified) ||
				   newState.ClaudeMDInfo.Size != oldState.ClaudeMDInfo.Size {
					changes = append(changes, Change{
						Type:        "CLAUDE_MD",
						Description: "CLAUDE.md updated",
						Agent:       newState.Name,
						Timestamp:   time.Now(),
					})
				}
			} else {
				// ClaudeMDInfoがない場合はファイルを直接チェック
				info, err := os.Stat(newState.ClaudeMDPath)
				if err == nil && oldState.ClaudeMDInfo != nil {
					if info.ModTime().After(oldState.ClaudeMDInfo.LastModified) {
						changes = append(changes, Change{
							Type:        "CLAUDE_MD",
							Description: "CLAUDE.md updated",
							Agent:       newState.Name,
							Timestamp:   time.Now(),
						})
					}
				}
			}
		}
	}
	
	return changes
}

// GenerateClaudeMDSummary はCLAUDE.mdファイルの要約を生成する
func (m *Monitor) GenerateClaudeMDSummary(path string) string {
	if path == "" {
		return "CLAUDE.md not found"
	}
	
	file, err := os.Open(path)
	if err != nil {
		if os.IsNotExist(err) {
			return "CLAUDE.md not found"
		}
		return fmt.Sprintf("Error reading CLAUDE.md: %v", err)
	}
	defer file.Close()
	
	// ファイルサイズをチェック
	info, err := file.Stat()
	if err != nil {
		return fmt.Sprintf("Error reading CLAUDE.md info: %v", err)
	}
	
	if info.Size() == 0 {
		return "Empty CLAUDE.md"
	}
	
	// ファイル内容を解析
	scanner := bufio.NewScanner(file)
	var (
		ruleCount   int
		apiKeyCount int
		sectionCount int
	)
	
	for scanner.Scan() {
		line := scanner.Text()
		trimmed := strings.TrimSpace(line)
		
		// セクションをカウント
		if strings.HasPrefix(trimmed, "#") {
			sectionCount++
		}
		
		// ルールをカウント（リスト形式または番号付きリスト）
		if strings.HasPrefix(trimmed, "-") || strings.HasPrefix(trimmed, "*") {
			// セクション問わずリストアイテムをカウント
			ruleCount++
		} else if len(trimmed) > 2 && trimmed[0] >= '1' && trimmed[0] <= '9' && trimmed[1] == '.' {
			// 番号付きリストをカウント
			ruleCount++
		}
		
		// APIキーを検出（マスクする）
		if strings.Contains(line, "API_KEY") || strings.Contains(line, "api_key") {
			apiKeyCount++
		}
	}
	
	if err := scanner.Err(); err != nil {
		return fmt.Sprintf("Error scanning CLAUDE.md: %v", err)
	}
	
	// 要約を生成
	parts := []string{}
	if ruleCount > 0 {
		parts = append(parts, fmt.Sprintf("%d rules", ruleCount))
	}
	if apiKeyCount > 0 {
		parts = append(parts, fmt.Sprintf("%d API key", apiKeyCount))
	}
	if sectionCount > 0 {
		parts = append(parts, fmt.Sprintf("%d sections", sectionCount))
	}
	
	if len(parts) == 0 {
		return "Empty CLAUDE.md"
	}
	
	return strings.Join(parts, ", ")
}

// UpdateAgentClaudeMDInfo はエージェントのCLAUDE.md情報を更新する
func UpdateAgentClaudeMDInfo(state *AgentState) {
	if state.WorktreeDir == "" {
		return
	}
	
	claudePath := filepath.Join(state.WorktreeDir, "CLAUDE.md")
	info, err := os.Stat(claudePath)
	
	if err != nil {
		if os.IsNotExist(err) {
			state.ClaudeMDPath = ""
			state.ClaudeMDInfo = &ClaudeMDInfo{
				Exists: false,
			}
		}
		return
	}
	
	state.ClaudeMDPath = claudePath
	state.ClaudeMDInfo = &ClaudeMDInfo{
		Exists:       true,
		LastModified: info.ModTime(),
		Size:         info.Size(),
	}
}