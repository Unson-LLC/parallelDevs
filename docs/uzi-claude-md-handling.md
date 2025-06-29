# uzi CLAUDE.md ハンドリング設計書

## 概要

エージェントのworktreeにおけるCLAUDE.mdファイルの取り扱いに関する設計仕様を定義します。

## 現在の問題

1. **不要なgit差分の発生**
   - CLAUDE-WORKER.mdをCLAUDE.mdとしてコピー
   - 常にgit statusで差分として表示
   - チェックポイント時の混乱

2. **メンテナンスの困難さ**
   - CLAUDE-WORKER.mdの更新が反映されない
   - 各worktreeで個別に更新が必要

## Claude Codeの仕様

- **ファイル名**: `CLAUDE.md`（固定）
- **読み込み**: カレントディレクトリから自動読み込み
- **インポート機能**: `@path/to/file`で他ファイルを読み込み可能
- **再帰的探索**: 親ディレクトリを再帰的に探索

## 推奨設計

### 1. インポート機能を活用した設計

```bash
# エージェントworktreeのCLAUDE.md
@../../CLAUDE-WORKER.md
```

### 2. git管理からの除外

```bash
# エージェントworktreeの.gitignore
CLAUDE.md
```

## 実装仕様

### uzi promptコマンドの改善

```bash
# 疑似コード
function create_agent_worktree() {
    local agent_name=$1
    local worktree_path=".uzi/${agent_name}-${repo}-${timestamp}"
    
    # 1. worktree作成
    git worktree add "$worktree_path"
    
    # 2. .gitignoreにCLAUDE.mdを追加
    echo "CLAUDE.md" >> "$worktree_path/.gitignore"
    
    # 3. インポート用CLAUDE.md作成
    cat > "$worktree_path/CLAUDE.md" << 'EOF'
# このファイルは自動生成されています
# CLAUDE-WORKER.mdの内容をインポート
@../../CLAUDE-WORKER.md
EOF
    
    # 4. .gitignoreをコミット
    cd "$worktree_path"
    git add .gitignore
    git commit -m "chore: CLAUDE.md除外設定"
}
```

### uzi checkpointコマンドの改善

```bash
# 疑似コード
function checkpoint_agent() {
    local agent_name=$1
    local message=$2
    
    # CLAUDE.mdを除外してステージング
    git add . ':!CLAUDE.md'
    
    # または、.gitignoreに含まれていれば自動除外される
    git add .
    git commit -m "$message"
}
```

## 移行手順

### 既存プロジェクトでの適用

1. **新規エージェント**: 自動的に新方式を適用
2. **既存エージェント**: 手動での移行が必要

```bash
# 既存エージェントの移行スクリプト
for worktree in .uzi/*/; do
    if [ -f "$worktree/CLAUDE.md" ]; then
        # .gitignoreに追加
        echo "CLAUDE.md" >> "$worktree/.gitignore"
        
        # CLAUDE.mdを置き換え
        echo "@../../CLAUDE-WORKER.md" > "$worktree/CLAUDE.md"
        
        # gitから削除
        cd "$worktree"
        git rm --cached CLAUDE.md 2>/dev/null || true
        git add .gitignore
        git commit -m "chore: CLAUDE.md handling改善" || true
        cd -
    fi
done
```

## 利点

1. **git差分の削減**
   - CLAUDE.mdがgit管理外
   - クリーンなコミット履歴

2. **メンテナンス性向上**
   - CLAUDE-WORKER.mdの更新が即座に反映
   - 一元管理が可能

3. **Claude Code仕様準拠**
   - 正式なインポート機能を使用
   - 将来的な仕様変更にも対応しやすい

## 注意事項

### インポートの制限
- 最大5階層までの再帰的インポート
- 循環参照に注意

### パスの指定
- 相対パス推奨: `@../../CLAUDE-WORKER.md`
- 絶対パスは環境依存のため避ける

### エラーハンドリング
- CLAUDE-WORKER.mdが存在しない場合のフォールバック
- インポート失敗時の警告表示

## テスト項目

1. **新規エージェント作成**
   - CLAUDE.mdが正しく生成されるか
   - .gitignoreに追加されているか

2. **チェックポイント実行**
   - CLAUDE.mdが含まれていないか
   - 正常にコミットされるか

3. **設定更新の反映**
   - CLAUDE-WORKER.md更新時の即時反映
   - 全エージェントで更新が有効か

## 今後の拡張

### 環境別設定
```bash
# CLAUDE.md
@../../CLAUDE-WORKER.md
@./CLAUDE.local.md  # エージェント固有の追加設定
```

### 条件付きインポート
```bash
# 将来的な機能（仮）
@if:test ../../CLAUDE-WORKER-TEST.md
@if:prod ../../CLAUDE-WORKER-PROD.md
```

## まとめ

この設計により：
- ✅ 不要なgit差分を排除
- ✅ 設定の一元管理を実現
- ✅ Claude Codeの仕様に完全準拠
- ✅ 将来の拡張にも柔軟に対応

実装の優先順位：
1. 新規エージェント作成時の適用（高）
2. checkpointコマンドの改善（中）
3. 既存エージェントの移行（低）