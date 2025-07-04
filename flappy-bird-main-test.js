// main.js 統合テスト（TDD t_wada方式）
// テストファースト→仮実装→三角測量→一般化

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { startGame, gameLoop } from '../flappy-bird/src/main.js';

// モックGameクラス
const mockGame = {
  isRunning: false,
  score: 0,
  gameState: 'menu',
  start: vi.fn(),
  update: vi.fn(),
  render: vi.fn(),
  handleInput: vi.fn(),
  reset: vi.fn()
};

// モック化
vi.mock('../flappy-bird/src/Game.js', () => ({
  Game: vi.fn(() => mockGame)
}));

// DOMモック
Object.defineProperty(global, 'document', {
  value: {
    getElementById: vi.fn(() => ({
      getContext: vi.fn(() => ({})),
      addEventListener: vi.fn()
    })),
    addEventListener: vi.fn()
  }
});

Object.defineProperty(global, 'requestAnimationFrame', {
  value: vi.fn()
});

describe('main.js 統合テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGame.isRunning = false;
    mockGame.score = 0;
    mockGame.gameState = 'menu';
  });

  describe('startGame関数', () => {
    it('Canvas要素を取得する', () => {
      startGame();
      expect(document.getElementById).toHaveBeenCalledWith('gameCanvas');
    });

    it('Gameインスタンスを作成する', () => {
      const { Game } = require('../flappy-bird/src/Game.js');
      startGame();
      expect(Game).toHaveBeenCalled();
    });

    it('キーボードイベントリスナーを登録する', () => {
      startGame();
      expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('ゲームループを開始する', () => {
      startGame();
      expect(requestAnimationFrame).toHaveBeenCalledWith(gameLoop);
    });

    // 三角測量：複数の条件でテスト
    it('Canvas要素が存在しない場合はエラーを投げる', () => {
      document.getElementById.mockReturnValue(null);
      expect(() => startGame()).toThrow('Canvas element not found');
    });
  });

  describe('gameLoop関数', () => {
    let mockTimestamp;

    beforeEach(() => {
      mockTimestamp = 16.67; // 60FPS相当
      mockGame.isRunning = true;
    });

    it('ゲーム状態を更新する', () => {
      gameLoop(mockTimestamp);
      expect(mockGame.update).toHaveBeenCalled();
    });

    it('描画処理を実行する', () => {
      gameLoop(mockTimestamp);
      expect(mockGame.render).toHaveBeenCalled();
    });

    it('次フレームを予約する', () => {
      gameLoop(mockTimestamp);
      expect(requestAnimationFrame).toHaveBeenCalledWith(gameLoop);
    });

    it('デルタタイムを正しく計算する', () => {
      gameLoop(33.34); // 30FPS相当
      const deltaTime = mockGame.update.mock.calls[0][0];
      expect(deltaTime).toBeCloseTo(0.033, 3);
    });

    // 三角測量：ゲーム停止状態
    it('ゲームが停止状態の場合は更新しない', () => {
      mockGame.isRunning = false;
      gameLoop(mockTimestamp);
      expect(mockGame.update).not.toHaveBeenCalled();
    });

    // 三角測量：異常な時間値
    it('異常なタイムスタンプでもエラーを投げない', () => {
      expect(() => gameLoop(-1)).not.toThrow();
      expect(() => gameLoop(Infinity)).not.toThrow();
      expect(() => gameLoop(NaN)).not.toThrow();
    });
  });

  describe('入力処理統合テスト', () => {
    let keydownHandler;

    beforeEach(() => {
      startGame();
      keydownHandler = document.addEventListener.mock.calls
        .find(call => call[0] === 'keydown')[1];
    });

    it('スペースキーでゲームにジャンプ入力を送る', () => {
      const event = { code: 'Space', preventDefault: vi.fn() };
      keydownHandler(event);
      expect(mockGame.handleInput).toHaveBeenCalledWith('jump');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('Enterキーでゲームリスタートする', () => {
      const event = { code: 'Enter', preventDefault: vi.fn() };
      mockGame.gameState = 'gameover';
      keydownHandler(event);
      expect(mockGame.reset).toHaveBeenCalled();
    });

    // 三角測量：複数のキー入力
    it('無効なキーは無視する', () => {
      const event = { code: 'KeyA', preventDefault: vi.fn() };
      keydownHandler(event);
      expect(mockGame.handleInput).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('UI更新統合テスト', () => {
    let scoreElement, statusElement;

    beforeEach(() => {
      scoreElement = { textContent: '' };
      statusElement = { textContent: '' };
      document.getElementById
        .mockReturnValueOnce({ getContext: () => ({}), addEventListener: vi.fn() }) // gameCanvas
        .mockReturnValueOnce(scoreElement) // scoreDisplay
        .mockReturnValueOnce(statusElement); // gameStatus
    });

    it('スコア表示を更新する', () => {
      mockGame.score = 42;
      startGame();
      gameLoop(16.67);
      expect(scoreElement.textContent).toBe('Score: 42');
    });

    it('ゲーム状態表示を更新する', () => {
      mockGame.gameState = 'playing';
      startGame();
      gameLoop(16.67);
      expect(statusElement.textContent).toBe('Playing');
    });

    // 三角測量：複数の状態
    it('ゲームオーバー状態を正しく表示する', () => {
      mockGame.gameState = 'gameover';
      startGame();
      gameLoop(16.67);
      expect(statusElement.textContent).toBe('Game Over');
    });
  });

  describe('パフォーマンステスト', () => {
    it('1000回のゲームループでメモリリークしない', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      startGame();
      
      for (let i = 0; i < 1000; i++) {
        gameLoop(i * 16.67);
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // メモリ増加が1MB以下であること
      expect(memoryIncrease).toBeLessThan(1024 * 1024);
    });

    it('60FPSでフレームレートが安定する', () => {
      const timestamps = [];
      const originalRAF = requestAnimationFrame;
      
      requestAnimationFrame.mockImplementation((callback) => {
        const timestamp = performance.now();
        timestamps.push(timestamp);
        if (timestamps.length < 60) {
          setTimeout(() => callback(timestamp), 16.67);
        }
      });

      startGame();
      
      return new Promise(resolve => {
        setTimeout(() => {
          const frameTimes = timestamps.slice(1).map((t, i) => t - timestamps[i]);
          const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
          
          // 60FPS(16.67ms)から±2ms以内
          expect(avgFrameTime).toBeCloseTo(16.67, 0);
          resolve();
        }, 1000);
      });
    });
  });
});

// E2Eシナリオテスト
describe('Flappy Bird E2E統合シナリオ', () => {
  it('完全なゲームプレイシナリオ', () => {
    // 1. ゲーム開始
    startGame();
    expect(mockGame.start).toHaveBeenCalled();

    // 2. 数フレーム実行
    for (let i = 0; i < 5; i++) {
      gameLoop(i * 16.67);
    }
    expect(mockGame.update).toHaveBeenCalledTimes(5);
    expect(mockGame.render).toHaveBeenCalledTimes(5);

    // 3. ジャンプ入力
    const keyHandler = document.addEventListener.mock.calls
      .find(call => call[0] === 'keydown')[1];
    keyHandler({ code: 'Space', preventDefault: vi.fn() });
    expect(mockGame.handleInput).toHaveBeenCalledWith('jump');

    // 4. ゲームオーバー
    mockGame.gameState = 'gameover';
    gameLoop(100);

    // 5. リスタート
    keyHandler({ code: 'Enter', preventDefault: vi.fn() });
    expect(mockGame.reset).toHaveBeenCalled();
  });
});