/**
 * ローカルストレージ管理クラス
 * ゲームデータの保存・読み込み・削除を統括
 */
class StorageManager {
    constructor() {
        this.storagePrefix = 'breakout_';
        this.storageKeys = {
            highScore: 'highScore',
            gameSettings: 'gameSettings',
            gameProgress: 'gameProgress',
            achievements: 'achievements',
            statistics: 'statistics'
        };
        
        // ストレージの可用性チェック
        this.isStorageAvailable = this.checkStorageAvailability();
    }
    
    /**
     * ローカルストレージの可用性をチェック
     * @returns {boolean}
     */
    checkStorageAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('ローカルストレージが利用できません:', e);
            return false;
        }
    }
    
    /**
     * キーにプレフィックスを付与
     * @param {string} key - キー名
     * @returns {string}
     */
    getFullKey(key) {
        return this.storagePrefix + key;
    }
    
    /**
     * データを保存
     * @param {string} key - キー名
     * @param {*} data - 保存するデータ
     * @returns {boolean} 保存成功かどうか
     */
    save(key, data) {
        if (!this.isStorageAvailable) {
            return false;
        }
        
        try {
            const jsonData = JSON.stringify({
                data: data,
                timestamp: Date.now(),
                version: '1.0'
            });
            localStorage.setItem(this.getFullKey(key), jsonData);
            return true;
        } catch (error) {
            console.error('データの保存に失敗しました:', error);
            return false;
        }
    }
    
    /**
     * データを読み込み
     * @param {string} key - キー名
     * @returns {*} 読み込んだデータ（失敗時はnull）
     */
    load(key) {
        if (!this.isStorageAvailable) {
            return null;
        }
        
        try {
            const jsonData = localStorage.getItem(this.getFullKey(key));
            if (!jsonData) {
                return null;
            }
            
            const parsed = JSON.parse(jsonData);
            return parsed.data;
        } catch (error) {
            console.error('データの読み込みに失敗しました:', error);
            return null;
        }
    }
    
    /**
     * データを削除
     * @param {string} key - キー名
     * @returns {boolean} 削除成功かどうか
     */
    delete(key) {
        if (!this.isStorageAvailable) {
            return false;
        }
        
        try {
            localStorage.removeItem(this.getFullKey(key));
            return true;
        } catch (error) {
            console.error('データの削除に失敗しました:', error);
            return false;
        }
    }
    
    /**
     * すべてのゲームデータを削除
     * @returns {boolean} 削除成功かどうか
     */
    clearAll() {
        if (!this.isStorageAvailable) {
            return false;
        }
        
        try {
            // プレフィックスが付いたキーのみ削除
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.storagePrefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('全データの削除に失敗しました:', error);
            return false;
        }
    }
    
    /**
     * ハイスコアを保存
     * @param {number} score - スコア
     * @returns {boolean}
     */
    saveHighScore(score) {
        const highScoreData = {
            score: score,
            date: new Date().toISOString()
        };
        return this.save(this.storageKeys.highScore, highScoreData);
    }
    
    /**
     * ハイスコアを読み込み
     * @returns {number} ハイスコア（デフォルト0）
     */
    loadHighScore() {
        const data = this.load(this.storageKeys.highScore);
        return data ? data.score : 0;
    }
    
    /**
     * ゲーム設定を保存
     * @param {Object} settings - 設定オブジェクト
     * @returns {boolean}
     */
    saveGameSettings(settings) {
        return this.save(this.storageKeys.gameSettings, settings);
    }
    
    /**
     * ゲーム設定を読み込み
     * @returns {Object|null}
     */
    loadGameSettings() {
        return this.load(this.storageKeys.gameSettings);
    }
    
    /**
     * ゲーム進行状況を保存
     * @param {Object} progress - 進行状況データ
     * @returns {boolean}
     */
    saveGameProgress(progress) {
        const progressData = {
            ...progress,
            lastSaved: new Date().toISOString()
        };
        return this.save(this.storageKeys.gameProgress, progressData);
    }
    
    /**
     * ゲーム進行状況を読み込み
     * @returns {Object|null}
     */
    loadGameProgress() {
        return this.load(this.storageKeys.gameProgress);
    }
    
    /**
     * 実績データを保存
     * @param {Object} achievements - 実績データ
     * @returns {boolean}
     */
    saveAchievements(achievements) {
        return this.save(this.storageKeys.achievements, achievements);
    }
    
    /**
     * 実績データを読み込み
     * @returns {Object}
     */
    loadAchievements() {
        const data = this.load(this.storageKeys.achievements);
        return data || {
            firstClear: false,
            noMissClear: false,
            speedClear: false,
            perfectGame: false,
            highScorer: false,
            unlockedAt: {}
        };
    }
    
    /**
     * 統計データを保存
     * @param {Object} statistics - 統計データ
     * @returns {boolean}
     */
    saveStatistics(statistics) {
        return this.save(this.storageKeys.statistics, statistics);
    }
    
    /**
     * 統計データを読み込み
     * @returns {Object}
     */
    loadStatistics() {
        const data = this.load(this.storageKeys.statistics);
        return data || {
            totalPlayTime: 0,
            gamesPlayed: 0,
            gamesWon: 0,
            totalScore: 0,
            blocksDestroyed: 0,
            maxCombo: 0,
            perfectGames: 0
        };
    }
    
    /**
     * 統計データを更新
     * @param {Object} updates - 更新内容
     * @returns {boolean}
     */
    updateStatistics(updates) {
        const current = this.loadStatistics();
        const updated = { ...current };
        
        // 加算する項目
        const additive = ['totalPlayTime', 'gamesPlayed', 'gamesWon', 'totalScore', 'blocksDestroyed', 'perfectGames'];
        additive.forEach(key => {
            if (updates[key] !== undefined) {
                updated[key] = (current[key] || 0) + updates[key];
            }
        });
        
        // 最大値を更新する項目
        if (updates.maxCombo !== undefined && updates.maxCombo > (current.maxCombo || 0)) {
            updated.maxCombo = updates.maxCombo;
        }
        
        return this.saveStatistics(updated);
    }
    
    /**
     * データのエクスポート
     * @returns {Object} すべてのゲームデータ
     */
    exportData() {
        const data = {
            highScore: this.loadHighScore(),
            settings: this.loadGameSettings(),
            progress: this.loadGameProgress(),
            achievements: this.loadAchievements(),
            statistics: this.loadStatistics(),
            exportDate: new Date().toISOString()
        };
        return data;
    }
    
    /**
     * データのインポート
     * @param {Object} data - インポートするデータ
     * @returns {boolean}
     */
    importData(data) {
        try {
            if (data.highScore !== undefined) {
                this.saveHighScore(data.highScore);
            }
            if (data.settings) {
                this.saveGameSettings(data.settings);
            }
            if (data.progress) {
                this.saveGameProgress(data.progress);
            }
            if (data.achievements) {
                this.saveAchievements(data.achievements);
            }
            if (data.statistics) {
                this.saveStatistics(data.statistics);
            }
            return true;
        } catch (error) {
            console.error('データのインポートに失敗しました:', error);
            return false;
        }
    }
    
    /**
     * ストレージ使用量を取得
     * @returns {Object} 使用量情報
     */
    getStorageInfo() {
        if (!this.isStorageAvailable) {
            return { available: false };
        }
        
        let totalSize = 0;
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith(this.storagePrefix)) {
                const value = localStorage.getItem(key);
                totalSize += key.length + (value ? value.length : 0);
            }
        });
        
        return {
            available: true,
            usedBytes: totalSize,
            usedKB: (totalSize / 1024).toFixed(2),
            itemCount: keys.filter(k => k.startsWith(this.storagePrefix)).length
        };
    }
}

// エクスポート
export default StorageManager;