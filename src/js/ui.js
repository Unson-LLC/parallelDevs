// UI管理クラス
class UIManager {
    constructor() {
        // 画面要素
        this.screens = {
            title: document.getElementById('title-screen'),
            game: document.getElementById('game-screen'),
            gameOver: document.getElementById('game-over-screen'),
            stageClear: document.getElementById('stage-clear-screen'),
            pauseOverlay: document.getElementById('pause-overlay')
        };

        // UI要素
        this.elements = {
            // スコア関連
            score: document.getElementById('score'),
            finalScore: document.getElementById('final-score'),
            highScore: document.getElementById('high-score'),
            currentScore: document.getElementById('current-score'),
            clearBonus: document.getElementById('clear-bonus'),
            
            // ゲーム情報
            level: document.getElementById('level'),
            lives: document.getElementById('lives'),
            clearedStage: document.getElementById('cleared-stage'),
            
            // ボタン
            startButton: document.getElementById('start-button'),
            retryButton: document.getElementById('retry-button'),
            nextStageButton: document.getElementById('next-stage-button'),
            resumeButton: document.getElementById('resume-button'),
            titleButtons: [
                document.getElementById('title-button-gameover'),
                document.getElementById('title-button-clear'),
                document.getElementById('title-button-pause')
            ]
        };

        // ハイスコアの読み込み
        this.highScore = parseInt(localStorage.getItem('breakoutHighScore') || '0');
        
        // イベントリスナーの設定
        this.setupEventListeners();
    }

    // イベントリスナーの設定
    setupEventListeners() {
        // スタートボタン
        this.elements.startButton.addEventListener('click', () => {
            this.showScreen('game');
            if (window.game) {
                window.game.start();
            }
        });

        // リトライボタン
        this.elements.retryButton.addEventListener('click', () => {
            this.showScreen('game');
            if (window.game) {
                window.game.reset();
                window.game.start();
            }
        });

        // 次のステージボタン
        this.elements.nextStageButton.addEventListener('click', () => {
            this.showScreen('game');
            if (window.game) {
                window.game.nextStage();
            }
        });

        // 再開ボタン
        this.elements.resumeButton.addEventListener('click', () => {
            this.hidePauseOverlay();
            if (window.game) {
                window.game.resume();
            }
        });

        // タイトルに戻るボタン
        this.elements.titleButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.showScreen('title');
                if (window.game) {
                    window.game.reset();
                }
            });
        });

        // キーボードイベント（ポーズ用）
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ' && this.screens.game.style.display !== 'none') {
                e.preventDefault();
                if (window.game) {
                    if (window.game.isPaused) {
                        this.hidePauseOverlay();
                        window.game.resume();
                    } else {
                        this.showPauseOverlay();
                        window.game.pause();
                    }
                }
            }
        });
    }

    // 画面表示制御
    showScreen(screenName) {
        // すべての画面を非表示
        Object.values(this.screens).forEach(screen => {
            if (screen && screen !== this.screens.pauseOverlay) {
                screen.style.display = 'none';
            }
        });

        // 指定された画面を表示
        if (this.screens[screenName]) {
            this.screens[screenName].style.display = screenName === 'game' ? 'block' : 'flex';
        }

        // ポーズオーバーレイを非表示
        this.hidePauseOverlay();
    }

    // ポーズオーバーレイの表示
    showPauseOverlay() {
        this.screens.pauseOverlay.style.display = 'flex';
    }

    // ポーズオーバーレイの非表示
    hidePauseOverlay() {
        this.screens.pauseOverlay.style.display = 'none';
    }

    // スコアの更新
    updateScore(score) {
        this.elements.score.textContent = score;
    }

    // レベルの更新
    updateLevel(level) {
        this.elements.level.textContent = level;
    }

    // ライフの更新
    updateLives(lives) {
        this.elements.lives.textContent = lives;
    }

    // ゲームオーバー画面の表示
    showGameOver(finalScore) {
        this.elements.finalScore.textContent = finalScore;
        
        // ハイスコアの更新
        if (finalScore > this.highScore) {
            this.highScore = finalScore;
            localStorage.setItem('breakoutHighScore', this.highScore.toString());
            this.elements.highScore.classList.add('new-high-score');
        } else {
            this.elements.highScore.classList.remove('new-high-score');
        }
        
        this.elements.highScore.textContent = this.highScore;
        this.showScreen('gameOver');
    }

    // ステージクリア画面の表示
    showStageClear(stage, bonus, currentScore) {
        this.elements.clearedStage.textContent = stage;
        this.elements.clearBonus.textContent = bonus;
        this.elements.currentScore.textContent = currentScore;
        this.showScreen('stageClear');
    }

    // タイトル画面の表示
    showTitle() {
        this.showScreen('title');
    }
}

// ゲーム基本クラス（UI連携用のスタブ）
class Game {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.isPaused = false;
        this.isRunning = false;
    }

    start() {
        console.log('ゲーム開始');
        this.isRunning = true;
        this.isPaused = false;
        this.uiManager.updateScore(this.score);
        this.uiManager.updateLevel(this.level);
        this.uiManager.updateLives(this.lives);
    }

    pause() {
        console.log('ゲーム一時停止');
        this.isPaused = true;
    }

    resume() {
        console.log('ゲーム再開');
        this.isPaused = false;
    }

    reset() {
        console.log('ゲームリセット');
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.isPaused = false;
        this.isRunning = false;
    }

    nextStage() {
        console.log('次のステージへ');
        this.level++;
        this.uiManager.updateLevel(this.level);
        this.start();
    }

    // テスト用メソッド
    testGameOver() {
        this.uiManager.showGameOver(12500);
    }

    testStageClear() {
        this.uiManager.showStageClear(this.level, 1000, this.score + 1000);
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    const uiManager = new UIManager();
    window.uiManager = uiManager;
    
    // ゲームインスタンスの作成（実際のgame.jsが実装されるまでのスタブ）
    window.game = new Game(uiManager);
});