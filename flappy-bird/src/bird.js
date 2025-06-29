// Birdクラス - TDD実装
class Bird {
    constructor(x, y) {
        // 位置
        this.x = x || 50;
        this.y = y || 300;
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
    }
    
    // 更新処理
    update() {
        if (!this.alive) return;
        
        // 重力を適用
        this.velocity += this.gravity;
        this.y += this.velocity;
        
        // 地面との衝突チェック
        if (this.y > 600 - this.height) {
            this.y = 600 - this.height;
            this.velocity = 0;
            this.alive = false;
        }
        
        // 天井との衝突チェック
        if (this.y < 0) {
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
        
        ctx.save();
        
        // 鳥の回転（速度に応じて）
        const rotation = Math.min(Math.max(this.velocity * 0.05, -0.5), 0.5);
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(rotation);
        
        // 鳥の本体
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // 鳥の目
        ctx.fillStyle = '#FFF';
        ctx.fillRect(-this.width/2 + 20, -this.height/2 + 3, 8, 8);
        ctx.fillStyle = '#000';
        ctx.fillRect(-this.width/2 + 22, -this.height/2 + 5, 4, 4);
        
        // くちばし
        ctx.fillStyle = '#FF8C00';
        ctx.fillRect(this.width/2 - 15, -3, 10, 6);
        
        ctx.restore();
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
