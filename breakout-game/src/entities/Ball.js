class Ball {
  constructor(x, y, radius, speedX, speedY) {
    this._initialX = x;
    this._initialY = y;
    this._x = x;
    this._y = y;
    this._radius = radius;
    this._speedX = speedX;
    this._speedY = speedY;
  }

  reset() {
    this._x = this._initialX;
    this._y = this._initialY;
  }

  update(dt) {
    this._x += this._speedX * dt;
    this._y += this._speedY * dt;
  }

  reverseX() {
    this._speedX = -this._speedX;
  }

  reverseY() {
    this._speedY = -this._speedY;
  }

  getPosition() {
    return { x: this._x, y: this._y };
  }

  getRadius() {
    return this._radius;
  }

  getVelocity() {
    return { x: this._speedX, y: this._speedY };
  }
}

export { Ball };