// TodoItem TDD テストファイル
// t_wada方式: テストファースト → 仮実装 → 三角測量 → 一般化

import { TodoItem } from '../TodoItem.js';

describe('TodoItem', () => {
  describe('constructor', () => {
    test('新しいTodoItemを正しく初期化する', () => {
      const id = 'test-id-1';
      const title = 'テストタイトル';
      const description = 'テスト説明';
      const priority = 'high';
      const dueDate = '2025-12-31T23:59:59.999Z';
      const completed = false;

      const todo = new TodoItem(id, title, description, priority, dueDate, completed);

      expect(todo.getId()).toBe(id);
      expect(todo.getTitle()).toBe(title);
      expect(todo.getDescription()).toBe(description);
      expect(todo.getPriority()).toBe(priority);
      expect(todo.getDueDate()).toBe(dueDate);
      expect(todo.isCompleted()).toBe(completed);
      expect(todo.getCreatedAt()).toBeDefined();
      expect(todo.getUpdatedAt()).toBeDefined();
    });

    test('不正な優先度でエラーをスローする', () => {
      expect(() => {
        new TodoItem('id', 'title', 'desc', 'invalid', null, false);
      }).toThrow('Priority must be one of: high, medium, low');
    });
  });

  describe('setTitle', () => {
    test('タイトルを正しく設定する', () => {
      const todo = new TodoItem('id', 'title', 'desc', 'medium', null, false);
      const newTitle = '新しいタイトル';
      
      todo.setTitle(newTitle);
      
      expect(todo.getTitle()).toBe(newTitle);
    });

    test('空文字列のタイトルでエラーをスローする', () => {
      const todo = new TodoItem('id', 'title', 'desc', 'medium', null, false);
      
      expect(() => {
        todo.setTitle('');
      }).toThrow('Title cannot be empty');
    });
  });

  describe('setDescription', () => {
    test('説明を正しく設定する', () => {
      const todo = new TodoItem('id', 'title', 'desc', 'medium', null, false);
      const newDescription = '新しい説明';
      
      todo.setDescription(newDescription);
      
      expect(todo.getDescription()).toBe(newDescription);
    });
  });

  describe('setPriority', () => {
    test('有効な優先度を正しく設定する', () => {
      const todo = new TodoItem('id', 'title', 'desc', 'medium', null, false);
      
      todo.setPriority('high');
      expect(todo.getPriority()).toBe('high');
      
      todo.setPriority('low');
      expect(todo.getPriority()).toBe('low');
    });

    test('無効な優先度でエラーをスローする', () => {
      const todo = new TodoItem('id', 'title', 'desc', 'medium', null, false);
      
      expect(() => {
        todo.setPriority('invalid');
      }).toThrow('Priority must be one of: high, medium, low');
    });
  });

  describe('setDueDate', () => {
    test('有効な日付文字列を正しく設定する', () => {
      const todo = new TodoItem('id', 'title', 'desc', 'medium', null, false);
      const dueDate = '2025-12-31T23:59:59.999Z';
      
      todo.setDueDate(dueDate);
      
      expect(todo.getDueDate()).toBe(dueDate);
    });

    test('無効な日付文字列でエラーをスローする', () => {
      const todo = new TodoItem('id', 'title', 'desc', 'medium', null, false);
      
      expect(() => {
        todo.setDueDate('invalid-date');
      }).toThrow('Due date must be a valid ISO string');
    });
  });

  describe('toggleCompleted', () => {
    test('完了状態を正しく切り替える', () => {
      const todo = new TodoItem('id', 'title', 'desc', 'medium', null, false);
      
      expect(todo.isCompleted()).toBe(false);
      
      todo.toggleCompleted();
      expect(todo.isCompleted()).toBe(true);
      
      todo.toggleCompleted();
      expect(todo.isCompleted()).toBe(false);
    });
  });

  describe('getUpdatedAt', () => {
    test('プロパティ変更時にupdatedAtが更新される', () => {
      const todo = new TodoItem('id', 'title', 'desc', 'medium', null, false);
      const originalUpdatedAt = todo.getUpdatedAt();
      
      // 少し待機してから変更
      setTimeout(() => {
        todo.setTitle('新しいタイトル');
        expect(todo.getUpdatedAt()).not.toBe(originalUpdatedAt);
      }, 1);
    });
  });

  describe('toJSON', () => {
    test('JSON形式で正しく出力する', () => {
      const id = 'test-id';
      const title = 'テストタイトル';
      const description = 'テスト説明';
      const priority = 'high';
      const dueDate = '2025-12-31T23:59:59.999Z';
      const completed = false;
      
      const todo = new TodoItem(id, title, description, priority, dueDate, completed);
      const json = todo.toJSON();
      
      expect(json).toEqual({
        id,
        title,
        description,
        priority,
        dueDate,
        completed,
        createdAt: todo.getCreatedAt(),
        updatedAt: todo.getUpdatedAt()
      });
    });
  });

  describe('fromJSON (静的メソッド)', () => {
    test('JSONデータから正しくTodoItemを復元する', () => {
      const jsonData = {
        id: 'test-id',
        title: 'テストタイトル',
        description: 'テスト説明',
        priority: 'medium',
        dueDate: '2025-12-31T23:59:59.999Z',
        completed: true,
        createdAt: '2025-06-29T12:00:00.000Z',
        updatedAt: '2025-06-29T12:30:00.000Z'
      };
      
      const todo = TodoItem.fromJSON(jsonData);
      
      expect(todo.getId()).toBe(jsonData.id);
      expect(todo.getTitle()).toBe(jsonData.title);
      expect(todo.getDescription()).toBe(jsonData.description);
      expect(todo.getPriority()).toBe(jsonData.priority);
      expect(todo.getDueDate()).toBe(jsonData.dueDate);
      expect(todo.isCompleted()).toBe(jsonData.completed);
      expect(todo.getCreatedAt()).toBe(jsonData.createdAt);
      expect(todo.getUpdatedAt()).toBe(jsonData.updatedAt);
    });

    test('不完全なJSONデータでエラーをスローする', () => {
      const incompleteData = {
        id: 'test-id',
        title: 'テストタイトル'
        // 必須フィールドが不足
      };
      
      expect(() => {
        TodoItem.fromJSON(incompleteData);
      }).toThrow('Invalid JSON data for TodoItem');
    });

    test('nullデータでエラーをスローする', () => {
      expect(() => {
        TodoItem.fromJSON(null);
      }).toThrow('Invalid JSON data for TodoItem');
    });
  });

  // 三角測量のための追加テスト
  describe('エッジケースと境界値テスト', () => {
    test('dueDateがnullでも正しく動作する', () => {
      const todo = new TodoItem('id', 'title', 'desc', 'low', null, false);
      expect(todo.getDueDate()).toBeNull();
    });

    test('descriptionが空文字列でも正しく動作する', () => {
      const todo = new TodoItem('id', 'title', '', 'medium', null, false);
      expect(todo.getDescription()).toBe('');
    });

    test('複数回のtoggleCompletedが正しく動作する', () => {
      const todo = new TodoItem('id', 'title', 'desc', 'high', null, false);
      
      // 4回切り替え
      todo.toggleCompleted(); // true
      todo.toggleCompleted(); // false
      todo.toggleCompleted(); // true
      todo.toggleCompleted(); // false
      
      expect(todo.isCompleted()).toBe(false);
    });

    test('空白のみのタイトルでエラーをスローする', () => {
      const todo = new TodoItem('id', 'title', 'desc', 'medium', null, false);
      
      expect(() => {
        todo.setTitle('   ');
      }).toThrow('Title cannot be empty');
    });

    test('すべての優先度レベルを網羅テスト', () => {
      const priorities = ['high', 'medium', 'low'];
      
      priorities.forEach(priority => {
        const todo = new TodoItem('id', 'title', 'desc', priority, null, false);
        expect(todo.getPriority()).toBe(priority);
        
        // 他の優先度への変更もテスト
        const otherPriorities = priorities.filter(p => p !== priority);
        otherPriorities.forEach(newPriority => {
          todo.setPriority(newPriority);
          expect(todo.getPriority()).toBe(newPriority);
        });
      });
    });

    test('日付形式の厳密な検証', () => {
      const todo = new TodoItem('id', 'title', 'desc', 'medium', null, false);
      
      // 無効な日付形式のテスト
      const invalidDates = [
        '2025-13-31T23:59:59.999Z', // 無効な月
        '2025-12-32T23:59:59.999Z', // 無効な日
        '2025-12-31T25:00:00.000Z', // 無効な時間
        '2025-12-31',               // 不完全な形式
        'invalid-date-string'       // 完全に無効
      ];
      
      invalidDates.forEach(invalidDate => {
        expect(() => {
          todo.setDueDate(invalidDate);
        }).toThrow('Due date must be a valid ISO string');
      });
    });

    test('時間の境界値での日付検証', () => {
      const todo = new TodoItem('id', 'title', 'desc', 'medium', null, false);
      
      // 有効な境界値
      const validDates = [
        '2025-01-01T00:00:00.000Z',
        '2025-12-31T23:59:59.999Z',
        '2025-02-28T12:30:45.123Z'
      ];
      
      validDates.forEach(validDate => {
        expect(() => {
          todo.setDueDate(validDate);
        }).not.toThrow();
        expect(todo.getDueDate()).toBe(validDate);
      });
    });
  });
});