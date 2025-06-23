/**
 * ブロッククラス
 * ゲーム内のブロックを管理
 */
export class Block {
    constructor(x, y, width, height, type = 'normal', row = 0) {
        // 位置とサイズ
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        
        // ブロックタイプと属性
        this.type = type;
        this.row = row;
        this.hitPoints = this.getInitialHitPoints(type);
        this.maxHitPoints = this.hitPoints;
        this.score = this.getScoreValue(type);
        
        // 色設定
        this.color = this.getColor(type, row);
        
        // 状態
        this.isDestroyed = false;
        this.isAnimating = false;
        this.animationTimer = 0;
        
        // パワーアップドロップ
        this.powerUpType = null;
        this.powerUpDropChance = 0.2; // 20%の確率
        
        // エフェクト用
        this.particles = [];
        this.shakeAmount = 0;
    }
    
    /**
     * ブロックタイプによる初期HP設定
     */
    getInitialHitPoints(type) {
        switch(type) {
            case 'normal':
                return 1;
            case 'hard':
                return 2;
            case 'super_hard':
                return 3;
            case 'unbreakable':
                return Infinity;
            default:
                return 1;
        }
    }
    
    /**
     * ブロックタイプによるスコア値設定
     */
    getScoreValue(type) {
        switch(type) {
            case 'normal':
                return 10;
            case 'hard':
                return 20;
            case 'super_hard':
                return 30;
            case 'unbreakable':
                return 0;
            default:
                return 10;
        }
    }
    
    /**
     * ブロックの色設定
     */
    getColor(type, row) {
        if (type === 'unbreakable') {
            return '#808080'; // グレー
        } else if (type === 'hard') {
            return '#FFD700'; // ゴールド
        } else if (type === 'super_hard') {
            return '#FF4500'; // オレンジレッド
        }
        
        // 通常ブロックは行によって色分け
        const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082'];
        return colors[row % colors.length];
    }
    
    /**
     * ヒット処理
     */
    hit(isPowerBall = false) {
        if (this.type === 'unbreakable' && !isPowerBall) {
            // 破壊不可能ブロックは貫通ボール以外では破壊されない
            this.shakeAmount = 5;
            return false;
        }
        
        this.hitPoints--;
        
        if (this.hitPoints <= 0) {
            this.destroy();
            return true;
        } else {
            // ダメージエフェクト
            this.shakeAmount = 3;
            this.createHitParticles();
            return false;
        }
    }
    
    /**
     * 破壊処理
     */
    destroy() {
        this.isDestroyed = true;
        this.isAnimating = true;
        this.animationTimer = 500; // 0.5秒のアニメーション
        this.createDestroyParticles();
        
        // パワーアップドロップの判定
        if (Math.random() < this.powerUpDropChance && this.type !== 'unbreakable') {
            this.dropPowerUp();
        }
    }
    
    /**
     * パワーアップのドロップ
     */
    dropPowerUp() {
        const powerUpTypes = [
            'MULTI_BALL',
            'WIDE_PADDLE',
            'SLOW_BALL',
            'POWER_BALL',
            'EXTRA_LIFE',
            'MEGA_BALL'
        ];
        this.powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    }
    
    /**
     * ヒット時のパーティクル生成
     */
    createHitParticles() {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 20,
                color: this.color
            });
        }
    }
    
    /**
     * 破壊時のパーティクル生成
     */
    createDestroyParticles() {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: this.x + Math.random() * this.width,
                y: this.y + Math.random() * this.height,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 30,
                color: this.color,
                size: Math.random() * 5 + 2
            });
        }
    }
    
    /**
     * 更新処理
     */
    update(deltaTime) {
        // シェイクエフェクト
        if (this.shakeAmount > 0) {
            this.shakeAmount *= 0.9;
        }
        
        // アニメーションタイマー
        if (this.isAnimating && this.animationTimer > 0) {
            this.animationTimer -= deltaTime;
        }
        
        // パーティクルの更新
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.2; // 重力
            particle.life--;
            return particle.life > 0;
        });
    }
    
    /**
     * 描画処理
     */
    draw(ctx) {
        // パーティクルの描画
        this.particles.forEach(particle => {
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = particle.life / 30;
            const size = particle.size || 2;
            ctx.fillRect(particle.x - size/2, particle.y - size/2, size, size);
        });
        ctx.globalAlpha = 1;
        
        // ブロック本体の描画（破壊されていない場合）
        if (!this.isDestroyed) {
            ctx.save();
            
            // シェイクエフェクト
            if (this.shakeAmount > 0) {
                const shakeX = (Math.random() - 0.5) * this.shakeAmount;
                const shakeY = (Math.random() - 0.5) * this.shakeAmount;
                ctx.translate(shakeX, shakeY);
            }
            
            // ブロックの描画
            ctx.fillStyle = this.color;
            
            // ダメージ状態の表現
            if (this.hitPoints < this.maxHitPoints) {
                ctx.globalAlpha = 0.6 + (this.hitPoints / this.maxHitPoints) * 0.4;
            }
            
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // 枠線
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            
            // 硬いブロックの場合、残りHPを表示
            if (this.type !== 'normal' && this.type !== 'unbreakable' && this.hitPoints > 0) {
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.hitPoints.toString(), this.x + this.width / 2, this.y + this.height / 2);
            }
            
            ctx.restore();
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
     * パワーアップアイテムの取得
     */
    getPowerUp() {
        const powerUp = this.powerUpType;
        this.powerUpType = null;
        return powerUp;
    }
}

/**
 * ブロック配置を生成するヘルパークラス
 */
export class BlockLayout {
    static createStandardLayout(rows = 6, cols = 8, blockWidth = 75, blockHeight = 25, spacing = 5, topMargin = 60) {
        const blocks = [];
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * (blockWidth + spacing) + spacing;
                const y = row * (blockHeight + spacing) + topMargin;
                
                // 行によってブロックタイプを変える
                let type = 'normal';
                if (row === 0) {
                    type = 'hard';
                } else if (row === 1 && col % 2 === 0) {
                    type = 'hard';
                }
                
                blocks.push(new Block(x, y, blockWidth, blockHeight, type, row));
            }
        }
        
        return blocks;
    }
    
    static createCustomLayout(layout) {
        // カスタムレイアウトの作成（将来の拡張用）
        const blocks = [];
        // layout配列に基づいてブロックを配置
        return blocks;
    }
}