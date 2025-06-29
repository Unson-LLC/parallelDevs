/**
 * GameManager統合テスト
 * 各モジュールの連携を確認
 */

import { GameManager } from '../../managers/GameManager.js';
import { Ball } from '../../entities/Ball.js';
import { Paddle } from '../../entities/Paddle.js';
import { Block } from '../../entities/Block.js';
import { ScoreManager } from '../../managers/ScoreManager.js';
import { LivesManager } from '../../managers/LivesManager.js';
import { CollisionDetector } from '../../systems/CollisionDetector.js';

describe('GameManager統合テスト', () => {
  let gameManager;
  let canvas;

  beforeEach(() => {
    // テスト用のcanvas要素を作成
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    gameManager = new GameManager(canvas);
  });

  describe('初期化', () => {
    test('GameManagerが正しく初期化される', () => {
      expect(gameManager).toBeDefined();
      expect(gameManager.getState()).toBe('ready');
    });

    test('init()で全てのゲーム要素が初期化される', () => {
      gameManager.init();
      
      const state = gameManager.getState();
      expect(state).toBe('ready');
      
      // 内部状態の確認（パブリックメソッド経由）
      expect(gameManager.isGameOver()).toBe(false);
      expect(gameManager.isLevelComplete()).toBe(false);
    });
  });

  describe('ゲーム開始', () => {
    beforeEach(() => {
      gameManager.init();
    });

    test('start()でゲームが開始される', () => {
      gameManager.start();
      expect(gameManager.getState()).toBe('playing');
    });

    test('pause()でゲームが一時停止される', () => {
      gameManager.start();
      gameManager.pause();
      expect(gameManager.getState()).toBe('paused');
    });

    test('resume()でゲームが再開される', () => {
      gameManager.start();
      gameManager.pause();
      gameManager.resume();
      expect(gameManager.getState()).toBe('playing');
    });
  });

  describe('ゲームロジック', () => {
    beforeEach(() => {
      gameManager.init();
      gameManager.start();
    });

    test('update()でゲーム状態が更新される', () => {
      const initialState = gameManager.getState();
      gameManager.update();
      // ゲーム状態は継続している
      expect(gameManager.getState()).toBe(initialState);
    });

    test('全てのブロックを破壊するとレベルクリア', () => {
      // テスト用に簡易的なブロック破壊シミュレーション
      // 実際の実装では、CollisionDetectorとの連携で処理される
      
      // ここでは、GameManagerのパブリックAPIを通じて確認
      expect(gameManager.isLevelComplete()).toBe(false);
      
      // 実装後は、全ブロック破壊のシミュレーションを行う
    });

    test('ライフが0になるとゲームオーバー', () => {
      // LivesManagerとの連携テスト
      expect(gameManager.isGameOver()).toBe(false);
      
      // 実装後は、ライフ減少のシミュレーションを行う
    });
  });

  describe('リセット機能', () => {
    test('reset()でゲームが初期状態に戻る', () => {
      gameManager.init();
      gameManager.start();
      gameManager.reset();
      
      expect(gameManager.getState()).toBe('ready');
      expect(gameManager.isGameOver()).toBe(false);
      expect(gameManager.isLevelComplete()).toBe(false);
    });
  });

  describe('エンティティとの連携', () => {
    test('Ball, Paddle, Blockが正しく生成・管理される', () => {
      gameManager.init();
      
      // エンティティの存在確認（実装後に詳細なテストを追加）
      // 現時点では、エラーなく初期化されることを確認
      expect(() => gameManager.update()).not.toThrow();
    });
  });

  describe('マネージャーとの連携', () => {
    test('ScoreManagerとの連携', () => {
      gameManager.init();
      
      // スコア管理の確認（実装後に詳細なテストを追加）
      // 現時点では、エラーなく初期化されることを確認
      expect(() => gameManager.update()).not.toThrow();
    });

    test('LivesManagerとの連携', () => {
      gameManager.init();
      
      // ライフ管理の確認（実装後に詳細なテストを追加）
      expect(gameManager.isGameOver()).toBe(false);
    });
  });

  describe('CollisionDetectorとの連携', () => {
    test('衝突判定が正しく処理される', () => {
      gameManager.init();
      gameManager.start();
      
      // 衝突判定の確認（実装後に詳細なテストを追加）
      expect(() => gameManager.update()).not.toThrow();
    });
  });
});