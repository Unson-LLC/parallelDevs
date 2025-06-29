import { CollisionDetector } from '../../collisions/CollisionDetector.js';

describe('CollisionDetector', () => {
  let detector;

  beforeEach(() => {
    detector = new CollisionDetector();
  });

  describe('エッジケース', () => {
    it('半径0のボールでも正しく動作する', () => {
      const ball = { x: 100, y: 100, radius: 0 };
      const paddle = { x: 100, y: 100, width: 80, height: 10 };
      
      expect(detector.detectBallPaddleCollision(ball, paddle)).toBe(true);
    });

    it('非常に大きなボールでも正しく動作する', () => {
      const ball = { x: 400, y: 300, radius: 100 };
      const block = { x: 350, y: 250, width: 60, height: 20 };
      
      expect(detector.detectBallBlockCollision(ball, block)).toBe(true);
    });

    it('ボールが完全に矩形の内側にある場合も衝突と判定される', () => {
      const ball = { x: 100, y: 100, radius: 5 };
      const block = { x: 50, y: 50, width: 100, height: 100 };
      
      expect(detector.detectBallBlockCollision(ball, block)).toBe(true);
    });
  });

  describe('detectBallPaddleCollision', () => {
    it('衝突していない場合はfalseを返す', () => {
      const ball = { x: 100, y: 100, radius: 10 };
      const paddle = { x: 200, y: 500, width: 80, height: 10 };
      
      expect(detector.detectBallPaddleCollision(ball, paddle)).toBe(false);
    });

    it('ボールがパドルに衝突している場合はtrueを返す', () => {
      const ball = { x: 100, y: 495, radius: 10 };
      const paddle = { x: 60, y: 500, width: 80, height: 10 };
      
      expect(detector.detectBallPaddleCollision(ball, paddle)).toBe(true);
    });

    it('ボールがパドルの端に衝突している場合もtrueを返す', () => {
      const ball = { x: 140, y: 495, radius: 10 };
      const paddle = { x: 60, y: 500, width: 80, height: 10 };
      
      expect(detector.detectBallPaddleCollision(ball, paddle)).toBe(true);
    });

    it('異なる位置でのパドル衝突を正しく判定する', () => {
      // パドルが別の位置にある場合
      const ball = { x: 300, y: 445, radius: 10 };
      const paddle = { x: 250, y: 450, width: 100, height: 15 };
      
      expect(detector.detectBallPaddleCollision(ball, paddle)).toBe(true);
    });

    it('ボールがパドルの上を通過している場合はfalseを返す', () => {
      const ball = { x: 100, y: 480, radius: 10 };
      const paddle = { x: 60, y: 500, width: 80, height: 10 };
      
      expect(detector.detectBallPaddleCollision(ball, paddle)).toBe(false);
    });
  });

  describe('detectBallBlockCollision', () => {
    it('衝突していない場合はfalseを返す', () => {
      const ball = { x: 100, y: 100, radius: 10 };
      const block = { x: 200, y: 200, width: 60, height: 20 };
      
      expect(detector.detectBallBlockCollision(ball, block)).toBe(false);
    });

    it('ボールがブロックに衝突している場合はtrueを返す', () => {
      const ball = { x: 100, y: 100, radius: 10 };
      const block = { x: 95, y: 95, width: 60, height: 20 };
      
      expect(detector.detectBallBlockCollision(ball, block)).toBe(true);
    });

    it('ボールがブロックの角に衝突している場合もtrueを返す', () => {
      const ball = { x: 150, y: 95, radius: 10 };
      const block = { x: 95, y: 95, width: 60, height: 20 };
      
      expect(detector.detectBallBlockCollision(ball, block)).toBe(true);
    });

    it('異なるサイズのブロックとの衝突を正しく判定する', () => {
      const ball = { x: 400, y: 250, radius: 8 };
      const block = { x: 390, y: 240, width: 40, height: 30 };
      
      expect(detector.detectBallBlockCollision(ball, block)).toBe(true);
    });

    it('ボールがブロックのすぐ外側にある場合はfalseを返す', () => {
      const ball = { x: 100, y: 100, radius: 10 };
      const block = { x: 111, y: 111, width: 60, height: 20 };
      
      expect(detector.detectBallBlockCollision(ball, block)).toBe(false);
    });
  });

  describe('detectBallWallCollision', () => {
    it('壁に衝突していない場合は全てfalseを返す', () => {
      const ball = { x: 200, y: 200, radius: 10 };
      const canvasWidth = 800;
      const canvasHeight = 600;
      
      const result = detector.detectBallWallCollision(ball, canvasWidth, canvasHeight);
      
      expect(result.top).toBe(false);
      expect(result.left).toBe(false);
      expect(result.right).toBe(false);
      expect(result.bottom).toBe(false);
    });

    it('上の壁に衝突している場合はtopがtrueを返す', () => {
      const ball = { x: 200, y: 5, radius: 10 };
      const canvasWidth = 800;
      const canvasHeight = 600;
      
      const result = detector.detectBallWallCollision(ball, canvasWidth, canvasHeight);
      
      expect(result.top).toBe(true);
      expect(result.left).toBe(false);
      expect(result.right).toBe(false);
      expect(result.bottom).toBe(false);
    });

    it('左の壁に衝突している場合はleftがtrueを返す', () => {
      const ball = { x: 5, y: 200, radius: 10 };
      const canvasWidth = 800;
      const canvasHeight = 600;
      
      const result = detector.detectBallWallCollision(ball, canvasWidth, canvasHeight);
      
      expect(result.top).toBe(false);
      expect(result.left).toBe(true);
      expect(result.right).toBe(false);
      expect(result.bottom).toBe(false);
    });

    it('右の壁に衝突している場合はrightがtrueを返す', () => {
      const ball = { x: 795, y: 200, radius: 10 };
      const canvasWidth = 800;
      const canvasHeight = 600;
      
      const result = detector.detectBallWallCollision(ball, canvasWidth, canvasHeight);
      
      expect(result.top).toBe(false);
      expect(result.left).toBe(false);
      expect(result.right).toBe(true);
      expect(result.bottom).toBe(false);
    });

    it('下の壁に衝突している場合はbottomがtrueを返す', () => {
      const ball = { x: 200, y: 595, radius: 10 };
      const canvasWidth = 800;
      const canvasHeight = 600;
      
      const result = detector.detectBallWallCollision(ball, canvasWidth, canvasHeight);
      
      expect(result.top).toBe(false);
      expect(result.left).toBe(false);
      expect(result.right).toBe(false);
      expect(result.bottom).toBe(true);
    });
  });

  describe('calculateBounceAngle', () => {
    it('パドルの中央に当たった場合は垂直に跳ね返る（90度）', () => {
      const ball = { x: 100, y: 495, radius: 10 };
      const paddle = { x: 60, y: 500, width: 80, height: 10 };
      
      const angle = detector.calculateBounceAngle(ball, paddle);
      
      expect(angle).toBeCloseTo(Math.PI / 2); // 90度 = π/2ラジアン
    });

    it('パドルの左端に当たった場合は左に跳ね返る（150度）', () => {
      const ball = { x: 60, y: 495, radius: 10 };
      const paddle = { x: 60, y: 500, width: 80, height: 10 };
      
      const angle = detector.calculateBounceAngle(ball, paddle);
      
      expect(angle).toBeCloseTo(Math.PI * 5 / 6); // 150度 = 5π/6ラジアン
    });

    it('パドルの右端に当たった場合は右に跳ね返る（30度）', () => {
      const ball = { x: 140, y: 495, radius: 10 };
      const paddle = { x: 60, y: 500, width: 80, height: 10 };
      
      const angle = detector.calculateBounceAngle(ball, paddle);
      
      expect(angle).toBeCloseTo(Math.PI / 6); // 30度 = π/6ラジアン
    });

    it('パドルの左寄りに当たった場合は左寄りに跳ね返る', () => {
      const ball = { x: 80, y: 495, radius: 10 };
      const paddle = { x: 60, y: 500, width: 80, height: 10 };
      
      const angle = detector.calculateBounceAngle(ball, paddle);
      
      expect(angle).toBeGreaterThan(Math.PI / 2); // 90度より大きい
      expect(angle).toBeLessThan(Math.PI * 5 / 6); // 150度より小さい
    });

    it('パドルの右寄りに当たった場合は右寄りに跳ね返る', () => {
      const ball = { x: 120, y: 495, radius: 10 };
      const paddle = { x: 60, y: 500, width: 80, height: 10 };
      
      const angle = detector.calculateBounceAngle(ball, paddle);
      
      expect(angle).toBeGreaterThan(Math.PI / 6); // 30度より大きい
      expect(angle).toBeLessThan(Math.PI / 2); // 90度より小さい
    });
  });
});