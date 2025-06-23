#!/bin/bash

# マネージャーエージェントのチェックスクリプト

echo "=== Uziマネージャーチェックリスト ==="
echo ""

# 1. uzi autoの確認
echo "1. uzi autoプロセスの確認..."
if ps aux | grep "uzi auto" | grep -v grep > /dev/null; then
    echo "   ✅ uzi autoが起動しています"
else
    echo "   ❌ uzi autoが起動していません！"
    echo "   実行: nohup ./uzi auto > /dev/null 2>&1 &"
fi
echo ""

# 2. CLAUDE.mdの確認
echo "2. CLAUDE.mdの確認..."
if grep -q "Uziマネージャーエージェント" CLAUDE.md 2>/dev/null; then
    echo "   ✅ マネージャー用CLAUDE.mdが設定されています"
else
    echo "   ❌ CLAUDE.mdがワーカー用になっています！"
    echo "   git checkout HEAD -- CLAUDE.md で復元してください"
fi
echo ""

# 3. アクティブなエージェントの確認
echo "3. アクティブなエージェント:"
./uzi ls 2>/dev/null || echo "   uziコマンドが見つかりません"
echo ""

# 4. コマンドリマインダー
echo "=== よく使うコマンド ==="
echo "• 並列実装の例:"
echo "  ./uzi prompt \"フロントエンドの実装\""
echo "  ./uzi prompt \"バックエンドの実装\""
echo "  ./uzi prompt \"テストコードの作成\""
echo ""
echo "• チェックポイント（必ずメッセージ付き）:"
echo "  ./uzi checkpoint <エージェント名> \"feat: 機能実装\""
echo ""
echo "• 状態確認:"
echo "  ./uzi ls -d"
echo ""