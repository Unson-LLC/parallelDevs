/**
 * 衝突判定モジュール
 */

/**
 * 衝突判定クラス
 * ゲーム内の各種衝突判定を管理
 */
export class CollisionDetector {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }
  
  /**
   * 円と矩形の衝突判定
   * @param {Object} circle - 円オブジェクト {x, y, radius}
   * @param {Object} rect - 矩形オブジェクト {x, y, width, height}
   * @returns {Object|null} 衝突情報 {hit: boolean, side: string, point: {x, y}} または null
   */
  circleRectCollision(circle, rect) {
    // 矩形の境界
    const rectLeft = rect.x;
    const rectRight = rect.x + rect.width;
    const rectTop = rect.y;
    const rectBottom = rect.y + rect.height;
    
    // 円の中心から矩形への最近点を見つける
    const nearestX = Math.max(rectLeft, Math.min(circle.x, rectRight));
    const nearestY = Math.max(rectTop, Math.min(circle.y, rectBottom));
    
    // 最近点までの距離を計算
    const deltaX = circle.x - nearestX;
    const deltaY = circle.y - nearestY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // 衝突判定
    if (distance <= circle.radius) {
      // どの辺に衝突したかを判定
      let side = '';
      
      // 円の中心が矩形の内部にある場合
      if (circle.x >= rectLeft && circle.x <= rectRight &&
          circle.y >= rectTop && circle.y <= rectBottom) {
        // 各辺までの距離を計算
        const distToLeft = circle.x - rectLeft;
        const distToRight = rectRight - circle.x;
        const distToTop = circle.y - rectTop;
        const distToBottom = rectBottom - circle.y;
        
        // 最も近い辺を特定
        const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
        
        if (minDist === distToLeft) side = 'left';
        else if (minDist === distToRight) side = 'right';
        else if (minDist === distToTop) side = 'top';
        else side = 'bottom';
      } else {
        // 円の中心が矩形の外部にある場合
        if (nearestX === rectLeft) side = 'left';
        else if (nearestX === rectRight) side = 'right';
        else if (nearestY === rectTop) side = 'top';
        else if (nearestY === rectBottom) side = 'bottom';
        
        // コーナーの場合
        if (nearestX === circle.x) {
          side = (nearestY === rectTop) ? 'top' : 'bottom';
        } else if (nearestY === circle.y) {
          side = (nearestX === rectLeft) ? 'left' : 'right';
        }
      }
      
      return {
        hit: true,
        side: side,
        point: { x: nearestX, y: nearestY },
        normal: this.getSideNormal(side)
      };
    }
    
    return null;
  }
  
  /**
   * ボールと壁の衝突判定
   * @param {Object} ball - ボールオブジェクト {x, y, radius, vx, vy}
   * @returns {Object} 衝突情報 {left, right, top, bottom}
   */
  checkWallCollision(ball) {
    const collision = {
      left: false,
      right: false,
      top: false,
      bottom: false
    };
    
    // 左壁
    if (ball.x - ball.radius <= 0) {
      collision.left = true;
      ball.x = ball.radius; // 壁にめり込まないよう位置を補正
    }
    
    // 右壁
    if (ball.x + ball.radius >= this.canvasWidth) {
      collision.right = true;
      ball.x = this.canvasWidth - ball.radius;
    }
    
    // 上壁
    if (ball.y - ball.radius <= 0) {
      collision.top = true;
      ball.y = ball.radius;
    }
    
    // 下壁（ゲームオーバー判定用）
    if (ball.y - ball.radius >= this.canvasHeight) {
      collision.bottom = true;
    }
    
    return collision;
  }
  
  /**
   * ボールとパドルの衝突判定
   * @param {Object} ball - ボールオブジェクト
   * @param {Object} paddle - パドルオブジェクト {x, y, width, height}
   * @returns {Object|null} 衝突情報
   */
  checkPaddleCollision(ball, paddle) {
    // ボールが下方向に移動している場合のみ判定（無限ループ防止）
    if (ball.vy <= 0) return null;
    
    const collision = this.circleRectCollision(
      { x: ball.x, y: ball.y, radius: ball.radius },
      paddle
    );
    
    if (collision && collision.hit) {
      // パドルの上面との衝突のみ有効
      if (collision.side === 'top' || 
          (ball.y < paddle.y && Math.abs(ball.x - (paddle.x + paddle.width / 2)) < paddle.width / 2 + ball.radius)) {
        return {
          hit: true,
          paddleCenter: paddle.x + paddle.width / 2,
          paddleWidth: paddle.width,
          hitPoint: ball.x
        };
      }
    }
    
    return null;
  }
  
  /**
   * ボールとブロックの衝突判定
   * @param {Object} ball - ボールオブジェクト
   * @param {Object} block - ブロックオブジェクト {x, y, width, height, isDestroyed}
   * @returns {Object|null} 衝突情報
   */
  checkBlockCollision(ball, block) {
    // 既に破壊されているブロックはスキップ
    if (block.isDestroyed) return null;
    
    const collision = this.circleRectCollision(
      { x: ball.x, y: ball.y, radius: ball.radius },
      { x: block.x, y: block.y, width: block.width, height: block.height }
    );
    
    return collision;
  }
  
  /**
   * 複数のブロックとの衝突を検出
   * @param {Object} ball - ボールオブジェクト
   * @param {Array} blocks - ブロックの配列
   * @returns {Array} 衝突したブロックの情報配列
   */
  checkBlocksCollision(ball, blocks) {
    const collisions = [];
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const collision = this.checkBlockCollision(ball, block);
      
      if (collision) {
        collisions.push({
          block: block,
          blockIndex: i,
          collision: collision
        });
      }
    }
    
    return collisions;
  }
  
  /**
   * 衝突した辺の法線ベクトルを取得
   * @param {string} side - 衝突した辺 ('top', 'bottom', 'left', 'right')
   * @returns {Object} 法線ベクトル {x, y}
   */
  getSideNormal(side) {
    switch (side) {
      case 'top':
        return { x: 0, y: -1 };
      case 'bottom':
        return { x: 0, y: 1 };
      case 'left':
        return { x: -1, y: 0 };
      case 'right':
        return { x: 1, y: 0 };
      default:
        return { x: 0, y: 0 };
    }
  }
  
  /**
   * 衝突応答の処理（反射）
   * @param {Object} ball - ボールオブジェクト
   * @param {string} side - 衝突した辺
   */
  resolveCollision(ball, side) {
    switch (side) {
      case 'top':
      case 'bottom':
        ball.reflectY();
        break;
      case 'left':
      case 'right':
        ball.reflectX();
        break;
    }
  }
  
  /**
   * 壁との衝突を処理
   * @param {Object} ball - ボールオブジェクト
   * @param {Object} wallCollision - 壁衝突情報
   * @returns {boolean} ゲームオーバーかどうか
   */
  handleWallCollision(ball, wallCollision) {
    if (wallCollision.left || wallCollision.right) {
      ball.reflectX();
    }
    
    if (wallCollision.top) {
      ball.reflectY();
    }
    
    // 下壁に衝突した場合はゲームオーバー
    return wallCollision.bottom;
  }
  
  /**
   * パドルとの衝突を処理
   * @param {Object} ball - ボールオブジェクト
   * @param {Object} paddleCollision - パドル衝突情報
   */
  handlePaddleCollision(ball, paddleCollision) {
    if (paddleCollision && paddleCollision.hit) {
      // パドルの反射処理（physics.jsのメソッドを使用）
      ball.reflectFromPaddle(paddleCollision.paddleCenter, paddleCollision.paddleWidth);
    }
  }
  
  /**
   * ブロックとの衝突を処理
   * @param {Object} ball - ボールオブジェクト
   * @param {Array} blockCollisions - ブロック衝突情報の配列
   * @returns {Array} 破壊されたブロックの配列
   */
  handleBlockCollisions(ball, blockCollisions) {
    const destroyedBlocks = [];
    
    // 貫通ボールでない場合は最初の衝突のみ処理
    if (!ball.isPowerBall && blockCollisions.length > 0) {
      const collision = blockCollisions[0];
      
      // 反射処理
      this.resolveCollision(ball, collision.collision.side);
      
      // ブロックにダメージを与える
      if (this.damageBlock(collision.block)) {
        destroyedBlocks.push(collision);
      }
      
      ball.onHit();
    } else if (ball.isPowerBall) {
      // 貫通ボールの場合、すべてのブロックを破壊
      for (const collision of blockCollisions) {
        if (this.damageBlock(collision.block)) {
          destroyedBlocks.push(collision);
        }
      }
      
      if (blockCollisions.length > 0) {
        ball.onHit();
      }
    }
    
    return destroyedBlocks;
  }
  
  /**
   * ブロックにダメージを与える
   * @param {Object} block - ブロックオブジェクト
   * @returns {boolean} ブロックが破壊されたかどうか
   */
  damageBlock(block) {
    // 破壊不可能ブロックの場合
    if (block.type === 'unbreakable') {
      return false;
    }
    
    // ヒットポイントを減らす
    block.hitPoints = (block.hitPoints || 1) - 1;
    
    // ブロックが破壊された場合
    if (block.hitPoints <= 0) {
      block.isDestroyed = true;
      return true;
    }
    
    return false;
  }
}

