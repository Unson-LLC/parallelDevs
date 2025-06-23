/**
 * 2Dベクトル演算のユーティリティクラス
 */
class Vector2D {
  /**
   * Vector2Dのコンストラクタ
   * @param {number} x - X座標
   * @param {number} y - Y座標
   */
  constructor(x, y) {
    this._x = Number(x) || 0;
    this._y = Number(y) || 0;
  }

  /**
   * ベクトルを加算
   * @param {Vector2D} vector - 加算するベクトル
   * @returns {Vector2D} 加算結果の新しいベクトル
   */
  add(vector) {
    if (!(vector instanceof Vector2D)) {
      throw new Error('引数はVector2Dインスタンスである必要があります');
    }
    return new Vector2D(this._x + vector._x, this._y + vector._y);
  }

  /**
   * ベクトルを減算
   * @param {Vector2D} vector - 減算するベクトル
   * @returns {Vector2D} 減算結果の新しいベクトル
   */
  subtract(vector) {
    if (!(vector instanceof Vector2D)) {
      throw new Error('引数はVector2Dインスタンスである必要があります');
    }
    return new Vector2D(this._x - vector._x, this._y - vector._y);
  }

  /**
   * スカラー倍
   * @param {number} scalar - 倍率
   * @returns {Vector2D} スカラー倍結果の新しいベクトル
   */
  multiply(scalar) {
    const s = Number(scalar);
    if (isNaN(s)) {
      throw new Error('引数は数値である必要があります');
    }
    return new Vector2D(this._x * s, this._y * s);
  }

  /**
   * 正規化
   * @returns {Vector2D} 正規化された新しいベクトル
   */
  normalize() {
    const mag = this.magnitude();
    
    // 零ベクトルの場合は零ベクトルを返す
    if (mag === 0) {
      return new Vector2D(0, 0);
    }
    
    return new Vector2D(this._x / mag, this._y / mag);
  }

  /**
   * 大きさを取得
   * @returns {number} ベクトルの大きさ
   */
  magnitude() {
    return Math.sqrt(this._x * this._x + this._y * this._y);
  }

  /**
   * 内積を計算
   * @param {Vector2D} vector - 内積を計算する相手のベクトル
   * @returns {number} 内積の値
   */
  dot(vector) {
    if (!(vector instanceof Vector2D)) {
      throw new Error('引数はVector2Dインスタンスである必要があります');
    }
    return this._x * vector._x + this._y * vector._y;
  }

  /**
   * X成分を取得
   * @returns {number} X座標
   */
  getX() {
    return this._x;
  }

  /**
   * Y成分を取得
   * @returns {number} Y座標
   */
  getY() {
    return this._y;
  }

  /**
   * X成分を設定
   * @param {number} x - 新しいX座標
   */
  setX(x) {
    this._x = Number(x) || 0;
  }

  /**
   * Y成分を設定
   * @param {number} y - 新しいY座標
   */
  setY(y) {
    this._y = Number(y) || 0;
  }
}

// 名前付きエクスポート
export { Vector2D };