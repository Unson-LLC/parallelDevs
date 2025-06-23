#!/bin/bash
# Uziマネージャー初期化スクリプト
# このスクリプトはマネージャーエージェント起動時に必ず実行すること

set -e

echo "==================================="
echo "   Uziマネージャー初期化"
echo "==================================="
echo ""

# 1. uzi autoが既に起動しているか確認
if pgrep -f "uzi auto" > /dev/null; then
    echo "✅ uzi autoは既に起動しています"
else
    echo "1. uzi autoを起動します..."
    ./uzi auto &
    sleep 2
    echo "✅ uzi autoを起動しました"
fi

# 2. エージェントの状況を確認
echo ""
echo "2. エージェント状況を確認します..."
echo ""
./uzi ls -d

echo ""
echo "==================================="
echo "   初期化完了"
echo "==================================="
echo ""
echo "次のステップ:"
echo "1. TodoWriteツールでタスクリストを作成"
echo "2. ./uzi prompt でエージェントに作業を委託"
echo ""