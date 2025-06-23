/**
 * ゲーム状態管理クラス
 * ゲームの状態遷移、ポーズ機能、ステージ管理を担当
 */
class GameState {
    constructor() {
        // ゲーム状態
        this.states = {
            LOADING: 'loading',
            TITLE: 'title',
            PLAYING: 'playing',
            PAUSED: 'paused',
            GAME_OVER: 'gameOver',
            STAGE_CLEAR: 'stageClear',
            GAME_CLEAR: 'gameClear'
        };
        
        this.currentState = this.states.LOADING;
        this.previousState = null;
        
        // ゲーム情報
        this.currentStage = 1;
        this.totalStages = 5;
        this.difficulty = 'normal';
        this.startTime = null;
        this.pauseTime = null;
        this.totalPauseTime = 0;
        this.elapsedTime = 0;
        
        // ゲーム設定
        this.settings = {
            soundEnabled: true,
            musicEnabled: true,
            soundVolume: 0.7,
            musicVolume: 0.5,
            controlType: 'keyboard' // keyboard, mouse, touch
        };
        
        // イベントリスナー用
        this.listeners = {
            stateChange: [],
            stageClear: [],
            gameComplete: [],
            pause: [],
            resume: []
        };
        
        // 状態遷移の履歴
        this.stateHistory = [];
        this.maxHistorySize = 10;
    }
    
    /**
     * 初期化
     * @param {Object} config - 設定オブジェクト
     */
    init(config = {}) {
        this.currentState = this.states.TITLE;
        this.previousState = null;
        this.currentStage = 1;
        this.difficulty = config.difficulty || 'normal';
        this.startTime = null;
        this.pauseTime = null;
        this.totalPauseTime = 0;
        this.elapsedTime = 0;
        this.stateHistory = [];
        
        // 設定をマージ
        if (config.settings) {
            this.settings = { ...this.settings, ...config.settings };
        }
        
        this.addToHistory(this.currentState);
        this.notifyListeners('stateChange', {
            current: this.currentState,
            previous: this.previousState
        });
    }
    
    /**
     * ゲーム開始
     */
    startGame() {
        if (this.currentState !== this.states.TITLE && 
            this.currentState !== this.states.GAME_OVER &&
            this.currentState !== this.states.GAME_CLEAR) {
            return false;
        }
        
        this.changeState(this.states.PLAYING);
        this.startTime = Date.now();
        this.totalPauseTime = 0;
        this.elapsedTime = 0;
        
        return true;
    }
    
    /**
     * ゲーム一時停止
     */
    pauseGame() {
        if (this.currentState !== this.states.PLAYING) {
            return false;
        }
        
        this.changeState(this.states.PAUSED);
        this.pauseTime = Date.now();
        this.notifyListeners('pause');
        
        return true;
    }
    
    /**
     * ゲーム再開
     */
    resumeGame() {
        if (this.currentState !== this.states.PAUSED) {
            return false;
        }
        
        if (this.pauseTime) {
            this.totalPauseTime += Date.now() - this.pauseTime;
            this.pauseTime = null;
        }
        
        this.changeState(this.states.PLAYING);
        this.notifyListeners('resume');
        
        return true;
    }
    
    /**
     * ゲームオーバー
     */
    gameOver() {
        if (this.currentState === this.states.GAME_OVER) {
            return false;
        }
        
        this.changeState(this.states.GAME_OVER);
        this.updateElapsedTime();
        
        return true;
    }
    
    /**
     * ステージクリア
     */
    stageClear() {
        if (this.currentState !== this.states.PLAYING) {
            return false;
        }
        
        this.changeState(this.states.STAGE_CLEAR);
        this.updateElapsedTime();
        
        const stageInfo = {
            stage: this.currentStage,
            time: this.getPlayTime(),
            nextStage: this.currentStage + 1 <= this.totalStages ? this.currentStage + 1 : null
        };
        
        this.notifyListeners('stageClear', stageInfo);
        
        return true;
    }
    
    /**
     * 次のステージへ
     */
    nextStage() {
        if (this.currentState !== this.states.STAGE_CLEAR) {
            return false;
        }
        
        if (this.currentStage >= this.totalStages) {
            this.changeState(this.states.GAME_CLEAR);
            this.notifyListeners('gameComplete', {
                totalTime: this.getPlayTime(),
                stages: this.totalStages
            });
            return false;
        }
        
        this.currentStage++;
        this.changeState(this.states.PLAYING);
        
        return true;
    }
    
    /**
     * タイトル画面へ戻る
     */
    returnToTitle() {
        this.changeState(this.states.TITLE);
        this.resetGameData();
        
        return true;
    }
    
