/**
 * ライフシステム管理クラス
 * プレイヤーのライフ管理、表示、ゲームオーバー判定を担当
 */
class LifeManager {
    constructor() {
        this.currentLives = 3;
        this.maxLives = 5;
        this.initialLives = 3;
        this.isGameOver = false;
        
        // 難易度別の初期ライフ設定
        this.difficultyLives = {
            easy: 5,
            normal: 3,
            hard: 1
        };
        
        // イベントリスナー用
        this.listeners = {
            lifeUpdate: [],
            gameOver: [],
            lifeGained: [],
            lifeLost: []
        };
    }
    
    /**
     * 初期化
     * @param {string} difficulty - 難易度（easy/normal/hard）
     */
    init(difficulty = 'normal') {
        this.initialLives = this.difficultyLives[difficulty] || 3;
        this.currentLives = this.initialLives;
        this.isGameOver = false;
        this.notifyListeners('lifeUpdate', this.currentLives);
    }
    
    /**
     * ライフを減らす
     * @returns {boolean} ゲームオーバーかどうか
     */
    loseLife() {
        if (this.isGameOver) {
            return true;
        }
        
        this.currentLives--;
        this.notifyListeners('lifeLost', this.currentLives);
        this.notifyListeners('lifeUpdate', this.currentLives);
        
        if (this.currentLives <= 0) {
            this.currentLives = 0;
            this.isGameOver = true;
            this.notifyListeners('gameOver');
            return true;
        }
        
        return false;
    }
    
    /**
     * ライフを増やす（パワーアップアイテムなど）
     * @param {number} amount - 増やす数（デフォルト1）
     * @returns {boolean} ライフが増えたかどうか
     */
    gainLife(amount = 1) {
        if (this.isGameOver || this.currentLives >= this.maxLives) {
            return false;
        }
        
        const previousLives = this.currentLives;
        this.currentLives = Math.min(this.currentLives + amount, this.maxLives);
        
        if (this.currentLives > previousLives) {
            this.notifyListeners('lifeGained', {
                previous: previousLives,
                current: this.currentLives,
                gained: this.currentLives - previousLives
            });
            this.notifyListeners('lifeUpdate', this.currentLives);
            return true;
        }
        
        return false;
    }
    
    /**
     * 現在のライフ数を取得
     * @returns {number}
     */
    getCurrentLives() {
        return this.currentLives;
    }
    
    /**
     * 最大ライフ数を取得
     * @returns {number}
     */
    getMaxLives() {
        return this.maxLives;
    }
    
    /**
     * ゲームオーバー状態を取得
     * @returns {boolean}
     */
    getIsGameOver() {
        return this.isGameOver;
    }
    
    /**
     * ライフがフルかどうか
     * @returns {boolean}
     */
    isFullLife() {
        return this.currentLives >= this.maxLives;
    }
    
    /**
     * ノーミスかどうか（初期ライフと同じ）
     * @returns {boolean}
     */
    isNoMiss() {
        return this.currentLives === this.initialLives;
    }
    
    /**
     * ライフ情報をまとめて取得
     * @returns {Object}
     */
    getLifeInfo() {
        return {
            current: this.currentLives,
            max: this.maxLives,
            initial: this.initialLives,
            isGameOver: this.isGameOver,
            isFullLife: this.isFullLife(),
            isNoMiss: this.isNoMiss(),
            percentage: (this.currentLives / this.maxLives) * 100
        };
    }
    
    /**
     * ライフをリセット
     * @param {string} difficulty - 難易度
     */
    reset(difficulty = 'normal') {
        this.init(difficulty);
    }
    
    /**
     * ライフ表示用のハートマークを生成
     * @returns {string}
     */
    getLifeDisplay() {
        const heart = '❤️';
        const emptyHeart = '🤍';
        let display = '';
        
        // 現在のライフ
        for (let i = 0; i < this.currentLives; i++) {
            display += heart;
        }
        
        // 失ったライフ
        for (let i = this.currentLives; i < this.initialLives; i++) {
            display += emptyHeart;
        }
        
        return display;
    }
    
    /**
     * ライフ表示用のHTML要素を生成
     * @returns {string}
     */
    getLifeHTML() {
        let html = '<div class="life-container">';
        
        for (let i = 0; i < this.maxLives; i++) {
            if (i < this.currentLives) {
                html += '<span class="life-icon life-active">❤️</span>';
            } else if (i < this.initialLives) {
                html += '<span class="life-icon life-lost">💔</span>';
            } else {
                html += '<span class="life-icon life-empty">🤍</span>';
            }
        }
        
        html += '</div>';
        return html;
    }
    
    /**
     * 警告状態かどうか（残りライフが1）
     * @returns {boolean}
     */
    isWarningState() {
        return this.currentLives === 1 && !this.isGameOver;
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
     * ゲーム統計用のデータを取得
     * @returns {Object}
     */
    getStats() {
        return {
            livesLost: this.initialLives - this.currentLives,
            livesRemaining: this.currentLives,
            noMiss: this.isNoMiss()
        };
    }
}

// エクスポート
export default LifeManager;