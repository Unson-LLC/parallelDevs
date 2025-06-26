import { BLOCK_DEFAULTS } from '../config/gameConstants.js';

// ブロックエンティティ
class Block {
  constructor(x, y, width, height, points = BLOCK_DEFAULTS.POINTS) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.points = points;
    this.destroyed = false;
  }

  // ヒット処理
  hit() {
    this.destroyed = true;
  }

  // 破壊されたか判定
  isDestroyed() {
    return this.destroyed;
  }

  // 位置を取得
  getPosition() {
    return { x: this.x, y: this.y };
  }

  // サイズを取得
  getDimensions() {
    return { width: this.width, height: this.height };
  }

  // ポイント数を取得
  getPoints() {
    return this.points;
  }
}

// 名前付きエクスポート
export { Block };