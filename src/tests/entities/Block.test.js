import { describe, test, expect } from '@jest/globals';
import { Block } from '../../entities/Block.js';

describe('Block', () => {
  describe('constructor', () => {
    test('正しい初期値でBlockが作成される', () => {
      const block = new Block(100, 50, 60, 20, 10);
      
      expect(block).toBeDefined();
      expect(block.x).toBe(100);
      expect(block.y).toBe(50);
      expect(block.width).toBe(60);
      expect(block.height).toBe(20);
      expect(block.points).toBe(10);
      expect(block.destroyed).toBe(false);
    });

    test('デフォルトポイントが1になる', () => {
      const block = new Block(0, 0, 50, 15);
      expect(block.points).toBe(1);
    });
  });

  describe('hit', () => {
    test('hit()を呼ぶとブロックが破壊される', () => {
      const block = new Block(100, 50, 60, 20, 10);
      expect(block.destroyed).toBe(false);
      
      block.hit();
      
      expect(block.destroyed).toBe(true);
    });
  });

  describe('isDestroyed', () => {
    test('初期状態ではfalseを返す', () => {
      const block = new Block(100, 50, 60, 20, 10);
      expect(block.isDestroyed()).toBe(false);
    });

    test('hit()の後はtrueを返す', () => {
      const block = new Block(100, 50, 60, 20, 10);
      block.hit();
      expect(block.isDestroyed()).toBe(true);
    });
  });

  describe('getPosition', () => {
    test('正しい位置オブジェクトを返す', () => {
      const block = new Block(150, 75, 60, 20, 10);
      const position = block.getPosition();
      
      expect(position).toEqual({ x: 150, y: 75 });
    });

    test('位置が変更されていないことを確認', () => {
      const block = new Block(200, 100, 60, 20, 10);
      const position1 = block.getPosition();
      const position2 = block.getPosition();
      
      expect(position1).toEqual(position2);
      expect(position1).toEqual({ x: 200, y: 100 });
    });
  });

  describe('getDimensions', () => {
    test('正しいサイズオブジェクトを返す', () => {
      const block = new Block(100, 50, 80, 25, 10);
      const dimensions = block.getDimensions();
      
      expect(dimensions).toEqual({ width: 80, height: 25 });
    });

    test('異なるサイズでも正しく動作する', () => {
      const block1 = new Block(0, 0, 100, 30, 5);
      const block2 = new Block(0, 0, 50, 15, 5);
      
      expect(block1.getDimensions()).toEqual({ width: 100, height: 30 });
      expect(block2.getDimensions()).toEqual({ width: 50, height: 15 });
    });
  });

  describe('getPoints', () => {
    test('設定したポイント数を返す', () => {
      const block = new Block(100, 50, 60, 20, 15);
      expect(block.getPoints()).toBe(15);
    });

    test('異なるポイント数でも正しく動作する', () => {
      const block1 = new Block(0, 0, 60, 20, 5);
      const block2 = new Block(0, 0, 60, 20, 10);
      const block3 = new Block(0, 0, 60, 20, 20);
      
      expect(block1.getPoints()).toBe(5);
      expect(block2.getPoints()).toBe(10);
      expect(block3.getPoints()).toBe(20);
    });

    test('ポイントを指定しない場合はデフォルト値を返す', () => {
      const block = new Block(0, 0, 60, 20);
      expect(block.getPoints()).toBe(1);
    });
  });
});