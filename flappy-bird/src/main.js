// main.js - Flappy Birdゲームのメインエントリーポイント（TDD t_wada方式実装）
// 日本語コメントで実装、export defaultは使用しない

import { Game } from './game.js';

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
  scoreElement = document.getElementById('score');
  statusElement = document.getElementById('status');

  // Gameインスタンス作成（gameCanvasのIDを渡す）
  game = new Game('gameCanvas');

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
  if (game && game.isRunning()) {
    // ゲーム状態更新
    game.update(deltaTime);

    // 描画処理
    game.draw();
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
      game.handleInput();
      break;
    
    case 'Enter':
      // Enterキーでリスタート（ゲームオーバー時）
      if (game.isGameOver()) {
        event.preventDefault();
        game.reset();
        game.start();
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
  game.handleInput();
}

/**
 * UI更新処理
 * スコア表示とゲーム状態表示を更新
 */
function updateUI() {
  if (!game) return;

  // スコア表示更新
  if (scoreElement) {
    scoreElement.textContent = `スコア: ${game.getScore()}`;
  }

  // ゲーム状態表示更新
  if (statusElement) {
    let statusText = '';
    if (game.isGameOver()) {
      statusText = 'ゲームオーバー';
    } else if (game.isRunning()) {
      statusText = 'プレイ中';
    } else {
      statusText = '待機中';
    }
    statusElement.textContent = statusText;
  }
}