const CollisionDetector = require('../src/collision');

describe('CollisionDetector', () => {
  describe('detectRectCollision', () => {
    test('重なっている矩形を検出する', () => {
      const rect1 = { x: 0, y: 0, width: 50, height: 50 };
      const rect2 = { x: 25, y: 25, width: 50, height: 50 };
      
      expect(CollisionDetector.detectRectCollision(rect1, rect2)).toBe(true);
    });

    test('重なっていない矩形を検出しない', () => {
      const rect1 = { x: 0, y: 0, width: 50, height: 50 };
      const rect2 = { x: 100, y: 100, width: 50, height: 50 };
      
      expect(CollisionDetector.detectRectCollision(rect1, rect2)).toBe(false);
    });

    test('隣接している矩形（境界線上）を検出しない', () => {
      const rect1 = { x: 0, y: 0, width: 50, height: 50 };
      const rect2 = { x: 50, y: 0, width: 50, height: 50 };
      
      expect(CollisionDetector.detectRectCollision(rect1, rect2)).toBe(false);
    });

    test('完全に内包される矩形を検出する', () => {
      const rect1 = { x: 0, y: 0, width: 100, height: 100 };
      const rect2 = { x: 25, y: 25, width: 50, height: 50 };
      
      expect(CollisionDetector.detectRectCollision(rect1, rect2)).toBe(true);
    });

    test('1ピクセルだけ重なる矩形を検出する', () => {
      const rect1 = { x: 0, y: 0, width: 50, height: 50 };
      const rect2 = { x: 49, y: 49, width: 50, height: 50 };
      
      expect(CollisionDetector.detectRectCollision(rect1, rect2)).toBe(true);
    });
  });

  describe('detectCircleRectCollision', () => {
    test('円の中心が矩形内にある場合を検出する', () => {
      const circle = { x: 50, y: 50, radius: 10 };
      const rect = { x: 0, y: 0, width: 100, height: 100 };
      
      expect(CollisionDetector.detectCircleRectCollision(circle, rect)).toBe(true);
    });

    test('円が矩形と重なっていない場合を検出しない', () => {
      const circle = { x: 200, y: 200, radius: 10 };
      const rect = { x: 0, y: 0, width: 100, height: 100 };
      
      expect(CollisionDetector.detectCircleRectCollision(circle, rect)).toBe(false);
    });

    test('円が矩形の辺に接触している場合を検出する', () => {
      const circle = { x: 110, y: 50, radius: 10 };
      const rect = { x: 0, y: 0, width: 100, height: 100 };
      
      expect(CollisionDetector.detectCircleRectCollision(circle, rect)).toBe(true);
    });

    test('円が矩形の角に接触している場合を検出する', () => {
      const circle = { x: 107, y: 107, radius: 10 };
      const rect = { x: 0, y: 0, width: 100, height: 100 };
      
      expect(CollisionDetector.detectCircleRectCollision(circle, rect)).toBe(true);
    });

    test('円が矩形の角の外側にある場合を検出しない', () => {
      const circle = { x: 108, y: 108, radius: 10 };
      const rect = { x: 0, y: 0, width: 100, height: 100 };
      
      expect(CollisionDetector.detectCircleRectCollision(circle, rect)).toBe(false);
    });

    test('大きな円が小さな矩形を完全に包含する場合を検出する', () => {
      const circle = { x: 50, y: 50, radius: 100 };
      const rect = { x: 40, y: 40, width: 20, height: 20 };
      
      expect(CollisionDetector.detectCircleRectCollision(circle, rect)).toBe(true);
    });
  });

  describe('calculateBallReflection', () => {
    test('パドルの中央でボールが反射する場合、垂直に跳ね返る', () => {
      const ball = { x: 50, y: 90, vx: 0, vy: 5, radius: 5 };
      const paddle = { x: 0, y: 95, width: 100, height: 10 };
      
      const result = CollisionDetector.calculateBallReflection(ball, paddle);
      
      expect(result.vx).toBeCloseTo(0);
      expect(result.vy).toBeLessThan(0); // 上向き
      expect(Math.sqrt(result.vx ** 2 + result.vy ** 2)).toBeCloseTo(5); // 速度の大きさは保持
    });

    test('パドルの左端でボールが反射する場合、左に角度をつけて跳ね返る', () => {
      const ball = { x: 10, y: 90, vx: 0, vy: 5, radius: 5 };
      const paddle = { x: 0, y: 95, width: 100, height: 10 };
      
      const result = CollisionDetector.calculateBallReflection(ball, paddle);
      
      expect(result.vx).toBeLessThan(0); // 左向き
      expect(result.vy).toBeLessThan(0); // 上向き
      expect(Math.sqrt(result.vx ** 2 + result.vy ** 2)).toBeCloseTo(5);
    });

    test('パドルの右端でボールが反射する場合、右に角度をつけて跳ね返る', () => {
      const ball = { x: 90, y: 90, vx: 0, vy: 5, radius: 5 };
      const paddle = { x: 0, y: 95, width: 100, height: 10 };
      
      const result = CollisionDetector.calculateBallReflection(ball, paddle);
      
      expect(result.vx).toBeGreaterThan(0); // 右向き
      expect(result.vy).toBeLessThan(0); // 上向き
      expect(Math.sqrt(result.vx ** 2 + result.vy ** 2)).toBeCloseTo(5);
    });

    test('斜めに入射したボールも速度の大きさを保持する', () => {
      const ball = { x: 50, y: 90, vx: 3, vy: 4, radius: 5 };
      const paddle = { x: 0, y: 95, width: 100, height: 10 };
      
      const originalSpeed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
      const result = CollisionDetector.calculateBallReflection(ball, paddle);
      const newSpeed = Math.sqrt(result.vx ** 2 + result.vy ** 2);
      
      expect(newSpeed).toBeCloseTo(originalSpeed);
      expect(result.vy).toBeLessThan(0); // 必ず上向き
    });
  });

  describe('detectWallCollision', () => {
    const boundaries = { left: 0, right: 800, top: 0, bottom: 600 };

    test('左壁との衝突を検出する', () => {
      const ball = { x: 5, y: 300, radius: 10 };
      
      expect(CollisionDetector.detectWallCollision(ball, boundaries)).toBe('left');
    });

    test('右壁との衝突を検出する', () => {
      const ball = { x: 795, y: 300, radius: 10 };
      
      expect(CollisionDetector.detectWallCollision(ball, boundaries)).toBe('right');
    });

    test('上壁との衝突を検出する', () => {
      const ball = { x: 400, y: 5, radius: 10 };
      
      expect(CollisionDetector.detectWallCollision(ball, boundaries)).toBe('top');
    });

    test('下壁との衝突を検出する', () => {
      const ball = { x: 400, y: 595, radius: 10 };
      
      expect(CollisionDetector.detectWallCollision(ball, boundaries)).toBe('bottom');
    });

    test('壁に接触していない場合はnullを返す', () => {
      const ball = { x: 400, y: 300, radius: 10 };
      
      expect(CollisionDetector.detectWallCollision(ball, boundaries)).toBe(null);
    });

    test('複数の壁に同時に接触する場合（コーナー）、最初に検出された壁を返す', () => {
      const ball = { x: 5, y: 5, radius: 10 };
      
      const result = CollisionDetector.detectWallCollision(ball, boundaries);
      expect(['left', 'top']).toContain(result);
    });
  });
});