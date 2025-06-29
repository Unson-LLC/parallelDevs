class Paddle {
  constructor(x, y, width, height, speed) {
    this._initialX = x;
    this._x = x;
    this._y = y;
    this._width = width;
    this._height = height;
    this._speed = speed;
    this._isMovingLeft = false;
    this._isMovingRight = false;
  }

  moveLeft() {
    this._isMovingLeft = true;
  }

  moveRight() {
    this._isMovingRight = true;
  }

  stopMoving() {
    this._isMovingLeft = false;
    this._isMovingRight = false;
  }

  update(canvasWidth, dt = 1) {
    if (this._isMovingLeft) {
      this._x -= this._speed * dt;
    }
    if (this._isMovingRight) {
      this._x += this._speed * dt;
    }

    // 境界チェック
    if (this._x < 0) {
      this._x = 0;
    }
    if (this._x + this._width > canvasWidth) {
      this._x = canvasWidth - this._width;
    }
  }

  reset() {
    this._x = this._initialX;
    this._isMovingLeft = false;
    this._isMovingRight = false;
  }

  getPosition() {
    return { x: this._x, y: this._y };
  }

  getDimensions() {
    return { width: this._width, height: this._height };
  }
}

export { Paddle };