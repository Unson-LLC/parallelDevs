import { Vector2D } from '../src/js/vector2d.js';

describe('Vector2D', () => {
  describe('コンストラクタ', () => {
    it('x, y座標で初期化できる', () => {
      const vector = new Vector2D(3, 4);
      expect(vector.getX()).toBe(3);
      expect(vector.getY()).toBe(4);
    });
  });

  describe('加算', () => {
    it('2つのベクトルを加算できる', () => {
      const v1 = new Vector2D(1, 2);
      const v2 = new Vector2D(3, 4);
      const result = v1.add(v2);
      
      expect(result.getX()).toBe(4);
      expect(result.getY()).toBe(6);
    });

    it('元のベクトルは変更されない', () => {
      const v1 = new Vector2D(1, 2);
      const v2 = new Vector2D(3, 4);
      v1.add(v2);
      
      expect(v1.getX()).toBe(1);
      expect(v1.getY()).toBe(2);
    });
  });

  describe('減算', () => {
    it('2つのベクトルを減算できる', () => {
      const v1 = new Vector2D(5, 7);
      const v2 = new Vector2D(2, 3);
      const result = v1.subtract(v2);
      
      expect(result.getX()).toBe(3);
      expect(result.getY()).toBe(4);
    });

    it('元のベクトルは変更されない', () => {
      const v1 = new Vector2D(5, 7);
      const v2 = new Vector2D(2, 3);
      v1.subtract(v2);
      
      expect(v1.getX()).toBe(5);
      expect(v1.getY()).toBe(7);
    });
  });

  describe('スカラー倍', () => {
    it('ベクトルをスカラー倍できる', () => {
      const vector = new Vector2D(2, 3);
      const result = vector.multiply(3);
      
      expect(result.getX()).toBe(6);
      expect(result.getY()).toBe(9);
    });

    it('0倍すると零ベクトルになる', () => {
      const vector = new Vector2D(5, 7);
      const result = vector.multiply(0);
      
      expect(result.getX()).toBe(0);
      expect(result.getY()).toBe(0);
    });

    it('元のベクトルは変更されない', () => {
      const vector = new Vector2D(2, 3);
      vector.multiply(3);
      
      expect(vector.getX()).toBe(2);
      expect(vector.getY()).toBe(3);
    });
  });

  describe('正規化', () => {
    it('ベクトルを正規化できる', () => {
      const vector = new Vector2D(3, 4);
      const result = vector.normalize();
      
      expect(result.getX()).toBeCloseTo(0.6);
      expect(result.getY()).toBeCloseTo(0.8);
      expect(result.magnitude()).toBeCloseTo(1);
    });

    it('零ベクトルの正規化は零ベクトルを返す', () => {
      const vector = new Vector2D(0, 0);
      const result = vector.normalize();
      
      expect(result.getX()).toBe(0);
      expect(result.getY()).toBe(0);
    });

    it('元のベクトルは変更されない', () => {
      const vector = new Vector2D(3, 4);
      vector.normalize();
      
      expect(vector.getX()).toBe(3);
      expect(vector.getY()).toBe(4);
    });
  });

  describe('大きさ', () => {
    it('ベクトルの大きさを計算できる', () => {
      const vector = new Vector2D(3, 4);
      expect(vector.magnitude()).toBe(5);
    });

    it('零ベクトルの大きさは0', () => {
      const vector = new Vector2D(0, 0);
      expect(vector.magnitude()).toBe(0);
    });
  });

  describe('内積', () => {
    it('2つのベクトルの内積を計算できる', () => {
      const v1 = new Vector2D(2, 3);
      const v2 = new Vector2D(4, 5);
      expect(v1.dot(v2)).toBe(23); // 2*4 + 3*5 = 8 + 15 = 23
    });

    it('直交するベクトルの内積は0', () => {
      const v1 = new Vector2D(1, 0);
      const v2 = new Vector2D(0, 1);
      expect(v1.dot(v2)).toBe(0);
    });
  });

  describe('ゲッターとセッター', () => {
    it('X座標を取得・設定できる', () => {
      const vector = new Vector2D(1, 2);
      expect(vector.getX()).toBe(1);
      
      vector.setX(5);
      expect(vector.getX()).toBe(5);
      expect(vector.getY()).toBe(2); // Y座標は変更されない
    });

    it('Y座標を取得・設定できる', () => {
      const vector = new Vector2D(1, 2);
      expect(vector.getY()).toBe(2);
      
      vector.setY(7);
      expect(vector.getY()).toBe(7);
      expect(vector.getX()).toBe(1); // X座標は変更されない
    });
  });
});