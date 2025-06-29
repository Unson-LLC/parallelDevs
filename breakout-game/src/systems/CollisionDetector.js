class CollisionDetector {
  checkBallWallCollision(ball, canvasWidth, canvasHeight) {
    const pos = ball.getPosition();
    const radius = ball.getRadius();
    const collisions = {
      left: pos.x - radius <= 0,
      right: pos.x + radius >= canvasWidth,
      top: pos.y - radius <= 0,
      bottom: pos.y + radius >= canvasHeight
    };
    
    return collisions;
  }

  checkBallPaddleCollision(ball, paddle) {
    const ballPos = ball.getPosition();
    const ballRadius = ball.getRadius();
    const paddlePos = paddle.getPosition();
    const paddleDim = paddle.getDimensions();

    return (
      ballPos.x + ballRadius >= paddlePos.x &&
      ballPos.x - ballRadius <= paddlePos.x + paddleDim.width &&
      ballPos.y + ballRadius >= paddlePos.y &&
      ballPos.y - ballRadius <= paddlePos.y + paddleDim.height
    );
  }

  checkBallBlockCollision(ball, block) {
    if (block.isDestroyed()) {
      return false;
    }

    const ballPos = ball.getPosition();
    const ballRadius = ball.getRadius();
    const blockPos = block.getPosition();
    const blockDim = block.getDimensions();

    return (
      ballPos.x + ballRadius >= blockPos.x &&
      ballPos.x - ballRadius <= blockPos.x + blockDim.width &&
      ballPos.y + ballRadius >= blockPos.y &&
      ballPos.y - ballRadius <= blockPos.y + blockDim.height
    );
  }

  checkBallBottomCollision(ball, canvasHeight) {
    const pos = ball.getPosition();
    const radius = ball.getRadius();
    return pos.y + radius >= canvasHeight;
  }
}

export { CollisionDetector };