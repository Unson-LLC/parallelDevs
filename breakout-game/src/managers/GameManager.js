import { ScoreManager } from './ScoreManager.js';
import { LivesManager } from './LivesManager.js';

/**
 * GameManager - ブロック崩しゲームの全体管理クラス
 * 
 * 機能:
 * - ゲーム状態管理（開始、一時停止、再開、リセット）
 * - スコア管理（加算、ハイスコア管理）
 * - ライフ管理（減少、ゲームオーバー判定）
 * - ゲームループ制御（エンティティ更新、衝突検出）
 * - Ball、Paddle、Blockエンティティと各システムの統合
 * 
 * 設計思想:
 * - 各エンティティやシステムを疎結合で管理
 * - 将来的な拡張に対応した柔軟な構造
 * - TDDによる堅牢な実装
 */
class GameManager {
  // ゲーム状態の定数定義
  static GAME_STATES = {
    STOPPED: 'stopped',
    RUNNING: 'running', 
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
  };

  // デフォルト設定値
  static DEFAULT_INITIAL_LIVES = 3;

  constructor() {
    this.gameState = GameManager.GAME_STATES.STOPPED;
    this.scoreManager = new ScoreManager();
    this.livesManager = new LivesManager(GameManager.DEFAULT_INITIAL_LIVES);
    
    // 将来的な拡張のため、エンティティやシステムの管理領域を確保
    this.entities = {
      ball: null,
      paddle: null,
      blocks: []
    };
    
    this.systems = {
      collisionDetector: null,
      renderer: null,
      inputHandler: null
    };
  }

  /**
   * 現在のゲーム状態を取得
   * @returns {string} 'stopped', 'running', 'paused', 'gameOver'
   */
  // インターフェース準拠のために名前を変更
  getState() {
    return this.gameState;
  }

  init() {
    this.gameState = GameManager.GAME_STATES.STOPPED;
    this.scoreManager.reset();
    this.livesManager.reset();
    this._resetEntities();
  }

  isGameOver() {
    return this.gameState === GameManager.GAME_STATES.GAME_OVER;
  }

  isLevelComplete() {
    return this.entities.blocks.length > 0 && 
           this.entities.blocks.every(block => block.isDestroyed());
  }

  /**
   * 現在のスコアを取得
   * @returns {number} 現在のスコア
   */
  getScore() {
    return this.scoreManager.getScore();
  }

  /**
   * 現在のライフ数を取得
   * @returns {number} 現在のライフ数
   */
  getLives() {
    return this.livesManager.getLives();
  }

  /**
   * ゲームを開始
   */
  start() {
    const { STOPPED, GAME_OVER, RUNNING } = GameManager.GAME_STATES;
    if (this.gameState === STOPPED || this.gameState === GAME_OVER) {
      this.gameState = RUNNING;
    }
  }

  /**
   * ゲームを一時停止
   */
  pause() {
    const { RUNNING, PAUSED } = GameManager.GAME_STATES;
    if (this.gameState === RUNNING) {
      this.gameState = PAUSED;
    }
  }

  /**
   * ゲームを再開
   */
  resume() {
    const { PAUSED, RUNNING } = GameManager.GAME_STATES;
    if (this.gameState === PAUSED) {
      this.gameState = RUNNING;
    }
  }

  /**
   * ゲームをリセット
   */
  reset() {
    this.gameState = GameManager.GAME_STATES.STOPPED;
    this.scoreManager.reset();
    this.livesManager.reset();
    
    // エンティティのリセット（将来的な拡張用）
    this._resetEntities();
  }

  /**
   * エンティティをリセット（将来的な実装用）
   * @private
   */
  _resetEntities() {
    if (this.entities.ball) {
      this.entities.ball.reset();
    }
    if (this.entities.paddle) {
      this.entities.paddle.reset();
    }
    // ブロックは再構築される想定
    this.entities.blocks = [];
  }

  /**
   * スコアを加算
   * @param {number} points - 加算するポイント
   */
  addScore(points) {
    this.scoreManager.addScore(points);
  }

