import { GameManager } from '../../managers/GameManager.js';

describe('GameManager', () => {
  let gameManager;

  beforeEach(() => {
    gameManager = new GameManager();
  });

  describe('コンストラクタ', () => {
    test('初期化時にゲーム状態がstoppedであること', () => {
      expect(gameManager.getGameState()).toBe('stopped');
    });

    test('初期化時にスコアが0であること', () => {
      expect(gameManager.getScore()).toBe(0);
    });

    test('初期化時にライフが3であること', () => {
      expect(gameManager.getLives()).toBe(3);
    });
  });

  describe('start', () => {
    test('ゲームを開始するとゲーム状態がrunningになること', () => {
      gameManager.start();
      expect(gameManager.getGameState()).toBe('running');
    });

    test('2回目のstartは無視されること', () => {
      gameManager.start();
      gameManager.start();
      expect(gameManager.getGameState()).toBe('running');
    });
  });

  describe('pause', () => {
    test('実行中のゲームを一時停止できること', () => {
      gameManager.start();
      gameManager.pause();
      expect(gameManager.getGameState()).toBe('paused');
    });

    test('停止中のゲームは一時停止できないこと', () => {
      gameManager.pause();
      expect(gameManager.getGameState()).toBe('stopped');
    });
  });

  describe('resume', () => {
    test('一時停止中のゲームを再開できること', () => {
      gameManager.start();
      gameManager.pause();
      gameManager.resume();
      expect(gameManager.getGameState()).toBe('running');
    });

    test('停止中のゲームは再開できないこと', () => {
      gameManager.resume();
      expect(gameManager.getGameState()).toBe('stopped');
    });
  });

  describe('reset', () => {
    test('リセット後にゲーム状態がstoppedになること', () => {
      gameManager.start();
      gameManager.reset();
      expect(gameManager.getGameState()).toBe('stopped');
    });

    test('リセット後にスコアが0になること', () => {
      gameManager.addScore(100);
      gameManager.reset();
      expect(gameManager.getScore()).toBe(0);
    });

    test('リセット後にライフが3になること', () => {
      gameManager._setLives(1);
      gameManager.reset();
      expect(gameManager.getLives()).toBe(3);
    });
  });

  describe('addScore', () => {
    test('スコアを正しく加算できること', () => {
      gameManager.addScore(100);
      expect(gameManager.getScore()).toBe(100);
    });

    test('複数回のスコア加算が累積されること', () => {
      gameManager.addScore(50);
      gameManager.addScore(30);
      expect(gameManager.getScore()).toBe(80);
    });
  });

  describe('loseLife', () => {
    test('ライフを1減らすこと', () => {
      gameManager.loseLife();
      expect(gameManager.getLives()).toBe(2);
    });

    test('ライフが0になったときにゲームオーバーを返すこと', () => {
      gameManager._setLives(1);
      const isGameOver = gameManager.loseLife();
      expect(isGameOver).toBe(true);
      expect(gameManager.getLives()).toBe(0);
    });
  });

  describe('update', () => {
    test('実行中のゲームは更新される', () => {
      gameManager.start();
      // updateメソッドが正常に呼び出せることを確認
      expect(() => gameManager.update(16)).not.toThrow();
    });

    test('停止中のゲームは更新されない', () => {
      // updateメソッドが正常に呼び出せることを確認
      expect(() => gameManager.update(16)).not.toThrow();
    });
  });

  describe('ゲーム状態の複合シナリオ', () => {
    test('ゲーム開始→一時停止→再開の流れが正しく動作すること', () => {
      gameManager.start();
      expect(gameManager.getGameState()).toBe('running');
      
      gameManager.pause();
      expect(gameManager.getGameState()).toBe('paused');
      
      gameManager.resume();
      expect(gameManager.getGameState()).toBe('running');
    });

    test('ライフを全て失った後の状態が正しいこと', () => {
      gameManager.start();
      
      // ライフを全て失う
      gameManager.loseLife(); // 3 -> 2
      gameManager.loseLife(); // 2 -> 1
      const isGameOver = gameManager.loseLife(); // 1 -> 0
      
      expect(isGameOver).toBe(true);
      expect(gameManager.getGameState()).toBe('gameOver');
      expect(gameManager.getLives()).toBe(0);
    });

    test('ゲームオーバー後に開始可能であること', () => {
      // ゲームオーバー状態にする
      gameManager.start();
      gameManager._setLives(1);
      gameManager.loseLife();
      
      expect(gameManager.getGameState()).toBe('gameOver');
      
      // リセットして再開始
      gameManager.reset();
      gameManager.start();
      
      expect(gameManager.getGameState()).toBe('running');
      expect(gameManager.getLives()).toBe(3);
      expect(gameManager.getScore()).toBe(0);
    });

    test('大きなスコア値の処理', () => {
      gameManager.addScore(999999);
      expect(gameManager.getScore()).toBe(999999);
      
      gameManager.addScore(1);
      expect(gameManager.getScore()).toBe(1000000);
    });

    test('複数の一時停止・再開操作', () => {
      gameManager.start();
      
      // 複数回の一時停止・再開
      for (let i = 0; i < 5; i++) {
        gameManager.pause();
        expect(gameManager.getGameState()).toBe('paused');
        
        gameManager.resume();
        expect(gameManager.getGameState()).toBe('running');
      }
    });
  });
});