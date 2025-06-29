# main.js インターフェース定義書

## 概要
Flappy Birdゲームのメインエントリーポイントとゲームループを実装するモジュール

## ファイルパス
`flappy-bird/src/main.js`

## エクスポート形式（必須）
```javascript
export { startGame, gameLoop }
```

## 機能要件

### 1. Canvas取得とGameインスタンス作成
- HTMLCanvasElementの取得
- Gameクラスのインスタンス作成
- 初期化処理

### 2. キーボード/マウス入力ハンドリング
- スペースキー：ジャンプ
- Enterキー：ゲーム開始/リスタート
- マウスクリック：ジャンプ

### 3. 60FPSゲームループ
- `requestAnimationFrame`使用
- 一定フレームレート維持
- デルタタイム計算

### 4. UI更新
- スコア表示更新
- ゲーム状態表示（プレイ中、ゲームオーバー等）
- ハイスコア表示

### 5. ゲームリスタート機能
- ゲーム状態リセット
- スコア初期化
- UI更新

## インターフェース仕様

### startGame()
```javascript
/**
 * ゲーム開始関数
 * @returns {void}
 */
export function startGame() {
  // Canvas取得
  // Gameインスタンス作成
  // イベントリスナー登録
  // ゲームループ開始
}
```

### gameLoop()
```javascript
/**
 * ゲームループ関数
 * @param {number} timestamp - タイムスタンプ
 * @returns {void}
 */
export function gameLoop(timestamp) {
  // デルタタイム計算
  // ゲーム状態更新
  // 描画処理
  // UI更新
  // 次フレーム予約
}
```

## 依存関係
- `Game` クラス（`./Game.js`から`import { Game }`）

## 想定されるGameクラスインターフェース
```javascript
class Game {
  constructor(canvas, width, height)
  start()
  update(deltaTime)
  render()
  handleInput(event)
  reset()
  
  // プロパティ
  isRunning: boolean
  score: number
  gameState: string // 'menu', 'playing', 'gameover'
}
```

## TDD実装順序（t_wada方式）
1. テストファースト：統合テスト作成
2. 仮実装：最小限の動作実装
3. 三角測量：複数テストケース追加
4. 一般化：本格実装

## 品質要件
- エラーハンドリング必須
- パフォーマンス最適化
- メモリリーク防止
- クロスブラウザ対応

## テスト要件
- ユニットテスト：各関数の動作確認
- 統合テスト：ゲーム全体の動作確認
- E2Eテスト：実際のプレイシナリオ