/**
 * スコア計算を管理するクラス
 */
class ScoreManager {
  constructor() {
    this.score = 0;
    this.combo = 0;
    this.highScore = this.loadHighScore();
  }

  /**
   * ブロック破壊時のスコア計算
   * @param {string} blockType - ブロックの種類
   * @param {number} level - 現在のレベル
   * @returns {number} 獲得スコア
   */
  calculateBlockScore(blockType, level = 1) {
    const baseScores = {
      normal: 10,
      hard: 20,
      special: 50
    };

    const baseScore = baseScores[blockType] || 10;
    const levelMultiplier = 1 + (level - 1) * 0.2;
    const comboMultiplier = 1 + this.combo * 0.1;

    return Math.floor(baseScore * levelMultiplier * comboMultiplier);
  }

  /**
   * スコアを追加
   * @param {string} blockType - ブロックの種類
   * @param {number} level - 現在のレベル
   */
  addScore(blockType, level = 1) {
    const points = this.calculateBlockScore(blockType, level);
    this.score += points;
    this.combo++;
    
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }

    return points;
  }

  /**
   * コンボをリセット
   */
  resetCombo() {
    this.combo = 0;
  }

  /**
   * ステージクリアボーナスを計算
   * @param {number} remainingLives - 残りライフ数
   * @param {number} timeBonus - タイムボーナス（秒）
   * @returns {number} ボーナススコア
   */
  calculateStageClearBonus(remainingLives, timeBonus = 0) {
    const lifeBonus = remainingLives * 500;
    const timeBonusScore = Math.max(0, timeBonus * 10);
    return lifeBonus + timeBonusScore;
  }

  /**
   * ステージクリアボーナスを追加
   * @param {number} remainingLives - 残りライフ数
   * @param {number} timeBonus - タイムボーナス（秒）
   */
  addStageClearBonus(remainingLives, timeBonus = 0) {
    const bonus = this.calculateStageClearBonus(remainingLives, timeBonus);
    this.score += bonus;
    
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }

    return bonus;
  }

  /**
   * スコアをリセット
   */
  reset() {
    this.score = 0;
    this.combo = 0;
  }

  /**
   * ハイスコアを読み込み
   * @returns {number} ハイスコア
   */
  loadHighScore() {
    if (typeof localStorage !== 'undefined') {
      return parseInt(localStorage.getItem('breakoutHighScore') || '0', 10);
    }
    return 0;
  }

  /**
   * ハイスコアを保存
   */
  saveHighScore() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('breakoutHighScore', this.highScore.toString());
    }
  }

  /**
   * 現在のスコア情報を取得
   * @returns {Object} スコア情報
   */
  getScoreInfo() {
    return {
      score: this.score,
      highScore: this.highScore,
      combo: this.combo
    };
  }
}

module.exports = ScoreManager;