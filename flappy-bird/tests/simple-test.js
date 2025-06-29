// シンプルなテストフレームワーク
class SimpleTest {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    describe(description, testFn) {
        console.log(`\n📋 ${description}`);
        try {
            testFn();
        } catch (error) {
            console.error(`❌ テストスイート失敗: ${error.message}`);
        }
    }

    it(description, testFn) {
        try {
            testFn();
            this.passed++;
            console.log(`✅ ${description}`);
        } catch (error) {
            this.failed++;
            console.log(`❌ ${description}`);
            console.log(`   理由: ${error.message}`);
        }
    }

    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`期待値: ${expected}, 実際: ${actual}`);
                }
            },
            toBeCloseTo: (expected, precision = 2) => {
                const diff = Math.abs(actual - expected);
                const tolerance = Math.pow(10, -precision);
                if (diff > tolerance) {
                    throw new Error(`期待値: ${expected} (±${tolerance}), 実際: ${actual}`);
                }
            },
            toBeTruthy: () => {
                if (!actual) {
                    throw new Error(`期待値: truthy, 実際: ${actual}`);
                }
            },
            toBeFalsy: () => {
                if (actual) {
                    throw new Error(`期待値: falsy, 実際: ${actual}`);
                }
            },
            toBeInstanceOf: (expectedClass) => {
                if (!(actual instanceof expectedClass)) {
                    throw new Error(`期待値: ${expectedClass.name}のインスタンス, 実際: ${actual.constructor.name}`);
                }
            }
        };
    }

    runSummary() {
        console.log(`\n📊 テスト結果:`);
        console.log(`✅ 成功: ${this.passed}`);
        console.log(`❌ 失敗: ${this.failed}`);
        console.log(`📈 成功率: ${Math.round((this.passed / (this.passed + this.failed)) * 100)}%`);
        
        // ゲーム画面にテスト結果を表示
        const statusElement = document.getElementById('status');
        if (statusElement) {
            if (this.failed === 0) {
                statusElement.textContent = `✅ 全テスト成功 (${this.passed}件)`;
                statusElement.className = 'status-ready';
            } else {
                statusElement.textContent = `❌ テスト失敗 ${this.failed}件 / 成功 ${this.passed}件`;
                statusElement.className = 'status-gameover';
            }
        }
    }
}

// グローバルなテストインスタンス
const test = new SimpleTest();

// ブラウザでのテスト実行
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        // ページロード後にテストを実行
        setTimeout(() => {
            runAllTests();
        }, 100);
    });
}

function runAllTests() {
    console.log('🧪 Flappy Bird TDD テスト開始');
    
    // 統合テストを最初に実行
    runIntegrationTests();
    
    // 各クラスのテスト
    testBirdClass();
    testPipeClass();
    testGameClass();
    
    test.runSummary();
}

// Birdクラスのテスト
function testBirdClass() {
    test.describe('Bird クラステスト', () => {
        test.it('Birdクラスが存在する', () => {
            test.expect(typeof Bird).toBe('function');
        });
        
        test.it('Birdインスタンスを作成できる', () => {
            const bird = new Bird();
            test.expect(bird).toBeInstanceOf(Bird);
            test.expect(bird.x).toBe(50);
            test.expect(bird.y).toBe(300);
        });
        
        test.it('カスタム位置でBirdを作成できる', () => {
            const bird = new Bird(100, 200);
            test.expect(bird.x).toBe(100);
            test.expect(bird.y).toBe(200);
        });
        
        test.it('初期状態では生きている', () => {
            const bird = new Bird();
            test.expect(bird.isAlive()).toBeTruthy();
        });
        
        test.it('重力が適用される', () => {
            const bird = new Bird();
            const initialY = bird.y;
            bird.update();
            test.expect(bird.y > initialY).toBeTruthy();
        });
        
        test.it('ジャンプできる', () => {
            const bird = new Bird();
            bird.update(); // 重力を適用
            const beforeJump = bird.velocity;
            bird.jump();
            test.expect(bird.velocity).toBe(-12);
            test.expect(bird.velocity < beforeJump).toBeTruthy();
        });
        
        test.it('地面に衝突すると死ぬ', () => {
            const bird = new Bird();
            bird.y = 600; // 地面の位置
            bird.update();
            test.expect(bird.isAlive()).toBeFalsy();
        });
        
        test.it('死んだ鳥はジャンプできない', () => {
            const bird = new Bird();
            bird.die();
            const beforeVelocity = bird.velocity;
            bird.jump();
            test.expect(bird.velocity).toBe(beforeVelocity);
        });
        
        test.it('リセットで初期状態に戻る', () => {
            const bird = new Bird();
            bird.y = 500;
            bird.velocity = 10;
            bird.die();
            bird.reset();
            test.expect(bird.x).toBe(50);
            test.expect(bird.y).toBe(300);
            test.expect(bird.velocity).toBe(0);
            test.expect(bird.isAlive()).toBeTruthy();
        });
        
        test.it('当たり判定の矩形を取得できる', () => {
            const bird = new Bird(100, 200);
            const bounds = bird.getBounds();
            test.expect(bounds.x).toBe(100);
            test.expect(bounds.y).toBe(200);
            test.expect(bounds.width).toBe(34);
            test.expect(bounds.height).toBe(24);
        });
    });
}

function testPipeClass() {
    test.describe('Pipe クラステスト', () => {
        test.it('Pipeクラスが存在する', () => {
            test.expect(typeof Pipe).toBe('function');
        });
    });
}

function testGameClass() {
    test.describe('Game クラステスト', () => {
        test.it('Gameクラスが存在する', () => {
            test.expect(typeof Game).toBe('function');
        });
    });
}