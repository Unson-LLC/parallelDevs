class Bird {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.initialX = x;
    this.initialY = y;
    this.velocity = 0;
    this.gravity = 0.5;
    this.jumpPower = -8;
    this.width = 30;
    this.height = 30;
    this.alive = true;
  }

  update() {
    this.velocity += this.gravity;
    this.y += this.velocity;
  }

  jump() {
    this.velocity = this.jumpPower;
  }

  draw(ctx) {
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  reset() {
    this.x = this.initialX;
    this.y = this.initialY;
    this.velocity = 0;
    this.alive = true;
  }

  isAlive() {
    return this.alive;
  }
}

export { Bird };