// SortManager.test.js - TDD テストファースト
import { describe, beforeEach, it, expect } from '@jest/globals';
import { SortManager } from '../../managers/SortManager.js';

describe('SortManager', () => {
  let sortManager;
  let mockTodos;

  beforeEach(() => {
    sortManager = new SortManager();
    
    // テスト用のモックデータ
    mockTodos = [
      {
        getId: () => '1',
        getTitle: () => 'タスクB',
        getCreatedAt: () => new Date('2023-01-01'),
        getUpdatedAt: () => new Date('2023-01-02'),
        getDueDate: () => new Date('2023-12-31'),
        getPriority: () => 'high',
        isCompleted: () => false
      },
      {
        getId: () => '2',
        getTitle: () => 'タスクA',
        getCreatedAt: () => new Date('2023-01-02'),
        getUpdatedAt: () => new Date('2023-01-01'),
        getDueDate: () => new Date('2023-06-30'),
        getPriority: () => 'low',
        isCompleted: () => true
      },
      {
        getId: () => '3',
        getTitle: () => 'タスクC',
        getCreatedAt: () => new Date('2023-01-03'),
        getUpdatedAt: () => new Date('2023-01-03'),
        getDueDate: () => null,
        getPriority: () => 'medium',
        isCompleted: () => false
      }
    ];
  });

  describe('sortByCreatedDate', () => {
    it('作成日で昇順ソートができる', () => {
      const result = sortManager.sortByCreatedDate(mockTodos, true);
      expect(result[0].getId()).toBe('1'); // 2023-01-01
      expect(result[1].getId()).toBe('2'); // 2023-01-02
      expect(result[2].getId()).toBe('3'); // 2023-01-03
    });

    it('作成日で降順ソートができる', () => {
      const result = sortManager.sortByCreatedDate(mockTodos, false);
      expect(result[0].getId()).toBe('3'); // 2023-01-03
      expect(result[1].getId()).toBe('2'); // 2023-01-02
      expect(result[2].getId()).toBe('1'); // 2023-01-01
    });

    it('元の配列を変更しない', () => {
      const originalOrder = mockTodos.map(todo => todo.getId());
      sortManager.sortByCreatedDate(mockTodos, true);
      const currentOrder = mockTodos.map(todo => todo.getId());
      expect(currentOrder).toEqual(originalOrder);
    });
  });

  describe('sortByUpdatedDate', () => {
    it('更新日で昇順ソートができる', () => {
      const result = sortManager.sortByUpdatedDate(mockTodos, true);
      expect(result[0].getId()).toBe('2'); // 2023-01-01
      expect(result[1].getId()).toBe('1'); // 2023-01-02
      expect(result[2].getId()).toBe('3'); // 2023-01-03
    });

    it('更新日で降順ソートができる', () => {
      const result = sortManager.sortByUpdatedDate(mockTodos, false);
      expect(result[0].getId()).toBe('3'); // 2023-01-03
      expect(result[1].getId()).toBe('1'); // 2023-01-02
      expect(result[2].getId()).toBe('2'); // 2023-01-01
    });
  });

  describe('sortByDueDate', () => {
    it('期日で昇順ソートができる（nullは最後）', () => {
      const result = sortManager.sortByDueDate(mockTodos, true);
      expect(result[0].getId()).toBe('2'); // 2023-06-30
      expect(result[1].getId()).toBe('1'); // 2023-12-31
      expect(result[2].getId()).toBe('3'); // null
    });

    it('期日で降順ソートができる（nullは最後）', () => {
      const result = sortManager.sortByDueDate(mockTodos, false);
      expect(result[0].getId()).toBe('1'); // 2023-12-31
      expect(result[1].getId()).toBe('2'); // 2023-06-30
      expect(result[2].getId()).toBe('3'); // null
    });
  });

  describe('sortByPriority', () => {
    it('優先度で昇順ソート（high→medium→low）', () => {
      const result = sortManager.sortByPriority(mockTodos, true);
      expect(result[0].getPriority()).toBe('high');
      expect(result[1].getPriority()).toBe('medium');
      expect(result[2].getPriority()).toBe('low');
    });

    it('優先度で降順ソート（low→medium→high）', () => {
      const result = sortManager.sortByPriority(mockTodos, false);
      expect(result[0].getPriority()).toBe('low');
      expect(result[1].getPriority()).toBe('medium');
      expect(result[2].getPriority()).toBe('high');
    });
  });

  describe('sortByTitle', () => {
    it('タイトルで昇順ソートができる', () => {
      const result = sortManager.sortByTitle(mockTodos, true);
      expect(result[0].getTitle()).toBe('タスクA');
      expect(result[1].getTitle()).toBe('タスクB');
      expect(result[2].getTitle()).toBe('タスクC');
    });

    it('タイトルで降順ソートができる', () => {
      const result = sortManager.sortByTitle(mockTodos, false);
      expect(result[0].getTitle()).toBe('タスクC');
      expect(result[1].getTitle()).toBe('タスクB');
      expect(result[2].getTitle()).toBe('タスクA');
    });
  });

  describe('sortByCompletion', () => {
    it('完了済みを先頭にソートできる', () => {
      const result = sortManager.sortByCompletion(mockTodos, true);
      expect(result[0].isCompleted()).toBe(true);
      expect(result[1].isCompleted()).toBe(false);
      expect(result[2].isCompleted()).toBe(false);
    });

    it('未完了を先頭にソートできる', () => {
      const result = sortManager.sortByCompletion(mockTodos, false);
      expect(result[0].isCompleted()).toBe(false);
      expect(result[1].isCompleted()).toBe(false);
      expect(result[2].isCompleted()).toBe(true);
    });
  });

  describe('安定ソート', () => {
    it('同じ優先度のアイテムは元の順序を保持する', () => {
      const samePriorityTodos = [
        {
          getId: () => '1',
          getPriority: () => 'high',
          getTitle: () => 'First'
        },
        {
          getId: () => '2',
          getPriority: () => 'high',
          getTitle: () => 'Second'
        }
      ];
      
      const result = sortManager.sortByPriority(samePriorityTodos, true);
      expect(result[0].getId()).toBe('1');
      expect(result[1].getId()).toBe('2');
    });
  });

  describe('エラーハンドリング', () => {
    it('空の配列を処理できる', () => {
      const result = sortManager.sortByTitle([], true);
      expect(result).toEqual([]);
    });

    it('null/undefinedの配列を適切に処理する', () => {
      expect(() => sortManager.sortByTitle(null, true)).not.toThrow();
      expect(() => sortManager.sortByTitle(undefined, true)).not.toThrow();
    });
  });

  describe('三角測量・複雑なケース', () => {
    let complexTodos;

    beforeEach(() => {
      complexTodos = [
        {
          getId: () => '1',
          getTitle: () => '同じタイトル',
          getCreatedAt: () => new Date('2023-01-01T10:00:00'),
          getUpdatedAt: () => new Date('2023-01-01T12:00:00'),
          getDueDate: () => new Date('2023-06-01'),
          getPriority: () => 'high',
          isCompleted: () => false
        },
        {
          getId: () => '2',
          getTitle: () => '同じタイトル',
          getCreatedAt: () => new Date('2023-01-01T11:00:00'),
          getUpdatedAt: () => new Date('2023-01-01T11:00:00'),
          getDueDate: () => new Date('2023-06-01'),
          getPriority: () => 'high',
          isCompleted: () => true
        },
        {
          getId: () => '3',
          getTitle: () => 'AAA',
          getCreatedAt: () => new Date('2023-01-02T09:00:00'),
          getUpdatedAt: () => new Date('2023-01-02T09:00:00'),
          getDueDate: () => undefined,
          getPriority: () => 'invalid',
          isCompleted: () => false
        },
        {
          getId: () => '4',
          getTitle: () => '',
          getCreatedAt: () => new Date('2023-01-03T08:00:00'),
          getUpdatedAt: () => new Date('2023-01-03T08:00:00'),
          getDueDate: () => new Date('2023-05-01'),
          getPriority: () => 'medium',
          isCompleted: () => false
        }
      ];
    });

    it('同一値での安定ソート - 作成日時', () => {
      const sameDateTodos = [
        {
          getId: () => '1',
          getCreatedAt: () => new Date('2023-01-01T10:00:00'),
          getTitle: () => 'First'
        },
        {
          getId: () => '2',
          getCreatedAt: () => new Date('2023-01-01T10:00:00'),
          getTitle: () => 'Second'
        }
      ];
      
      const result = sortManager.sortByCreatedDate(sameDateTodos, true);
      expect(result[0].getId()).toBe('1');
      expect(result[1].getId()).toBe('2');
    });

    it('複数のnull/undefined値を含むソート', () => {
      const nullTodos = [
        { getId: () => '1', getDueDate: () => new Date('2023-06-01') },
        { getId: () => '2', getDueDate: () => null },
        { getId: () => '3', getDueDate: () => undefined },
        { getId: () => '4', getDueDate: () => new Date('2023-05-01') }
      ];
      
      const result = sortManager.sortByDueDate(nullTodos, true);
      expect(result[0].getId()).toBe('4'); // 2023-05-01
      expect(result[1].getId()).toBe('1'); // 2023-06-01
      expect(result[2].getId()).toBe('2'); // null
      expect(result[3].getId()).toBe('3'); // undefined
    });

    it('無効な優先度値の処理', () => {
      const invalidPriorityTodos = [
        { getId: () => '1', getPriority: () => 'high' },
        { getId: () => '2', getPriority: () => 'invalid' },
        { getId: () => '3', getPriority: () => null },
        { getId: () => '4', getPriority: () => 'low' }
      ];
      
      const result = sortManager.sortByPriority(invalidPriorityTodos, true);
      expect(result[0].getPriority()).toBe('high'); // 優先度3
      // invalid, nullは優先度0として扱われ、後続に配置される
    });

    it('空文字列・特殊文字を含むタイトルソート', () => {
      const specialTodos = [
        { getId: () => '1', getTitle: () => 'zebra' },
        { getId: () => '2', getTitle: () => '' },
        { getId: () => '3', getTitle: () => '123数字' },
        { getId: () => '4', getTitle: () => 'Apple' }
      ];
      
      const result = sortManager.sortByTitle(specialTodos, true);
      expect(result[0].getTitle()).toBe(''); // 空文字は最初
      expect(result[1].getTitle()).toBe('123数字'); // 数字
      expect(result[2].getTitle()).toBe('Apple'); // 大文字小文字無視
      expect(result[3].getTitle()).toBe('zebra');
    });

    it('大量データでのパフォーマンス確認', () => {
      const largeTodos = Array.from({ length: 1000 }, (_, i) => ({
        getId: () => `id-${i}`,
        getTitle: () => `タスク${Math.random().toString(36).substring(2)}`,
        getCreatedAt: () => new Date(2023, 0, 1 + Math.floor(Math.random() * 365)),
        getPriority: () => ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
        isCompleted: () => Math.random() > 0.5
      }));

      const startTime = Date.now();
      const result = sortManager.sortByCreatedDate(largeTodos, true);
      const endTime = Date.now();
      
      expect(result.length).toBe(1000);
      expect(endTime - startTime).toBeLessThan(100); // 100ms以内
    });
  });
});