#!/bin/bash
# promptコマンド実行前のチェックスクリプト
# uzi promptを実行する前に必ず実行すること

set -e

echo "==================================="
echo "   事前チェック実行中..."
echo "==================================="
echo ""

ERROR_COUNT=0

# 1. uzi autoが起動しているかチェック
if ! pgrep -f "uzi auto" > /dev/null; then
    echo "❌ エラー: uzi autoが起動していません"
    echo "   実行してください: ./uzi auto &"
    ((ERROR_COUNT++))
else
    echo "✅ uzi autoは起動しています"
fi

# 2. uziコマンドが存在するかチェック
if [ ! -f "./uzi" ]; then
    echo "❌ エラー: ./uzi コマンドが見つかりません"
    echo "   現在のディレクトリ: $(pwd)"
    ((ERROR_COUNT++))
else
    echo "✅ uziコマンドが見つかりました"
fi

# 3. 実行権限があるかチェック
if [ -f "./uzi" ] && [ ! -x "./uzi" ]; then
    echo "❌ エラー: ./uzi に実行権限がありません"
    echo "   実行してください: chmod +x ./uzi"
    ((ERROR_COUNT++))
else
    echo "✅ uziコマンドの実行権限があります"
fi

echo ""
echo "==================================="

if [ $ERROR_COUNT -gt 0 ]; then
    echo "   ❌ チェック失敗: $ERROR_COUNT 個のエラー"
    echo "==================================="
    echo ""
    echo "上記のエラーを修正してから再度実行してください"
    exit 1
else
    echo "   ✅ すべてのチェックに合格"
    echo "==================================="
    echo ""
    echo "./uzi prompt コマンドを安全に実行できます"
fi