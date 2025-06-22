# ワーカー・マネージャー間通知システム

## 概要

Uziに、ワーカー（エージェント）からマネージャーへの完了報告機能を実装しました。この機能により、ワーカーの完了状態をリアルタイムで検知し、自動的に状態を更新できます。

## アーキテクチャ

### 通信方式
- HTTPベースのシンプルな通知システム
- マネージャーが通知受信サーバーを起動（ポート9999）
- ワーカーがHTTP POSTで通知を送信

### コンポーネント

1. **通知サーバー** (`pkg/notification/server.go`)
   - マネージャー側で動作
   - `/notify` エンドポイントで通知を受信
   - `/health` エンドポイントでヘルスチェック

2. **通知クライアント** (`pkg/notification/client.go`)
   - ワーカーから通知を送信
   - 完了、エラー、進捗の3種類の通知タイプ

3. **状態管理の拡張** (`pkg/state/state.go`)
   - `AgentStatus` 型を追加（pending/running/completed/error）
   - 完了時刻の記録
   - 最後のメッセージの保存

## 使用方法

### 1. マネージャーの起動（自動モード）

```bash
# 通知サーバーを含むautoモードを起動
uzi auto
```

これにより：
- ポート9999で通知サーバーが起動
- tmuxペインの監視と自動Enter送信
- 通知の受信と状態更新

### 2. ワーカーからの通知送信

```bash
# 完了通知
uzi notify --session=agent-xxx --agent=john --type=complete "タスクが完了しました"

# エラー通知
uzi notify --session=agent-xxx --agent=john --type=error "エラーが発生しました"

# 進捗通知
uzi notify --session=agent-xxx --agent=john --type=progress "処理中です（50%）"
```

### 3. 状態の確認

```bash
# 通常の表示（完了状態も表示される）
uzi ls

# 詳細表示（アイコンで状態を確認）
uzi ls -d
```

状態アイコン：
- 🟡 Ready（準備完了）
- 🏃 Running（実行中）
- ✅ Completed（完了）
- ❌ Error（エラー）
- ⚠️ Stuck（停止中）

## ワーカーへの統合方法

### 方法1: プロンプトに通知コマンドを含める

```bash
uzi prompt --agents claude:1 "タスクを実行してください。完了したら以下のコマンドを実行してください：
uzi notify --session=\$SESSION_NAME --agent=\$AGENT_NAME --type=complete '作業が完了しました'"
```

### 方法2: スクリプトでラップする

```bash
#!/bin/bash
# worker-wrapper.sh

SESSION_NAME=$1
AGENT_NAME=$2

# ワーカーのタスクを実行
# ...

# 完了時に通知
uzi notify --session=$SESSION_NAME --agent=$AGENT_NAME --type=complete "タスク完了"
```

### 方法3: プログラム内から通知

Go言語のプログラムから直接通知を送信することも可能です：

```go
import "github.com/devflowinc/uzi/pkg/notification"

// 通知クライアントを作成
client := notification.NewNotificationClient(9999, sessionName, agentName)

// 完了通知を送信
err := client.NotifyComplete("処理が完了しました")
```

## 今後の拡張案

1. **自動チェックポイント**
   - 完了通知を受けたら自動的にcheckpointを実行

2. **Webhook統合**
   - 外部サービスへの通知転送

3. **統計情報の収集**
   - エージェントの作業時間の計測
   - 成功率の記録

4. **通知の永続化**
   - データベースへの保存
   - 履歴の参照機能

## トラブルシューティング

### 通知が届かない場合

1. マネージャーが起動しているか確認
   ```bash
   ps aux | grep "uzi auto"
   ```

2. ポート9999が使用可能か確認
   ```bash
   lsof -i :9999
   ```

3. ヘルスチェックを実行
   ```bash
   curl http://localhost:9999/health
   ```

### 状態が更新されない場合

1. state.jsonファイルの権限を確認
2. セッション名が正しいか確認
3. ログでエラーメッセージを確認