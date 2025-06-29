import { LivesManager } from '../../managers/LivesManager.js';

describe('LivesManager', () => {
  let livesManager;

  beforeEach(() => {
    livesManager = new LivesManager();
  });

  describe('初期化', () => {
    test('デフォルトで3ライフで初期化される', () => {
      expect(livesManager.getLives()).toBe(3);
    });

    test('カスタム初期ライフ数で初期化できる', () => {
      const customLivesManager = new LivesManager(5);
      expect(customLivesManager.getLives()).toBe(5);
    });

    test('ゲームオーバーではない状態で初期化される', () => {
      expect(livesManager.isGameOver()).toBe(false);
    });
  });

  describe('reset()', () => {
    test('ライフを初期値にリセットできる', () => {
      livesManager.loseLife();
      livesManager.loseLife();
      expect(livesManager.getLives()).toBe(1);
      
      livesManager.reset();
      expect(livesManager.getLives()).toBe(3);
    });

    test('カスタム初期値でリセットできる', () => {
      const customLivesManager = new LivesManager(5);
      customLivesManager.loseLife();
      customLivesManager.loseLife();
      
      customLivesManager.reset();
      expect(customLivesManager.getLives()).toBe(5);
    });
  });

  describe('loseLife()', () => {
    test('ライフを1減らす', () => {
      expect(livesManager.getLives()).toBe(3);
      livesManager.loseLife();
      expect(livesManager.getLives()).toBe(2);
    });

    test('ライフが1の時にloseLifeするとゲームオーバーになる', () => {
      livesManager.loseLife(); // 3 -> 2
      livesManager.loseLife(); // 2 -> 1
      expect(livesManager.loseLife()).toBe(true); // 1 -> 0, ゲームオーバー
      expect(livesManager.isGameOver()).toBe(true);
    });

    test('ライフが0の時はfalseを返す', () => {
      livesManager.loseLife(); // 3 -> 2
      livesManager.loseLife(); // 2 -> 1
      livesManager.loseLife(); // 1 -> 0
      expect(livesManager.getLives()).toBe(0);
      expect(livesManager.loseLife()).toBe(false);
    });
  });

  describe('addLife()', () => {
    test('ライフを1増やす', () => {
      expect(livesManager.getLives()).toBe(3);
      livesManager.addLife();
      expect(livesManager.getLives()).toBe(4);
    });

    test('最大ライフ数を超えない', () => {
      livesManager.addLife(); // 3 -> 4
      livesManager.addLife(); // 4 -> 5
      livesManager.addLife(); // 5のまま
      expect(livesManager.getLives()).toBe(5);
    });

    test('カスタム最大ライフ数を設定できる', () => {
      const customLivesManager = new LivesManager(3, 7);
      customLivesManager.addLife(); // 3 -> 4
      customLivesManager.addLife(); // 4 -> 5
      customLivesManager.addLife(); // 5 -> 6
      customLivesManager.addLife(); // 6 -> 7
      customLivesManager.addLife(); // 7のまま
      expect(customLivesManager.getLives()).toBe(7);
    });
  });

  describe('isGameOver()', () => {
    test('ライフが1以上の時はfalse', () => {
      expect(livesManager.isGameOver()).toBe(false);
      livesManager.loseLife();
      expect(livesManager.isGameOver()).toBe(false);
    });

    test('ライフが0の時はtrue', () => {
      livesManager.loseLife(); // 3 -> 2
      livesManager.loseLife(); // 2 -> 1
      livesManager.loseLife(); // 1 -> 0
      expect(livesManager.isGameOver()).toBe(true);
    });
  });

  describe('エッジケース', () => {
    test('負の初期ライフ数は0として扱われる', () => {
      const negativeLivesManager = new LivesManager(-5);
      expect(negativeLivesManager.getLives()).toBe(0);
      expect(negativeLivesManager.isGameOver()).toBe(true);
    });

    test('初期ライフ数が最大ライフ数を超える場合は最大ライフ数に制限される', () => {
      const overMaxLivesManager = new LivesManager(10, 5);
      expect(overMaxLivesManager.getLives()).toBe(5);
    });

    test('負の最大ライフ数は1として扱われる', () => {
      const negativeMaxLivesManager = new LivesManager(3, -5);
      expect(negativeMaxLivesManager.getLives()).toBe(1);
      negativeMaxLivesManager.addLife();
      expect(negativeMaxLivesManager.getLives()).toBe(1); // 最大値1なので増えない
    });

    test('ゲームオーバー後にaddLifeしても復活しない', () => {
      livesManager.loseLife(); // 3 -> 2
      livesManager.loseLife(); // 2 -> 1
      livesManager.loseLife(); // 1 -> 0
      expect(livesManager.isGameOver()).toBe(true);
      
      livesManager.addLife();
      expect(livesManager.getLives()).toBe(0);
      expect(livesManager.isGameOver()).toBe(true);
    });

    test('ゲームオーバー後にresetすると復活する', () => {
      livesManager.loseLife(); // 3 -> 2
      livesManager.loseLife(); // 2 -> 1
      livesManager.loseLife(); // 1 -> 0
      expect(livesManager.isGameOver()).toBe(true);
      
      livesManager.reset();
      expect(livesManager.getLives()).toBe(3);
      expect(livesManager.isGameOver()).toBe(false);
    });
  });
});