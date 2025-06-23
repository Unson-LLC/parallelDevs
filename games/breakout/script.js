// キャンバスとコンテキストの取得
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');

// ゲーム変数
let score = 0;
let lives = 3;
let isPaused = false;
let isGameOver = false;
let isGameWon = false;
let animationId;

// ボール
const ball = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    radius: 8,
    dx: 4,
    dy: -4,
    speed: 4
};

// パドル
const paddle = {
    width: 100,
    height: 15,
    x: canvas.width / 2 - 50,
    y: canvas.height - 30,
    speed: 8
};

// ブロック設定
const brickRowCount = 5;
const brickColumnCount = 10;
const brickWidth = 70;
const brickHeight = 20;
const brickPadding = 5;
const brickOffsetTop = 60;
const brickOffsetLeft = 35;

// ブロック配列の初期化
let bricks = [];
function initBricks() {
    bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r] = { 
                x: 0, 
                y: 0, 
                status: 1,
                color: `hsl(${r * 50}, 70%, 50%)`
            };
        }
    }
}

// マウス位置
let mouseX = 0;

// キーボード入力
const keys = {
    left: false,
    right: false
};

// イベントリスナー
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
});

startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', togglePause);

// ゲーム開始
function startGame() {
    resetGame();
    isGameOver = false;
    isGameWon = false;
    isPaused = false;
    startButton.style.display = 'none';
    pauseButton.style.display = 'inline-block';
    gameLoop();
}

// ゲームリセット
function resetGame() {
    score = 0;
    lives = 3;
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 100;
    ball.dx = 4;
    ball.dy = -4;
    paddle.x = canvas.width / 2 - paddle.width / 2;
    initBricks();
    updateScore();
    updateLives();
}

// 一時停止
function togglePause() {
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? '再開' : '一時停止';
    if (!isPaused) {
        gameLoop();
    }
}

// スコア更新
function updateScore() {
    scoreElement.textContent = score;
}

// 残機更新
function updateLives() {
    livesElement.textContent = lives;
}

// ボール描画
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#e74c3c';
    ctx.fill();
    ctx.closePath();
}

// パドル描画
function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.fillStyle = '#3498db';
    ctx.fill();
    ctx.closePath();
}

// ブロック描画
function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                ctx.fillStyle = bricks[c][r].color;
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

// パドル移動
function movePaddle() {
    // マウス操作
    if (mouseX > 0) {
        paddle.x = mouseX - paddle.width / 2;
    }
    
    // キーボード操作
    if (keys.left && paddle.x > 0) {
        paddle.x -= paddle.speed;
    }
    if (keys.right && paddle.x < canvas.width - paddle.width) {
        paddle.x += paddle.speed;
    }
    
    // 画面端制限
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, paddle.x));
}

// ボール移動
function moveBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // 壁との衝突判定
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx = -ball.dx;
    }
    if (ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
    }
    
    // 画面下に落ちた場合
    if (ball.y - ball.radius > canvas.height) {
        lives--;
        updateLives();
        if (lives <= 0) {
            gameOver();
        } else {
            resetBall();
        }
    }
}

// ボールリセット
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 100;
    ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = -4;
}

// 衝突判定
function collisionDetection() {
    // ブロックとの衝突
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                if (ball.x > b.x && ball.x < b.x + brickWidth &&
                    ball.y > b.y && ball.y < b.y + brickHeight) {
                    ball.dy = -ball.dy;
                    b.status = 0;
                    score += 10;
                    updateScore();
                    
                    // 全ブロック破壊チェック
                    if (checkWin()) {
                        gameWon();
                    }
                }
            }
        }
    }
    
    // パドルとの衝突
    if (ball.y + ball.radius > paddle.y &&
        ball.y - ball.radius < paddle.y + paddle.height &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width) {
        
        // パドルの中心からの距離に応じて反射角度を変更
        const hitPos = (ball.x - paddle.x) / paddle.width;
        ball.dx = 8 * (hitPos - 0.5);
        ball.dy = -Math.abs(ball.dy);
        
        // スピード調整
        const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        ball.dx = (ball.dx / currentSpeed) * ball.speed;
        ball.dy = (ball.dy / currentSpeed) * ball.speed;
    }
}

// 勝利判定
function checkWin() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                return false;
            }
        }
    }
    return true;
}

// ゲームオーバー
function gameOver() {
    isGameOver = true;
    cancelAnimationFrame(animationId);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e74c3c';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
    ctx.font = '24px Arial';
    ctx.fillText(`最終スコア: ${score}`, canvas.width / 2, canvas.height / 2 + 50);
    startButton.style.display = 'inline-block';
    startButton.textContent = 'もう一度プレイ';
    pauseButton.style.display = 'none';
}

// ゲームクリア
function gameWon() {
    isGameWon = true;
    cancelAnimationFrame(animationId);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#2ecc71';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CLEAR!', canvas.width / 2, canvas.height / 2);
    ctx.font = '24px Arial';
    ctx.fillText(`最終スコア: ${score}`, canvas.width / 2, canvas.height / 2 + 50);
    startButton.style.display = 'inline-block';
    startButton.textContent = 'もう一度プレイ';
    pauseButton.style.display = 'none';
}

// ゲームループ
function gameLoop() {
    if (isPaused || isGameOver || isGameWon) {
        return;
    }
    
    // 画面クリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 描画と更新
    drawBricks();
    drawBall();
    drawPaddle();
    movePaddle();
    moveBall();
    collisionDetection();
    
    animationId = requestAnimationFrame(gameLoop);
}

// 初期化
initBricks();