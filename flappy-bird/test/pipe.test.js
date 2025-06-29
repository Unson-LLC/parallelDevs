/**
 * Pipeクラス テストファイル
 * TDD（t_wada方式）に従いテストファーストで作成
 */

// テスト対象クラスのインポート（実装後に有効になる）
import { Pipe } from '../src/pipe.js';

// テスト用定数（インターフェース定義書より）
const PIPE_WIDTH = 80;
const PIPE_SPEED = 2;
const CANVAS_WIDTH = 800;

describe('Pipeクラス', () => {
  let mockCanvas;
  let mockCtx;

  beforeEach(() => {
    // モックCanvas 2Dコンテキストの準備（手動モック）
    mockCtx = {
      fillStyle: '',
      fillRect: mockFn(),
      strokeStyle: '',
      strokeRect: mockFn(),
      lineWidth: 0
    };
    
    mockCanvas = {
      width: CANVAS_WIDTH,
      height: 600
    };
  });

  // 手動モック関数の実装
  function mockFn() {
    const calls = [];
    const fn = (...args) => {
      calls.push(args);
    };
    fn.toHaveBeenCalled = () => calls.length > 0;
    fn.toHaveBeenCalledTimes = (times) => calls.length === times;
    fn.toHaveBeenCalledWith = (...args) => {
      return calls.some(call => 
        call.length === args.length && 
        call.every((arg, i) => arg === args[i])
      );
    };
    fn.mock = { calls };
    return fn;
  }

  describe('コンストラクタ', () => {
    test('正常系: すべてのプロパティが正しく初期化される', () => {
      // 三角測量用の複数パターン
      const testCases = [
        { x: 400, gapY: 200, gapSize: 150 },
        { x: 600, gapY: 300, gapSize: 200 },
        { x: 0, gapY: 100, gapSize: 100 }
      ];

      testCases.forEach(({ x, gapY, gapSize }) => {
        const pipe = new Pipe(x, gapY, gapSize);
        
        expect(pipe.x).toBe(x);
        expect(pipe.gapY).toBe(gapY);
        expect(pipe.gapSize).toBe(gapSize);
        expect(pipe.passed).toBe(false);
      });
    });

    test('境界値: ゼロ値での初期化', () => {
      const pipe = new Pipe(0, 0, 0);
      
      expect(pipe.x).toBe(0);
      expect(pipe.gapY).toBe(0);
      expect(pipe.gapSize).toBe(0);
      expect(pipe.passed).toBe(false);
    });

    test('境界値: 負の値での初期化', () => {
      const pipe = new Pipe(-100, -50, -20);
      
      expect(pipe.x).toBe(-100);
      expect(pipe.gapY).toBe(-50);
      expect(pipe.gapSize).toBe(-20);
      expect(pipe.passed).toBe(false);
    });
  });

  describe('update()メソッド', () => {
    test('正常系: X座標が正しく減少する', () => {
      const pipe = new Pipe(400, 200, 150);
      const initialX = pipe.x;
      
      pipe.update();
      
      expect(pipe.x).toBe(initialX - PIPE_SPEED);
    });

    test('三角測量: 複数回の更新で連続的に減少する', () => {
      const pipe = new Pipe(400, 200, 150);
      const initialX = pipe.x;
      
      pipe.update();
      expect(pipe.x).toBe(initialX - PIPE_SPEED);
      
      pipe.update();
      expect(pipe.x).toBe(initialX - PIPE_SPEED * 2);
      
      pipe.update();
      expect(pipe.x).toBe(initialX - PIPE_SPEED * 3);
    });

    test('境界値: X座標が負の値になる場合', () => {
      const pipe = new Pipe(1, 200, 150);
      
      pipe.update();
      
      expect(pipe.x).toBe(1 - PIPE_SPEED);
      expect(pipe.x).toBeLessThan(0);
    });
  });

  describe('getBounds()メソッド', () => {
    test('正常系: 上下パイプの矩形配列を返す', () => {
      const pipe = new Pipe(400, 200, 150);
      const bounds = pipe.getBounds();
      
      expect(bounds).toBeInstanceOf(Array);
      expect(bounds).toHaveLength(2);
      
      // 上パイプの矩形
      expect(bounds[0]).toEqual({
        x: 400,
        y: 0,
        width: PIPE_WIDTH,
        height: 200 - 150 / 2
      });
      
      // 下パイプの矩形
      expect(bounds[1]).toEqual({
        x: 400,
        y: 200 + 150 / 2,
        width: PIPE_WIDTH,
        height: 600 - (200 + 150 / 2)
      });
    });

    test('三角測量: 異なる位置とサイズでの矩形計算', () => {
      const testCases = [
        { x: 300, gapY: 150, gapSize: 100 },
        { x: 500, gapY: 250, gapSize: 200 },
        { x: 100, gapY: 300, gapSize: 120 }
      ];

      testCases.forEach(({ x, gapY, gapSize }) => {
        const pipe = new Pipe(x, gapY, gapSize);
        const bounds = pipe.getBounds();
        
        expect(bounds).toHaveLength(2);
        expect(bounds[0].x).toBe(x);
        expect(bounds[0].width).toBe(PIPE_WIDTH);
        expect(bounds[1].x).toBe(x);
        expect(bounds[1].width).toBe(PIPE_WIDTH);
      });
    });

    test('境界値: 隙間サイズが0の場合', () => {
      const pipe = new Pipe(400, 200, 0);
      const bounds = pipe.getBounds();
      
      expect(bounds).toHaveLength(2);
      expect(bounds[0].height).toBe(200);
      expect(bounds[1].y).toBe(200);
    });
  });

  describe('isOffScreen()メソッド', () => {
    test('正常系: 画面内にある場合はfalse', () => {
      const pipe = new Pipe(400, 200, 150);
      
      expect(pipe.isOffScreen()).toBe(false);
    });

    test('正常系: 画面外に出た場合はtrue', () => {
      const pipe = new Pipe(-PIPE_WIDTH - 1, 200, 150);
      
      expect(pipe.isOffScreen()).toBe(true);
    });

    test('境界値: ちょうど画面外になる境界', () => {
      const pipe = new Pipe(-PIPE_WIDTH, 200, 150);
      
      expect(pipe.isOffScreen()).toBe(true);
    });

    test('境界値: ちょうど画面外になる直前', () => {
      const pipe = new Pipe(-PIPE_WIDTH + 1, 200, 150);
      
      expect(pipe.isOffScreen()).toBe(false);
    });

    test('三角測量: 更新によって画面外になる過程', () => {
      const pipe = new Pipe(PIPE_WIDTH + 1, 200, 150);
      
      expect(pipe.isOffScreen()).toBe(false);
      
      // 十分な回数更新して画面外に出す
      for (let i = 0; i < 50; i++) {
        pipe.update();
      }
      
      expect(pipe.isOffScreen()).toBe(true);
    });
  });

  describe('isPassed()メソッド', () => {
    test('正常系: 鳥がパイプを通過していない場合はfalse', () => {
      const pipe = new Pipe(400, 200, 150);
      const birdX = 300;
      
      expect(pipe.isPassed(birdX)).toBe(false);
    });

    test('正常系: 鳥がパイプを通過した場合はtrue', () => {
      const pipe = new Pipe(400, 200, 150);
      const birdX = 500;
      
      expect(pipe.isPassed(birdX)).toBe(true);
    });

    test('境界値: ちょうど通過する境界', () => {
      const pipe = new Pipe(400, 200, 150);
      const birdX = 400 + PIPE_WIDTH;
      
      expect(pipe.isPassed(birdX)).toBe(true);
    });

    test('境界値: 通過する直前', () => {
      const pipe = new Pipe(400, 200, 150);
      const birdX = 400 + PIPE_WIDTH - 1;
      
      expect(pipe.isPassed(birdX)).toBe(false);
    });

    test('三角測量: 複数回の判定で一度通過したら常にtrue', () => {
      const pipe = new Pipe(400, 200, 150);
      
      expect(pipe.isPassed(300)).toBe(false);
      expect(pipe.isPassed(500)).toBe(true);
      expect(pipe.isPassed(300)).toBe(true); // 一度通過したら戻らない
    });

    test('異常系: 負の鳥X座標', () => {
      const pipe = new Pipe(400, 200, 150);
      
      expect(pipe.isPassed(-100)).toBe(false);
    });
  });

  describe('draw()メソッド', () => {
    test('正常系: Canvasコンテキストに描画される', () => {
      const pipe = new Pipe(400, 200, 150);
      
      pipe.draw(mockCtx);
      
      expect(mockCtx.fillRect).toHaveBeenCalled();
      expect(mockCtx.fillRect).toHaveBeenCalledTimes(2); // 上下パイプ
    });

    test('三角測量: 異なる位置での描画', () => {
      const testCases = [
        { x: 300, gapY: 150, gapSize: 100 },
        { x: 500, gapY: 250, gapSize: 200 }
      ];

      testCases.forEach(({ x, gapY, gapSize }) => {
        const mockCtxLocal = {
          fillStyle: '',
          fillRect: jest.fn()
        };
        
        const pipe = new Pipe(x, gapY, gapSize);
        pipe.draw(mockCtxLocal);
        
        expect(mockCtxLocal.fillRect).toHaveBeenCalled();
        expect(mockCtxLocal.fillRect).toHaveBeenCalledTimes(2);
      });
    });

    test('異常系: nullコンテキストでもエラーにならない', () => {
      const pipe = new Pipe(400, 200, 150);
      
      expect(() => {
        pipe.draw(null);
      }).not.toThrow();
    });

    test('境界値: 画面外の位置での描画', () => {
      const pipe = new Pipe(-200, 200, 150);
      
      expect(() => {
        pipe.draw(mockCtx);
      }).not.toThrow();
      
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });
  });

  describe('統合テスト', () => {
    test('パイプのライフサイクル全体', () => {
      const pipe = new Pipe(800, 200, 150);
      
      // 初期状態
      expect(pipe.isOffScreen()).toBe(false);
      expect(pipe.isPassed(100)).toBe(false);
      
      // 移動
      for (let i = 0; i < 10; i++) {
        pipe.update();
      }
      
      // 鳥が通過
      expect(pipe.isPassed(100)).toBe(true);
      
      // 最終的に画面外へ
      for (let i = 0; i < 500; i++) {
        pipe.update();
      }
      
      expect(pipe.isOffScreen()).toBe(true);
    });
  });
});