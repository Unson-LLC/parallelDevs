import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { Bird } from '../src/bird.js';

describe('Bird', () => {
  let bird;

  beforeEach(() => {
    bird = new Bird(100, 200);
  });

  describe('constructor', () => {
    test('should be created with given x and y coordinates', () => {
      expect(bird).toBeDefined();
      expect(bird.x).toBe(100);
      expect(bird.y).toBe(200);
    });

    test('should be created with different coordinates', () => {
      const bird2 = new Bird(50, 150);
      
      expect(bird2.x).toBe(50);
      expect(bird2.y).toBe(150);
    });
  });

  describe('update', () => {
    test('should apply gravity and update position', () => {
      const initialY = bird.y;
      bird.update();
      
      expect(bird.y).toBeGreaterThan(initialY);
    });
  });

  describe('jump', () => {
    test('should give bird upward velocity', () => {
      bird.update(); // apply gravity first
      const yAfterGravity = bird.y;
      
      bird.jump();
      bird.update();
      
      expect(bird.y).toBeLessThan(yAfterGravity);
    });
  });

  describe('getBounds', () => {
    test('should return rectangle with position and size', () => {
      const bounds = bird.getBounds();
      
      expect(bounds).toHaveProperty('x');
      expect(bounds).toHaveProperty('y');
      expect(bounds).toHaveProperty('width');
      expect(bounds).toHaveProperty('height');
      expect(bounds.width).toBeGreaterThan(0);
      expect(bounds.height).toBeGreaterThan(0);
    });
  });

  describe('isAlive', () => {
    test('should return true initially', () => {
      expect(bird.isAlive()).toBe(true);
    });
  });

  describe('reset', () => {
    test('should reset bird to initial position', () => {
      bird.update();
      bird.jump();
      
      bird.reset();
      
      expect(bird.x).toBe(100);
      expect(bird.y).toBe(200);
    });
  });

  describe('draw', () => {
    test('should not throw error when called with context', () => {
      const mockCtx = {
        fillRect: jest.fn(),
        beginPath: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn()
      };
      
      expect(() => bird.draw(mockCtx)).not.toThrow();
    });
  });
});