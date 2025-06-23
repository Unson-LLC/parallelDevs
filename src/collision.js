/**
 * 衝突判定を行うユーティリティクラス
 */
class CollisionDetector {
  /**
   * 矩形同士の衝突判定
   * @param {Object} rect1 - {x, y, width, height}
   * @param {Object} rect2 - {x, y, width, height}
   * @returns {boolean} 衝突している場合true
   */
  static detectRectCollision(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  /**
   * 円と矩形の衝突判定
   * @param {Object} circle - {x, y, radius}
   * @param {Object} rect - {x, y, width, height}
   * @returns {boolean} 衝突している場合true
   */
  static detectCircleRectCollision(circle, rect) {
    // 矩形の中心座標
    const rectCenterX = rect.x + rect.width / 2;
    const rectCenterY = rect.y + rect.height / 2;

    // 円の中心と矩形の中心の距離
    const distX = Math.abs(circle.x - rectCenterX);
    const distY = Math.abs(circle.y - rectCenterY);

    // 距離が大きすぎる場合は衝突していない
    if (distX > rect.width / 2 + circle.radius) return false;
    if (distY > rect.height / 2 + circle.radius) return false;

    // 矩形の内部に円の中心がある場合
    if (distX <= rect.width / 2) return true;
    if (distY <= rect.height / 2) return true;

    // 矩形の角との距離を計算
    const cornerDistSq =
      Math.pow(distX - rect.width / 2, 2) +
      Math.pow(distY - rect.height / 2, 2);

    return cornerDistSq <= Math.pow(circle.radius, 2);
  }

  /**
   * ボールの反射角度を計算
   * @param {Object} ball - {x, y, vx, vy, radius}
   * @param {Object} paddle - {x, y, width, height}
   * @returns {Object} 新しい速度ベクトル {vx, vy}
   */
  static calculateBallReflection(ball, paddle) {
    // パドルの中心からの相対位置 (-1 ~ 1)
    const paddleCenter = paddle.x + paddle.width / 2;
    const relativePosition = (ball.x - paddleCenter) / (paddle.width / 2);
    
    // 反射角度を計算 (最大45度)
    const maxAngle = Math.PI / 4; // 45度
    const angle = relativePosition * maxAngle;
    
    // 速度の大きさを保持
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    
    return {
      vx: speed * Math.sin(angle),
      vy: -Math.abs(speed * Math.cos(angle)) // 必ず上向きに
    };
  }

  /**
   * ボールと壁の衝突位置を判定
   * @param {Object} ball - {x, y, radius}
   * @param {Object} boundaries - {left, right, top, bottom}
   * @returns {string|null} 衝突した壁の位置 ('left', 'right', 'top', 'bottom') またはnull
   */
  static detectWallCollision(ball, boundaries) {
    if (ball.x - ball.radius <= boundaries.left) return 'left';
    if (ball.x + ball.radius >= boundaries.right) return 'right';
    if (ball.y - ball.radius <= boundaries.top) return 'top';
    if (ball.y + ball.radius >= boundaries.bottom) return 'bottom';
    return null;
  }
}

module.exports = CollisionDetector;