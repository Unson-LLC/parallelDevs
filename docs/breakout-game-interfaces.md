# ブロック崩しゲーム - インターフェース定義書

## 概要
このドキュメントは、ブロック崩しWebアプリケーションの各モジュールのインターフェース定義を記載しています。
すべてのモジュールは名前付きエクスポート（`export { ClassName }`）を使用し、`export default`は使用しません。

## エンティティ層

### モジュール: Ball
- ファイルパス: `src/entities/Ball.js`
- エクスポート形式: `export { Ball }`
- 公開メソッド:
  - `constructor(x, y, radius, speedX, speedY)` - ボールの初期化
  - `reset()` - 初期位置に戻す
  - `update(dt)` - 位置更新（dt: デルタタイム）
  - `reverseX()` - X方向の速度反転
  - `reverseY()` - Y方向の速度反転
  - `getPosition()` - {x: number, y: number}を返す
  - `getRadius()` - 半径を返す
  - `getVelocity()` - {x: number, y: number}速度を返す

### モジュール: Paddle
- ファイルパス: `src/entities/Paddle.js`
- エクスポート形式: `export { Paddle }`
- 公開メソッド:
  - `constructor(x, y, width, height)` - パドルの初期化
  - `reset()` - 初期位置に戻す
  - `update(dt)` - 位置更新（dt: デルタタイム）
  - `moveLeft()` - 左に移動開始
  - `moveRight()` - 右に移動開始
  - `stop()` - 移動停止
  - `getPosition()` - {x: number, y: number}を返す
  - `getDimensions()` - {width: number, height: number}を返す

### モジュール: Block
- ファイルパス: `src/entities/Block.js`
- エクスポート形式: `export { Block }`
- 公開メソッド:
  - `constructor(x, y, width, height, points)` - ブロックの初期化
  - `hit()` - ヒット処理
  - `isDestroyed()` - 破壊されたか判定（boolean）
  - `getPosition()` - {x: number, y: number}を返す
  - `getDimensions()` - {width: number, height: number}を返す
  - `getPoints()` - ポイント数を返す（number）

## コア層

### モジュール: GameEngine
- ファイルパス: `src/core/GameEngine.js`
- エクスポート形式: `export { GameEngine }`
- 依存関係: Ball, Paddle, Block, CollisionDetector, ScoreManager, LivesManager
- 公開メソッド:
  - `constructor(width, height)` - ゲームエンジンの初期化
  - `reset()` - ゲームリセット
  - `update(dt)` - ゲーム状態更新（dt: デルタタイム）
  - `start()` - ゲーム開始
  - `pause()` - 一時停止
  - `resume()` - 再開
  - `isGameOver()` - ゲームオーバー判定（boolean）
  - `isLevelClear()` - レベルクリア判定（boolean）
  - `getEntities()` - 全エンティティ取得 {ball, paddle, blocks[]}

### モジュール: CollisionDetector
- ファイルパス: `src/core/CollisionDetector.js`
- エクスポート形式: `export { CollisionDetector }`
- 公開メソッド:
  - `checkBallPaddleCollision(ball, paddle)` - ボールとパドルの衝突判定（boolean）
  - `checkBallBlockCollision(ball, block)` - ボールとブロックの衝突判定（boolean）
  - `checkBallWallCollision(ball, width, height)` - ボールと壁の衝突判定 {hitLeft, hitRight, hitTop, hitBottom}

## 管理層

### モジュール: ScoreManager
- ファイルパス: `src/managers/ScoreManager.js`
- エクスポート形式: `export { ScoreManager }`
- 公開メソッド:
  - `reset()` - スコアリセット
  - `addScore(points)` - スコア加算（points: number）
  - `getScore()` - 現在のスコア取得（number）
  - `getHighScore()` - ハイスコア取得（number）
  - `saveHighScore()` - ハイスコア保存

### モジュール: LivesManager
- ファイルパス: `src/managers/LivesManager.js`
- エクスポート形式: `export { LivesManager }`
- 公開メソッド:
  - `constructor(initialLives)` - 初期ライフ数設定（initialLives: number）
  - `reset()` - ライフリセット
  - `loseLife()` - ライフ減少
  - `getLives()` - 残ライフ数取得（number）
  - `isGameOver()` - ゲームオーバー判定（boolean）

## UI層

### モジュール: Renderer
- ファイルパス: `src/ui/Renderer.js`
- エクスポート形式: `export { Renderer }`
- 公開メソッド:
  - `constructor(canvas)` - キャンバス設定（canvas: HTMLCanvasElement）
  - `clear()` - 画面クリア
  - `drawBall(ball)` - ボール描画
  - `drawPaddle(paddle)` - パドル描画
  - `drawBlock(block)` - ブロック描画
  - `drawScore(score)` - スコア描画（score: number）
  - `drawLives(lives)` - ライフ描画（lives: number）
  - `drawGameOver()` - ゲームオーバー画面描画

### モジュール: InputHandler
- ファイルパス: `src/ui/InputHandler.js`
- エクスポート形式: `export { InputHandler }`
- 公開メソッド:
  - `constructor()` - 入力ハンドラ初期化
  - `onLeftPressed(callback)` - 左キー押下時のコールバック登録
  - `onRightPressed(callback)` - 右キー押下時のコールバック登録
  - `onKeyReleased(callback)` - キー解放時のコールバック登録
  - `onSpacePressed(callback)` - スペースキー押下時のコールバック登録
  - `destroy()` - イベントリスナー解除

## 実装の優先順位

### Phase 1: エンティティ層（並列実装可能）
- Ball
- Paddle
- Block

### Phase 2: コア機能
- CollisionDetector
- ScoreManager
- LivesManager

### Phase 3: ゲームエンジンとUI（並列実装可能）
- GameEngine
- Renderer
- InputHandler

### Phase 4: 統合とテスト
- 全モジュールの統合
- ゲームプレイテスト
- パフォーマンス最適化