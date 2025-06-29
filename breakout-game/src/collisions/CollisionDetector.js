/**
 * 衝突判定を行うクラス
 */
class CollisionDetector {
  // バウンス角度の定数
  static MIN_BOUNCE_ANGLE = Math.PI / 6;      // 30度
  static MAX_BOUNCE_ANGLE = Math.PI * 5 / 6;  // 150度
  static CENTER_BOUNCE_ANGLE = Math.PI / 2;   // 90度
  /**
   * ボールとパドルの衝突判定
   * @param {Object} ball - ボールオブジェクト（x, y, radius）
   * @param {Object} paddle - パドルオブジェクト（x, y, width, height）
   * @returns {boolean} 衝突している場合はtrue
   */
  detectBallPaddleCollision(ball, paddle) {
    // 矩形と円の衝突判定アルゴリズム
    return this._detectBallRectCollision(ball, paddle);
  }

  /**
   * ボールとブロックの衝突判定
   * @param {Object} ball - ボールオブジェクト（x, y, radius）
   * @param {Object} block - ブロックオブジェクト（x, y, width, height）
   * @returns {boolean} 衝突している場合はtrue
   */
  detectBallBlockCollision(ball, block) {
    // 矩形と円の衝突判定アルゴリズム
    return this._detectBallRectCollision(ball, block);
  }

  /**
   * ボールと矩形の衝突判定（内部メソッド）
   * @private
   * @param {Object} ball - ボールオブジェクト（x, y, radius）
   * @param {Object} rect - 矩形オブジェクト（x, y, width, height）
   * @returns {boolean} 衝突している場合はtrue
   */
  _detectBallRectCollision(ball, rect) {
    // 矩形の端の座標を計算
    const rectLeft = rect.x;
    const rectRight = rect.x + rect.width;
    const rectTop = rect.y;
    const rectBottom = rect.y + rect.height;

    // ボールの中心から矩形への最近点を見つける
    const closestX = Math.max(rectLeft, Math.min(ball.x, rectRight));
    const closestY = Math.max(rectTop, Math.min(ball.y, rectBottom));

    // ボールの中心から最近点までの距離を計算
    const distanceX = ball.x - closestX;
    const distanceY = ball.y - closestY;
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;

    // 距離がボールの半径以下なら衝突している
    return distanceSquared <= ball.radius * ball.radius;
  }

  /**
   * ボールと壁の衝突判定
   * @param {Object} ball - ボールオブジェクト（x, y, radius）
   * @param {number} canvasWidth - キャンバスの幅
   * @param {number} canvasHeight - キャンバスの高さ
   * @returns {Object} 各壁との衝突状態（top, left, right, bottom）
   */
  detectBallWallCollision(ball, canvasWidth, canvasHeight) {
    // 各壁との衝突を個別に判定
    const collisions = {
      top: ball.y - ball.radius <= 0,
      left: ball.x - ball.radius <= 0,
      right: ball.x + ball.radius >= canvasWidth,
      bottom: ball.y + ball.radius >= canvasHeight
    };

    return collisions;
  }

  /**
   * パドルとの衝突時のバウンス角度を計算
   * @param {Object} ball - ボールオブジェクト（x, y, radius）
   * @param {Object} paddle - パドルオブジェクト（x, y, width, height）
   * @returns {number} バウンス角度（ラジアン）
   */
  calculateBounceAngle(ball, paddle) {
    // パドルの中心座標を計算
    const paddleCenter = paddle.x + paddle.width / 2;
    
    // ボールがパドルのどこに当たったかを計算（-1 〜 1の範囲）
    const hitPosition = (ball.x - paddleCenter) / (paddle.width / 2);
    
    // hitPositionを-1〜1の範囲に制限
    const normalizedHitPosition = Math.max(-1, Math.min(1, hitPosition));
    
    // バウンス角度を計算（30度〜150度の範囲）
    // -1（左端）→ 150度（5π/6）
    //  0（中央）→ 90度（π/2）
    //  1（右端）→ 30度（π/6）
    
    // 線形補間を使って角度を計算
    if (normalizedHitPosition < 0) {
      // 左側に当たった場合（90度〜150度）
      return CollisionDetector.CENTER_BOUNCE_ANGLE + 
             (-normalizedHitPosition) * (CollisionDetector.MAX_BOUNCE_ANGLE - CollisionDetector.CENTER_BOUNCE_ANGLE);
    } else {
      // 右側に当たった場合（30度〜90度）
      return CollisionDetector.CENTER_BOUNCE_ANGLE - 
             normalizedHitPosition * (CollisionDetector.CENTER_BOUNCE_ANGLE - CollisionDetector.MIN_BOUNCE_ANGLE);
    }
  }
}

export { CollisionDetector };