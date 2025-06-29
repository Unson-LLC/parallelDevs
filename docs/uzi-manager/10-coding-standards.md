# 開発規約詳細

## インターフェース準拠

### エクスポート/インポート形式
- **エクスポート形式**: 必ず `export { ClassName }` を使用
- **インポート形式**: 必ず名前付きインポート `import { ClassName } from './module.js'` を使用
- **export default は絶対に使用しない**

### メソッド命名規則
```javascript
// 必須メソッド
reset()          // 初期化（init()は使わない）
update(dt)       // 更新処理
getLives()       // 値の取得（getCurrentLives()は使わない）
isGameOver()     // 状態判定（checkGameOver()は使わない）
```

## コーディング規約

- 言語に応じた一般的なコーディング規約に従う
- コメントは日本語で記述
- エラーハンドリングを適切に実装
- パフォーマンスを考慮した実装
- **マジックナンバーや設定値は定数・設定ファイルに切り出す**
- **仮実装以外でのハードコードは禁止**

## よくある間違いと正しい実装

### ❌ 悪い例
```javascript
// デフォルトエクスポート
export default class ScoreManager { }

// 冗長なメソッド名
getCurrentScore() { }

// initメソッド
init() { }
```

### ✅ 良い例
```javascript
// 名前付きエクスポート
export { ScoreManager };

// 簡潔なメソッド名
getScore() { }

// resetメソッド
reset() { }
```

## 命名規則の統一
```javascript
// 良い例
export { ClassName };
class ClassName {
    reset() { }      // 初期化は reset
    update(dt) { }   // 更新は update
    getLives() { }   // getter は get + 名詞
}

// 悪い例
export default ClassName;  // default は使わない
init() { }                // reset を使う
getCurrentLives() { }     // 冗長な名前を避ける
```

## 依存関係の明示
```javascript
// 各ファイルの先頭で依存関係を明示
/**
 * @module ModuleName
 * @requires {ClassName} from './path/to/module.js'
 */
```

## Git操作

- 適切なコミットメッセージを使用
- 小さな単位でコミット
- 作業完了時は明確に報告