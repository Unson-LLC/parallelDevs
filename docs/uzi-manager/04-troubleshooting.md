# トラブルシューティング

## エージェントが応答しない場合

```bash
# 状態を確認
uzi ls

# 強制的に入力を送信
uzi run "echo 'continuing...'"

# 最終手段：エージェントを再起動
uzi kill stuck-agent
uzi prompt --agents claude:1 "前回の続きから..."
```

## ポートの競合

```bash
# uzi.yamlでポート範囲を調整
portRange: 4000-4010  # 別の範囲に変更
```

## マージコンフリクトの解決

### 1. コンフリクトの予防策

```bash
# 事前に各エージェントの変更内容を確認
uzi ls  # DIFFカラムで変更量を確認

# 同じファイルを編集しているエージェントを特定
uzi run "git status"
uzi run "git diff --name-only"

# 作業を分離する指示を送信
uzi broadcast "他のエージェントとファイルが重複しないよう注意してください"
```

### 2. 段階的なマージ戦略

```bash
# 小さな変更から順番にマージ
uzi checkpoint small-change-agent "feat: 小規模な変更"

# 問題がないことを確認してから次へ
git log --oneline -5
uzi checkpoint next-agent "feat: 次の変更"
```

### 3. コンフリクト発生時の対処

```bash
# コンフリクトが発生した場合
uzi checkpoint agent1 "feat: 機能A"
# エラー: マージコンフリクトが発生

# 1. 現在のブランチの状態を確認
git status
git diff --name-only --diff-filter=U  # コンフリクトファイル一覧

# 2. エージェントのワークツリーに直接アクセス
cd ~/.local/share/uzi/worktrees/agent1
git diff HEAD  # 変更内容を詳細確認

# 3. メインブランチに戻ってマニュアルマージ
cd /Users/unson/Documents/uzi
git checkout main
git merge --no-commit --no-ff worktree-agent1

# 4. コンフリクトを解決
# ファイルを編集してコンフリクトマーカーを解決
# <<<<<<<, =======, >>>>>>> を探して適切に統合

# 5. 解決後にコミット
git add .
git commit -m "feat: 機能A - コンフリクト解決済み"
```

### 4. 複数エージェントの成果物を統合

```bash
# 方法1: チェリーピックによる選択的統合
# 各エージェントのコミットを確認
cd ~/.local/share/uzi/worktrees/agent1
git log --oneline -10
# 良いコミットのハッシュをメモ

cd /Users/unson/Documents/uzi
git cherry-pick <commit-hash>

# 方法2: パッチファイルによる統合
cd ~/.local/share/uzi/worktrees/agent2
git diff main > /tmp/agent2-changes.patch

cd /Users/unson/Documents/uzi
git apply --check /tmp/agent2-changes.patch  # 事前確認
git apply /tmp/agent2-changes.patch         # 適用
```

### 5. 高度なコンフリクト解決テクニック

```bash
# 特定のファイルだけを取得
git checkout worktree-agent1 -- path/to/specific/file

# 3-wayマージツールを使用
git mergetool

# インタラクティブなマージ
git rebase -i main

# 部分的なマージ
git checkout --patch worktree-agent2
```

### 6. コンフリクト解決のベストプラクティス

#### 事前の調整
```bash
# エージェントに作業範囲を明確に指示
uzi prompt --agents claude:3 "src/apiディレクトリのみを修正してください"
```

#### 定期的な同期
```bash
# 30分ごとに小さくチェックポイント
uzi checkpoint fast-agent "wip: 進行中の作業"
```

#### コンフリクト後の検証
```bash
# マージ後は必ずテストを実行
npm test
npm run lint
npm run build
```