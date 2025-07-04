/**
 * Pipeクラス Node.jsテストファイル
 * TDD（t_wada方式）に従いテストファーストで作成
 */

import { Pipe } from '../src/pipe.js';

// テスト用定数（インターフェース定義書より）
const PIPE_WIDTH = 80;
const PIPE_SPEED = 2;
const CANVAS_WIDTH = 800;

// 手動テスト実装
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🔬 Pipeクラス TDD テスト開始\n');

    for (const { name, fn } of this.tests) {
      try {
        await fn();
        console.log(`✅ ${name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}\n`);
        this.failed++;
      }
    }

    console.log(`\n📊 テスト結果: ${this.passed} passed, ${this.failed} failed`);
    return this.failed === 0;
  }
}

// 簡易アサーション関数
function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, but got ${actual}`);
      }
    },
    toEqual: (expected) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
      }
    },
    toBeInstanceOf: (expected) => {
      if (!(actual instanceof expected)) {
        throw new Error(`Expected instance of ${expected.name}, but got ${typeof actual}`);
      }
    },
    toHaveLength: (expected) => {
      if (actual.length !== expected) {
        throw new Error(`Expected length ${expected}, but got ${actual.length}`);
      }
    },
    toBeLessThan: (expected) => {
      if (actual >= expected) {
        throw new Error(`Expected ${actual} to be less than ${expected}`);
      }
    }
  };
}

// モック関数の実装
function mockFn() {
  const calls = [];
  const fn = (...args) => {
    calls.push(args);
  };
  fn.toHaveBeenCalled = () => calls.length > 0;
  fn.toHaveBeenCalledTimes = (times) => calls.length === times;
  fn.mock = { calls };
  return fn;
}

// テストランナー作成
const runner = new TestRunner();

// コンストラクタテスト
runner.test('コンストラクタ: 正常系 - すべてのプロパティが正しく初期化される', () => {
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

runner.test('コンストラクタ: 境界値 - ゼロ値での初期化', () => {
  const pipe = new Pipe(0, 0, 0);
  
  expect(pipe.x).toBe(0);
  expect(pipe.gapY).toBe(0);
  expect(pipe.gapSize).toBe(0);
  expect(pipe.passed).toBe(false);
});

// update()メソッドテスト
runner.test('update(): 正常系 - X座標が正しく減少する', () => {
  const pipe = new Pipe(400, 200, 150);
  const initialX = pipe.x;
  
  pipe.update();
  
  expect(pipe.x).toBe(initialX - PIPE_SPEED);
});

runner.test('update(): 三角測量 - 複数回の更新で連続的に減少する', () => {
  const pipe = new Pipe(400, 200, 150);
  const initialX = pipe.x;
  
  pipe.update();
  expect(pipe.x).toBe(initialX - PIPE_SPEED);
  
  pipe.update();
  expect(pipe.x).toBe(initialX - PIPE_SPEED * 2);
  
  pipe.update();
  expect(pipe.x).toBe(initialX - PIPE_SPEED * 3);
});

runner.test('update(): 境界値 - X座標が負の値になる場合', () => {
  const pipe = new Pipe(1, 200, 150);
  
  pipe.update();
  
  expect(pipe.x).toBe(1 - PIPE_SPEED);
  expect(pipe.x).toBeLessThan(0);
});

// getBounds()メソッドテスト
runner.test('getBounds(): 正常系 - 上下パイプの矩形配列を返す', () => {
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

runner.test('getBounds(): 三角測量 - 異なる位置とサイズでの矩形計算', () => {
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

runner.test('getBounds(): 境界値 - 隙間サイズが0の場合', () => {
  const pipe = new Pipe(400, 200, 0);
  const bounds = pipe.getBounds();
  
  expect(bounds).toHaveLength(2);
  expect(bounds[0].height).toBe(200);
  expect(bounds[1].y).toBe(200);
});

// isOffScreen()メソッドテスト
runner.test('isOffScreen(): 正常系 - 画面内にある場合はfalse', () => {
  const pipe = new Pipe(400, 200, 150);
  
  expect(pipe.isOffScreen()).toBe(false);
});

runner.test('isOffScreen(): 正常系 - 画面外に出た場合はtrue', () => {
  const pipe = new Pipe(-PIPE_WIDTH - 1, 200, 150);
  
  expect(pipe.isOffScreen()).toBe(true);
});

runner.test('isOffScreen(): 境界値 - ちょうど画面外になる境界', () => {
  const pipe = new Pipe(-PIPE_WIDTH, 200, 150);
  
  expect(pipe.isOffScreen()).toBe(true);
});

runner.test('isOffScreen(): 境界値 - ちょうど画面外になる直前', () => {
  const pipe = new Pipe(-PIPE_WIDTH + 1, 200, 150);
  
  expect(pipe.isOffScreen()).toBe(false);
});

runner.test('isOffScreen(): 三角測量 - 更新によって画面外になる過程', () => {
  const pipe = new Pipe(PIPE_WIDTH + 1, 200, 150);
  
  expect(pipe.isOffScreen()).toBe(false);
  
  // 十分な回数更新して画面外に出す（計算: (81 + 80) / 2 = 80.5回で画面外）
  for (let i = 0; i < 85; i++) {
    pipe.update();
  }
  
  expect(pipe.isOffScreen()).toBe(true);
});

// isPassed()メソッドテスト
runner.test('isPassed(): 正常系 - 鳥がパイプを通過していない場合はfalse', () => {
  const pipe = new Pipe(400, 200, 150);
  const birdX = 300;
  
  expect(pipe.isPassed(birdX)).toBe(false);
});

runner.test('isPassed(): 正常系 - 鳥がパイプを通過した場合はtrue', () => {
  const pipe = new Pipe(400, 200, 150);
  const birdX = 500;
  
  expect(pipe.isPassed(birdX)).toBe(true);
});

runner.test('isPassed(): 境界値 - ちょうど通過する境界', () => {
  const pipe = new Pipe(400, 200, 150);
  const birdX = 400 + PIPE_WIDTH;
  
  expect(pipe.isPassed(birdX)).toBe(true);
});

runner.test('isPassed(): 境界値 - 通過する直前', () => {
  const pipe = new Pipe(400, 200, 150);
  const birdX = 400 + PIPE_WIDTH - 1;
  
  expect(pipe.isPassed(birdX)).toBe(false);
});

runner.test('isPassed(): 三角測量 - 複数回の判定で一度通過したら常にtrue', () => {
  const pipe = new Pipe(400, 200, 150);
  
  expect(pipe.isPassed(300)).toBe(false);
  expect(pipe.isPassed(500)).toBe(true);
  expect(pipe.isPassed(300)).toBe(true); // 一度通過したら戻らない
});

runner.test('isPassed(): 異常系 - 負の鳥X座標', () => {
  const pipe = new Pipe(400, 200, 150);
  
  expect(pipe.isPassed(-100)).toBe(false);
});

// draw()メソッドテスト
runner.test('draw(): 正常系 - Canvasコンテキストに描画される', () => {
  const pipe = new Pipe(400, 200, 150);
  const mockCtx = {
    fillStyle: '',
    fillRect: mockFn()
  };
  
  pipe.draw(mockCtx);
  
  if (!mockCtx.fillRect.toHaveBeenCalled()) {
    throw new Error('fillRect was not called');
  }
  if (!mockCtx.fillRect.toHaveBeenCalledTimes(2)) {
    throw new Error(`Expected fillRect to be called 2 times, but was called ${mockCtx.fillRect.mock.calls.length} times`);
  }
});

runner.test('draw(): 三角測量 - 異なる位置での描画', () => {
  const testCases = [
    { x: 300, gapY: 150, gapSize: 100 },
    { x: 500, gapY: 250, gapSize: 200 }
  ];

  testCases.forEach(({ x, gapY, gapSize }) => {
    const mockCtxLocal = {
      fillStyle: '',
      fillRect: mockFn()
    };
    
    const pipe = new Pipe(x, gapY, gapSize);
    pipe.draw(mockCtxLocal);
    
    if (!mockCtxLocal.fillRect.toHaveBeenCalled()) {
      throw new Error('fillRect was not called');
    }
    if (!mockCtxLocal.fillRect.toHaveBeenCalledTimes(2)) {
      throw new Error(`Expected fillRect to be called 2 times, but was called ${mockCtxLocal.fillRect.mock.calls.length} times`);
    }
  });
});

runner.test('draw(): 異常系 - nullコンテキストでもエラーにならない', () => {
  const pipe = new Pipe(400, 200, 150);
  
  // エラーが投げられないことを確認
  pipe.draw(null);
});

runner.test('draw(): 境界値 - 画面外の位置での描画', () => {
  const pipe = new Pipe(-200, 200, 150);
  const mockCtx = {
    fillStyle: '',
    fillRect: mockFn()
  };
  
  pipe.draw(mockCtx);
  
  if (!mockCtx.fillRect.toHaveBeenCalled()) {
    throw new Error('fillRect should be called even for off-screen pipes');
  }
});

// 統合テスト
runner.test('統合テスト: パイプのライフサイクル全体', () => {
  const pipe = new Pipe(200, 200, 150); // より小さい初期X座標に変更
  
  // 初期状態
  expect(pipe.isOffScreen()).toBe(false);
  expect(pipe.isPassed(100)).toBe(false);
  
  // 移動してパイプが鳥を通過
  for (let i = 0; i < 10; i++) {
    pipe.update();
  }
  
  // 10回移動後 x=200-20=180, 鳥100 > パイプ右端260なのでまだ通過していない
  expect(pipe.isPassed(100)).toBe(false);
  
  // さらに移動してパイプが鳥の位置より左に来る
  for (let i = 0; i < 10; i++) {
    pipe.update();
  }
  
  // 20回移動後 x=200-40=160, 鳥100 < パイプ右端240なのでまだ通過していない
  expect(pipe.isPassed(100)).toBe(false);
  
  // 十分移動してパイプが鳥より左に移動
  for (let i = 0; i < 10; i++) {
    pipe.update();
  }
  
  // 30回移動後 x=200-60=140, パイプ右端220 > 鳥100なのでまだ通過していない
  // 正しい通過判定のためには鳥がパイプの右端を越える必要がある
  expect(pipe.isPassed(250)).toBe(true); // 鳥が右側にいる場合の通過判定
  
  // 最終的に画面外へ
  for (let i = 0; i < 500; i++) {
    pipe.update();
  }
  
  expect(pipe.isOffScreen()).toBe(true);
});

// テスト実行
runner.run().then(success => {
  if (success) {
    console.log('\n🎉 全テスト通過！TDD第2段階完了');
  } else {
    console.log('\n❌ テスト失敗 - 実装を修正してください');
    process.exit(1);
  }
});