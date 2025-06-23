import { GameState } from './gameState.js';
import { ScoreManager } from './scoreManager.js';
import { LifeManager } from './lifeManager.js';
import { UIManager } from './ui.js';
import { CollisionDetector } from './collision.js';
import { Paddle } from './entities/Paddle.js';
import { Ball } from './entities/Ball.js';
import { Block, BlockLayout } from './entities/Block.js';

/**
 * ブロック崩しゲームのメインクラス
 */
export class BreakoutGame {
    constructor() {
        // キャンバスの設定
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // ゲームマネージャーの初期化
        this.gameState = new GameState();
        this.scoreManager = new ScoreManager();
        this.lifeManager = new LifeManager('normal');
        this.uiManager = new UIManager(this);
        this.collisionDetector = new CollisionDetector(this.canvas.width, this.canvas.height);
        
        // ゲームエンティティ
        this.paddle = new Paddle(this.canvas.width, this.canvas.height);
        this.balls = [];
        this.blocks = [];
        this.powerUps = [];
        
        // ゲーム設定
        this.difficulty = 'normal';
        this.currentStage = 1;
        this.maxStages = 5;
        
        // ゲームループ関連
        this.lastTime = 0;
        this.animationId = null;
        
        // 初期化
        this.init();
    }
    
    /**
     * ゲームの初期化
     */
    init() {
        // イベントリスナーの設定
        this.setupEventListeners();
        
        // UIの初期化
        this.uiManager.init();
        
        // ゲーム状態をタイトルに設定
        this.gameState.changeState('TITLE');
        this.uiManager.showScreen('title');
        
        // ゲームループの開始
        this.startGameLoop();
    }
    
    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // ゲーム開始ボタン
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.addEventListener('click', () => this.startGame());
        }
        
        // リトライボタン
        const retryButton = document.getElementById('retryButton');
        if (retryButton) {
            retryButton.addEventListener('click', () => this.startGame());
        }
        
        // 次のステージボタン
        const nextStageButton = document.getElementById('nextStageButton');
        if (nextStageButton) {
            nextStageButton.addEventListener('click', () => this.nextStage());
        }
        
        // タイトルに戻るボタン
        const titleButtons = document.querySelectorAll('.title-button');
        titleButtons.forEach(button => {
            button.addEventListener('click', () => this.returnToTitle());
        });
        
        // 難易度選択
        const difficultySelect = document.getElementById('difficulty');
        if (difficultySelect) {
            difficultySelect.addEventListener('change', (e) => {
                this.difficulty = e.target.value;
                this.paddle.setDifficulty(this.difficulty);
                this.lifeManager = new LifeManager(this.difficulty);
            });
        }
        
        // スペースキーでポーズ
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.gameState.currentState === 'PLAYING') {
                e.preventDefault();
                this.togglePause();
            }
        });
    }
    
    /**
     * ゲーム開始
     */
    startGame() {
        // ゲーム状態をリセット
        this.currentStage = 1;
        this.scoreManager.reset();
        this.lifeManager.reset();
        this.gameState.reset();
        
        // ステージの初期化
        this.initStage();
        
        // ゲーム画面に切り替え
        this.gameState.changeState('PLAYING');
        this.uiManager.showScreen('game');
        this.uiManager.updateDisplay(
            this.scoreManager.getCurrentScore(),
            this.currentStage,
            this.lifeManager.getLives()
        );
    }
    
    /**
     * ステージの初期化
     */
    initStage() {
        // パドルのリセット
        this.paddle.reset();
        
        // ボールの初期化
        this.balls = [];
        const ballRadius = 5;
        const initialSpeed = this.getInitialBallSpeed();
        const angle = -Math.PI / 4; // 45度上向き
        this.balls.push(new Ball(
            this.canvas.width / 2,
            this.canvas.height - 100,
            ballRadius,
            initialSpeed * Math.cos(angle),
            initialSpeed * Math.sin(angle)
        ));
        
        // ブロックの配置
        this.blocks = this.createStageLayout(this.currentStage);
        
        // パワーアップのクリア
        this.powerUps = [];
        
        // ゲーム時間のリセット
        this.gameState.resetTimer();
    }
    
    /**
     * 初期ボール速度の取得
     */
    getInitialBallSpeed() {
        switch(this.difficulty) {
            case 'easy':
                return 4;
            case 'normal':
                return 5;
            case 'hard':
                return 6;
            default:
                return 5;
        }
    }
    
    /**
     * ステージレイアウトの作成
     */
    createStageLayout(stage) {
        // ステージに応じて異なるレイアウトを作成
        switch(stage) {
            case 1:
                return BlockLayout.createStandardLayout(5, 8);
            case 2:
                return BlockLayout.createStandardLayout(6, 8);
            case 3:
                // 難しいブロックを含むレイアウト
                const blocks = BlockLayout.createStandardLayout(6, 8);
                // 一部のブロックを硬いブロックに変更
                blocks.forEach((block, index) => {
                    if (index % 3 === 0) {
                        block.type = 'hard';
                        block.hitPoints = 2;
                        block.maxHitPoints = 2;
                        block.color = '#FFD700';
                    }
                });
                return blocks;
            case 4:
                // より難しいレイアウト
                return this.createDiamondLayout();
            case 5:
                // 最終ステージ
                return this.createFinalStageLayout();
            default:
                return BlockLayout.createStandardLayout(6, 8);
        }
    }
    
    /**
     * ダイヤモンド型レイアウト
     */
    createDiamondLayout() {
        const blocks = [];
        const centerX = 4;
        const centerY = 3;
        const pattern = [
            [0,0,0,1,0,0,0],
            [0,0,1,1,1,0,0],
            [0,1,1,1,1,1,0],
            [1,1,1,1,1,1,1],
            [0,1,1,1,1,1,0],
            [0,0,1,1,1,0,0],
            [0,0,0,1,0,0,0]
        ];
        
        pattern.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                if (cell === 1) {
                    const x = (colIndex + 0.5) * 100 + 50;
                    const y = rowIndex * 30 + 60;
                    const type = (rowIndex === centerY || colIndex === centerX - 1) ? 'hard' : 'normal';
                    blocks.push(new Block(x, y, 75, 25, type, rowIndex));
                }
            });
        });
        
        return blocks;
    }
    
    /**
     * 最終ステージレイアウト
     */
    createFinalStageLayout() {
        const blocks = [];
        // 特殊なパターンを作成
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const x = col * 85 + 60;
                const y = row * 30 + 60;
                
                // チェッカーボードパターン
                if ((row + col) % 2 === 0) {
                    const type = row < 2 ? 'super_hard' : (row < 4 ? 'hard' : 'normal');
                    blocks.push(new Block(x, y, 75, 25, type, row));
                }
            }
        }
        
        // 中央に破壊不可能ブロック
        blocks.push(new Block(350, 180, 100, 30, 'unbreakable', 4));
        
        return blocks;
    }
    
    /**
     * ゲームループ
     */
    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // ゲーム状態に応じた処理
        if (this.gameState.currentState === 'PLAYING') {
            this.update(deltaTime);
            this.render();
        } else if (this.gameState.currentState === 'PAUSED') {
            this.render();
            this.renderPauseOverlay();
        }
        
        // 次のフレームをリクエスト
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    /**
     * ゲームループの開始
     */
    startGameLoop() {
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }
    
    /**
     * 更新処理
     */
    update(deltaTime) {
        // ゲーム時間の更新
        this.gameState.updateTimer(deltaTime);
        
        // パドルの更新
        this.paddle.update(deltaTime);
        
        // ボールの更新
        this.balls.forEach((ball, index) => {
            ball.update(deltaTime);
            
            // 衝突判定
            this.handleCollisions(ball);
            
            // 画面下に落ちたかチェック
            if (ball.y > this.canvas.height) {
                this.balls.splice(index, 1);
                
                // すべてのボールを失った場合
                if (this.balls.length === 0) {
                    this.loseLife();
                }
            }
        });
        
        // ブロックの更新
        this.blocks.forEach(block => {
            block.update(deltaTime);
        });
        
        // パワーアップの更新
        this.updatePowerUps(deltaTime);
        
        // ステージクリアチェック
        if (this.checkStageClear()) {
            this.stageClear();
        }
        
        // UI更新
        this.uiManager.updateDisplay(
            this.scoreManager.getCurrentScore(),
            this.currentStage,
            this.lifeManager.getLives()
        );
    }
    
    /**
     * 衝突判定処理
     */
    handleCollisions(ball) {
        // 壁との衝突
        this.collisionDetector.checkWallCollision(ball);
        
        // パドルとの衝突
        if (this.collisionDetector.checkPaddleCollision(ball, this.paddle)) {
            ball.onPaddleHit(this.paddle.x, this.paddle.width);
            // ヒット音を再生（将来の実装）
        }
        
        // ブロックとの衝突
        this.blocks.forEach((block, index) => {
            if (!block.isDestroyed && this.collisionDetector.checkBlockCollision(ball, block)) {
                const destroyed = block.hit(ball.isPowerBall);
                
                if (destroyed) {
                    // スコア加算
                    this.scoreManager.addScore(block.score);
                    
                    // パワーアップドロップ
                    if (block.powerUpType) {
                        this.createPowerUp(block.x + block.width / 2, block.y + block.height / 2, block.powerUpType);
                    }
                    
                    // 破壊音を再生（将来の実装）
                }
            }
        });
        
        // 破壊されたブロックを削除
        this.blocks = this.blocks.filter(block => !block.isDestroyed || block.isAnimating);
    }
    
    /**
     * パワーアップの作成
     */
    createPowerUp(x, y, type) {
        this.powerUps.push({
            x: x,
            y: y,
            type: type,
            width: 30,
            height: 30,
            speed: 2,
            color: this.getPowerUpColor(type)
        });
    }
    
    /**
     * パワーアップの色取得
     */
    getPowerUpColor(type) {
        const colors = {
            'MULTI_BALL': '#00FF00',
            'WIDE_PADDLE': '#0000FF',
            'SLOW_BALL': '#00FFFF',
            'POWER_BALL': '#FFD700',
            'EXTRA_LIFE': '#FF00FF',
            'MEGA_BALL': '#FF0000'
        };
        return colors[type] || '#FFFFFF';
    }
    
    /**
     * パワーアップの更新
     */
    updatePowerUps(deltaTime) {
        this.powerUps.forEach((powerUp, index) => {
            // 落下
            powerUp.y += powerUp.speed;
            
            // パドルとの衝突判定
            if (this.checkPowerUpCollision(powerUp, this.paddle)) {
                this.activatePowerUp(powerUp.type);
                this.powerUps.splice(index, 1);
            }
            
            // 画面外に出たら削除
            if (powerUp.y > this.canvas.height) {
                this.powerUps.splice(index, 1);
            }
        });
    }
    
    /**
     * パワーアップとパドルの衝突判定
     */
    checkPowerUpCollision(powerUp, paddle) {
        return powerUp.x < paddle.x + paddle.width &&
               powerUp.x + powerUp.width > paddle.x &&
               powerUp.y < paddle.y + paddle.height &&
               powerUp.y + powerUp.height > paddle.y;
    }
    
    /**
     * パワーアップの発動
     */
    activatePowerUp(type) {
        switch(type) {
            case 'MULTI_BALL':
                this.multiplyBalls();
                break;
            case 'WIDE_PADDLE':
                this.paddle.activatePowerUp('WIDE_PADDLE', 10000);
                break;
            case 'SLOW_BALL':
                this.balls.forEach(ball => {
                    ball.vx *= 0.5;
                    ball.vy *= 0.5;
                    ball.speed *= 0.5;
                });
                break;
            case 'POWER_BALL':
                this.balls.forEach(ball => {
                    ball.activatePowerBall(5000);
                });
                break;
            case 'EXTRA_LIFE':
                this.lifeManager.addLife();
                break;
            case 'MEGA_BALL':
                this.balls.forEach(ball => {
                    ball.radius *= 2;
                });
                setTimeout(() => {
                    this.balls.forEach(ball => {
                        ball.radius /= 2;
                    });
                }, 10000);
                break;
        }
        
        // パワーアップ取得音（将来の実装）
    }
    
    /**
     * ボールを増やす
     */
    multiplyBalls() {
        const newBalls = [];
        this.balls.forEach(ball => {
            // 3つに分裂
            for (let i = 0; i < 2; i++) {
                const angle = (Math.PI * 2 / 3) * (i + 1);
                const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
                newBalls.push(new Ball(
                    ball.x,
                    ball.y,
                    ball.radius,
                    speed * Math.cos(angle),
                    speed * Math.sin(angle)
                ));
            }
        });
        this.balls.push(...newBalls);
    }
    
    /**
     * ライフを失う処理
     */
    loseLife() {
        this.lifeManager.loseLife();
        
        if (this.lifeManager.isGameOver()) {
            this.gameOver();
        } else {
            // ボールを再配置
            const ballRadius = 5;
            const initialSpeed = this.getInitialBallSpeed();
            const angle = -Math.PI / 4;
            this.balls.push(new Ball(
                this.canvas.width / 2,
                this.canvas.height - 100,
                ballRadius,
                initialSpeed * Math.cos(angle),
                initialSpeed * Math.sin(angle)
            ));
            
            // パドルをリセット
            this.paddle.reset();
        }
    }
    
    /**
     * ステージクリアチェック
     */
    checkStageClear() {
        return this.blocks.filter(block => !block.isDestroyed && block.type !== 'unbreakable').length === 0;
    }
    
    /**
     * ステージクリア処理
     */
    stageClear() {
        // ボーナススコア計算
        const timeBonus = Math.max(0, 300 - Math.floor(this.gameState.playTime / 1000)) * 10;
        const noMissBonus = this.lifeManager.getLives() === this.lifeManager.getMaxLives() ? 1000 : 0;
        
        this.scoreManager.addScore(timeBonus + noMissBonus);
        
        // 状態変更
        this.gameState.changeState('STAGE_CLEAR');
        
        // UI更新
        this.uiManager.showScreen('stageClear');
        document.getElementById('stageClearScore').textContent = this.scoreManager.getCurrentScore();
        document.getElementById('stageClearStage').textContent = this.currentStage;
        
        // 最終ステージクリアの場合
        if (this.currentStage >= this.maxStages) {
            this.gameComplete();
        }
    }
    
    /**
     * 次のステージへ
     */
    nextStage() {
        this.currentStage++;
        this.gameState.nextStage();
        this.initStage();
        this.gameState.changeState('PLAYING');
        this.uiManager.showScreen('game');
    }
    
    /**
     * ゲームオーバー処理
     */
    gameOver() {
        this.gameState.changeState('GAME_OVER');
        this.scoreManager.saveHighScore();
        
        this.uiManager.showScreen('gameOver');
        document.getElementById('finalScore').textContent = this.scoreManager.getCurrentScore();
        document.getElementById('highScore').textContent = this.scoreManager.getHighScore();
    }
    
    /**
     * ゲームコンプリート
     */
    gameComplete() {
        this.gameState.changeState('GAME_CLEAR');
        this.scoreManager.saveHighScore();
        
        // ゲームクリア画面の表示（将来の実装）
        alert('Congratulations! You completed all stages!');
    }
    
    /**
     * タイトルに戻る
     */
    returnToTitle() {
        this.gameState.changeState('TITLE');
        this.uiManager.showScreen('title');
        this.balls = [];
        this.blocks = [];
        this.powerUps = [];
    }
    
    /**
     * ポーズの切り替え
     */
    togglePause() {
        if (this.gameState.currentState === 'PLAYING') {
            this.gameState.pause();
            this.uiManager.showScreen('pause');
        } else if (this.gameState.currentState === 'PAUSED') {
            this.gameState.resume();
            this.uiManager.showScreen('game');
        }
    }
    
    /**
     * 描画処理
     */
    render() {
        // キャンバスのクリア
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // ゲーム要素の描画
        if (this.gameState.currentState !== 'TITLE') {
            // ブロックの描画
            this.blocks.forEach(block => {
                block.draw(this.ctx);
            });
            
            // パドルの描画
            this.paddle.draw(this.ctx);
            
            // ボールの描画
            this.balls.forEach(ball => {
                ball.draw(this.ctx);
            });
            
            // パワーアップの描画
            this.renderPowerUps();
        }
    }
    
    /**
     * パワーアップの描画
     */
    renderPowerUps() {
        this.powerUps.forEach(powerUp => {
            this.ctx.fillStyle = powerUp.color;
            this.ctx.fillRect(powerUp.x - powerUp.width / 2, powerUp.y - powerUp.height / 2, powerUp.width, powerUp.height);
            
            // アイコンまたはテキスト（簡略化）
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(powerUp.type.charAt(0), powerUp.x, powerUp.y);
        });
    }
    
    /**
     * ポーズオーバーレイの描画
     */
    renderPauseOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    }
    
    /**
     * クリーンアップ
     */
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.paddle.destroy();
    }
}

// ゲームの初期化
window.addEventListener('DOMContentLoaded', () => {
    const game = new BreakoutGame();
});