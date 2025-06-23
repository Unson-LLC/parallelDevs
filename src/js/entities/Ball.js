import { Ball as PhysicsBall } from '../physics.js';

/**
 * ボールエンティティクラス
 * 物理演算のBallクラスを拡張し、描画機能を追加
 */
export class Ball extends PhysicsBall {
    constructor(x, y, radius, speedX, speedY) {
        super(x, y, radius, speedX, speedY);
        
        // 描画関連
        this.color = '#FFFFFF';
        this.trailPositions = []; // トレイル効果用
        this.maxTrailLength = 10;
        
        // パワーアップ状態の視覚効果
        this.glowEffect = false;
    }
    
    /**
     * 更新処理（物理演算を含む）
     */
    update(deltaTime) {
        // 前の位置を記録（トレイル効果用）
        if (this.trailPositions.length >= this.maxTrailLength) {
            this.trailPositions.shift();
        }
        this.trailPositions.push({ x: this.x, y: this.y });
        
        // 物理演算の更新
        this.updatePosition(deltaTime);
        
        // パワーボール時の視覚効果
        this.glowEffect = this.isPowerBall;
    }
    
    /**
     * 描画処理
     */
    draw(ctx) {
        // トレイル効果の描画
        if (this.speed > 8) { // 高速時のみトレイル表示
            this.drawTrail(ctx);
        }
        
        // パワーボール時のグロー効果
        if (this.glowEffect) {
            this.drawGlow(ctx);
        }
        
        // ボール本体の描画
        ctx.fillStyle = this.isPowerBall ? '#FFD700' : this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // パワーボール時の追加効果
        if (this.isPowerBall) {
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
    
    /**
     * トレイル効果の描画
     */
    drawTrail(ctx) {
        this.trailPositions.forEach((pos, index) => {
            const alpha = (index + 1) / this.trailPositions.length * 0.3;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            const trailRadius = this.radius * (index + 1) / this.trailPositions.length;
            ctx.arc(pos.x, pos.y, trailRadius, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    /**
     * グロー効果の描画
     */
    drawGlow(ctx) {
        const gradient = ctx.createRadialGradient(
            this.x, this.y, this.radius,
            this.x, this.y, this.radius * 2.5
        );
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * リセット
     */
    reset(x, y, speedX, speedY) {
        this.x = x;
        this.y = y;
        this.vx = speedX;
        this.vy = speedY;
        this.speed = Math.sqrt(speedX * speedX + speedY * speedY);
        this.isPowerBall = false;
        this.powerBallTimer = 0;
        this.hitCount = 0;
        this.trailPositions = [];
        this.glowEffect = false;
    }
    
    /**
     * 境界ボックスの取得（衝突判定用）
     */
    getBounds() {
        return {
            x: this.x - this.radius,
            y: this.y - this.radius,
            width: this.radius * 2,
            height: this.radius * 2,
            centerX: this.x,
            centerY: this.y,
            radius: this.radius
        };
    }
    
    /**
     * パドルとの衝突時の特殊効果
     */
    onPaddleHit(paddleX, paddleWidth) {
        // パドルの中心からの距離で反射角度を調整
        const paddleCenter = paddleX + paddleWidth / 2;
        const hitPosition = (this.x - paddleCenter) / (paddleWidth / 2); // -1 to 1
        
        // 反射角度の調整（最大45度）
        const maxAngle = Math.PI / 4; // 45度
        const angle = hitPosition * maxAngle;
        
        // 現在の速度を保持しつつ、新しい方向を設定
        const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        this.vx = currentSpeed * Math.sin(angle);
        this.vy = -Math.abs(currentSpeed * Math.cos(angle)); // 常に上向き
    }
}