/**
 * 衝突判定のヘルパー関数
 */
export const CollisionHelper = {
  /**
   * 2つの矩形が重なっているかを判定
   * @param {Object} rect1 - 矩形1 {x, y, width, height}
   * @param {Object} rect2 - 矩形2 {x, y, width, height}
   * @returns {boolean} 重なっているかどうか
   */
  rectIntersectsRect(rect1, rect2) {
    return !(rect1.x + rect1.width < rect2.x ||
             rect2.x + rect2.width < rect1.x ||
             rect1.y + rect1.height < rect2.y ||
             rect2.y + rect2.height < rect1.y);
  },
  
  /**
   * 点が矩形内にあるかを判定
   * @param {Object} point - 点 {x, y}
   * @param {Object} rect - 矩形 {x, y, width, height}
   * @returns {boolean} 点が矩形内にあるかどうか
   */
  pointInRect(point, rect) {
    return point.x >= rect.x &&
           point.x <= rect.x + rect.width &&
           point.y >= rect.y &&
           point.y <= rect.y + rect.height;
  },
  
  /**
   * 2つの円が重なっているかを判定
   * @param {Object} circle1 - 円1 {x, y, radius}
   * @param {Object} circle2 - 円2 {x, y, radius}
   * @returns {boolean} 重なっているかどうか
   */
  circleIntersectsCircle(circle1, circle2) {
    const dx = circle2.x - circle1.x;
    const dy = circle2.y - circle1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < circle1.radius + circle2.radius;
  }
};