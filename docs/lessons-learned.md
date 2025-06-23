# 教訓と改善策

## 1. 並列実装の活用不足

### 問題
- ブロック崩しゲーム全体を1つのエージェントに任せてしまった
- 並列実装の利点を活かせなかった

### 改善策
タスクを適切に分割して並列実装：
```bash
# 良い例：並列実装
./uzi prompt "HTML構造とCanvasの初期設定を実装"
./uzi prompt "ゲームロジック（ボール、パドル、ブロック）を実装"
./uzi prompt "衝突判定とスコア管理を実装"
./uzi prompt "UIとゲーム状態管理を実装"
```

## 2. checkpointコマンドの使い方

### 問題
```bash
# エラーになった例
./uzi checkpoint penelope
# エラー: agent name and commit message arguments are required
```

### 改善策
checkpointには必ずコミットメッセージが必要：
```bash
# 正しい使い方
./uzi checkpoint penelope "feat: ブロック崩しゲームの実装"
```

### ヘルパースクリプトの活用
```bash
# ヘルパースクリプトを使用（対話的にメッセージを選択可能）
./scripts/uzi-checkpoint-helper.sh penelope
```

## 3. CLAUDE.mdの管理

### 問題
- CLAUDE.mdがワーカー用の内容で上書きされていた

### 改善策
- 定期的に`./scripts/check-manager.sh`でチェック
- 問題があれば`git checkout HEAD -- CLAUDE.md`で復元

## 4. 推奨ワークフロー

1. **初期セットアップ**
   ```bash
   nohup ./uzi auto > /dev/null 2>&1 &
   ./scripts/check-manager.sh
   ```

2. **タスク受領時**
   - TodoWriteでタスク分解
   - 並列実行可能な単位に分割
   - 複数のエージェントに同時に割り当て

3. **進捗管理**
   ```bash
   ./uzi ls -d  # 定期的に状態確認
   ```

4. **完了時**
   ```bash
   ./scripts/uzi-checkpoint-helper.sh <エージェント名>
   ```

## 5. チェックリスト

マネージャーとして作業前に確認：
- [ ] uzi autoが起動している
- [ ] CLAUDE.mdがマネージャー用である
- [ ] タスクを並列実行可能な単位に分割した
- [ ] 各エージェントへの指示が明確である
- [ ] checkpointにコミットメッセージを含める