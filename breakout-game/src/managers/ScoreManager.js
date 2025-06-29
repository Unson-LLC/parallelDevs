class ScoreManager {
  constructor() {
    this._score = 0;
    this._highScore = this._loadHighScore();
  }

  reset() {
    this._score = 0;
  }

  addScore(points) {
    this._score += points;
    return this._score;
  }

  getScore() {
    return this._score;
  }

  getHighScore() {
    return this._highScore;
  }

  saveHighScore() {
    if (this._score > this._highScore) {
      this._highScore = this._score;
      this._saveHighScore();
    }
  }

  _loadHighScore() {
    try {
      const saved = localStorage.getItem('breakout-highscore');
      return saved ? parseInt(saved, 10) : 0;
    } catch (e) {
      return 0;
    }
  }

  _saveHighScore() {
    try {
      localStorage.setItem('breakout-highscore', this._highScore.toString());
    } catch (e) {
      // ローカルストレージが使用できない場合は無視
    }
  }
}

export { ScoreManager };