/**
 * ボールの物理演算モジュール
 */

/**
 * ボールクラス
 * ボールの位置、速度、加速度を管理し、物理演算を行う
 */
export class Ball {
  constructor(x, y, radius = 5, speedX = 5, speedY = -5) {
    // 位置
    this.x = x;
    this.y = y;
    
    // サイズ
    this.radius = radius;
    
    // 速度ベクトル
    this.vx = speedX;
    this.vy = speedY;
    
    // 初期速度（リセット用）
    this.initialSpeed = Math.sqrt(speedX * speedX + speedY * speedY);
    
    // 最大速度
    this.maxSpeed = 12;
    
    // 加速率（10ヒットごとに0.1px/frame増加）
    this.accelerationRate = 0.1;
    this.hitCount = 0;
    
    // 特殊状態
    this.isPowerBall = false; // 貫通ボール
    this.powerBallTimer = 0;
  }
  
  /**
   * ボールの位置を更新
   * @param {number} deltaTime - 前フレームからの経過時間（通常は1）
   */
  update(deltaTime = 1) {
    // 位置を速度に基づいて更新
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    
    // パワーボールタイマーの更新
    if (this.powerBallTimer > 0) {
      this.powerBallTimer -= deltaTime;
      if (this.powerBallTimer <= 0) {
        this.isPowerBall = false;
      }
    }
    
    // 速度制限
    const currentSpeed = this.getSpeed();
    if (currentSpeed > this.maxSpeed) {
      const scale = this.maxSpeed / currentSpeed;
      this.vx *= scale;
      this.vy *= scale;
    }
  }
  
  /**
   * 現在の速度を取得
   * @returns {number} 速度の大きさ
   */
  getSpeed() {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
  }
  
  /**
   * 速度を設定
   * @param {number} speed - 新しい速度の大きさ
   */
  setSpeed(speed) {
    const currentSpeed = this.getSpeed();
    if (currentSpeed > 0) {
      const scale = speed / currentSpeed;
      this.vx *= scale;
      this.vy *= scale;
    }
  }
  
  /**
   * ヒット時の処理（加速など）
   */
  onHit() {
    this.hitCount++;
    
    // 10ヒットごとに加速
    if (this.hitCount % 10 === 0) {
      const currentSpeed = this.getSpeed();
      const newSpeed = Math.min(currentSpeed + this.accelerationRate, this.maxSpeed);
      this.setSpeed(newSpeed);
    }
  }
  
  /**
   * X軸方向の反射
   */
  reflectX() {
    this.vx = -this.vx;
  }
  
  /**
   * Y軸方向の反射
   */
  reflectY() {
    this.vy = -this.vy;
  }
  
  /**
   * 任意の角度で反射
   * @param {number} normalX - 反射面の法線ベクトルのX成分
   * @param {number} normalY - 反射面の法線ベクトルのY成分
   */
  reflect(normalX, normalY) {
    // 法線ベクトルを正規化
    const length = Math.sqrt(normalX * normalX + normalY * normalY);
    normalX /= length;
    normalY /= length;
    
    // 反射ベクトルの計算: v' = v - 2(v・n)n
    const dotProduct = this.vx * normalX + this.vy * normalY;
    this.vx = this.vx - 2 * dotProduct * normalX;
    this.vy = this.vy - 2 * dotProduct * normalY;
  }
  
  /**
   * パドルとの衝突による反射角度の計算
   * @param {number} paddleX - パドルの中心X座標
   * @param {number} paddleWidth - パドルの幅
   */
  reflectFromPaddle(paddleX, paddleWidth) {
    // パドルの中心からの距離を計算（-1〜1に正規化）
    const relativeIntersectX = (this.x - paddleX) / (paddleWidth / 2);
    
    // 反射角度を計算（最大60度）
    const maxBounceAngle = Math.PI / 3; // 60度
    const bounceAngle = relativeIntersectX * maxBounceAngle;
    
    // 現在の速度を保持
    const speed = this.getSpeed();
    
    // 新しい速度ベクトルを計算
    this.vx = speed * Math.sin(bounceAngle);
    this.vy = -speed * Math.cos(bounceAngle);
    
    // ヒット処理
    this.onHit();
  }
  
  /**
   * 貫通ボール状態を有効化
   * @param {number} duration - 効果時間（フレーム数）
   */
  enablePowerBall(duration) {
    this.isPowerBall = true;
    this.powerBallTimer = duration;
  }
  
  /**
   * ボールをリセット
   * @param {number} x - リセット位置X
   * @param {number} y - リセット位置Y
   */
  reset(x, y) {
    this.x = x;
    this.y = y;
    
    // 初期速度に戻す
    const angle = -Math.PI / 4 + Math.random() * Math.PI / 2; // -45度〜45度のランダムな角度
    this.vx = this.initialSpeed * Math.sin(angle);
    this.vy = -Math.abs(this.initialSpeed * Math.cos(angle)); // 必ず上方向
    
    // カウンターリセット
    this.hitCount = 0;
    
    // 特殊状態リセット
    this.isPowerBall = false;
    this.powerBallTimer = 0;
  }
  
  /**
   * ボールの境界ボックスを取得
   * @returns {Object} 境界ボックス {left, right, top, bottom}
   */
  getBounds() {
    return {
      left: this.x - this.radius,
      right: this.x + this.radius,
      top: this.y - this.radius,
      bottom: this.y + this.radius
    };
  }
}

/**
 * 物理演算ヘルパー関数
 */
export const PhysicsHelper = {
  /**
   * 2点間の距離を計算
   * @param {number} x1 - 点1のX座標
   * @param {number} y1 - 点1のY座標
   * @param {number} x2 - 点2のX座標
   * @param {number} y2 - 点2のY座標
   * @returns {number} 距離
   */
  distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  },
  
  /**
   * ベクトルの正規化
   * @param {number} x - ベクトルのX成分
   * @param {number} y - ベクトルのY成分
   * @returns {Object} 正規化されたベクトル {x, y}
   */
  normalize(x, y) {
    const length = Math.sqrt(x * x + y * y);
    if (length === 0) return { x: 0, y: 0 };
    return {
      x: x / length,
      y: y / length
    };
  },
  
  /**
   * 角度をラジアンに変換
   * @param {number} degrees - 角度（度）
   * @returns {number} ラジアン
   */
  degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
  },
  
  /**
   * ラジアンを角度に変換
   * @param {number} radians - ラジアン
   * @returns {number} 角度（度）
   */
  radiansToDegrees(radians) {
    return radians * 180 / Math.PI;
  }
};