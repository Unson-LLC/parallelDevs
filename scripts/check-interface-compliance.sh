#!/bin/bash
# インターフェース準拠チェックスクリプト

echo "🔍 インターフェース準拠チェックを開始します..."

# エラーカウンター
ERROR_COUNT=0
WARNING_COUNT=0

# 色の定義
RED='\033[0;31m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# 1. export default の使用をチェック
echo "📋 エクスポート形式をチェック中..."
if grep -r "export default" src/js --include="*.js" > /tmp/export_default_check.txt 2>/dev/null; then
    if [ -s /tmp/export_default_check.txt ]; then
        echo -e "${RED}❌ export default の使用が検出されました:${NC}"
        cat /tmp/export_default_check.txt
        ERROR_COUNT=$((ERROR_COUNT + $(wc -l < /tmp/export_default_check.txt)))
    fi
else
    echo -e "${GREEN}✅ エクスポート形式は正しいです${NC}"
fi

# 2. 必須メソッドの存在チェック
echo "📋 必須メソッドをチェック中..."
REQUIRED_METHODS=("reset" "update" "getCurrentScore" "getLives" "changeState")
for method in "${REQUIRED_METHODS[@]}"; do
    if ! grep -r "$method" src/js --include="*.js" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  メソッド '$method' が見つかりません${NC}"
        WARNING_COUNT=$((WARNING_COUNT + 1))
    fi
done

# 3. 命名規則チェック（getCurrentXxx の使用）
echo "📋 命名規則をチェック中..."
if grep -r "getCurrent[A-Z]" src/js --include="*.js" | grep -v "getCurrentScore" > /tmp/naming_check.txt 2>/dev/null; then
    if [ -s /tmp/naming_check.txt ]; then
        echo -e "${YELLOW}⚠️  冗長な命名が検出されました:${NC}"
        cat /tmp/naming_check.txt
        WARNING_COUNT=$((WARNING_COUNT + $(wc -l < /tmp/naming_check.txt)))
    fi
fi

# 4. インポート形式チェック
echo "📋 インポート形式をチェック中..."
if grep -r "^import [A-Za-z]* from" src/js --include="*.js" | grep -v "^import {" > /tmp/import_check.txt 2>/dev/null; then
    if [ -s /tmp/import_check.txt ]; then
        echo -e "${RED}❌ デフォルトインポートの使用が検出されました:${NC}"
        cat /tmp/import_check.txt
        ERROR_COUNT=$((ERROR_COUNT + $(wc -l < /tmp/import_check.txt)))
    fi
fi

# 5. クラス定義の確認
echo "📋 クラス定義をチェック中..."
EXPECTED_CLASSES=("GameState" "ScoreManager" "LifeManager" "Ball" "Paddle" "Block")
for class in "${EXPECTED_CLASSES[@]}"; do
    if ! grep -r "class $class" src/js --include="*.js" > /dev/null 2>&1; then
        echo -e "${RED}❌ クラス '$class' が定義されていません${NC}"
        ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
done

# 6. エラーハンドリングチェック
echo "📋 エラーハンドリングをチェック中..."
if ! grep -r "console.error" src/js --include="*.js" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  エラーハンドリングが不足している可能性があります${NC}"
    WARNING_COUNT=$((WARNING_COUNT + 1))
fi

# 結果の集計
echo ""
echo "========================================="
echo "チェック結果："
echo "========================================="
echo -e "エラー: ${RED}$ERROR_COUNT 件${NC}"
echo -e "警告: ${YELLOW}$WARNING_COUNT 件${NC}"

if [ $ERROR_COUNT -gt 0 ]; then
    echo -e "${RED}❌ インターフェース準拠チェックに失敗しました${NC}"
    echo "エラーを修正してから再度実行してください"
    exit 1
elif [ $WARNING_COUNT -gt 0 ]; then
    echo -e "${YELLOW}⚠️  警告がありますが、チェックは通過しました${NC}"
    exit 0
else
    echo -e "${GREEN}✅ すべてのチェックに合格しました！${NC}"
    exit 0
fi