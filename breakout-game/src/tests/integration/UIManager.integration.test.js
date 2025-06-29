/**
 * UIManager統合テスト
 * UI要素とゲーム状態の連携を確認
 */

import { UIManager } from '../../ui/UIManager.js';
import { GameManager } from '../../managers/GameManager.js';
import { ScoreManager } from '../../managers/ScoreManager.js';
import { LivesManager } from '../../managers/LivesManager.js';

describe('UIManager統合テスト', () => {
  let uiManager;
  let gameManager;
  let scoreManager;
  let livesManager;
  let container;

  beforeEach(() => {
    // テスト用のDOM要素を作成
    container = document.createElement('div');
    container.id = 'game-container';
    document.body.appendChild(container);

    // 各マネージャーのインスタンスを作成
    uiManager = new UIManager(container);
    scoreManager = new ScoreManager();
    livesManager = new LivesManager(3);
    
    // GameManagerのモックまたは実際のインスタンス
    const canvas = document.createElement('canvas');
    gameManager = new GameManager(canvas);
  });

  afterEach(() => {
    // DOM要素のクリーンアップ
    document.body.removeChild(container);
  });

  describe('UI初期化', () => {
    test('UIManagerが正しく初期化される', () => {
      expect(uiManager).toBeDefined();
    });

    test('必要なUI要素が作成される', () => {
      uiManager.init();
      
      // UI要素の存在確認（実装後に詳細を追加）
      expect(() => uiManager.updateScore(0)).not.toThrow();
      expect(() => uiManager.updateLives(3)).not.toThrow();
    });
  });

  describe('スタート画面', () => {
    test('showStartScreen()でスタート画面が表示される', () => {
      uiManager.showStartScreen();
      // DOM要素の確認（実装後に詳細を追加）
    });

    test('hideStartScreen()でスタート画面が非表示になる', () => {
      uiManager.showStartScreen();
      uiManager.hideStartScreen();
      // DOM要素の確認（実装後に詳細を追加）
    });
  });

  describe('ゲームオーバー画面', () => {
    test('showGameOverScreen()でゲームオーバー画面が表示される', () => {
      const finalScore = 1000;
      uiManager.showGameOverScreen(finalScore);
      // スコアが正しく表示されることを確認（実装後に詳細を追加）
    });

    test('hideGameOverScreen()でゲームオーバー画面が非表示になる', () => {
      uiManager.showGameOverScreen(1000);
      uiManager.hideGameOverScreen();
      // DOM要素の確認（実装後に詳細を追加）
    });
  });

  describe('レベルクリア画面', () => {
    test('showLevelCompleteScreen()でレベルクリア画面が表示される', () => {
      uiManager.showLevelCompleteScreen();
      // DOM要素の確認（実装後に詳細を追加）
    });

    test('hideLevelCompleteScreen()でレベルクリア画面が非表示になる', () => {
      uiManager.showLevelCompleteScreen();
      uiManager.hideLevelCompleteScreen();
      // DOM要素の確認（実装後に詳細を追加）
    });
  });

  describe('ゲーム情報の更新', () => {
    test('updateScore()でスコア表示が更新される', () => {
      uiManager.updateScore(100);
      uiManager.updateScore(200);
      // DOM要素の確認（実装後に詳細を追加）
    });

    test('updateLives()でライフ表示が更新される', () => {
      uiManager.updateLives(3);
      uiManager.updateLives(2);
      uiManager.updateLives(1);
      uiManager.updateLives(0);
      // DOM要素の確認（実装後に詳細を追加）
    });
  });

  describe('マネージャーとの連携', () => {
    test('ScoreManagerの変更がUIに反映される', () => {
      scoreManager.reset();
      uiManager.updateScore(scoreManager.getScore());
      
      scoreManager.addScore(100);
      uiManager.updateScore(scoreManager.getScore());
      
      // スコアが正しく表示されることを確認（実装後に詳細を追加）
    });

    test('LivesManagerの変更がUIに反映される', () => {
      livesManager.reset();
      uiManager.updateLives(livesManager.getLives());
      
      livesManager.loseLife();
      uiManager.updateLives(livesManager.getLives());
      
      // ライフが正しく表示されることを確認（実装後に詳細を追加）
    });
  });

  describe('ゲーム状態との連携', () => {
    test('ゲーム開始時にUIが適切に更新される', () => {
      uiManager.showStartScreen();
      
      // ゲーム開始
      gameManager.init();
      gameManager.start();
      uiManager.hideStartScreen();
      
      // ゲーム中のUI状態を確認（実装後に詳細を追加）
    });

    test('ゲームオーバー時にUIが適切に更新される', () => {
      gameManager.init();
      gameManager.start();
      
      // ゲームオーバーのシミュレーション
      // 実装後に、実際のゲームオーバー処理を追加
      
      const finalScore = 1500;
      uiManager.showGameOverScreen(finalScore);
    });
  });
});