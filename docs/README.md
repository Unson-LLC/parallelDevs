# ドキュメント一覧

このディレクトリには、parallelDevsプロジェクトの各種ドキュメントが含まれています。

## ディレクトリ構造

```
docs/
├── README.md                      # このファイル
├── uzi-manager/                   # Uziマネージャー用ドキュメント
│   ├── README.md                  # マネージャードキュメントの概要
│   ├── 01-tdd-workflow.md         # TDD開発ワークフロー ⚠️ 重要更新
│   ├── 02-agent-management.md     # エージェント管理
│   ├── 03-alert-conditions.md     # アラート条件
│   ├── 04-troubleshooting.md      # トラブルシューティング
│   ├── 05-batch-scripts.md        # バッチスクリプト
│   ├── 06-command-reference.md    # コマンドリファレンス
│   ├── 07-notification-templates.md # 通知テンプレート
│   ├── 08-interface-definition-template.md # インターフェース定義 🆕
│   └── 09-quality-checklist.md    # 品質管理チェックリスト 🆕
├── requirements/                  # 要件定義書
│   └── breakout-game.md          # ブロック崩しゲーム要件
├── enhanced-ls-command.md        # 拡張lsコマンド仕様
├── notification-system.md        # 通知システム仕様
├── lessons-learned.md            # 学んだ教訓（一般）
└── lessons-learned-breakout.md   # ブロック崩し開発からの教訓 🆕
```

## 重要なドキュメント

### 🔴 必読（マネージャー向け）
1. **[CLAUDE.md](../CLAUDE.md)** - マネージャーエージェント設定
2. **[インターフェース定義テンプレート](./uzi-manager/08-interface-definition-template.md)** - 並列開発の必須プロセス
3. **[TDD開発ワークフロー](./uzi-manager/01-tdd-workflow.md)** - 更新されたTDDプロセス

### 🔵 必読（ワーカー向け）
1. **[CLAUDE-WORKER.md](../CLAUDE-WORKER.md)** - ワーカーエージェント設定
2. **[インターフェース定義テンプレート](./uzi-manager/08-interface-definition-template.md)** - 実装時の契約

### 📚 参考資料
- **[ブロック崩し開発からの教訓](./lessons-learned-breakout.md)** - 失敗から学んだこと
- **[品質管理チェックリスト](./uzi-manager/09-quality-checklist.md)** - 品質確保のための手順
- **[トラブルシューティング](./uzi-manager/04-troubleshooting.md)** - 問題解決ガイド

## 2025年6月の重要な変更

### インターフェース定義フェーズの必須化
並列開発での問題を防ぐため、以下が必須となりました：

1. **事前のインターフェース定義**
2. **統合テストの優先作成**
3. **段階的な統合**
4. **エクスポート形式の統一**（`export { }` のみ使用）

詳細は各ドキュメントを参照してください。

## クイックリンク

### 開発フロー
- [TDDワークフロー](./uzi-manager/01-tdd-workflow.md) → [インターフェース定義](./uzi-manager/08-interface-definition-template.md) → [品質チェック](./uzi-manager/09-quality-checklist.md)

### コマンド
- [uziコマンドリファレンス](./uzi-manager/06-command-reference.md)
- [バッチスクリプト](./uzi-manager/05-batch-scripts.md)

### 問題解決
- [トラブルシューティング](./uzi-manager/04-troubleshooting.md)
- [アラート条件](./uzi-manager/03-alert-conditions.md)

## ドキュメントの更新

ドキュメントは継続的に改善されています。最新の情報は各ドキュメントの更新日時を確認してください。

特に重要な更新：
- 2025年6月23日: インターフェース定義プロセスの追加
- 2025年6月23日: 品質管理チェックリストの作成
- 2025年6月23日: CLAUDE-WORKER.mdの全面改訂