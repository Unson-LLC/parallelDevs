const { FilterManager } = require('../../managers/FilterManager.js');

describe('FilterManager', () => {
  let filterManager;
  let mockTodos;

  beforeEach(() => {
    filterManager = new FilterManager();
    mockTodos = [
      { id: 1, title: 'Task 1', completed: false, priority: 'high' },
      { id: 2, title: 'Task 2', completed: true, priority: 'medium' },
      { id: 3, title: 'Search Task', completed: false, priority: 'low' },
      { id: 4, title: 'Another Task', completed: true, priority: 'high' }
    ];
  });

  describe('constructor', () => {
    test('should initialize with default filters', () => {
      const filters = filterManager.getCurrentFilters();
      expect(filters.completion).toBe('all');
      expect(filters.priority).toBe('all');
      expect(filters.search).toBe('');
    });
  });

  describe('setCompletionFilter', () => {
    test('should set completion filter to completed', () => {
      filterManager.setCompletionFilter('completed');
      const filters = filterManager.getCurrentFilters();
      expect(filters.completion).toBe('completed');
    });

    test('should set completion filter to pending', () => {
      filterManager.setCompletionFilter('pending');
      const filters = filterManager.getCurrentFilters();
      expect(filters.completion).toBe('pending');
    });

    test('should set completion filter to all', () => {
      filterManager.setCompletionFilter('all');
      const filters = filterManager.getCurrentFilters();
      expect(filters.completion).toBe('all');
    });
  });

  describe('setPriorityFilter', () => {
    test('should set priority filter to high', () => {
      filterManager.setPriorityFilter('high');
      const filters = filterManager.getCurrentFilters();
      expect(filters.priority).toBe('high');
    });
  });

  describe('setSearchQuery', () => {
    test('should set search query', () => {
      filterManager.setSearchQuery('test');
      const filters = filterManager.getCurrentFilters();
      expect(filters.search).toBe('test');
    });
  });

  describe('applyFilters', () => {
    test('should return all todos when no filters are applied', () => {
      const result = filterManager.applyFilters(mockTodos);
      expect(result).toHaveLength(4);
    });

    test('should filter by completion status - completed', () => {
      filterManager.setCompletionFilter('completed');
      const result = filterManager.applyFilters(mockTodos);
      expect(result).toHaveLength(2);
      expect(result.every(todo => todo.completed)).toBe(true);
    });

    test('should filter by completion status - pending', () => {
      filterManager.setCompletionFilter('pending');
      const result = filterManager.applyFilters(mockTodos);
      expect(result).toHaveLength(2);
      expect(result.every(todo => !todo.completed)).toBe(true);
    });

    test('should filter by priority', () => {
      filterManager.setPriorityFilter('high');
      const result = filterManager.applyFilters(mockTodos);
      expect(result).toHaveLength(2);
      expect(result.every(todo => todo.priority === 'high')).toBe(true);
    });

    test('should filter by search query', () => {
      filterManager.setSearchQuery('search');
      const result = filterManager.applyFilters(mockTodos);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Search Task');
    });

    test('should apply multiple filters', () => {
      filterManager.setCompletionFilter('completed');
      filterManager.setPriorityFilter('high');
      const result = filterManager.applyFilters(mockTodos);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(4);
    });
  });

  describe('resetFilters', () => {
    test('should reset all filters to default values', () => {
      filterManager.setCompletionFilter('completed');
      filterManager.setPriorityFilter('high');
      filterManager.setSearchQuery('test');
      
      filterManager.resetFilters();
      
      const filters = filterManager.getCurrentFilters();
      expect(filters.completion).toBe('all');
      expect(filters.priority).toBe('all');
      expect(filters.search).toBe('');
    });
  });

  describe('Case insensitive search', () => {
    test('should perform case insensitive search', () => {
      filterManager.setSearchQuery('SEARCH');
      const result = filterManager.applyFilters(mockTodos);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Search Task');
    });

    test('should handle partial matches', () => {
      filterManager.setSearchQuery('task');
      const result = filterManager.applyFilters(mockTodos);
      expect(result).toHaveLength(4);
    });
  });

  describe('Edge cases', () => {
    test('should handle empty todos array', () => {
      const result = filterManager.applyFilters([]);
      expect(result).toHaveLength(0);
    });

    test('should handle whitespace in search query', () => {
      filterManager.setSearchQuery('  ');
      const result = filterManager.applyFilters(mockTodos);
      expect(result).toHaveLength(4);
    });

    test('should handle complex filter combinations', () => {
      filterManager.setCompletionFilter('pending');
      filterManager.setPriorityFilter('low');
      filterManager.setSearchQuery('search');
      const result = filterManager.applyFilters(mockTodos);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(3);
    });
  });

  describe('Performance considerations', () => {
    test('should not mutate original todos array', () => {
      const originalTodos = [...mockTodos];
      filterManager.setCompletionFilter('completed');
      filterManager.applyFilters(mockTodos);
      expect(mockTodos).toEqual(originalTodos);
    });

    test('should return new array instance', () => {
      const result = filterManager.applyFilters(mockTodos);
      expect(result).not.toBe(mockTodos);
    });
  });

  describe('Input validation', () => {
    test('should handle invalid completion filter', () => {
      filterManager.setCompletionFilter('invalid');
      const filters = filterManager.getCurrentFilters();
      expect(filters.completion).toBe('all');
    });

    test('should handle invalid priority filter', () => {
      filterManager.setPriorityFilter('invalid');
      const filters = filterManager.getCurrentFilters();
      expect(filters.priority).toBe('all');
    });

    test('should handle non-string search query', () => {
      filterManager.setSearchQuery(123);
      const filters = filterManager.getCurrentFilters();
      expect(filters.search).toBe('');
    });

    test('should handle null search query', () => {
      filterManager.setSearchQuery(null);
      const filters = filterManager.getCurrentFilters();
      expect(filters.search).toBe('');
    });

    test('should handle non-array input to applyFilters', () => {
      const result = filterManager.applyFilters(null);
      expect(result).toEqual([]);
    });
  });
});