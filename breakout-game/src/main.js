import { GameManager } from './managers/GameManager.js';
import { Ball } from './entities/Ball.js';
import { Paddle } from './entities/Paddle.js';
import { Block } from './entities/Block.js';
import { CollisionDetector } from './systems/CollisionDetector.js';
import { InputHandler } from './systems/InputHandler.js';
import { Renderer } from './systems/Renderer.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.gameManager = new GameManager();
    this.renderer = new Renderer(this.canvas);
    this.inputHandler = new InputHandler();
    this.collisionDetector = new CollisionDetector();
    
    this.lastTime = 0;
    this.animationId = null;
    
    this.init();
  }

  init() {
    // 入力ハンドラーの初期化
    this.inputHandler.init();
    
    // ゲーム要素の作成
    this.ball = new Ball(400, 300, 10, 5, -5);
    this.paddle = new Paddle(350, 550, 100, 20, 8);
    this.blocks = this.createBlocks();
    
    // GameManagerにエンティティとシステムを登録
    this.gameManager.initializeGame(
      this.ball,
      this.paddle,
      this.blocks,
      {
        collisionDetector: this.collisionDetector,
        renderer: this.renderer,
        inputHandler: this.inputHandler
      }
    );
    
    this.gameManager.init();
    this.startGameLoop();
  }

  createBlocks() {
    const blocks = [];
    const blockWidth = 75;
    const blockHeight = 20;
    const rows = 5;
    const cols = 10;
    const padding = 5;
    const offsetX = 40;
    const offsetY = 50;
    
    const colors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff'];
    const points = [50, 40, 30, 20, 10];
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = offsetX + col * (blockWidth + padding);
        const y = offsetY + row * (blockHeight + padding);
        blocks.push(new Block(x, y, blockWidth, blockHeight, colors[row], points[row]));
      }
    }
    
    return blocks;
  }

  startGameLoop() {
    this.lastTime = performance.now();
    this.gameLoop();
  }

  gameLoop = (currentTime) => {
    const deltaTime = (currentTime - this.lastTime) / 1000; // 秒に変換
    this.lastTime = currentTime;
    
    this.update(deltaTime);
    this.render();
    
    this.animationId = requestAnimationFrame(this.gameLoop);
  }

  update(deltaTime) {
    // 入力処理
    this.handleInput();
    
    // ゲームマネージャーの更新
    this.gameManager.update(deltaTime);
    
    // 物理演算とエンティティ更新
    if (this.gameManager.getState() === 'running') {
      this.updatePhysics(deltaTime);
    }
  }

  handleInput() {
    const state = this.gameManager.getState();
    
    if (this.inputHandler.isSpacePressed()) {
      if (state === 'stopped' || state === 'gameOver') {
        if (state === 'gameOver') {
          this.resetGame();
        }
        this.gameManager.start();
      } else if (state === 'running') {
        this.gameManager.pause();
      } else if (state === 'paused') {
        this.gameManager.resume();
      }
    }
    
    if (this.inputHandler.isResetPressed()) {
      this.resetGame();
    }
    
    // パドルの移動
    if (this.inputHandler.isLeftPressed()) {
      this.paddle.moveLeft();
    } else if (this.inputHandler.isRightPressed()) {
      this.paddle.moveRight();
    } else {
      this.paddle.stopMoving();
    }
  }

  updatePhysics(deltaTime) {
    // パドルの更新
    this.paddle.update(this.canvas.width, deltaTime);
    
    // ボールの更新
    this.ball.update(deltaTime);
    
    // 衝突判定
    this.checkCollisions();
  }

  checkCollisions() {
    // 壁との衝突
    const wallCollisions = this.collisionDetector.checkBallWallCollision(
      this.ball, this.canvas.width, this.canvas.height
    );
    
    if (wallCollisions.left || wallCollisions.right) {
      this.ball.reverseX();
    }
    if (wallCollisions.top) {
      this.ball.reverseY();
    }
    if (wallCollisions.bottom) {
      this.gameManager.loseLife();
      if (!this.gameManager.isGameOver()) {
        this.resetBall();
      }
    }
    
    // パドルとの衝突
    if (this.collisionDetector.checkBallPaddleCollision(this.ball, this.paddle)) {
      this.ball.reverseY();
    }
    
    // ブロックとの衝突
    this.blocks.forEach(block => {
      if (!block.isDestroyed() && 
          this.collisionDetector.checkBallBlockCollision(this.ball, block)) {
        block.hit();
        this.ball.reverseY();
        this.gameManager.addScore(block.getPoints());
      }
    });
    
    // レベルクリア判定
    if (this.gameManager.isLevelComplete()) {
      this.gameManager.pause();
      // 新しいレベルを開始（今回は単純にリセット）
      setTimeout(() => {
        this.resetGame();
        this.gameManager.start();
      }, 2000);
    }
  }

  resetBall() {
    this.ball.reset();
  }

  resetGame() {
    this.ball.reset();
    this.paddle.reset();
    this.blocks = this.createBlocks();
    this.gameManager.initializeGame(
      this.ball,
      this.paddle,
      this.blocks,
      {
        collisionDetector: this.collisionDetector,
        renderer: this.renderer,
        inputHandler: this.inputHandler
      }
    );
    this.gameManager.reset();
  }

  render() {
    // 画面クリア
    this.renderer.clear();
    
    // ゲーム要素の描画
    this.renderer.drawBall(this.ball);
    this.renderer.drawPaddle(this.paddle);
    
    this.blocks.forEach(block => {
      this.renderer.drawBlock(block);
    });
    
    // UI要素の描画
    this.renderer.drawScore(this.gameManager.getScore());
    this.renderer.drawLives(this.gameManager.getLives());
    
    // ゲーム状態の描画
    const state = this.gameManager.getState();
    if (state !== 'running') {
      this.renderer.drawGameState(state);
    }
  }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
  new Game();
});