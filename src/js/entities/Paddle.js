/**
 * パドルクラス
 * プレイヤーが操作するパドルを管理
 */
export class Paddle {
    constructor(canvasWidth, canvasHeight) {
        // キャンバスサイズ
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // パドルのサイズ（デフォルト）
        this.defaultWidth = 100;
        this.defaultHeight = 20;
        this.width = this.defaultWidth;
        this.height = this.defaultHeight;
        
        // パドルの位置（初期位置は画面下部中央）
        this.x = (canvasWidth - this.width) / 2;
        this.y = canvasHeight - 30 - this.height;
        
        // 移動速度
        this.speed = 8;
        
        // 色
        this.color = '#FFFFFF';
        
        // 入力状態
        this.keys = {
            left: false,
            right: false
        };
        
        // マウス/タッチ位置
        this.targetX = null;
        
        // パワーアップ状態
        this.powerUpActive = false;
        this.powerUpType = null;
        this.powerUpTimer = 0;
        
        // イベントリスナーの設定
        this.setupEventListeners();
    }
    
    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // キーボードイベント
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // マウスイベント
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // タッチイベント
        window.addEventListener('touchmove', (e) => this.handleTouchMove(e));
    }
    
    /**
     * キー押下処理
     */
    handleKeyDown(e) {
        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.keys.left = true;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.keys.right = true;
                break;
        }
    }
    
    /**
     * キー離上処理
     */
    handleKeyUp(e) {
        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.keys.left = false;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.keys.right = false;
                break;
        }
    }
    
    /**
     * マウス移動処理
     */
    handleMouseMove(e) {
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            this.targetX = e.clientX - rect.left - this.width / 2;
        }
    }
    
    /**
     * タッチ移動処理
     */
    handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length > 0) {
            const canvas = document.getElementById('gameCanvas');
            if (canvas) {
                const rect = canvas.getBoundingClientRect();
                this.targetX = e.touches[0].clientX - rect.left - this.width / 2;
            }
        }
    }
    
    /**
     * 更新処理
     */
    update(deltaTime) {
        // パワーアップタイマーの更新
        if (this.powerUpActive && this.powerUpTimer > 0) {
            this.powerUpTimer -= deltaTime;
            if (this.powerUpTimer <= 0) {
                this.deactivatePowerUp();
            }
        }
        
        // キーボード入力による移動
        if (this.keys.left) {
            this.x -= this.speed;
        }
        if (this.keys.right) {
            this.x += this.speed;
        }
        
        // マウス/タッチによる移動
        if (this.targetX !== null) {
            const diff = this.targetX - this.x;
            if (Math.abs(diff) > this.speed) {
                this.x += diff > 0 ? this.speed : -this.speed;
            } else {
                this.x = this.targetX;
            }
        }
        
        // 画面端での制限
        this.x = Math.max(0, Math.min(this.canvasWidth - this.width, this.x));
    }
    
    /**
     * 描画処理
     */
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // パワーアップ中の視覚効果
        if (this.powerUpActive) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
        }
    }
    
    /**
     * パワーアップの適用
     */
    activatePowerUp(type, duration = 10000) {
        this.powerUpActive = true;
        this.powerUpType = type;
        this.powerUpTimer = duration;
        
        switch(type) {
            case 'WIDE_PADDLE':
                this.width = this.defaultWidth * 1.5;
                // 位置調整（中心を保つ）
                this.x -= (this.width - this.defaultWidth) / 2;
                this.x = Math.max(0, Math.min(this.canvasWidth - this.width, this.x));
                break;
        }
    }
    
    /**
     * パワーアップの解除
     */
    deactivatePowerUp() {
        switch(this.powerUpType) {
            case 'WIDE_PADDLE':
                // 位置調整（中心を保つ）
                this.x += (this.width - this.defaultWidth) / 2;
                this.width = this.defaultWidth;
                break;
        }
        
        this.powerUpActive = false;
        this.powerUpType = null;
        this.powerUpTimer = 0;
    }
    
    /**
     * リセット
     */
    reset() {
        this.x = (this.canvasWidth - this.width) / 2;
        this.y = this.canvasHeight - 30 - this.height;
        this.keys.left = false;
        this.keys.right = false;
        this.targetX = null;
        this.deactivatePowerUp();
    }
    
    /**
     * 難易度による設定
     */
    setDifficulty(difficulty) {
        switch(difficulty) {
            case 'easy':
                this.defaultWidth = 120;
                break;
            case 'normal':
                this.defaultWidth = 100;
                break;
            case 'hard':
                this.defaultWidth = 80;
                break;
        }
        
        // パワーアップ中でなければ幅を更新
        if (!this.powerUpActive) {
            this.width = this.defaultWidth;
        }
    }
    
    /**
     * 境界ボックスの取得（衝突判定用）
     */
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    /**
     * イベントリスナーのクリーンアップ
     */
    destroy() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('touchmove', this.handleTouchMove);
    }
}