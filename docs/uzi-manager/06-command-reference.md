# コマンドリファレンス

## 頻繁に使用するコマンド

### エージェント管理
```bash
uzi prompt --agents claude:count "タスクの説明"
uzi ls [-w]                    # 状態確認（-wで監視モード）
uzi auto                        # 自動確認モード
uzi kill agent-name|all         # エージェントの終了
```

### コミュニケーション
```bash
uzi broadcast "メッセージ"      # 全エージェントへ送信
uzi run "コマンド"              # 全エージェントでコマンド実行
```

### 成果物の統合
```bash
uzi checkpoint agent-name "コミットメッセージ"
```

### クリーンアップ
```bash
uzi reset                       # 全データの削除（注意）
```

## 開発環境の設定

```yaml
# uzi.yaml
devCommand: cd project && npm install && npm run dev --port $PORT
portRange: 3000-3010
```

## 重要な注意事項

1. **状態の永続性**: エージェントの状態は`~/.local/share/uzi/states.json`に保存される
2. **Gitワークツリー**: 各エージェントは独立したワークツリーで作業
3. **Tmuxセッション**: 各エージェントは`uzi-エージェント名`のtmuxセッションで実行
4. **自動クリーンアップ**: killコマンドでワークツリーも削除される
5. **並行性の制限**: ポート範囲内でのみ並列実行可能