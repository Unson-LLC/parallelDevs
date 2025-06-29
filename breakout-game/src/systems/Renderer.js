class Renderer {
  constructor(canvas) {
    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');
  }

  clear() {
    this._ctx.fillStyle = '#000';
    this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
  }

  drawBall(ball) {
    const pos = ball.getPosition();
    const radius = ball.getRadius();

    this._ctx.beginPath();
    this._ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    this._ctx.fillStyle = '#00ff00';
    this._ctx.fill();
    this._ctx.closePath();
  }

  drawPaddle(paddle) {
    const pos = paddle.getPosition();
    const dim = paddle.getDimensions();

    this._ctx.fillStyle = '#00ff00';
    this._ctx.fillRect(pos.x, pos.y, dim.width, dim.height);
  }

  drawBlock(block) {
    if (block.isDestroyed()) {
      return;
    }

    const pos = block.getPosition();
    const dim = block.getDimensions();
    
    this._ctx.fillStyle = block.getColor();
    this._ctx.fillRect(pos.x, pos.y, dim.width, dim.height);
    
    // ブロックの境界線
    this._ctx.strokeStyle = '#ffffff';
    this._ctx.lineWidth = 1;
    this._ctx.strokeRect(pos.x, pos.y, dim.width, dim.height);
  }

  drawScore(score) {
    this._ctx.font = '20px Arial';
    this._ctx.fillStyle = '#00ff00';
    this._ctx.fillText(`Score: ${score}`, 10, 30);
  }

  drawLives(lives) {
    this._ctx.font = '20px Arial';
    this._ctx.fillStyle = '#00ff00';
    this._ctx.fillText(`Lives: ${lives}`, 10, 60);
  }

  drawGameState(state) {
    this._ctx.font = '30px Arial';
    this._ctx.fillStyle = '#00ff00';
    this._ctx.textAlign = 'center';
    
    const centerX = this._canvas.width / 2;
    const centerY = this._canvas.height / 2;
    
    switch (state) {
      case 'stopped':
        this._ctx.fillText('Press SPACE to Start', centerX, centerY);
        break;
      case 'paused':
        this._ctx.fillText('PAUSED - Press SPACE to Resume', centerX, centerY);
        break;
      case 'gameOver':
        this._ctx.fillText('GAME OVER - Press R to Restart', centerX, centerY);
        break;
    }
    
    this._ctx.textAlign = 'left';
  }
}

export { Renderer };