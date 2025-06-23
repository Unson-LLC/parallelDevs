#!/bin/bash

# checkpointコマンドのヘルパースクリプト

if [ $# -lt 1 ]; then
    echo "❌ エラー: エージェント名が指定されていません"
    echo ""
    echo "使い方: ./scripts/uzi-checkpoint-helper.sh <エージェント名> [コミットメッセージ]"
    echo ""
    echo "例:"
    echo "  ./scripts/uzi-checkpoint-helper.sh penelope"
    echo "  ./scripts/uzi-checkpoint-helper.sh penelope \"feat: 新機能の実装\""
    exit 1
fi

AGENT_NAME=$1
COMMIT_MSG=${2:-""}

# エージェントの存在確認
if ! ./uzi ls | grep -q "^$AGENT_NAME"; then
    echo "❌ エラー: エージェント '$AGENT_NAME' が見つかりません"
    echo ""
    echo "アクティブなエージェント:"
    ./uzi ls
    exit 1
fi

# コミットメッセージの自動生成
if [ -z "$COMMIT_MSG" ]; then
    echo "コミットメッセージが指定されていません。"
    echo "エージェントの変更内容を確認中..."
    
    # git diffから変更内容を推測
    DIFF_SUMMARY=$(./uzi ls -d | grep "^$AGENT_NAME" | awk '{print $4}')
    
    echo ""
    echo "推奨されるコミットメッセージ:"
    echo "  1) feat: 新機能の実装"
    echo "  2) fix: バグ修正"
    echo "  3) docs: ドキュメントの更新"
    echo "  4) refactor: リファクタリング"
    echo "  5) test: テストの追加・修正"
    echo ""
    read -p "番号を選択するか、カスタムメッセージを入力してください: " choice
    
    case $choice in
        1) COMMIT_MSG="feat: 新機能の実装";;
        2) COMMIT_MSG="fix: バグ修正";;
        3) COMMIT_MSG="docs: ドキュメントの更新";;
        4) COMMIT_MSG="refactor: リファクタリング";;
        5) COMMIT_MSG="test: テストの追加・修正";;
        *) COMMIT_MSG="$choice";;
    esac
fi

# checkpointの実行
echo ""
echo "実行: ./uzi checkpoint $AGENT_NAME \"$COMMIT_MSG\""
./uzi checkpoint "$AGENT_NAME" "$COMMIT_MSG"