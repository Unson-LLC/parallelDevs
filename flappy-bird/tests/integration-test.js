// Flappy Bird 統合テスト
// インターフェース定義に基づいたテストファースト実装

function runIntegrationTests() {
    test.describe('Flappy Bird 統合テスト', () => {
        
        test.describe('Bird-Game統合', () => {
            test.it('ゲームにBirdが正しく統合される', () => {
                const game = new Game('gameCanvas');
                test.expect(game.bird).toBeInstanceOf(Bird);
                test.expect(game.bird.isAlive()).toBeTruthy();
            });
            
            test.it('Birdのジャンプがゲームに反映される', () => {
                const game = new Game('gameCanvas');
                const initialY = game.bird.y;
                game.handleInput('jump');
                game.update();
                test.expect(game.bird.y < initialY).toBeTruthy();
            });
        });
        
        test.describe('Pipe-Game統合', () => {
            test.it('ゲームにPipeが正しく生成される', () => {
                const game = new Game('gameCanvas');
                game.start();
                game.update(); // パイプ生成をトリガー
                test.expect(game.pipes.length > 0).toBeTruthy();
                test.expect(game.pipes[0]).toBeInstanceOf(Pipe);
            });
            
            test.it('Pipeがスクロールする', () => {
                const game = new Game('gameCanvas');
                const pipe = new Pipe(400, 200, 150);
                game.pipes.push(pipe);
                const initialX = pipe.x;
                game.update();
                test.expect(pipe.x < initialX).toBeTruthy();
            });
        });
        
        test.describe('Bird-Pipe衝突判定統合', () => {
            test.it('BirdとPipeの衝突が正しく検出される', () => {
                const game = new Game('gameCanvas');
                const bird = game.bird;
                const pipe = new Pipe(50, 200, 100); // 鳥の位置に配置
                game.pipes.push(pipe);
                
                bird.y = 180; // パイプ内部に配置
                const collision = game.checkCollisions();
                test.expect(collision).toBeTruthy();
                test.expect(bird.isAlive()).toBeFalsy();
            });
            
            test.it('安全な通過でスコアが増加する', () => {
                const game = new Game('gameCanvas');
                const initialScore = game.getScore();
                const pipe = new Pipe(100, 200, 150);
                game.pipes.push(pipe);
                
                // 鳥を安全な位置に配置
                game.bird.y = 250;
                
                // パイプを鳥の後ろまで移動
                for (let i = 0; i < 10; i++) {
                    game.update();
                }
                
                test.expect(game.getScore() > initialScore).toBeTruthy();
            });
        });
        
        test.describe('ゲーム状態管理統合', () => {
            test.it('ゲーム開始から終了まで正常に動作する', () => {
                const game = new Game('gameCanvas');
                
                // 初期状態
                test.expect(game.bird.isAlive()).toBeTruthy();
                test.expect(game.getScore()).toBe(0);
                
                // ゲーム開始
                game.start();
                test.expect(game.isRunning()).toBeTruthy();
                
                // 鳥を地面に落とす
                game.bird.y = 600;
                game.update();
                
                // ゲームオーバー状態
                test.expect(game.bird.isAlive()).toBeFalsy();
                test.expect(game.isGameOver()).toBeTruthy();
            });
            
            test.it('ゲームリセットで全て初期状態に戻る', () => {
                const game = new Game('gameCanvas');
                
                // ゲーム状態を変更
                game.start();
                game.bird.y = 500;
                game.bird.die();
                game.score = 10;
                game.pipes.push(new Pipe(300, 200, 150));
                
                // リセット実行
                game.reset();
                
                // 初期状態確認
                test.expect(game.bird.isAlive()).toBeTruthy();
                test.expect(game.bird.y).toBe(300);
                test.expect(game.getScore()).toBe(0);
                test.expect(game.pipes.length).toBe(0);
                test.expect(game.isRunning()).toBeFalsy();
            });
        });
        
        test.describe('Canvas描画統合', () => {
            test.it('全要素が正しく描画される', () => {
                // モックCanvas作成
                const mockCanvas = {
                    getContext: () => ({
                        fillStyle: '',
                        fillRect: () => {},
                        clearRect: () => {},
                        save: () => {},
                        restore: () => {},
                        translate: () => {},
                        rotate: () => {}
                    })
                };
                
                const game = new Game();
                game.canvas = mockCanvas;
                game.ctx = mockCanvas.getContext('2d');
                
                // 描画テスト（エラーが発生しないことを確認）
                test.expect(() => {
                    game.draw();
                }).not.toThrow();
            });
        });
        
        test.describe('パフォーマンス統合', () => {
            test.it('60FPSでスムーズに動作する', () => {
                const game = new Game('gameCanvas');
                const startTime = performance.now();
                
                // 60フレーム分実行
                for (let i = 0; i < 60; i++) {
                    game.update();
                    game.draw();
                }
                
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                // 1秒以内で60フレーム処理できることを確認
                test.expect(duration < 1000).toBeTruthy();
            });
        });
    });
}