/**
 * 2Dベクトル演算の高性能ユーティリティクラス
 * ゲーム開発に最適化された実装
 * 
 * @class Vector2D
 * @version 2.0.0
 * @author ブロック崩しゲーム開発チーム
 */
class Vector2D {
  /**
   * Vector2Dコンストラクタ
   * 数値の型安全性とパフォーマンスを考慮した初期化
   * 
   * @param {number} x - X座標（デフォルト: 0）
   * @param {number} y - Y座標（デフォルト: 0）
   * @throws {TypeError} 引数が数値でない場合
   */
  constructor(x = 0, y = 0) {
    // 高速な型チェックと数値変換
    this._x = this._validateNumber(x, 'x');
    this._y = this._validateNumber(y, 'y');
    
    // 計算済み値をキャッシュするためのフラグ
    this._magnitudeCache = null;
    this._magnitudeCacheDirty = true;
  }

  /**
   * 数値バリデーションヘルパー（パフォーマンス最適化）
   * @private
   * @param {*} value - 検証する値
   * @param {string} paramName - パラメータ名（エラーメッセージ用）
   * @returns {number} 有効な数値
   * @throws {TypeError} 無効な数値の場合
   */
  _validateNumber(value, paramName) {
    if (typeof value === 'number') {
      return isNaN(value) ? 0 : value;
    }
    
    const num = Number(value);
    if (isNaN(num)) {
      throw new TypeError(`${paramName}は有効な数値である必要があります。受け取った値: ${value}`);
    }
    return num;
  }

  /**
   * Vector2Dインスタンスの型チェック（高速化）
   * @private
   * @param {*} vector - チェックするオブジェクト
   * @param {string} methodName - メソッド名（エラーメッセージ用）
   * @throws {TypeError} Vector2Dでない場合
   */
  _validateVector(vector, methodName) {
    if (!(vector instanceof Vector2D)) {
      throw new TypeError(`${methodName}の引数はVector2Dインスタンスである必要があります。受け取った型: ${typeof vector}`);
    }
  }

  /**
   * キャッシュを無効化
   * @private
   */
  _invalidateCache() {
    this._magnitudeCacheDirty = true;
  }

  /**
   * ベクトル加算（イミュータブル）
   * パフォーマンス最適化済み
   * 
   * @param {Vector2D} vector - 加算するベクトル
   * @returns {Vector2D} 加算結果の新しいベクトル
   * @throws {TypeError} 引数がVector2Dでない場合
   */
  add(vector) {
    this._validateVector(vector, 'add');
    return new Vector2D(this._x + vector._x, this._y + vector._y);
  }

  /**
   * ベクトル減算（イミュータブル）
   * パフォーマンス最適化済み
   * 
   * @param {Vector2D} vector - 減算するベクトル
   * @returns {Vector2D} 減算結果の新しいベクトル
   * @throws {TypeError} 引数がVector2Dでない場合
   */
  subtract(vector) {
    this._validateVector(vector, 'subtract');
    return new Vector2D(this._x - vector._x, this._y - vector._y);
  }

  /**
   * スカラー倍（イミュータブル）
   * 数値バリデーション強化
   * 
   * @param {number} scalar - 倍率
   * @returns {Vector2D} スカラー倍結果の新しいベクトル
   * @throws {TypeError} 引数が数値でない場合
   */
  multiply(scalar) {
    const s = this._validateNumber(scalar, 'scalar');
    return new Vector2D(this._x * s, this._y * s);
  }

  /**
   * ベクトル正規化（イミュータブル）
   * 零ベクトルの安全な処理とキャッシュ利用
   * 
   * @returns {Vector2D} 正規化された新しいベクトル
   */
  normalize() {
    const mag = this.magnitude();
    
    // 零ベクトルまたは極小ベクトルの安全な処理
    if (mag < Number.EPSILON) {
      return new Vector2D(0, 0);
    }
    
    const invMag = 1 / mag; // 除算を乗算で置き換えて高速化
    return new Vector2D(this._x * invMag, this._y * invMag);
  }

