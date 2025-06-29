// main.js - Flappy Birdゲームのメインエントリーポイント（TDD t_wada方式実装）
// 日本語コメントで実装、export defaultは使用しない

import { Game } from './Game.js';

// グローバル変数（モジュールスコープ）
let game = null;
let lastTimestamp = 0;
let scoreElement = null;
let statusElement = null;

/**
 * ゲーム開始関数
 * Canvas要素取得、Gameインスタンス作成、イベントリスナー登録、ゲームループ開始
 * @returns {void}
 */
export function startGame() {
  // Canvas要素取得
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) {
    throw new Error('Canvas element not found');
  }

  // UI要素取得
  scoreElement = document.getElementById('scoreDisplay');
  statusElement = document.getElementById('gameStatus');

  // Gameインスタンス作成（800x600は標準的なサイズ）
  game = new Game(canvas, 800, 600);

  // キーボードイベントリスナー登録
  document.addEventListener('keydown', handleKeyInput);

  // マウスクリックイベントリスナー登録
  canvas.addEventListener('click', handleMouseInput);

  // ゲーム開始
  game.start();

  // ゲームループ開始
  requestAnimationFrame(gameLoop);
}

/**
 * ゲームループ関数
 * デルタタイム計算、ゲーム状態更新、描画処理、UI更新、次フレーム予約
 * @param {number} timestamp - タイムスタンプ
 * @returns {void}
 */
export function gameLoop(timestamp) {
  // 異常なタイムスタンプのハンドリング
  if (typeof timestamp !== 'number' || isNaN(timestamp) || timestamp < 0 || !isFinite(timestamp)) {
    timestamp = performance.now();
  }

  // デルタタイム計算（秒単位）
  const deltaTime = lastTimestamp === 0 ? 0 : (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  // ゲームインスタンスが存在し、実行中の場合のみ更新
  if (game && game.isRunning) {
    // ゲーム状態更新
    game.update(deltaTime);

    // 描画処理
    game.render();
  }

  // UI更新
  updateUI();

  // 次フレーム予約
  requestAnimationFrame(gameLoop);
}

/**
 * キーボード入力処理
 * スペースキー: ジャンプ、Enterキー: ゲームリスタート
 * @param {KeyboardEvent} event - キーボードイベント
 */
function handleKeyInput(event) {
  if (!game) return;

  switch (event.code) {
    case 'Space':
      // スペースキーでジャンプ
      event.preventDefault();
      game.handleInput('jump');
      break;
    
    case 'Enter':
      // Enterキーでリスタート（ゲームオーバー時）
      if (game.gameState === 'gameover') {
        event.preventDefault();
        game.reset();
      }
      break;
    
    default:
      // その他のキーは無視
      break;
  }
}

/**
 * マウス入力処理
 * クリックでジャンプ
 * @param {MouseEvent} event - マウスイベント
 */
function handleMouseInput(event) {
  if (!game) return;

  // マウスクリックでジャンプ
  event.preventDefault();
  game.handleInput('jump');
}

/**
 * UI更新処理
 * スコア表示とゲーム状態表示を更新
 */
function updateUI() {
  if (!game) return;

  // スコア表示更新
  if (scoreElement) {
    scoreElement.textContent = `Score: ${game.score}`;
  }

  // ゲーム状態表示更新
  if (statusElement) {
    let statusText = '';
    switch (game.gameState) {
      case 'menu':
        statusText = 'Menu';
        break;
      case 'playing':
        statusText = 'Playing';
        break;
      case 'gameover':
        statusText = 'Game Over';
        break;
      default:
        statusText = 'Unknown';
        break;
    }
    statusElement.textContent = statusText;
  }
}