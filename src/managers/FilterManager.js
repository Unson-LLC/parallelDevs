class FilterManager {
  constructor() {
    this.filters = {
      completion: 'all',
      priority: 'all',
      search: ''
    };
  }

  setCompletionFilter(filter) {
    const validFilters = ['all', 'completed', 'pending'];
    if (validFilters.includes(filter)) {
      this.filters.completion = filter;
    }
  }

  setPriorityFilter(priority) {
    const validPriorities = ['all', 'high', 'medium', 'low'];
    if (validPriorities.includes(priority)) {
      this.filters.priority = priority;
    }
  }

  setSearchQuery(query) {
    this.filters.search = typeof query === 'string' ? query : '';
  }

  applyFilters(todos) {
    if (!Array.isArray(todos)) {
      return [];
    }

    return todos.filter(todo => {
      // Completion filter
      if (this.filters.completion !== 'all') {
        if (this.filters.completion === 'completed' && !todo.completed) {
          return false;
        }
        if (this.filters.completion === 'pending' && todo.completed) {
          return false;
        }
      }

      // Priority filter
      if (this.filters.priority !== 'all' && todo.priority !== this.filters.priority) {
        return false;
      }

      // Search filter
      const searchTerm = this.filters.search.trim();
      if (searchTerm !== '') {
        const searchLower = searchTerm.toLowerCase();
        const titleLower = (todo.title || '').toLowerCase();
        if (!titleLower.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }

  getCurrentFilters() {
    return { ...this.filters };
  }

  resetFilters() {
    this.filters = {
      completion: 'all',
      priority: 'all',
      search: ''
    };
  }
}

// テスト環境ではCommonJSを使用、本番では要件に応じてES6 exportに変更可能
module.exports = { FilterManager };