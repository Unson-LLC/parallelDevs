const ScoreManager = require('../src/score');

// localStorageのモック
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
});

describe('ScoreManager', () => {
  let scoreManager;

  beforeEach(() => {
    localStorageMock.clear();
    scoreManager = new ScoreManager();
  });

  describe('calculateBlockScore', () => {
    test('通常ブロックの基本スコアを計算する', () => {
      const score = scoreManager.calculateBlockScore('normal', 1);
      expect(score).toBe(10);
    });

    test('硬いブロックの基本スコアを計算する', () => {
      const score = scoreManager.calculateBlockScore('hard', 1);
      expect(score).toBe(20);
    });

    test('特殊ブロックの基本スコアを計算する', () => {
      const score = scoreManager.calculateBlockScore('special', 1);
      expect(score).toBe(50);
    });

    test('レベルによるスコア倍率を適用する', () => {
      const scoreLevel1 = scoreManager.calculateBlockScore('normal', 1);
      const scoreLevel2 = scoreManager.calculateBlockScore('normal', 2);
      const scoreLevel5 = scoreManager.calculateBlockScore('normal', 5);

      expect(scoreLevel1).toBe(10);
      expect(scoreLevel2).toBe(12); // 10 * 1.2
      expect(scoreLevel5).toBe(18); // 10 * 1.8
    });

    test('コンボによるスコア倍率を適用する', () => {
      scoreManager.combo = 0;
      const scoreNoCombo = scoreManager.calculateBlockScore('normal', 1);
      
      scoreManager.combo = 5;
      const scoreWithCombo = scoreManager.calculateBlockScore('normal', 1);

      expect(scoreNoCombo).toBe(10);
      expect(scoreWithCombo).toBe(15); // 10 * 1.5
    });

    test('レベルとコンボの複合倍率を適用する', () => {
      scoreManager.combo = 10;
      const score = scoreManager.calculateBlockScore('hard', 3);
      
      // 基本スコア20 * レベル倍率1.4 * コンボ倍率2.0 = 56
      expect(score).toBe(56);
    });

    test('未知のブロックタイプはデフォルトスコアを返す', () => {
      const score = scoreManager.calculateBlockScore('unknown', 1);
      expect(score).toBe(10);
    });
  });

  describe('addScore', () => {
    test('スコアを正しく加算する', () => {
      scoreManager.addScore('normal', 1);
      expect(scoreManager.score).toBe(10);
      
      scoreManager.addScore('hard', 1);
      expect(scoreManager.score).toBe(30);
    });

    test('スコア追加時にコンボが増加する', () => {
      expect(scoreManager.combo).toBe(0);
      
      scoreManager.addScore('normal', 1);
      expect(scoreManager.combo).toBe(1);
      
      scoreManager.addScore('normal', 1);
      expect(scoreManager.combo).toBe(2);
    });

    test('ハイスコアを更新する', () => {
      scoreManager.highScore = 50;
      
      scoreManager.addScore('special', 1); // 50点
      expect(scoreManager.score).toBe(50);
      expect(scoreManager.highScore).toBe(50);
      
      scoreManager.addScore('normal', 1); // +11点（コンボ1）
      expect(scoreManager.score).toBe(61);
      expect(scoreManager.highScore).toBe(61);
    });

    test('獲得スコアを返す', () => {
      const points = scoreManager.addScore('hard', 2);
      expect(points).toBe(24); // 20 * 1.2
    });
  });

  describe('resetCombo', () => {
    test('コンボをリセットする', () => {
      scoreManager.combo = 10;
      scoreManager.resetCombo();
      expect(scoreManager.combo).toBe(0);
    });
  });

  describe('calculateStageClearBonus', () => {
    test('残りライフによるボーナスを計算する', () => {
      const bonus = scoreManager.calculateStageClearBonus(3, 0);
      expect(bonus).toBe(1500); // 3 * 500
    });

    test('タイムボーナスを計算する', () => {
      const bonus = scoreManager.calculateStageClearBonus(0, 60);
      expect(bonus).toBe(600); // 60 * 10
    });

    test('ライフとタイムの複合ボーナスを計算する', () => {
      const bonus = scoreManager.calculateStageClearBonus(2, 30);
      expect(bonus).toBe(1300); // (2 * 500) + (30 * 10)
    });

    test('負のタイムボーナスは0として扱う', () => {
      const bonus = scoreManager.calculateStageClearBonus(1, -10);
      expect(bonus).toBe(500); // (1 * 500) + 0
    });
  });

  describe('addStageClearBonus', () => {
    test('ステージクリアボーナスを加算する', () => {
      scoreManager.score = 1000;
      const bonus = scoreManager.addStageClearBonus(3, 45);
      
      expect(bonus).toBe(1950); // (3 * 500) + (45 * 10)
      expect(scoreManager.score).toBe(2950);
    });

    test('ボーナス追加でハイスコアを更新する', () => {
      scoreManager.score = 1000;
      scoreManager.highScore = 2000;
      
      scoreManager.addStageClearBonus(5, 100);
      
      expect(scoreManager.score).toBe(4500); // 1000 + 2500 + 1000
      expect(scoreManager.highScore).toBe(4500);
    });
  });

  describe('reset', () => {
    test('スコアとコンボをリセットする', () => {
      scoreManager.score = 5000;
      scoreManager.combo = 10;
      
      scoreManager.reset();
      
      expect(scoreManager.score).toBe(0);
      expect(scoreManager.combo).toBe(0);
    });

    test('ハイスコアは保持される', () => {
      scoreManager.score = 5000;
      scoreManager.highScore = 10000;
      
      scoreManager.reset();
      
      expect(scoreManager.highScore).toBe(10000);
    });
  });

  describe('loadHighScore', () => {
    test('保存されたハイスコアを読み込む', () => {
      localStorage.setItem('breakoutHighScore', '12345');
      const newScoreManager = new ScoreManager();
      
      expect(newScoreManager.highScore).toBe(12345);
    });

    test('ハイスコアが保存されていない場合は0を返す', () => {
      const newScoreManager = new ScoreManager();
      
      expect(newScoreManager.highScore).toBe(0);
    });

    test('不正な値が保存されている場合は0を返す', () => {
      localStorage.setItem('breakoutHighScore', 'invalid');
      const newScoreManager = new ScoreManager();
      
      expect(newScoreManager.highScore).toBe(0);
    });
  });

  describe('saveHighScore', () => {
    test('ハイスコアをlocalStorageに保存する', () => {
      scoreManager.highScore = 99999;
      scoreManager.saveHighScore();
      
      expect(localStorage.getItem('breakoutHighScore')).toBe('99999');
    });
  });

  describe('getScoreInfo', () => {
    test('現在のスコア情報を取得する', () => {
      scoreManager.score = 1500;
      scoreManager.highScore = 5000;
      scoreManager.combo = 7;
      
      const info = scoreManager.getScoreInfo();
      
      expect(info).toEqual({
        score: 1500,
        highScore: 5000,
        combo: 7
      });
    });
  });

  describe('統合テスト', () => {
    test('ゲームプレイのシナリオをシミュレート', () => {
      // ゲーム開始
      expect(scoreManager.score).toBe(0);
      expect(scoreManager.combo).toBe(0);

      // 連続でブロックを破壊
      scoreManager.addScore('normal', 1); // 10点
      scoreManager.addScore('normal', 1); // 11点（コンボ1）
      scoreManager.addScore('hard', 1);   // 24点（コンボ2）
      
      expect(scoreManager.score).toBe(45);
      expect(scoreManager.combo).toBe(3);

      // ミスしてコンボリセット
      scoreManager.resetCombo();
      scoreManager.addScore('normal', 1); // 10点（コンボ0）
      
      expect(scoreManager.score).toBe(55);
      expect(scoreManager.combo).toBe(1);

      // ステージクリア
      scoreManager.addStageClearBonus(2, 90);
      
      expect(scoreManager.score).toBe(2955); // 55 + 1000 + 900
      expect(scoreManager.highScore).toBe(2955);

      // 新しいゲーム
      scoreManager.reset();
      expect(scoreManager.score).toBe(0);
      expect(scoreManager.highScore).toBe(2955); // ハイスコアは保持
    });
  });
});