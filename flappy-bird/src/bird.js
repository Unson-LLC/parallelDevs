// Birdクラス - TDD実装
class Bird {
    constructor(x, y) {
        // 位置
        this.x = x !== undefined ? x : 50;
        this.y = y !== undefined ? y : 300;
        this.initialX = this.x;
        this.initialY = this.y;
        
        // 物理パラメータ
        this.velocity = 0;
        this.gravity = 0.6;
        this.jumpPower = -12;
        
        // 表示パラメータ
        this.width = 34;
        this.height = 24;
        this.color = '#FFD700';
        
        // 状態
        this.alive = true;
        
        console.log('Bird created at x:', this.x, 'y:', this.y, 'ground:', 600 - this.height, 'alive:', this.alive);
    }
    
    // 更新処理
    update() {
        if (!this.alive) return;
        
        // 重力を適用
        this.velocity += this.gravity;
        this.y += this.velocity;
        
        // 地面との衝突チェック
        if (this.y > 600 - this.height) {
            console.log('Bird hit ground! y:', this.y, 'ground:', 600 - this.height);
            this.y = 600 - this.height;
            this.velocity = 0;
            this.alive = false;
        }
        
        // 天井との衝突チェック
        if (this.y < 0) {
            console.log('Bird hit ceiling! y:', this.y);
            this.y = 0;
            this.velocity = 0;
        }
    }
    
    // ジャンプ
    jump() {
        console.log('Bird jump called, alive:', this.alive, 'velocity before:', this.velocity);
        if (!this.alive) return;
        this.velocity = this.jumpPower;
        console.log('Bird jump executed, velocity after:', this.velocity);
    }
    
    // 描画
    draw(ctx) {
        if (!ctx) return;
        
        console.log('Bird draw called at x:', this.x, 'y:', this.y, 'alive:', this.alive);
        
        // シンプルな矩形描画（デバッグ用）
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 目印として黒い枠線を追加
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
    
    // 当たり判定用の矩形を取得
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    // リセット
    reset() {
        this.x = this.initialX;
        this.y = this.initialY;
        this.velocity = 0;
        this.alive = true;
    }
    
    // 死亡状態にする
    die() {
        this.alive = false;
    }
    
    // 生存状態を取得
    isAlive() {
        return this.alive;
    }
}

export { Bird };
