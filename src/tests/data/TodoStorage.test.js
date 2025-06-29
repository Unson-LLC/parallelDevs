// TodoStorage.test.js - TDD方式によるテスト

const { TodoStorage } = require('../../data/TodoStorage');

// LocalStorageのモック
global.localStorage = {
  store: {},
  getItem: function(key) {
    return this.store[key] || null;
  },
  setItem: function(key, value) {
    this.store[key] = value.toString();
  },
  removeItem: function(key) {
    delete this.store[key];
  },
  clear: function() {
    this.store = {};
  }
};

describe('TodoStorage', () => {
  let storage;
  const mockTodos = [
    {
      id: "1",
      title: "テストタスク1",
      description: "説明1",
      priority: "high",
      dueDate: "2025-12-31T23:59:59.999Z",
      completed: false,
      createdAt: "2025-06-29T12:00:00.000Z",
      updatedAt: "2025-06-29T12:00:00.000Z"
    },
    {
      id: "2", 
      title: "テストタスク2",
      description: "説明2",
      priority: "medium",
      dueDate: "2025-12-25T23:59:59.999Z",
      completed: true,
      createdAt: "2025-06-28T12:00:00.000Z",
      updatedAt: "2025-06-29T13:00:00.000Z"
    }
  ];

  beforeEach(() => {
    storage = new TodoStorage();
    // LocalStorageをクリア
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  afterEach(() => {
    // テスト後のクリーンアップ
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  // 基本機能テスト（レッドフェーズ）
  describe('基本機能', () => {
    test('getStorageKey()でストレージキーを取得できる', () => {
      expect(storage.getStorageKey()).toBe('todo-app-data');
    });

    test('save()でLocalStorageにデータを保存できる', () => {
      expect(() => storage.save(mockTodos)).not.toThrow();
    });

    test('load()でLocalStorageからデータを読み込める（空の場合）', () => {
      const result = storage.load();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test('clear()で全データを削除できる', () => {
      expect(() => storage.clear()).not.toThrow();
    });

    test('exportData()でデータをエクスポートできる', () => {
      const result = storage.exportData();
      expect(typeof result).toBe('string');
    });

    test('importData()でデータをインポートできる', () => {
      const jsonData = JSON.stringify({ todos: mockTodos });
      expect(() => storage.importData(jsonData)).not.toThrow();
    });
  });

  // 三角測量フェーズ - 複数のテストケースで一般化を促進
  describe('データ保存と読み込み（三角測量）', () => {
    test('データを保存後、読み込みで同じデータが取得できる', () => {
      storage.save(mockTodos);
      const result = storage.load();
      expect(result).toEqual(mockTodos);
    });

    test('空配列を保存後、空配列が読み込める', () => {
      storage.save([]);
      const result = storage.load();
      expect(result).toEqual([]);
    });

    test('null/undefinedを保存時はデフォルト処理される', () => {
      storage.save(null);
      const result = storage.load();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('エラーハンドリング（三角測量）', () => {
    test('無効なJSONでインポート時はエラーが発生する', () => {
      expect(() => storage.importData('invalid json')).toThrow('データのインポートに失敗しました');
    });

    test('todosプロパティが無いデータのインポート時はエラーが発生する', () => {
      const invalidData = JSON.stringify({ settings: {} });
      expect(() => storage.importData(invalidData)).toThrow('データのインポートに失敗しました');
    });

    test('todosが配列でないデータのインポート時はエラーが発生する', () => {
      const invalidData = JSON.stringify({ todos: 'not an array' });
      expect(() => storage.importData(invalidData)).toThrow('データのインポートに失敗しました');
    });
  });

  describe('データエクスポート（三角測量）', () => {
    test('データを保存後、エクスポートで正しいJSON文字列が取得できる', () => {
      storage.save(mockTodos);
      const exported = storage.exportData();
      const parsed = JSON.parse(exported);
      expect(parsed.todos).toEqual(mockTodos);
      expect(parsed.settings).toBeDefined();
    });

    test('データが無い状態でもエクスポートできる', () => {
      storage.clear();
      const exported = storage.exportData();
      const parsed = JSON.parse(exported);
      expect(parsed.todos).toEqual([]);
    });
  });

  describe('データクリア（三角測量）', () => {
    test('データ保存後のクリアで読み込み結果が空になる', () => {
      storage.save(mockTodos);
      storage.clear();
      const result = storage.load();
      expect(result).toEqual([]);
    });
  });
});