    /**
     * 状態変更
     * @param {string} newState - 新しい状態
     */
    changeState(newState) {
        if (!Object.values(this.states).includes(newState)) {
            console.error('無効な状態:', newState);
            return;
        }
        
        this.previousState = this.currentState;
        this.currentState = newState;
        this.addToHistory(newState);
        
        this.notifyListeners('stateChange', {
            current: this.currentState,
            previous: this.previousState
        });
    }
    
    /**
     * 現在の状態を取得
     * @returns {string}
     */
    getCurrentState() {
        return this.currentState;
    }
    
    /**
     * 特定の状態かチェック
     * @param {string} state - チェックする状態
     * @returns {boolean}
     */
    isState(state) {
        return this.currentState === state;
    }
    
    /**
     * プレイ中かチェック
     * @returns {boolean}
     */
    isPlaying() {
        return this.currentState === this.states.PLAYING;
    }
    
    /**
     * ポーズ中かチェック
     * @returns {boolean}
     */
    isPaused() {
        return this.currentState === this.states.PAUSED;
    }
    
    /**
     * ゲーム実行中かチェック（プレイ中またはポーズ中）
     * @returns {boolean}
     */
    isGameActive() {
        return this.currentState === this.states.PLAYING || 
               this.currentState === this.states.PAUSED;
    }
    
    /**
     * プレイ時間を取得（ポーズ時間を除く）
     * @returns {number} 秒単位の時間
     */
    getPlayTime() {
        if (!this.startTime) {
            return 0;
        }
        
        this.updateElapsedTime();
        return Math.floor(this.elapsedTime / 1000);
    }
    
    /**
     * 経過時間を更新
     */
    updateElapsedTime() {
        if (this.startTime) {
            const currentTime = this.currentState === this.states.PAUSED && this.pauseTime ? 
                                this.pauseTime : Date.now();
            this.elapsedTime = currentTime - this.startTime - this.totalPauseTime;
        }
    }
    
    /**
     * ゲームデータをリセット
     */
    resetGameData() {
        this.currentStage = 1;
        this.startTime = null;
        this.pauseTime = null;
        this.totalPauseTime = 0;
        this.elapsedTime = 0;
    }
    
    /**
     * 設定を更新
     * @param {Object} newSettings - 新しい設定
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        return this.settings;
    }
    
    /**
     * 設定を取得
     * @returns {Object}
     */
    getSettings() {
        return { ...this.settings };
    }
    
    /**
     * ゲーム情報をまとめて取得
     * @returns {Object}
     */
    getGameInfo() {
        return {
            state: this.currentState,
            stage: this.currentStage,
            totalStages: this.totalStages,
            difficulty: this.difficulty,
            playTime: this.getPlayTime(),
            isActive: this.isGameActive(),
            settings: this.getSettings()
        };
    }
    
    /**
     * 状態履歴に追加
     * @param {string} state - 状態
     */
    addToHistory(state) {
        this.stateHistory.push({
            state: state,
            timestamp: Date.now()
        });
        
        // 履歴サイズを制限
        if (this.stateHistory.length > this.maxHistorySize) {
            this.stateHistory.shift();
        }
    }
    
    /**
     * 状態履歴を取得
     * @returns {Array}
     */
    getStateHistory() {
        return [...this.stateHistory];
    }
    
    /**
     * イベントリスナー登録
     * @param {string} event - イベント名
     * @param {Function} callback - コールバック関数
     */
    addEventListener(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }
    
    /**
     * イベントリスナー削除
     * @param {string} event - イベント名
     * @param {Function} callback - コールバック関数
     */
    removeEventListener(event, callback) {
        if (this.listeners[event]) {
            const index = this.listeners[event].indexOf(callback);
            if (index > -1) {
                this.listeners[event].splice(index, 1);
            }
        }
    }
    
    /**
     * リスナーに通知
     * @param {string} event - イベント名
     * @param {*} data - データ
     */
    notifyListeners(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                callback(data);
            });
        }
    }
    
    /**
     * セーブデータを生成
     * @returns {Object}
     */
    generateSaveData() {
        return {
            currentStage: this.currentStage,
            difficulty: this.difficulty,
            settings: this.settings,
            timestamp: Date.now()
        };
    }
    
    /**
     * セーブデータから復元
     * @param {Object} saveData - セーブデータ
     */
    loadFromSaveData(saveData) {
        if (saveData.currentStage) {
            this.currentStage = saveData.currentStage;
        }
        if (saveData.difficulty) {
            this.difficulty = saveData.difficulty;
        }
        if (saveData.settings) {
            this.settings = { ...this.settings, ...saveData.settings };
        }
    }
}

// エクスポート
export default GameState;