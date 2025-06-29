# ブロック崩しゲーム インターフェース定義書

## モジュール構成

### 1. エンティティ層
- Ball（ボール）
- Paddle（パドル）
- Block（ブロック）

### 2. マネージャー層
- GameManager（ゲーム全体管理）
- ScoreManager（スコア管理）
- LivesManager（ライフ管理）

### 3. システム層
- CollisionDetector（衝突判定）
- InputHandler（入力制御）
- Renderer（描画）

### 4. UI層
- UIManager（UI全体管理）
- StartScreen（スタート画面）
- GameOverScreen（ゲームオーバー画面）

## インターフェース定義

### エンティティ層

#### Ball
- ファイルパス: `src/entities/Ball.js`
- エクスポート形式: `export { Ball }`
- 公開メソッド:
  - `constructor(x, y, radius, speedX, speedY)` - ボールの初期化
  - `update()` - 位置更新
  - `reverseX()` - X方向の速度反転
  - `reverseY()` - Y方向の速度反転
  - `reset()` - 初期位置に戻す
  - `getPosition()` - {x, y}を返す
  - `getRadius()` - 半径を返す
  - `getVelocity()` - {x, y}速度を返す

#### Paddle
- ファイルパス: `src/entities/Paddle.js`
- エクスポート形式: `export { Paddle }`
- 公開メソッド:
  - `constructor(x, y, width, height, speed)` - パドルの初期化
  - `moveLeft()` - 左に移動
  - `moveRight()` - 右に移動
  - `update(canvasWidth)` - 位置更新（境界チェック含む）
  - `reset()` - 初期位置に戻す
  - `getPosition()` - {x, y}を返す
  - `getDimensions()` - {width, height}を返す

#### Block
- ファイルパス: `src/entities/Block.js`
- エクスポート形式: `export { Block }`
- 公開メソッド:
  - `constructor(x, y, width, height, color, points)` - ブロックの初期化
  - `hit()` - ブロックがヒットされた
  - `isDestroyed()` - 破壊されたかどうか
  - `getPosition()` - {x, y}を返す
  - `getDimensions()` - {width, height}を返す
  - `getPoints()` - ポイント値を返す
  - `getColor()` - 色を返す

### マネージャー層

#### GameManager
- ファイルパス: `src/managers/GameManager.js`
- エクスポート形式: `export { GameManager }`
- 公開メソッド:
  - `constructor()` - ゲームマネージャーの初期化
  - `init()` - ゲーム初期化
  - `start()` - ゲーム開始
  - `pause()` - 一時停止
  - `resume()` - 再開
  - `reset()` - リセット
  - `update()` - ゲーム状態更新
  - `isGameOver()` - ゲームオーバー判定
  - `isLevelComplete()` - レベルクリア判定
  - `getState()` - 現在の状態を返す
- 依存関係:
  - Ball, Paddle, Block
  - ScoreManager, LivesManager
  - CollisionDetector

#### ScoreManager
- ファイルパス: `src/managers/ScoreManager.js`
- エクスポート形式: `export { ScoreManager }`
- 公開メソッド:
  - `reset()` - スコアをリセット
  - `addScore(points)` - スコアを加算
  - `getScore()` - 現在のスコアを取得
  - `getHighScore()` - ハイスコアを取得

#### LivesManager
- ファイルパス: `src/managers/LivesManager.js`
- エクスポート形式: `export { LivesManager }`
- 公開メソッド:
  - `constructor(initialLives)` - 初期ライフ数で初期化
  - `reset()` - ライフをリセット
  - `loseLife()` - ライフを1つ減らす
  - `getLives()` - 残りライフ数を取得
  - `isGameOver()` - ライフが0かどうか

### システム層

#### CollisionDetector
- ファイルパス: `src/systems/CollisionDetector.js`
- エクスポート形式: `export { CollisionDetector }`
- 公開メソッド:
  - `checkBallWallCollision(ball, canvasWidth, canvasHeight)` - 壁との衝突判定
  - `checkBallPaddleCollision(ball, paddle)` - パドルとの衝突判定
  - `checkBallBlockCollision(ball, block)` - ブロックとの衝突判定
  - `checkBallBottomCollision(ball, canvasHeight)` - 底面との衝突判定

#### InputHandler
- ファイルパス: `src/systems/InputHandler.js`
- エクスポート形式: `export { InputHandler }`
- 公開メソッド:
  - `constructor()` - 入力ハンドラーの初期化
  - `init()` - イベントリスナーの設定
  - `isLeftPressed()` - 左キーが押されているか
  - `isRightPressed()` - 右キーが押されているか
  - `isSpacePressed()` - スペースキーが押されたか
  - `isResetPressed()` - Rキーが押されたか
  - `reset()` - 入力状態をリセット

#### Renderer
- ファイルパス: `src/systems/Renderer.js`
- エクスポート形式: `export { Renderer }`
- 公開メソッド:
  - `constructor(canvas)` - キャンバスで初期化
  - `clear()` - 画面クリア
  - `drawBall(ball)` - ボール描画
  - `drawPaddle(paddle)` - パドル描画
  - `drawBlock(block)` - ブロック描画
  - `drawScore(score)` - スコア描画
  - `drawLives(lives)` - ライフ描画

### UI層

#### UIManager
- ファイルパス: `src/ui/UIManager.js`
- エクスポート形式: `export { UIManager }`
- 公開メソッド:
  - `constructor()` - UI管理の初期化
  - `showStartScreen()` - スタート画面表示
  - `hideStartScreen()` - スタート画面非表示
  - `showGameOverScreen(score)` - ゲームオーバー画面表示
  - `hideGameOverScreen()` - ゲームオーバー画面非表示
  - `showLevelCompleteScreen()` - レベルクリア画面表示
  - `hideLevelCompleteScreen()` - レベルクリア画面非表示
  - `updateScore(score)` - スコア表示更新
  - `updateLives(lives)` - ライフ表示更新

## 並列化可能なモジュール

以下のモジュールは依存関係がないため、並列実装可能：

### グループ1（エンティティ）
- Ball
- Paddle
- Block

### グループ2（独立マネージャー）
- ScoreManager
- LivesManager

### グループ3（システム）
- CollisionDetector
- InputHandler
- Renderer

### グループ4（UI）
- StartScreen
- GameOverScreen

## 実装順序

1. **フェーズ1**: インターフェース定義（完了）
2. **フェーズ2**: 統合テスト作成
3. **フェーズ3**: 並列実装
   - グループ1〜4を同時に実装
4. **フェーズ4**: GameManagerとUIManagerの実装
5. **フェーズ5**: 統合とテスト