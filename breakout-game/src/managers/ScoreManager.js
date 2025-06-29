/**
 * ScoreManager - ブロック崩しゲームのスコア管理クラス
 * 
 * 機能:
 * - 現在のスコアの管理
 * - ハイスコアの永続化（localStorage使用）
 * - スコアの加算と初期化
 */
class ScoreManager {
  static STORAGE_KEY = 'breakout-highscore';
  
  constructor() {
    this.score = 0;
  }

  /**
   * スコアを0にリセットする
   */
  reset() {
    this.score = 0;
  }

  /**
   * ポイントを加算して現在のスコアを返す
   * @param {number} points - 加算するポイント（0以上の数値）
   * @returns {number} 加算後の現在のスコア
   * @throws {Error} pointsが数値でない場合、または負の値の場合
   */
  addScore(points) {
    // 型チェック
    if (typeof points !== 'number') {
      throw new Error('Points must be a number');
    }
    
    // 負の値チェック
    if (points < 0) {
      throw new Error('Points must be non-negative');
    }
    
    // 小数点を整数に変換（切り捨て）
    const intPoints = Math.floor(points);
    
    // スコアを加算
    this.score += intPoints;
    return this.score;
  }

  /**
   * 現在のスコアを取得する
   * @returns {number} 現在のスコア
   */
  getScore() {
    return this.score;
  }

  /**
   * 保存されているハイスコアを取得する
   * @returns {number} ハイスコア（存在しない場合は0）
   */
  getHighScore() {
    const storage = this._getStorage();
    
    if (!storage) {
      return 0;
    }
    
    const stored = storage.getItem(ScoreManager.STORAGE_KEY);
    
    if (!stored) {
      return 0;
    }
    
    const parsed = parseInt(stored, 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * 現在のスコアがハイスコアを超えている場合、ハイスコアを更新する
   */
  saveHighScore() {
    const storage = this._getStorage();
    
    if (!storage) {
      return;
    }
    
    const currentHighScore = this.getHighScore();
    
    // 現在のスコアがハイスコアを超えている場合、または
    // ハイスコアがまだ存在しない場合（0の場合も含む）は保存
    if (this.score > currentHighScore || (currentHighScore === 0 && !storage.getItem(ScoreManager.STORAGE_KEY))) {
      storage.setItem(ScoreManager.STORAGE_KEY, this.score.toString());
    }
  }

  /**
   * 環境に応じた localStorage オブジェクトを取得する
   * @private
   * @returns {Storage|null} localStorage オブジェクト、利用できない場合は null
   */
  _getStorage() {
    // ブラウザ環境とNode.js環境の両方に対応
    return typeof window !== 'undefined' ? window.localStorage : global.localStorage || null;
  }
}

export { ScoreManager };