  /**
   * ライフを1減らす
   * @returns {boolean} ゲームオーバーになった場合true
   */
  loseLife() {
    const isGameOver = this.livesManager.loseLife();
    if (isGameOver) {
      this.gameState = GameManager.GAME_STATES.GAME_OVER;
      this._onGameOver();
    }
    return isGameOver;
  }

  /**
   * ゲーム状態を更新
   * @param {number} deltaTime - 前フレームからの経過時間（ms）
   */
  update(deltaTime) {
    if (this.gameState === GameManager.GAME_STATES.RUNNING) {
      this._updateGameLogic(deltaTime);
    }
  }

  /**
   * ゲームオーバー時の処理
   * @private
   */
  _onGameOver() {
    // ハイスコアの保存
    this.scoreManager.saveHighScore();
    
    // 将来的には、ゲームオーバー効果やアニメーションの開始などを実装
  }

  /**
   * ゲームロジックの更新（内部処理）
   * @param {number} deltaTime - 前フレームからの経過時間（ms）
   * @private
   */
  _updateGameLogic(deltaTime) {
    // Ball、Paddle、Block等のエンティティ更新処理
    this._updateEntities(deltaTime);
    
    // 衝突検出処理
    this._processCollisions();
    
    // レベルクリア/ゲームオーバー判定
    this._checkGameConditions();
  }

  /**
   * エンティティの更新処理（将来的な実装用）
   * @param {number} deltaTime - 前フレームからの経過時間（ms）
   * @private
   */
  _updateEntities(deltaTime) {
    if (this.entities.ball) {
      this.entities.ball.update(deltaTime);
    }
    if (this.entities.paddle) {
      this.entities.paddle.update(deltaTime);
    }
  }

  /**
   * 衝突検出処理（将来的な実装用）
   * @private
   */
  _processCollisions() {
    if (!this.systems.collisionDetector || !this.entities.ball) {
      return;
    }
    
    // Ball vs Paddle
    if (this.entities.paddle) {
      const ballPaddleCollision = this.systems.collisionDetector.checkBallPaddleCollision(
        this.entities.ball, 
        this.entities.paddle
      );
      if (ballPaddleCollision) {
        this.entities.ball.reverseY();
      }
    }
    
    // Ball vs Blocks
    this.entities.blocks.forEach((block, index) => {
      if (!block.isDestroyed()) {
        const ballBlockCollision = this.systems.collisionDetector.checkBallBlockCollision(
          this.entities.ball, 
          block
        );
        if (ballBlockCollision) {
          block.hit();
          this.entities.ball.reverseY();
          this.addScore(block.getPoints());
        }
      }
    });
  }

  /**
   * ゲーム状況の判定（将来的な実装用）
   * @private
   */
  _checkGameConditions() {
    // レベルクリア判定：全ブロックが破壊されたか
    const allBlocksDestroyed = this.entities.blocks.every(block => block.isDestroyed());
    if (allBlocksDestroyed && this.entities.blocks.length > 0) {
      // レベルクリア処理（今後実装）
    }
    
    // ゲームオーバー判定：ボールが画面下部に落下したか（今後実装）
  }

  /**
   * エンティティとシステムの登録（将来的な実装用）
   * @param {Object} ball - Ballエンティティ
   * @param {Object} paddle - Paddleエンティティ
   * @param {Array} blocks - Blockエンティティの配列
   * @param {Object} systems - システムオブジェクト（collisionDetector等）
   */
  initializeGame(ball, paddle, blocks, systems) {
    this.entities.ball = ball;
    this.entities.paddle = paddle;
    this.entities.blocks = blocks || [];
    this.systems = { ...this.systems, ...systems };
  }

  /**
   * 現在のゲーム情報を取得（デバッグ・UI用）
   * @returns {Object} ゲーム情報
   */
  getGameInfo() {
    return {
      state: this.gameState,
      score: this.getScore(),
      lives: this.getLives(),
      highScore: this.scoreManager.getHighScore(),
      entitiesCount: {
        blocks: this.entities.blocks.filter(block => !block.isDestroyed()).length
      }
    };
  }

  /**
   * テスト用：ライフ数を直接設定
   * @param {number} lives - 設定するライフ数
   * @private
   */
  _setLives(lives) {
    this.livesManager.lives = lives;
  }
}

export { GameManager };