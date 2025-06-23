/**
 * スコアシステム管理クラス
 * ブロック崩しゲームのスコア計算、コンボ管理、ハイスコア保存を担当
 */
class ScoreManager {
    constructor() {
        this.currentScore = 0;
        this.highScore = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.lastHitTime = 0;
        this.comboTimeout = 2000; // 2秒でコンボリセット
        
        // スコア設定
        this.scoreConfig = {
            normalBlock: 10,      // 通常ブロック
            hardBlock: 20,        // 硬いブロック
            unbreakableBlock: 0,  // 破壊不可能ブロック
            comboMultiplier: 1.5, // コンボ倍率
            clearBonus: 1000,     // ステージクリアボーナス
            timeBonus: 100,       // 時間ボーナス（秒あたり）
            noMissBonus: 500      // ノーミスボーナス
        };
        
        // イベントリスナー用
        this.listeners = {
            scoreUpdate: [],
            comboUpdate: [],
            highScoreUpdate: []
        };
    }
    
    /**
     * 初期化
     */
    init() {
        this.currentScore = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.lastHitTime = 0;
        this.loadHighScore();
        this.notifyListeners('scoreUpdate', this.currentScore);
        this.notifyListeners('comboUpdate', this.combo);
    }
    
    /**
     * ブロック破壊時のスコア加算
     * @param {string} blockType - ブロックの種類
     * @param {number} hitCount - ヒット数（硬いブロックの場合）
     */
    addBlockScore(blockType, hitCount = 1) {
        const currentTime = Date.now();
        
        // コンボ判定
        if (currentTime - this.lastHitTime <= this.comboTimeout) {
            this.combo++;
            if (this.combo > this.maxCombo) {
                this.maxCombo = this.combo;
            }
        } else {
            this.combo = 1;
        }
        
        this.lastHitTime = currentTime;
        
        // スコア計算
        let baseScore = 0;
        switch (blockType) {
            case 'normal':
                baseScore = this.scoreConfig.normalBlock;
                break;
            case 'hard':
                baseScore = this.scoreConfig.hardBlock;
                break;
            case 'unbreakable':
                baseScore = this.scoreConfig.unbreakableBlock;
                break;
            default:
                baseScore = this.scoreConfig.normalBlock;
        }
        
        // コンボボーナス適用
        const comboBonus = this.combo > 1 ? 
            Math.floor(baseScore * (1 + (this.combo - 1) * 0.1)) : 
            baseScore;
        
        this.currentScore += comboBonus;
        
        // ハイスコア更新チェック
        if (this.currentScore > this.highScore) {
            this.highScore = this.currentScore;
            this.saveHighScore();
            this.notifyListeners('highScoreUpdate', this.highScore);
        }
        
        // リスナーに通知
        this.notifyListeners('scoreUpdate', this.currentScore);
        this.notifyListeners('comboUpdate', this.combo);
        
        return comboBonus;
    }
    
    /**
     * ステージクリアボーナス
     * @param {number} clearTime - クリア時間（秒）
     * @param {boolean} noMiss - ノーミスかどうか
     */
    addClearBonus(clearTime, noMiss = false) {
        let bonus = this.scoreConfig.clearBonus;
        
        // 時間ボーナス（3分以内なら時間ボーナス）
        if (clearTime < 180) {
            const timeBonus = Math.floor((180 - clearTime) * this.scoreConfig.timeBonus / 60);
            bonus += timeBonus;
        }
        
        // ノーミスボーナス
        if (noMiss) {
            bonus += this.scoreConfig.noMissBonus;
        }
        
        // 最大コンボボーナス
        bonus += this.maxCombo * 10;
        
        this.currentScore += bonus;
        
        // ハイスコア更新チェック
        if (this.currentScore > this.highScore) {
            this.highScore = this.currentScore;
            this.saveHighScore();
            this.notifyListeners('highScoreUpdate', this.highScore);
        }
        
        this.notifyListeners('scoreUpdate', this.currentScore);
        
        return bonus;
    }
    
    /**
     * コンボリセット
     */
    resetCombo() {
        this.combo = 0;
        this.lastHitTime = 0;
        this.notifyListeners('comboUpdate', this.combo);
    }
    
    /**
     * スコアリセット
     */
    resetScore() {
        this.currentScore = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.lastHitTime = 0;
        this.notifyListeners('scoreUpdate', this.currentScore);
        this.notifyListeners('comboUpdate', this.combo);
    }
    
    /**
     * ハイスコアをローカルストレージから読み込み
     */
    loadHighScore() {
        try {
            const savedHighScore = localStorage.getItem('breakout_highScore');
            if (savedHighScore) {
                this.highScore = parseInt(savedHighScore, 10);
            }
        } catch (error) {
            console.error('ハイスコアの読み込みに失敗しました:', error);
            this.highScore = 0;
        }
    }
    
    /**
     * ハイスコアをローカルストレージに保存
     */
    saveHighScore() {
        try {
            localStorage.setItem('breakout_highScore', this.highScore.toString());
        } catch (error) {
            console.error('ハイスコアの保存に失敗しました:', error);
        }
    }
    
    /**
     * 現在のスコアを取得
     * @returns {number}
     */
    getCurrentScore() {
        return this.currentScore;
    }
    
    /**
     * ハイスコアを取得
     * @returns {number}
     */
    getHighScore() {
        return this.highScore;
    }
    
    /**
     * 現在のコンボ数を取得
     * @returns {number}
     */
    getCurrentCombo() {
        return this.combo;
    }
    
    /**
     * 最大コンボ数を取得
     * @returns {number}
     */
    getMaxCombo() {
        return this.maxCombo;
    }
    
    /**
     * スコア情報をまとめて取得
     * @returns {Object}
     */
    getScoreInfo() {
        return {
            currentScore: this.currentScore,
            highScore: this.highScore,
            combo: this.combo,
            maxCombo: this.maxCombo
        };
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
}

// エクスポート
export default ScoreManager;