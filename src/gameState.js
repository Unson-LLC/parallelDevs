/**
 * ゲーム状態を管理するクラス
 */
class GameStateManager {
  constructor() {
    this.states = {
      MENU: 'menu',
      PLAYING: 'playing',
      PAUSED: 'paused',
      GAME_OVER: 'gameOver',
      STAGE_CLEAR: 'stageClear'
    };
    
    this.currentState = this.states.MENU;
    this.previousState = null;
    this.lives = 3;
    this.level = 1;
    this.isPowerUpActive = false;
    this.powerUpType = null;
    this.powerUpTimer = 0;
    this.stateChangeCallbacks = [];
  }

  /**
   * 現在の状態を取得
   * @returns {string} 現在の状態
   */
  getCurrentState() {
    return this.currentState;
  }

  /**
   * 状態を変更
   * @param {string} newState - 新しい状態
   * @returns {boolean} 状態変更が成功したかどうか
   */
  changeState(newState) {
    // 有効な状態かチェック
    if (!Object.values(this.states).includes(newState)) {
      return false;
    }

    // 同じ状態への遷移は無視
    if (this.currentState === newState) {
      return false;
    }

    // 状態遷移のバリデーション
    if (!this.isValidTransition(this.currentState, newState)) {
      return false;
    }

    this.previousState = this.currentState;
    this.currentState = newState;

    // コールバックを実行
    this.stateChangeCallbacks.forEach(callback => {
      callback(this.currentState, this.previousState);
    });

    return true;
  }

  /**
   * 有効な状態遷移かチェック
   * @param {string} from - 遷移元の状態
   * @param {string} to - 遷移先の状態
   * @returns {boolean} 有効な遷移かどうか
   */
  isValidTransition(from, to) {
    const validTransitions = {
      [this.states.MENU]: [this.states.PLAYING],
      [this.states.PLAYING]: [this.states.PAUSED, this.states.GAME_OVER, this.states.STAGE_CLEAR],
      [this.states.PAUSED]: [this.states.PLAYING, this.states.MENU],
      [this.states.GAME_OVER]: [this.states.MENU],
      [this.states.STAGE_CLEAR]: [this.states.PLAYING, this.states.MENU]
    };

    return validTransitions[from]?.includes(to) || false;
  }

  /**
   * ライフを減らす
   * @returns {number} 残りライフ数
   */
  loseLife() {
    this.lives = Math.max(0, this.lives - 1);
    
    if (this.lives === 0) {
      this.changeState(this.states.GAME_OVER);
    }
    
    return this.lives;
  }

  /**
   * ライフを追加
   * @param {number} amount - 追加するライフ数
   * @returns {number} 現在のライフ数
   */
  addLife(amount = 1) {
    this.lives += amount;
    return this.lives;
  }

  /**
   * レベルを進める
   * @returns {number} 新しいレベル
   */
  nextLevel() {
    this.level++;
    this.changeState(this.states.STAGE_CLEAR);
    return this.level;
  }

  /**
   * パワーアップを有効化
   * @param {string} type - パワーアップの種類
   * @param {number} duration - 持続時間（秒）
   */
  activatePowerUp(type, duration) {
    this.isPowerUpActive = true;
    this.powerUpType = type;
    this.powerUpTimer = duration;
  }

  /**
   * パワーアップの更新
   * @param {number} deltaTime - 経過時間（秒）
   * @returns {boolean} パワーアップが終了したかどうか
   */
  updatePowerUp(deltaTime) {
    if (!this.isPowerUpActive) return false;

    this.powerUpTimer -= deltaTime;
    
    if (this.powerUpTimer <= 0) {
      this.isPowerUpActive = false;
      this.powerUpType = null;
      this.powerUpTimer = 0;
      return true;
    }
    
    return false;
  }

  /**
   * ゲームをリセット
   */
  reset() {
    this.currentState = this.states.MENU;
    this.previousState = null;
    this.lives = 3;
    this.level = 1;
    this.isPowerUpActive = false;
    this.powerUpType = null;
    this.powerUpTimer = 0;
  }

  /**
   * 状態変更時のコールバックを登録
   * @param {Function} callback - コールバック関数
   */
  onStateChange(callback) {
    this.stateChangeCallbacks.push(callback);
  }

  /**
   * ゲーム状態の情報を取得
   * @returns {Object} ゲーム状態情報
   */
  getGameInfo() {
    return {
      state: this.currentState,
      lives: this.lives,
      level: this.level,
      isPowerUpActive: this.isPowerUpActive,
      powerUpType: this.powerUpType,
      powerUpTimer: this.powerUpTimer
    };
  }

  /**
   * ポーズ状態をトグル
   * @returns {boolean} ポーズ状態かどうか
   */
  togglePause() {
    if (this.currentState === this.states.PLAYING) {
      this.changeState(this.states.PAUSED);
      return true;
    } else if (this.currentState === this.states.PAUSED) {
      this.changeState(this.states.PLAYING);
      return false;
    }
    return this.currentState === this.states.PAUSED;
  }
}

module.exports = GameStateManager;