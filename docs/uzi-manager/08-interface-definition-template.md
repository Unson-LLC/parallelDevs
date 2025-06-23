# インターフェース定義テンプレート

## 概要

並列開発を開始する前に、全モジュールのインターフェースを定義することで、エージェント間の実装の不整合を防ぎます。

## インターフェース定義書テンプレート

```markdown
# [プロジェクト名] インターフェース定義書

## モジュール構成

### 1. GameState（ゲーム状態管理）
- **ファイルパス**: `src/js/gameState.js`
- **エクスポート形式**: `export { GameState }`
- **責務**: ゲーム全体の状態管理、画面遷移制御

#### 公開メソッド
```javascript
class GameState {
    // 必須メソッド
    reset(): void                        // 状態を初期化
    changeState(state: string): void     // 状態を変更
    getCurrentState(): string            // 現在の状態を取得
    
    // タイマー関連
    resetTimer(): void                   // タイマーをリセット
    updateTimer(deltaTime: number): void // タイマーを更新
    
    // 状態定数
    states: {
        loading: 'loading',
        title: 'title',
        playing: 'playing',
        paused: 'paused',
        gameOver: 'gameOver',
        stageClear: 'stageClear',
        gameClear: 'gameClear'
    }
}
```

### 2. ScoreManager（スコア管理）
- **ファイルパス**: `src/js/scoreManager.js`
- **エクスポート形式**: `export { ScoreManager }`
- **責務**: スコア計算、ハイスコア管理

#### 公開メソッド
```javascript
class ScoreManager {
    // 必須メソッド
    reset(): void                    // スコアをリセット
    addScore(score: number): number  // スコアを加算
    getCurrentScore(): number        // 現在のスコアを取得
    getHighScore(): number          // ハイスコアを取得
    saveHighScore(): void           // ハイスコアを保存
    
    // ブロック関連
    addBlockScore(type: string, hitCount: number): number
}
```

### 3. LifeManager（ライフ管理）
- **ファイルパス**: `src/js/lifeManager.js`
- **エクスポート形式**: `export { LifeManager }`
- **責務**: プレイヤーのライフ管理

#### 公開メソッド
```javascript
class LifeManager {
    constructor(difficulty: string)
    
    // 必須メソッド
    reset(): void           // ライフをリセット
    getLives(): number      // 現在のライフ数を取得
    getMaxLives(): number   // 最大ライフ数を取得
    loseLife(): boolean     // ライフを減らす（ゲームオーバーならtrue）
    addLife(): boolean      // ライフを増やす
    isGameOver(): boolean   // ゲームオーバー判定
}
```

## 依存関係マトリクス

| モジュール | 依存する | 依存される |
|-----------|---------|-----------|
| GameState | なし | UIManager, Main |
| ScoreManager | StorageManager | Main, UIManager |
| LifeManager | なし | Main, UIManager |
| UIManager | GameState, ScoreManager, LifeManager | Main |
| CollisionDetector | なし | Main |
| Ball | Physics | Main, CollisionDetector |
| Paddle | なし | Main, CollisionDetector |
| Block | なし | Main, CollisionDetector |

## エクスポート/インポート規則

### エクスポート（統一形式）
```javascript
// ✅ 良い例：名前付きエクスポート
export { ClassName };

// ❌ 悪い例：デフォルトエクスポート
export default ClassName;
```

### インポート
```javascript
// ✅ 良い例：名前付きインポート
import { GameState } from './gameState.js';
import { ScoreManager } from './scoreManager.js';

// ❌ 悪い例：デフォルトインポート
import GameState from './gameState.js';
```

## メソッド命名規則

### 基本ルール
1. **初期化**: `reset()` を使用（`init()` は使わない）
2. **更新**: `update(deltaTime)` を使用
3. **取得**: `get` + 名詞（例：`getLives()`）
4. **設定**: `set` + 名詞（例：`setDifficulty()`）
5. **判定**: `is` + 形容詞/状態（例：`isGameOver()`）
6. **アクション**: 動詞 + 名詞（例：`addScore()`）

### 一貫性の例
```javascript
// ✅ 良い例：一貫性のある命名
getLives()      // 現在の値を取得
getMaxLives()   // 最大値を取得
isGameOver()    // 状態を判定

// ❌ 悪い例：冗長または不一貫
getCurrentLives()     // getCurrentは冗長
getLifeCount()        // Livesに統一すべき
checkGameOver()       // isを使うべき
```

## 実装時の注意事項

### 1. エラーハンドリング
```javascript
changeState(newState) {
    // 無効な状態をチェック
    if (!Object.values(this.states).includes(newState)) {
        console.error('無効な状態:', newState);
        return;
    }
    // 実装...
}
```

### 2. 型安全性（JSDoc使用）
```javascript
/**
 * スコアを加算
 * @param {number} score - 加算するスコア
 * @returns {number} 更新後のスコア
 */
addScore(score) {
    if (typeof score !== 'number' || score < 0) {
        console.error('無効なスコア:', score);
        return this.currentScore;
    }
    // 実装...
}
```

### 3. イベント通知パターン
```javascript
class ScoreManager {
    constructor() {
        this.listeners = {
            scoreUpdate: [],
            highScoreUpdate: []
        };
    }
    
    notifyListeners(event, data) {
        this.listeners[event]?.forEach(fn => fn(data));
    }
}
```

## 統合テストの例

```javascript
// tests/integration/game-modules.test.js
import { GameState } from '../src/js/gameState.js';
import { ScoreManager } from '../src/js/scoreManager.js';
import { LifeManager } from '../src/js/lifeManager.js';

describe('ゲームモジュール統合テスト', () => {
    test('全モジュールが正しくインポートできる', () => {
        expect(GameState).toBeDefined();
        expect(ScoreManager).toBeDefined();
        expect(LifeManager).toBeDefined();
    });
    
    test('必須メソッドが存在する', () => {
        const gameState = new GameState();
        const scoreManager = new ScoreManager();
        const lifeManager = new LifeManager('normal');
        
        // GameState
        expect(gameState.reset).toBeDefined();
        expect(gameState.changeState).toBeDefined();
        expect(gameState.getCurrentState).toBeDefined();
        
        // ScoreManager
        expect(scoreManager.reset).toBeDefined();
        expect(scoreManager.addScore).toBeDefined();
        expect(scoreManager.getCurrentScore).toBeDefined();
        
        // LifeManager
        expect(lifeManager.reset).toBeDefined();
        expect(lifeManager.getLives).toBeDefined();
        expect(lifeManager.isGameOver).toBeDefined();
    });
});
```

## チェックリスト

インターフェース定義完了前に確認：

- [ ] 全モジュールの公開メソッドが定義されている
- [ ] エクスポート形式が統一されている（`export { }`）
- [ ] メソッド命名規則が一貫している
- [ ] 依存関係が明確になっている
- [ ] 必須メソッド（`reset()`など）が含まれている
- [ ] パラメータと戻り値の型が明記されている
- [ ] エラーハンドリングの方針が決まっている