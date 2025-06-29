# Uzi - 並列AIエージェント管理ツール

このプロジェクトは[Devflow, Inc](https://www.uzi.sh)による素晴らしい[Uziプロジェクト](https://github.com/devflowinc/uzi)のフォークです。

## 謝辞

このプロジェクトはDevflow, IncのUziチームの優れた作品に基づいています。オリジナルのプロジェクトは以下で確認できます：
- ウェブサイト: https://www.uzi.sh
- リポジトリ: https://github.com/devflowinc/uzi
- ホワイトペーパー: https://cdn.trieve.ai/uzi-whitepaper.pdf

## このフォークについて

Uziは、複数のAIエージェントを並列で管理し、効率的なソフトウェア開発を支援するツールです。このフォークでは以下の改善を加えています：

- 日本語ドキュメントの充実
- 並列開発ワークフローの設計ドキュメント追加
- CLAUDE.md管理機能の改善
- エラー処理と監視機能の強化

## 主な機能

- **並列エージェント管理**: 複数のClaude AIエージェントを同時に起動・管理
- **独立した作業環境**: 各エージェントにGit worktreeによる独立した環境を提供
- **進捗監視**: エージェントの状態をリアルタイムで監視
- **簡単な統合**: チェックポイント機能で各エージェントの成果を統合

## インストール

```bash
# Go環境がある場合
go install github.com/Unson-LLC/parallelDevs/uzi@latest

# または、リリースページからバイナリをダウンロード
```

## 基本的な使い方

### エージェントの起動
```bash
# 新しいエージェントを起動してタスクを割り当て
./uzi prompt "TodoListコンポーネントを実装してください"
```

### 状態の確認
```bash
# 全エージェントの状態を表示
./uzi ls -d

# プロンプト自動応答を有効化
./uzi auto > /dev/null 2>&1 &
```

### 成果の統合
```bash
# エージェントの作業をメインブランチに統合
./uzi checkpoint agent-name "feat: TodoList実装完了"
```

### エージェントの終了
```bash
# 特定のエージェントを終了
./uzi dismiss agent-name

# 全エージェントを終了
./uzi dismiss --all
```

## 設計思想

Uziは以下の原則に基づいて設計されています：

1. **並列化の最大化**: 独立したタスクは必ず並列で実行
2. **独立性の確保**: 各エージェントは干渉しない環境で作業
3. **監視と介入**: マネージャーは差分情報のみに集中

詳細は[設計思想ドキュメント](./docs/uzi-design-philosophy.md)を参照してください。

## ドキュメント

- [設計思想](./docs/uzi-design-philosophy.md) - Uziの設計原則と使用方法
- [CLAUDE.mdハンドリング](./docs/uzi-claude-md-handling.md) - エージェント設定ファイルの管理
- [マネージャーガイド](./docs/uzi-manager/) - 効率的なエージェント管理方法

## 開発状況

現在実装済み：
- ✅ 基本的なエージェント管理機能
- ✅ Git worktreeによる環境分離
- ✅ チェックポイント機能
- ✅ プロンプト自動応答

開発中：
- 🚧 `uzi monitor` - リアルタイム差分監視
- 🚧 エラー通知システム
- 🚧 進捗レポート機能

## ライセンス

MIT License - 詳細は[LICENSE](./LICENSE)ファイルを参照してください。

## 貢献

プルリクエストや機能提案を歓迎します。詳細は[CONTRIBUTING.md](./CONTRIBUTING.md)（準備中）を参照してください。