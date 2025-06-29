class Block {
  constructor(x, y, width, height, color, points) {
    this._x = x;
    this._y = y;
    this._width = width;
    this._height = height;
    this._color = color;
    this._points = points;
    this._destroyed = false;
  }

  hit() {
    this._destroyed = true;
  }

  isDestroyed() {
    return this._destroyed;
  }

  getPosition() {
    return { x: this._x, y: this._y };
  }

  getDimensions() {
    return { width: this._width, height: this._height };
  }

  getPoints() {
    return this._points;
  }

  getColor() {
    return this._color;
  }
}

export { Block };