# Pipeクラス インターフェース定義書

## 基本情報
- **ファイルパス**: `flappy-bird/src/pipe.js`
- **エクスポート形式**: `export { Pipe }`
- **役割**: Flappy Birdゲームのパイプオブジェクト

## パラメータ定数
```javascript
const PIPE_WIDTH = 80;      // パイプの幅
const PIPE_SPEED = 2;       // パイプの移動速度
const CANVAS_WIDTH = 800;   // キャンバス幅（画面外判定用）
```

## コンストラクタ
```javascript
constructor(x, gapY, gapSize)
```
- **x**: パイプのX座標（初期位置）
- **gapY**: 隙間の中心Y座標
- **gapSize**: 隙間のサイズ（高さ）

## 公開メソッド

### update()
```javascript
update()
```
- パイプを左方向に移動する
- 戻り値: なし

### draw(ctx)
```javascript
draw(ctx)
```
- Canvas 2Dコンテキストにパイプを描画する
- **ctx**: Canvas 2Dレンダリングコンテキスト
- 戻り値: なし

### getBounds()
```javascript
getBounds()
```
- 当たり判定用の矩形配列を返す
- 戻り値: `Array<{x, y, width, height}>` - 上下のパイプの矩形

### isOffScreen()
```javascript
isOffScreen()
```
- パイプが画面外に出たかを判定する
- 戻り値: `boolean` - 画面外なら`true`

### isPassed(birdX)
```javascript
isPassed(birdX)
```
- 鳥がパイプを通過したかを判定する
- **birdX**: 鳥のX座標
- 戻り値: `boolean` - 通過していれば`true`

## プライベートプロパティ
- `x`: 現在のX座標
- `gapY`: 隙間の中心Y座標
- `gapSize`: 隙間のサイズ
- `passed`: 通過済みフラグ

## テスト要件（TDD）
1. コンストラクタでプロパティが正しく初期化される
2. `update()`でX座標が正しく減少する
3. `getBounds()`が正しい矩形配列を返す
4. `isOffScreen()`が正しく画面外を判定する
5. `isPassed()`が正しく通過を判定する
6. `draw()`が正しくCanvasに描画する

## 実装順序（TDD方式）
1. テストファースト: 各メソッドのテスト作成
2. 仮実装: 最小限の実装でテスト通過
3. 三角測量: 複数のテストケースで検証
4. 一般化: 最終的な実装に仕上げ