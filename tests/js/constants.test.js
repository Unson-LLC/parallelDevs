// constants.test.js - 定数定義のテスト

import { 
  GAME_WIDTH, 
  GAME_HEIGHT, 
  PADDLE_WIDTH, 
  PADDLE_HEIGHT, 
  BALL_SIZE, 
  BLOCK_WIDTH, 
  BLOCK_HEIGHT, 
  BLOCK_ROWS, 
  BLOCK_COLS 
} from '../../src/js/constants.js';

describe('Constants', () => {
  describe('ゲーム領域の定数', () => {
    test('GAME_WIDTHが定義されている', () => {
      expect(GAME_WIDTH).toBeDefined();
      expect(typeof GAME_WIDTH).toBe('number');
      expect(GAME_WIDTH).toBeGreaterThan(0);
    });

    test('GAME_HEIGHTが定義されている', () => {
      expect(GAME_HEIGHT).toBeDefined();
      expect(typeof GAME_HEIGHT).toBe('number');
      expect(GAME_HEIGHT).toBeGreaterThan(0);
    });
  });

  describe('パドルの定数', () => {
    test('PADDLE_WIDTHが定義されている', () => {
      expect(PADDLE_WIDTH).toBeDefined();
      expect(typeof PADDLE_WIDTH).toBe('number');
      expect(PADDLE_WIDTH).toBeGreaterThan(0);
    });

    test('PADDLE_HEIGHTが定義されている', () => {
      expect(PADDLE_HEIGHT).toBeDefined();
      expect(typeof PADDLE_HEIGHT).toBe('number');
      expect(PADDLE_HEIGHT).toBeGreaterThan(0);
    });

    test('パドルのサイズがゲーム領域内に収まる', () => {
      expect(PADDLE_WIDTH).toBeLessThan(GAME_WIDTH);
      expect(PADDLE_HEIGHT).toBeLessThan(GAME_HEIGHT);
    });
  });

  describe('ボールの定数', () => {
    test('BALL_SIZEが定義されている', () => {
      expect(BALL_SIZE).toBeDefined();
      expect(typeof BALL_SIZE).toBe('number');
      expect(BALL_SIZE).toBeGreaterThan(0);
    });

    test('ボールのサイズがゲーム領域内に収まる', () => {
      expect(BALL_SIZE).toBeLessThan(GAME_WIDTH);
      expect(BALL_SIZE).toBeLessThan(GAME_HEIGHT);
    });
  });

  describe('ブロックの定数', () => {
    test('BLOCK_WIDTHが定義されている', () => {
      expect(BLOCK_WIDTH).toBeDefined();
      expect(typeof BLOCK_WIDTH).toBe('number');
      expect(BLOCK_WIDTH).toBeGreaterThan(0);
    });

    test('BLOCK_HEIGHTが定義されている', () => {
      expect(BLOCK_HEIGHT).toBeDefined();
      expect(typeof BLOCK_HEIGHT).toBe('number');
      expect(BLOCK_HEIGHT).toBeGreaterThan(0);
    });

    test('BLOCK_ROWSが定義されている', () => {
      expect(BLOCK_ROWS).toBeDefined();
      expect(typeof BLOCK_ROWS).toBe('number');
      expect(BLOCK_ROWS).toBeGreaterThan(0);
      expect(Number.isInteger(BLOCK_ROWS)).toBe(true);
    });

    test('BLOCK_COLSが定義されている', () => {
      expect(BLOCK_COLS).toBeDefined();
      expect(typeof BLOCK_COLS).toBe('number');
      expect(BLOCK_COLS).toBeGreaterThan(0);
      expect(Number.isInteger(BLOCK_COLS)).toBe(true);
    });

    test('ブロックの配置がゲーム領域内に収まる', () => {
      const totalBlocksWidth = BLOCK_COLS * BLOCK_WIDTH;
      const totalBlocksHeight = BLOCK_ROWS * BLOCK_HEIGHT;
      
      expect(totalBlocksWidth).toBeLessThanOrEqual(GAME_WIDTH);
      expect(totalBlocksHeight).toBeLessThan(GAME_HEIGHT); // ボールとパドルのスペースを考慮
    });
  });

  describe('定数の妥当性チェック', () => {
    test('ゲーム領域が適切なサイズである', () => {
      expect(GAME_WIDTH).toBeGreaterThanOrEqual(600);
      expect(GAME_WIDTH).toBeLessThanOrEqual(1200);
      expect(GAME_HEIGHT).toBeGreaterThanOrEqual(400);
      expect(GAME_HEIGHT).toBeLessThanOrEqual(800);
    });

    test('パドルがボールより大きい', () => {
      expect(PADDLE_WIDTH).toBeGreaterThan(BALL_SIZE);
    });

    test('ブロックがボールより大きい', () => {
      expect(BLOCK_WIDTH).toBeGreaterThan(BALL_SIZE);
      expect(BLOCK_HEIGHT).toBeGreaterThan(BALL_SIZE / 2);
    });
  });
});