  /**
   * ベクトルの大きさ（長さ）を取得
   * 計算結果をキャッシュしてパフォーマンス向上
   * 
   * @returns {number} ベクトルの大きさ
   */
  magnitude() {
    if (this._magnitudeCacheDirty) {
      this._magnitudeCache = Math.sqrt(this._x * this._x + this._y * this._y);
      this._magnitudeCacheDirty = false;
    }
    return this._magnitudeCache;
  }

  /**
   * ベクトルの大きさの2乗を取得
   * 平方根計算を避けてパフォーマンス向上（距離比較等に有用）
   * 
   * @returns {number} ベクトルの大きさの2乗
   */
  magnitudeSquared() {
    return this._x * this._x + this._y * this._y;
  }

  /**
   * 内積計算
   * 
   * @param {Vector2D} vector - 内積を計算する相手のベクトル
   * @returns {number} 内積の値
   * @throws {TypeError} 引数がVector2Dでない場合
   */
  dot(vector) {
    this._validateVector(vector, 'dot');
    return this._x * vector._x + this._y * vector._y;
  }

  /**
   * 2つのベクトル間の距離を計算
   * 
   * @param {Vector2D} vector - 距離を計算する相手のベクトル
   * @returns {number} 2つのベクトル間の距離
   * @throws {TypeError} 引数がVector2Dでない場合
   */
  distanceTo(vector) {
    this._validateVector(vector, 'distanceTo');
    const dx = this._x - vector._x;
    const dy = this._y - vector._y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 2つのベクトル間の距離の2乗を計算
   * 平方根計算を避けてパフォーマンス向上
   * 
   * @param {Vector2D} vector - 距離を計算する相手のベクトル
   * @returns {number} 2つのベクトル間の距離の2乗
   * @throws {TypeError} 引数がVector2Dでない場合
   */
  distanceSquaredTo(vector) {
    this._validateVector(vector, 'distanceSquaredTo');
    const dx = this._x - vector._x;
    const dy = this._y - vector._y;
    return dx * dx + dy * dy;
  }

  /**
   * X成分を取得
   * 
   * @returns {number} X座標
   */
  getX() {
    return this._x;
  }

  /**
   * Y成分を取得
   * 
   * @returns {number} Y座標
   */
  getY() {
    return this._y;
  }

  /**
   * X成分を設定
   * キャッシュ無効化を含む安全な設定
   * 
   * @param {number} x - 新しいX座標
   * @throws {TypeError} 引数が数値でない場合
   */
  setX(x) {
    this._x = this._validateNumber(x, 'x');
    this._invalidateCache();
  }

  /**
   * Y成分を設定
   * キャッシュ無効化を含む安全な設定
   * 
   * @param {number} y - 新しいY座標
   * @throws {TypeError} 引数が数値でない場合
   */
  setY(y) {
    this._y = this._validateNumber(y, 'y');
    this._invalidateCache();
  }

  /**
   * ベクトルのコピーを作成
   * 
   * @returns {Vector2D} このベクトルのコピー
   */
  clone() {
    return new Vector2D(this._x, this._y);
  }

  /**
   * 零ベクトルかどうかを判定
   * 
   * @returns {boolean} 零ベクトルの場合true
   */
  isZero() {
    return this._x === 0 && this._y === 0;
  }

  /**
   * ベクトルの文字列表現
   * デバッグ用
   * 
   * @returns {string} "(x, y)" 形式の文字列
   */
  toString() {
    return `(${this._x}, ${this._y})`;
  }

  /**
   * 2つのベクトルが等しいかを判定
   * 
   * @param {Vector2D} vector - 比較するベクトル
   * @returns {boolean} 等しい場合true
   */
  equals(vector) {
    if (!(vector instanceof Vector2D)) return false;
    return this._x === vector._x && this._y === vector._y;
  }
}

// 名前付きエクスポート
export { Vector2D };