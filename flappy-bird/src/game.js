import { Bird } from './bird.js';
import { Pipe } from './pipe.js';

/**
 * Game class - Flappy Birdゲームのメインクラス
 */
class Game {
  constructor(canvasId) {
    this.canvasId = canvasId;
    this.score = 0;
    this.running = false;
    this.gameOver = false;
    this.bird = null;
    this.pipes = [];
    this.canvas = null;
    this.ctx = null;
    this.canvasWidth = 800;
    this.canvasHeight = 600;
    this.pipeSpawnTimer = 0;
    this.pipeSpawnInterval = 120; // フレーム数
  }

  /**
   * ゲーム開始
   */
  start() {
    this.running = true;
    this.gameOver = false;
    // 基本的な初期化（後で拡張）
    this.bird = new Bird(50, 200);
    this.pipes = [];
  }

  /**
   * ゲームループ更新
   */
  update() {
    if (!this.running || this.gameOver) {
      return;
    }

    // 鳥の更新
    if (this.bird) {
      this.bird.update();
      
      // 画面境界チェック
      if (this.bird.y < 0 || this.bird.y + this.bird.height > this.canvasHeight) {
        this.setGameOver();
        return;
      }
    }

    // パイプの更新
    this.pipes.forEach(pipe => {
      pipe.update();
      
      // スコア更新チェック
      if (pipe.isPassed(this.bird.x)) {
        this.incrementScore();
      }
    });

    // 画面外のパイプを削除
    this.cleanupPipes();

    // 新しいパイプの生成
    this.pipeSpawnTimer += 1;
    if (this.pipeSpawnTimer >= this.pipeSpawnInterval) {
      this.generatePipes();
      this.pipeSpawnTimer = 0;
    }

    // 衝突判定
    this.checkCollisions();
  }

  /**
   * 全体描画
   */
  draw() {
    // Canvas要素を取得（実際のブラウザ環境では必要）
    if (!this.canvas && typeof document !== 'undefined') {
      this.canvas = document.getElementById(this.canvasId);
      if (this.canvas) {
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
      }
    }

    // テスト環境では描画をスキップ
    if (!this.ctx) {
      return;
    }

    // 背景をクリア
    this.ctx.fillStyle = '#87CEEB'; // スカイブルー
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // 鳥を描画
    if (this.bird) {
      this.bird.draw(this.ctx);
    }

    // パイプを描画
    this.pipes.forEach(pipe => {
      pipe.draw(this.ctx);
    });

    // スコア表示
    this.ctx.fillStyle = '#000';
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`Score: ${this.score}`, 10, 30);

    // ゲームオーバー表示
    if (this.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
      
      this.ctx.fillStyle = '#FFF';
      this.ctx.font = '48px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Game Over', this.canvasWidth / 2, this.canvasHeight / 2);
      this.ctx.font = '24px Arial';
      this.ctx.fillText(`Final Score: ${this.score}`, this.canvasWidth / 2, this.canvasHeight / 2 + 50);
      this.ctx.textAlign = 'start';
    }
  }

  /**
   * 入力処理
   */
  handleInput() {
    console.log('Game handleInput called, bird:', !!this.bird, 'running:', this.running);
    if (this.bird && this.running) {
      this.bird.jump();
    }
  }

  /**
   * 衝突判定
   */
  checkCollisions() {
    if (!this.bird || this.gameOver) {
      return;
    }

    const birdBounds = this.bird.getBounds();

    // パイプとの衝突判定
    for (const pipe of this.pipes) {
      const pipeBounds = pipe.getBounds();
      
      // 各パイプ（上下2つ）との衝突
      for (const bounds of pipeBounds) {
        if (this.isColliding(birdBounds, bounds)) {
          this.setGameOver();
          return;
        }
      }
    }
  }

  /**
   * 矩形同士の衝突判定
   */
  isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  /**
   * ゲームリセット
   */
  reset() {
    this.score = 0;
    this.running = false;
    this.gameOver = false;
    this.bird = null;
    this.pipes = [];
    this.pipeSpawnTimer = 0;
  }

  /**
   * スコア取得
   */
  getScore() {
    return this.score;
  }

  /**
   * 実行状態取得
   */
  isRunning() {
    return this.running;
  }

  /**
   * ゲームオーバー判定
   */
  isGameOver() {
    return this.gameOver;
  }

  /**
   * ゲームオーバー状態を設定
   */
  setGameOver() {
    this.gameOver = true;
    this.running = false;
  }

  /**
   * スコアを増加
   */
  incrementScore() {
    this.score += 1;
  }

  /**
   * 鳥オブジェクトを取得
   */
  getBird() {
    return this.bird;
  }

  /**
   * パイプ配列を取得
   */
  getPipes() {
    return this.pipes;
  }

  /**
   * パイプを生成
   */
  generatePipes() {
    const gapSize = 150;
    const minGapY = gapSize / 2 + 50;
    const maxGapY = this.canvasHeight - gapSize / 2 - 50;
    const gapY = Math.floor(Math.random() * (maxGapY - minGapY)) + minGapY;
    const pipe = new Pipe(this.canvasWidth, gapY, gapSize);
    this.pipes.push(pipe);
  }

  /**
   * 画面外のパイプを削除
   */
  cleanupPipes() {
    this.pipes = this.pipes.filter(pipe => !pipe.isOffScreen());
  }
}

export { Game };