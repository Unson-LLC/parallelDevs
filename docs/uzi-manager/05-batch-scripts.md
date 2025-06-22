# バッチ処理戦略

## 1. 基本的なバッチスクリプト

### REDフェーズ用スクリプト (start_red_phase.sh)
```bash
#!/bin/bash
# 複数のテスト作成エージェントを個別タスクで起動

echo "=== TDD REDフェーズ開始 ==="

# 各エージェントに個別のタスクを割り当て
uzi prompt --agents claude:1 "cmd/uzi/main_test.go: CLIのメインエントリーポイントのテストを作成" &
sleep 2
uzi prompt --agents claude:1 "internal/auth/auth_test.go: 認証機能の包括的なテストスイートを作成" &
sleep 2
uzi prompt --agents claude:1 "internal/api/api_test.go: REST APIエンドポイントのテストを作成" &
sleep 2
uzi prompt --agents claude:1 "internal/validation/validation_test.go: 入力検証とエラーハンドリングのテストを作成" &

# 自動確認モードを起動
sleep 5
uzi auto &

echo "全エージェントが起動しました。'uzi ls -w'で進捗を確認してください。"
```

### GREENフェーズ用スクリプト (start_green_phase.sh)
```bash
#!/bin/bash
# 実装エージェントを起動

echo "=== TDD GREENフェーズ開始 ==="

# テストを通過する実装を作成
uzi prompt --agents claude:1 "cmd/uzi/main.go: main_test.goのテストを通過する実装" &
sleep 2
uzi prompt --agents claude:1 "internal/auth/auth.go: auth_test.goのテストを通過する認証機能" &
sleep 2
uzi prompt --agents claude:1 "internal/api/api.go: api_test.goのテストを通過するAPIハンドラー" &
sleep 2
uzi prompt --agents claude:1 "internal/validation/validation.go: validation_test.goのテストを通過する検証ロジック" &

# テスト実行を監視
sleep 10
watch -n 5 'uzi run "go test ./... -v | grep -E \"(PASS|FAIL|---)\""'
```

## 2. 高度な自動化スクリプト

### 統合TDDマネージャー (tdd_manager.sh)
```bash
#!/bin/bash
# 完全自動化されたTDD開発フロー

# 設定
RED_AGENTS=4
GREEN_AGENTS=5
REFACTOR_AGENTS=3

# 関数定義
check_tests() {
    uzi run "go test ./..." | grep -q "FAIL"
    return $?
}

wait_for_agents() {
    local expected=$1
    while [ $(uzi ls | grep -c "ready") -lt $expected ]; do
        sleep 2
    done
}

# メイン処理
echo "=== 自動TDD開発開始 ==="

# REDフェーズ
echo "[1/3] REDフェーズ: テスト作成"
./start_red_phase.sh
wait_for_agents $RED_AGENTS

# テストが失敗することを確認
sleep 30
if check_tests; then
    echo "✅ テストが適切に失敗しています"
else
    echo "⚠️  警告: テストが通過しています。実装が既に存在する可能性があります"
fi

# 最良のテストを選択してマージ
echo "テストコードをレビューしてマージしてください"
uzi ls
read -p "マージするエージェント名: " agent_name
uzi checkpoint $agent_name "test: TDDテストスイートの追加"

# GREENフェーズ
echo "[2/3] GREENフェーズ: 実装"
uzi kill all
./start_green_phase.sh
wait_for_agents $GREEN_AGENTS

# テスト通過を待つ
while check_tests; do
    echo "テスト実行中..."
    sleep 10
done
echo "✅ 全テストが通過しました！"

# REFACTORフェーズ
echo "[3/3] REFACTORフェーズ: リファクタリング"
uzi kill all
uzi prompt --agents claude:$REFACTOR_AGENTS "テストを壊さずにコードをリファクタリング、最適化、ドキュメント追加"
uzi auto &

echo "=== TDD開発完了 ==="
```

## 3. プロジェクト別カスタマイズ

### プロジェクト設定ファイル (tdd_config.sh)
```bash
#!/bin/bash
# プロジェクト固有の設定

# テストファイルと実装ファイルのマッピング
declare -A TEST_MAPPING=(
    ["auth_test.go"]="internal/auth/auth.go"
    ["user_test.go"]="internal/models/user.go"
    ["api_test.go"]="internal/handlers/api.go"
)

# フェーズ別のエージェント数
RED_PHASE_AGENTS=4
GREEN_PHASE_AGENTS=5
REFACTOR_PHASE_AGENTS=3

# テストコマンド
TEST_CMD="go test -v -cover ./..."
LINT_CMD="golangci-lint run"
BUILD_CMD="go build -o uzi ./cmd/uzi"
```

## 4. エラーハンドリング付きスクリプト

### 堅牢なバッチ処理 (robust_tdd.sh)
```bash
#!/bin/bash
set -e  # エラー時に停止

# ログファイル
LOG_FILE="tdd_$(date +%Y%m%d_%H%M%S).log"

# エラーハンドリング
trap 'echo "エラーが発生しました。ログ: $LOG_FILE"; uzi kill all' ERR

# 実行
{
    echo "開始時刻: $(date)"
    
    # エージェント起動with retry
    for i in {1..3}; do
        if uzi prompt --agents claude:1 "テストを作成" >> $LOG_FILE 2>&1; then
            break
        else
            echo "起動失敗 (試行 $i/3)"
            sleep 5
        fi
    done
    
    # 進捗レポート
    while true; do
        echo "--- $(date) ---"
        uzi ls
        echo "テスト結果:"
        uzi run "go test ./... 2>&1 | tail -5"
        sleep 60
    done
} | tee -a $LOG_FILE
```