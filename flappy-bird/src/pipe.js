/**
 * Pipeクラス - Flappy Birdゲームのパイプオブジェクト
 * TDD（t_wada方式）による実装完了
 * export defaultは使用せず、export { Pipe }形式を厳守
 * 
 * @author Uziマネージャーエージェント
 * @version 1.0.0
 * @since 2025-06-29
 */

// 定数定義（インターフェース定義書より）
const PIPE_WIDTH = 80;      // パイプの幅（ピクセル）
const PIPE_SPEED = 2;       // パイプの移動速度（ピクセル/フレーム）
const CANVAS_HEIGHT = 600;  // キャンバス高さ（getBounds用）

/**
 * Pipeクラス - ゲーム内のパイプオブジェクト
 * Canvas 2D描画、当たり判定、移動処理を担当
 */
class Pipe {
  /**
   * コンストラクタ
   * @param {number} x - パイプのX座標（初期位置）
   * @param {number} gapY - 隙間の中心Y座標
   * @param {number} gapSize - 隙間のサイズ（高さ）
   */
  constructor(x, gapY, gapSize) {
    this.x = x;              // 現在のX座標
    this.gapY = gapY;        // 隙間の中心Y座標
    this.gapSize = gapSize;  // 隙間のサイズ
    this.passed = false;     // 通過済みフラグ
    
    // パフォーマンス最適化：getBounds()の結果をキャッシュ
    this._boundsCache = null;
    this._lastX = null;
  }

  /**
   * パイプを左方向に移動する
   * 毎フレーム呼び出される
   */
  update() {
    this.x -= PIPE_SPEED;
    
    // boundsキャッシュを無効化（位置が変更されたため）
    this._boundsCache = null;
  }

  /**
   * 当たり判定用の矩形配列を返す
   * パフォーマンス最適化：結果をキャッシュ
   * @returns {Array<{x: number, y: number, width: number, height: number}>} 上下パイプの矩形配列
   */
  getBounds() {
    // キャッシュがあり、位置が変わっていない場合はキャッシュを返す
    if (this._boundsCache && this._lastX === this.x) {
      return this._boundsCache;
    }
    
    const upperHeight = this.gapY - this.gapSize / 2;
    const lowerY = this.gapY + this.gapSize / 2;
    const lowerHeight = CANVAS_HEIGHT - lowerY;
    
    this._boundsCache = [
      {
        x: this.x,
        y: 0,
        width: PIPE_WIDTH,
        height: upperHeight
      },
      {
        x: this.x,
        y: lowerY,
        width: PIPE_WIDTH,
        height: lowerHeight
      }
    ];
    
    this._lastX = this.x;
    return this._boundsCache;
  }

  /**
   * パイプが画面外に出たかを判定する
   * @returns {boolean} 画面外なら true
   */
  isOffScreen() {
    return this.x + PIPE_WIDTH <= 0;
  }

  /**
   * 鳥がパイプを通過したかを判定する
   * 一度通過したら状態を保持する
   * @param {number} birdX - 鳥のX座標
   * @returns {boolean} 通過していれば true
   */
  isPassed(birdX) {
    if (!this.passed && birdX >= this.x + PIPE_WIDTH) {
      this.passed = true;
    }
    return this.passed;
  }

  /**
   * Canvas 2Dコンテキストにパイプを描画する
   * @param {CanvasRenderingContext2D|null} ctx - Canvas 2Dレンダリングコンテキスト
   */
  draw(ctx) {
    if (!ctx) return;
    
    const bounds = this.getBounds();
    
    // パイプの色を設定（緑色）
    ctx.fillStyle = '#4CAF50';
    
    // 上パイプを描画
    ctx.fillRect(bounds[0].x, bounds[0].y, bounds[0].width, bounds[0].height);
    
    // 下パイプを描画
    ctx.fillRect(bounds[1].x, bounds[1].y, bounds[1].width, bounds[1].height);
  }
}

// export defaultは使用しない - 5大ルール厳守
export { Pipe };