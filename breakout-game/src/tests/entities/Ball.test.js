import { Ball } from '../../entities/Ball.js';

describe('Ball', () => {
  describe('constructor', () => {
    it('初期化時に正しい位置と速度が設定される', () => {
      const ball = new Ball(100, 200, 5, 3, -4);
      
      const position = ball.getPosition();
      expect(position.x).toBe(100);
      expect(position.y).toBe(200);
      
      const velocity = ball.getVelocity();
      expect(velocity.x).toBe(3);
      expect(velocity.y).toBe(-4);
      
      expect(ball.getRadius()).toBe(5);
    });

    it('異なる初期値で正しく初期化される', () => {
      const ball = new Ball(50, 300, 10, -5, 7);
      
      const position = ball.getPosition();
      expect(position.x).toBe(50);
      expect(position.y).toBe(300);
      
      const velocity = ball.getVelocity();
      expect(velocity.x).toBe(-5);
      expect(velocity.y).toBe(7);
      
      expect(ball.getRadius()).toBe(10);
    });

    it('0の値でも正しく初期化される', () => {
      const ball = new Ball(0, 0, 1, 0, 0);
      
      const position = ball.getPosition();
      expect(position.x).toBe(0);
      expect(position.y).toBe(0);
      
      const velocity = ball.getVelocity();
      expect(velocity.x).toBe(0);
      expect(velocity.y).toBe(0);
      
      expect(ball.getRadius()).toBe(1);
    });
  });

  describe('reset', () => {
    it('初期位置にリセットされる', () => {
      const ball = new Ball(100, 200, 5, 3, -4);
      
      // 位置を更新
      ball.update(1);
      
      // リセット
      ball.reset();
      
      const position = ball.getPosition();
      expect(position.x).toBe(100);
      expect(position.y).toBe(200);
    });
  });

  describe('update', () => {
    it('デルタタイムに基づいて位置が更新される', () => {
      const ball = new Ball(100, 200, 5, 30, -40);
      
      ball.update(0.1); // 0.1秒
      
      const position = ball.getPosition();
      expect(position.x).toBe(103); // 100 + 30 * 0.1
      expect(position.y).toBe(196); // 200 + (-40) * 0.1
    });

    it('複数回の更新で累積的に位置が変わる', () => {
      const ball = new Ball(0, 0, 5, 10, 20);
      
      ball.update(0.5);
      ball.update(0.5);
      
      const position = ball.getPosition();
      expect(position.x).toBe(10); // 0 + 10 * 0.5 + 10 * 0.5
      expect(position.y).toBe(20); // 0 + 20 * 0.5 + 20 * 0.5
    });

    it('速度が0の場合は位置が変わらない', () => {
      const ball = new Ball(100, 100, 5, 0, 0);
      
      ball.update(1.0);
      
      const position = ball.getPosition();
      expect(position.x).toBe(100);
      expect(position.y).toBe(100);
    });
  });

  describe('reverseX', () => {
    it('X方向の速度が反転する', () => {
      const ball = new Ball(100, 200, 5, 3, -4);
      
      ball.reverseX();
      
      const velocity = ball.getVelocity();
      expect(velocity.x).toBe(-3);
      expect(velocity.y).toBe(-4);
    });

    it('2回反転すると元に戻る', () => {
      const ball = new Ball(100, 200, 5, 3, -4);
      
      ball.reverseX();
      ball.reverseX();
      
      const velocity = ball.getVelocity();
      expect(velocity.x).toBe(3);
      expect(velocity.y).toBe(-4);
    });
  });

  describe('reverseY', () => {
    it('Y方向の速度が反転する', () => {
      const ball = new Ball(100, 200, 5, 3, -4);
      
      ball.reverseY();
      
      const velocity = ball.getVelocity();
      expect(velocity.x).toBe(3);
      expect(velocity.y).toBe(4);
    });

    it('2回反転すると元に戻る', () => {
      const ball = new Ball(100, 200, 5, 3, -4);
      
      ball.reverseY();
      ball.reverseY();
      
      const velocity = ball.getVelocity();
      expect(velocity.x).toBe(3);
      expect(velocity.y).toBe(-4);
    });
  });

  describe('resetの詳細テスト', () => {
    it('速度を変更してもリセット後は初期位置に戻る', () => {
      const ball = new Ball(50, 100, 5, 20, -30);
      
      // 速度を反転させてから更新
      ball.reverseX();
      ball.reverseY();
      ball.update(1.0);
      
      // リセット
      ball.reset();
      
      const position = ball.getPosition();
      expect(position.x).toBe(50);
      expect(position.y).toBe(100);
      
      // 速度は反転したまま
      const velocity = ball.getVelocity();
      expect(velocity.x).toBe(-20);
      expect(velocity.y).toBe(30);
    });
  });
});