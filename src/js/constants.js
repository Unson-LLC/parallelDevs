/**
 * ブロック崩しゲーム用定数定義
 * パフォーマンス向上のため、関連する定数をグループ化し、計算済み値を事前定義
 */

// =============================================
// 基本ゲーム設定
// =============================================

/** ゲーム画面の幅 */
const GAME_WIDTH = 800;
/** ゲーム画面の高さ */
const GAME_HEIGHT = 600;

// =============================================
// パドル設定
// =============================================

/** パドルの幅 */
const PADDLE_WIDTH = 100;
/** パドルの高さ */
const PADDLE_HEIGHT = 20;
/** パドルの移動速度（ピクセル/秒） */
const PADDLE_SPEED = 300;
/** パドルの画面下からのオフセット */
const PADDLE_Y_OFFSET = 50;

// =============================================
// ボール設定
// =============================================

/** ボールの半径 */
const BALL_SIZE = 10;
/** ボールの初期速度（ピクセル/秒） */
const BALL_INITIAL_SPEED = 250;
/** ボールの最大速度（ピクセル/秒） */
const BALL_MAX_SPEED = 500;

// =============================================
// ブロック設定
// =============================================

/** ブロックの幅 */
const BLOCK_WIDTH = 75;
/** ブロックの高さ */
const BLOCK_HEIGHT = 20;
/** ブロックの行数 */
const BLOCK_ROWS = 5;
/** ブロックの列数 */
const BLOCK_COLS = 10;
/** ブロック間のパディング */
const BLOCK_PADDING = 5;
/** ブロック領域の上端オフセット */
const BLOCK_OFFSET_TOP = 60;

// =============================================
// 計算済み値（パフォーマンス向上）
// =============================================

/** ブロック領域の総幅（パディング含む） */
const BLOCK_AREA_WIDTH = (BLOCK_WIDTH + BLOCK_PADDING) * BLOCK_COLS - BLOCK_PADDING;
/** ブロック領域の左端オフセット（中央配置） */
const BLOCK_OFFSET_LEFT = (GAME_WIDTH - BLOCK_AREA_WIDTH) / 2;
/** パドルのY座標（固定値） */
const PADDLE_Y = GAME_HEIGHT - PADDLE_Y_OFFSET;
/** ゲーム境界の最小X座標 */
const GAME_BOUNDS_MIN_X = BALL_SIZE;
/** ゲーム境界の最大X座標 */
const GAME_BOUNDS_MAX_X = GAME_WIDTH - BALL_SIZE;
/** ゲーム境界の最小Y座標 */
const GAME_BOUNDS_MIN_Y = BALL_SIZE;

// =============================================
// ゲーム設定
// =============================================

/** 初期ライフ数 */
const INITIAL_LIVES = 3;
/** 最大ライフ数 */
const MAX_LIVES = 5;

// =============================================
// スコア設定
// =============================================

/** 基本ブロックのスコア */
const SCORE_BLOCK_BASIC = 10;
/** 中級ブロックのスコア */
const SCORE_BLOCK_MEDIUM = 20;
/** 上級ブロックのスコア */
const SCORE_BLOCK_HARD = 30;

// =============================================
// エクスポート（下位互換性維持）
// =============================================

export { 
  GAME_WIDTH, 
  GAME_HEIGHT, 
  PADDLE_WIDTH, 
  PADDLE_HEIGHT, 
  PADDLE_SPEED,
  PADDLE_Y_OFFSET,
  PADDLE_Y,
  BALL_SIZE, 
  BALL_INITIAL_SPEED,
  BALL_MAX_SPEED,
  BLOCK_WIDTH, 
  BLOCK_HEIGHT, 
  BLOCK_ROWS, 
  BLOCK_COLS,
  BLOCK_PADDING,
  BLOCK_OFFSET_TOP,
  BLOCK_OFFSET_LEFT,
  BLOCK_AREA_WIDTH,
  GAME_BOUNDS_MIN_X,
  GAME_BOUNDS_MAX_X,
  GAME_BOUNDS_MIN_Y,
  INITIAL_LIVES,
  MAX_LIVES,
  SCORE_BLOCK_BASIC,
  SCORE_BLOCK_MEDIUM,
  SCORE_BLOCK_HARD
};