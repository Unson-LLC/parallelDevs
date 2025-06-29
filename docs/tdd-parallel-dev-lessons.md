# TDD並列開発での重大バグ再発防止策

## 🚨 今回発生した問題

### 1. Bird座標初期化バグ
- **問題**: `this.y = y || 300` → `new Bird(50, 200)`で200を渡しても300になる
- **影響**: 即座に地面衝突で`alive = false`、スペースキー無効化

### 2. 描画処理の複雑性バグ
- **問題**: 複雑な回転・翻訳処理が実際のブラウザで動作しない
- **影響**: Birdが画面に表示されない

### 3. 統合テストの不備
- **問題**: モック依存で実際の描画・物理演算が未検証
- **影響**: 各モジュール単体では動作するが統合時に破綻

## 📋 再発防止策（改定CLAUDE.md）

### 1. **E2Eファースト TDD** (新ルール)

**従来**: テストファースト → 仮実装 → 三角測量 → 一般化
**改善**: **E2Eファースト** → テストファースト → 仮実装 → 三角測量 → 一般化

```markdown
## E2EファーストTDD手順
1. **E2E動作確認テスト作成** (ブラウザ実機)
2. **統合テスト作成** (モジュール間連携)
3. **ユニットテスト作成** (個別機能)
4. **仮実装** (最低限動作)
5. **ブラウザ動作確認** (各段階で必須)
6. **三角測量・一般化**
```

### 2. **インターフェース契約書の厳格化**

```markdown
## インターフェース契約書テンプレート

### Bird クラス
- **ファイル**: `src/bird.js`
- **エクスポート**: `export { Bird }`

#### コンストラクタ契約
```javascript
/**
 * @param {number} x - X座標（デフォルト値なし、必須）
 * @param {number} y - Y座標（デフォルト値なし、必須）
 * @throws {Error} x,yがnumber以外の場合
 */
constructor(x, y) {
  if (typeof x !== 'number' || typeof y !== 'number') {
    throw new Error('x, y must be numbers');
  }
  this.x = x; // デフォルト値使用禁止
  this.y = y; // デフォルト値使用禁止
}
```

#### 動作保証契約
- `new Bird(50, 200)` → `bird.x === 50 && bird.y === 200` を保証
- `bird.jump()` → `bird.velocity < 0` を保証
- `bird.update()` → 物理法則に従った位置更新を保証
```

### 3. **座標系統一規約**

```markdown
## 座標系統一規約
- **Canvas座標**: 左上原点、右下方向が正
- **Y軸方向**: 下向きが正（ブラウザ標準）
- **初期位置**: Bird(50, 200) → 画面左から50px、上から200px
- **境界値**: canvasHeight - bird.height が地面
- **デフォルト値禁止**: 全てのコンストラクタで明示的な値要求
```

### 4. **段階的統合検証プロセス**

```markdown
## 必須検証ステップ
1. **各クラス単体テスト** → パス必須
2. **ペア統合テスト** (Bird-Game, Game-Pipe等) → パス必須
3. **トリプル統合テスト** → パス必須
4. **フル統合テスト** → パス必須
5. **ブラウザE2Eテスト** → パス必須

各ステップで失敗した場合、前のステップに戻る
```

### 5. **デバッグファースト開発**

```markdown
## デバッグファースト原則
- **全メソッドにログ出力**: console.log必須
- **状態変化の記録**: before/after値を記録
- **エラー境界の明示**: 異常値の検出とログ
- **ブラウザ確認**: 各実装後にブラウザで目視確認

### 標準ログフォーマット
```javascript
// コンストラクタ
console.log(`${ClassName} created:`, {x: this.x, y: this.y, ...otherProps});

// メソッド実行
console.log(`${ClassName}.${methodName} called:`, {before: oldValue, after: newValue});

// 状態変化
console.log(`${ClassName} state change:`, {property: 'alive', from: true, to: false, reason: 'ground collision'});
```

### 6. **並列開発時の結合責任分離**

```markdown
## エージェント責任分担
- **各エージェント**: 単体実装 + 単体テスト
- **マネージャー**: 統合テスト + E2Eテスト + ブラウザ確認

## マネージャーの必須作業
1. 各エージェントの実装完了後、即座にcheckpoint
2. checkpoint後、統合テスト実行
3. 統合テスト通過後、ブラウザ確認
4. 問題発見時、該当エージェントに修正指示（具体的エラー内容と修正方法を明示）
```

### 7. **型安全性の強化**

```markdown
## TypeScript風の型チェック（JSDoc）
```javascript
/**
 * @typedef {Object} Position
 * @property {number} x - X座標
 * @property {number} y - Y座標
 */

/**
 * @typedef {Object} BirdState
 * @property {Position} position
 * @property {number} velocity
 * @property {boolean} alive
 */

class Bird {
  /**
   * @param {number} x 
   * @param {number} y 
   */
  constructor(x, y) {
    // 型チェック
    if (typeof x !== 'number' || typeof y !== 'number') {
      throw new TypeError('x and y must be numbers');
    }
    
    this.x = x;
    this.y = y;
  }
}
```

### 8. **CI/CD パイプライン（uzi monitor拡張）**

```markdown
## 自動品質チェック
```bash
# uzi monitor拡張で自動実行
./uzi monitor --auto-config quality-check.json

# quality-check.json
{
  "rules": [
    {
      "trigger": "agent_merged",
      "action": {
        "type": "test_pipeline",
        "steps": [
          "npm test",
          "npm run lint", 
          "npm run browser-test",
          "npm run integration-test"
        ]
      }
    }
  ]
}
```

## 🎯 実装優先順位（今後）

1. **E2Eテスト環境構築** (Playwright/Puppeteer)
2. **型チェック強化** (TypeScript化 or JSDoc強化)
3. **デバッグログ標準化** (ログライブラリ導入)
4. **統合テスト自動化** (uzi monitor拡張)
5. **座標系テストライブラリ** (Canvas座標系専用テスト)

## 📝 今回の教訓

> **「TDDは銀の弾丸ではない。E2Eファーストが真の安全網」**

- モックは便利だが、実環境との乖離を生む
- 並列開発では統合段階でのバグが最もコストが高い
- デバッグファーストは開発速度を落とすが、品質を飛躍的に向上させる

---

**次回プロジェクトでは、このルールを厳格に適用し、同様のバグの再発を防ぐ**