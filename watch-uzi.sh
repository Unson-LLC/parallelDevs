#!/bin/bash

# uziの状態を監視するスクリプト
# 使用方法: ./watch-uzi.sh [間隔秒数]

INTERVAL=${1:-5}  # デフォルト2秒間隔

echo "Uzi状態監視開始 (${INTERVAL}秒間隔) - Ctrl+Cで終了"
echo "=================================================="

while true; do
    # 画面をクリア
    clear
    
    # 現在時刻を表示
    echo "更新時刻: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "=================================================="
    
    # uzi ls -dの結果を表示
    ./uzi ls -d
    
    echo ""
    echo "次の更新まで ${INTERVAL}秒... (Ctrl+Cで終了)"
    
    # 指定秒数待機
    sleep $INTERVAL
done