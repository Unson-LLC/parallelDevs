// UI管理クラス
export class UIManager {
    constructor(game) {
        this.game = game;
        // 画面要素
        this.screens = {
            title: document.getElementById('titleScreen'),
            game: document.getElementById('gameScreen'),
            gameOver: document.getElementById('gameOverScreen'),
            stageClear: document.getElementById('stageClearScreen'),
            pause: document.getElementById('pauseScreen')
        };

        // UI要素
        this.elements = {
            // スコア関連
            score: document.getElementById('score'),
            finalScore: document.getElementById('finalScore'),
            highScore: document.getElementById('highScore'),
            currentScore: document.getElementById('stageClearScore'),
            clearBonus: document.getElementById('clearBonus'),
            
            // ゲーム情報
            level: document.getElementById('level'),
            lives: document.getElementById('lives'),
            clearedStage: document.getElementById('stageClearStage'),
            
            // ボタン
            startButton: document.getElementById('startButton'),
            retryButton: document.getElementById('retryButton'),
            nextStageButton: document.getElementById('nextStageButton'),
            resumeButton: document.getElementById('resumeButton'),
            titleButtons: document.querySelectorAll('.title-button')
        };

        // ハイスコアの読み込み
        this.highScore = parseInt(localStorage.getItem('breakoutHighScore') || '0');
    }

    // 初期化
    init() {
        // イベントリスナーは外部から設定される
    }

    // 画面表示制御
    showScreen(screenName) {
        // すべての画面を非表示
        Object.values(this.screens).forEach(screen => {
            if (screen && screen !== this.screens.pause) {
                screen.style.display = 'none';
            }
        });

        // 指定された画面を表示
        if (this.screens[screenName]) {
            this.screens[screenName].style.display = screenName === 'game' ? 'block' : 'flex';
        }
        
        // ポーズ以外の画面を表示するときはポーズを非表示
        if (screenName !== 'pause') {
            this.hidePauseOverlay();
        }
    }

    // ポーズオーバーレイの表示
    showPauseOverlay() {
        if (this.screens.pause) {
            this.screens.pause.style.display = 'flex';
        }
    }

    // ポーズオーバーレイの非表示
    hidePauseOverlay() {
        if (this.screens.pause) {
            this.screens.pause.style.display = 'none';
        }
    }

    // 表示更新
    updateDisplay(score, level, lives) {
        if (this.elements.score) this.elements.score.textContent = score;
        if (this.elements.level) this.elements.level.textContent = level;
        if (this.elements.lives) this.elements.lives.textContent = lives;
    }

    // ゲームオーバー画面の表示
    showGameOver(finalScore) {
        if (this.elements.finalScore) this.elements.finalScore.textContent = finalScore;
        
        // ハイスコアの更新
        if (finalScore > this.highScore) {
            this.highScore = finalScore;
            localStorage.setItem('breakoutHighScore', this.highScore.toString());
            if (this.elements.highScore) this.elements.highScore.classList.add('new-high-score');
        } else {
            if (this.elements.highScore) this.elements.highScore.classList.remove('new-high-score');
        }
        
        if (this.elements.highScore) this.elements.highScore.textContent = this.highScore;
        this.showScreen('gameOver');
    }

    // ステージクリア画面の表示  
    showStageClear(stage, bonus, currentScore) {
        if (this.elements.clearedStage) this.elements.clearedStage.textContent = stage;
        if (this.elements.clearBonus) this.elements.clearBonus.textContent = bonus;
        if (this.elements.currentScore) this.elements.currentScore.textContent = currentScore;
        this.showScreen('stageClear');
    }

    // タイトル画面の表示
    showTitle() {
        this.showScreen('title');
    }
}