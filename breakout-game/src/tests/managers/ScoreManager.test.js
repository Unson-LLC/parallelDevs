import { ScoreManager } from '../../managers/ScoreManager.js';
import { jest } from '@jest/globals';

describe('ScoreManager', () => {
  let scoreManager;
  let mockLocalStorage;

  beforeEach(() => {
    // localStorageをモック化（ScoreManagerインスタンス作成前に行う）
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      clear: jest.fn()
    };
    
    // jsdomのlocalStorageを直接置き換える
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
    
    // モック化後にインスタンスを作成
    scoreManager = new ScoreManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('reset', () => {
    it('スコアを0にリセットする', () => {
      // まず、スコアを追加
      scoreManager.addScore(100);
      expect(scoreManager.getScore()).toBe(100);
      
      // リセット
      scoreManager.reset();
      expect(scoreManager.getScore()).toBe(0);
    });
  });

  describe('addScore', () => {
    it('正の数値を加算して現在のスコアを返す', () => {
      const result = scoreManager.addScore(50);
      expect(result).toBe(50);
      expect(scoreManager.getScore()).toBe(50);
    });

    it('複数回の加算が正しく動作する', () => {
      scoreManager.addScore(100);
      const result = scoreManager.addScore(50);
      expect(result).toBe(150);
      expect(scoreManager.getScore()).toBe(150);
    });

    it('0を加算してもスコアは変わらない', () => {
      scoreManager.addScore(100);
      const result = scoreManager.addScore(0);
      expect(result).toBe(100);
      expect(scoreManager.getScore()).toBe(100);
    });

    it('負の数値を渡した場合はエラーをスロー', () => {
      expect(() => scoreManager.addScore(-10)).toThrow('Points must be non-negative');
    });

    it('数値以外を渡した場合はエラーをスロー', () => {
      expect(() => scoreManager.addScore('10')).toThrow('Points must be a number');
      expect(() => scoreManager.addScore(null)).toThrow('Points must be a number');
      expect(() => scoreManager.addScore(undefined)).toThrow('Points must be a number');
    });

    it('小数点を渡した場合は整数に変換される', () => {
      const result = scoreManager.addScore(10.7);
      expect(result).toBe(10);
      expect(scoreManager.getScore()).toBe(10);
    });

    it('非常に大きな数値でも正しく処理される', () => {
      const result = scoreManager.addScore(Number.MAX_SAFE_INTEGER - 100);
      expect(result).toBe(Number.MAX_SAFE_INTEGER - 100);
      
      // オーバーフローチェック
      const overflow = scoreManager.addScore(200);
      expect(overflow).toBe(Number.MAX_SAFE_INTEGER + 100);
    });

    it('複数の小数点値の加算でも正しく処理される', () => {
      scoreManager.addScore(10.3);
      scoreManager.addScore(20.7);
      scoreManager.addScore(5.9);
      expect(scoreManager.getScore()).toBe(35); // 10 + 20 + 5
    });
  });

  describe('getScore', () => {
    it('初期状態では0を返す', () => {
      expect(scoreManager.getScore()).toBe(0);
    });

    it('スコア加算後に正しい値を返す', () => {
      scoreManager.addScore(250);
      expect(scoreManager.getScore()).toBe(250);
    });
  });

  describe('getHighScore', () => {
    it('localStorageに保存されているハイスコアを取得する', () => {
      mockLocalStorage.getItem.mockReturnValue('500');
      expect(scoreManager.getHighScore()).toBe(500);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('breakout-highscore');
    });

    it('localStorageにハイスコアがない場合は0を返す', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      expect(scoreManager.getHighScore()).toBe(0);
    });

    it('localStorageの値が不正な場合は0を返す', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid');
      expect(scoreManager.getHighScore()).toBe(0);
    });
  });

  describe('saveHighScore', () => {
    it('現在のスコアがハイスコアより高い場合、ハイスコアを更新する', () => {
      mockLocalStorage.getItem.mockReturnValue('100');
      scoreManager.addScore(200);
      scoreManager.saveHighScore();
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('breakout-highscore', '200');
    });

    it('現在のスコアがハイスコア以下の場合、ハイスコアは更新しない', () => {
      mockLocalStorage.getItem.mockReturnValue('300');
      scoreManager.addScore(200);
      scoreManager.saveHighScore();
      
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('ハイスコアがまだない場合、現在のスコアをハイスコアとして保存する', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      scoreManager.addScore(100);
      scoreManager.saveHighScore();
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('breakout-highscore', '100');
    });

    it('スコアが0の場合でも、ハイスコアがなければ保存される', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      scoreManager.saveHighScore();
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('breakout-highscore', '0');
    });
  });

  describe('統合テスト', () => {
    it('完全なゲームフローでの動作確認', () => {
      // 初期状態
      expect(scoreManager.getScore()).toBe(0);
      
      // ゲームプレイ中
      scoreManager.addScore(100);
      scoreManager.addScore(50);
      expect(scoreManager.getScore()).toBe(150);
      
      // ハイスコア更新
      mockLocalStorage.getItem.mockReturnValue('120');
      scoreManager.saveHighScore();
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('breakout-highscore', '150');
      
      // リセット
      scoreManager.reset();
      expect(scoreManager.getScore()).toBe(0);
      
      // 次のゲーム
      scoreManager.addScore(80);
      expect(scoreManager.getScore()).toBe(80);
      
      // ハイスコアは更新されない
      mockLocalStorage.getItem.mockReturnValue('150');
      scoreManager.saveHighScore();
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1); // 前回の1回のみ
    });
  });
});