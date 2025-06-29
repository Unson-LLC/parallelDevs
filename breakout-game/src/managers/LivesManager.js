class LivesManager {
  constructor(initialLives = 3) {
    this._initialLives = initialLives;
    this._lives = initialLives;
  }

  reset() {
    this._lives = this._initialLives;
  }

  loseLife() {
    if (this._lives > 0) {
      this._lives--;
    }
    return this._lives <= 0;
  }

  getLives() {
    return this._lives;
  }

  isGameOver() {
    return this._lives <= 0;
  }
}

export { LivesManager };