// デフォルト設定値
const DEFAULT_INITIAL_LIVES = 3;
const DEFAULT_MAX_LIVES = 5;
const MIN_MAX_LIVES = 1;
const MIN_LIVES = 0;

/**
 * ライフ管理を行うクラス
 */
class LivesManager {
  /**
   * @param {number} initialLives - 初期ライフ数（デフォルト: 3）
   * @param {number} maxLives - 最大ライフ数（デフォルト: 5）
   */
  constructor(initialLives = DEFAULT_INITIAL_LIVES, maxLives = DEFAULT_MAX_LIVES) {
    // 負の最大ライフ数は1として扱う
    this.maxLives = Math.max(MIN_MAX_LIVES, maxLives);
    
    // 負の初期ライフ数は0として扱う
    let validInitialLives = Math.max(MIN_LIVES, initialLives);
    
    // 初期ライフ数が最大ライフ数を超える場合は最大ライフ数に制限
    this.initialLives = Math.min(validInitialLives, this.maxLives);
    
    this.lives = this.initialLives;
  }

  /**
   * ライフを初期値にリセット
   */
  reset() {
    this.lives = this.initialLives;
  }

  /**
   * ライフを1減らし、ゲームオーバーかどうかを返す
   * @returns {boolean} ゲームオーバーの場合true
   */
  loseLife() {
    if (this.lives <= MIN_LIVES) {
      return false;
    }
    
    this.lives--;
    return this.lives === MIN_LIVES;
  }

  /**
   * 現在のライフ数を取得
   * @returns {number} 現在のライフ数
   */
  getLives() {
    return this.lives;
  }

  /**
   * ゲームオーバーかどうかを判定
   * @returns {boolean} ゲームオーバーの場合true
   */
  isGameOver() {
    return this.lives <= MIN_LIVES;
  }

  /**
   * ライフを1増やす（ボーナス用）
   */
  addLife() {
    // ゲームオーバー時は復活しない
    if (this.isGameOver()) {
      return;
    }
    
    if (this.lives < this.maxLives) {
      this.lives++;
    }
  }
}

export { LivesManager };