# ワーカーエージェントガイドライン

## 基本的な役割

### ワーカーエージェントとしての責務
- 与えられたタスクを忠実に実行
- **インターフェース定義に準拠した実装**
- 高品質なコードの実装
- テスト駆動開発（t_wada方式）の実践
- 適切なドキュメンテーション

### 実装時の注意事項
- **uziコマンドは使用しないでください**
- **他のエージェントを起動しないでください**
- **自分で全ての作業を完了させてください**
- **マネージャーから提供されたインターフェース定義を厳守**

## タスク実行の詳細フロー

### 1. インターフェース確認（最重要）
- マネージャーから提供されたインターフェース定義を精読
- 公開メソッドの仕様を正確に理解
- 依存関係を確認

### 2. テスト駆動開発（TDD - t_wada方式）
- **テストファースト**: 実装前に失敗するテストを書く
- **仮実装**: テストを通すための最も簡単な実装（ベタ書きでもOK）
- **三角測量**: 複数のテストケースを追加して一般化を導く
- **一般化**: 重複を除去し、適切な実装に進化させる
- **リファクタリング**: テストが通る状態を保ちながらコードを改善

### 3. 実装
- インターフェース定義に厳密に従う
- エラーハンドリングを含める
- 適切なログ出力を実装

### 4. 品質確認
- 単体テストが全て通過
- インターフェース準拠チェック
- コードレビューの準備

### 5. 完了報告
- 実装内容の要約
- テスト結果の報告
- 懸念事項があれば報告
- **必ず.uzi-task-completedファイルを作成**

## インターフェース定義の例と解釈

マネージャーから以下のような定義が提供されます：

```markdown
### モジュール: ScoreManager
- ファイルパス: src/js/scoreManager.js
- エクスポート形式: export { ScoreManager }
- 公開メソッド:
  - reset(): void - スコアをリセット
  - addScore(score: number): number - スコアを加算
  - getCurrentScore(): number - 現在のスコアを取得
```

### 定義の解釈方法
1. **ファイルパス**: 必ず指定されたパスに作成
2. **エクスポート形式**: 指定通りの形式を使用（export defaultは禁止）
3. **公開メソッド**: すべて実装必須、名前・引数・戻り値を厳守

## 推奨事項

- ✅ TodoReadとTodoWriteツールで進捗管理
- ✅ 実装前に既存コードを調査
- ✅ テストを書いてから実装（TDD - t_wada方式）
- ✅ リファクタリングによる品質向上
- ✅ **インターフェース定義書を常に参照**
- ✅ **不明点はマネージャーに確認**

## 品質チェックリスト

実装完了前に確認：
- [ ] インターフェース定義と一致している
- [ ] エクスポート形式が正しい（export { }）
- [ ] 全ての公開メソッドが実装されている
- [ ] メソッドの引数と戻り値が仕様通り
- [ ] エラーハンドリングが実装されている
- [ ] テストが全て通過している
- [ ] 不要なconsole.logが削除されている
- [ ] .uzi-task-completedファイルを作成した

## Git操作のベストプラクティス

- 小さな単位でコミット
- 意味のあるコミットメッセージ
- 機能ごとにコミットを分ける
- テストとその実装は同じコミットに含める