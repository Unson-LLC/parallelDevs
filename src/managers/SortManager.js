// SortManager.js - TodoItem配列のソート機能を提供
class SortManager {
  constructor() {
    // 優先度の順序定義
    this.priorityOrder = {
      'high': 3,
      'medium': 2,
      'low': 1
    };
  }

  // 共通のバリデーション処理
  _validateTodos(todos) {
    return todos && Array.isArray(todos) ? todos : [];
  }

  // 安全な値の取得
  _safeGetValue(getter, defaultValue = null) {
    try {
      return getter() || defaultValue;
    } catch {
      return defaultValue;
    }
  }

  sortByCreatedDate(todos, ascending = true) {
    const validTodos = this._validateTodos(todos);
    if (validTodos.length === 0) return [];

    return [...validTodos].sort((a, b) => {
      const dateA = this._safeGetValue(() => a.getCreatedAt(), new Date(0));
      const dateB = this._safeGetValue(() => b.getCreatedAt(), new Date(0));
      
      if (ascending) {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
  }

  sortByUpdatedDate(todos, ascending = true) {
    const validTodos = this._validateTodos(todos);
    if (validTodos.length === 0) return [];

    return [...validTodos].sort((a, b) => {
      const dateA = this._safeGetValue(() => a.getUpdatedAt(), new Date(0));
      const dateB = this._safeGetValue(() => b.getUpdatedAt(), new Date(0));
      
      if (ascending) {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
  }

  sortByDueDate(todos, ascending = true) {
    const validTodos = this._validateTodos(todos);
    if (validTodos.length === 0) return [];

    return [...validTodos].sort((a, b) => {
      const dueDateA = this._safeGetValue(() => a.getDueDate());
      const dueDateB = this._safeGetValue(() => b.getDueDate());
      
      // null, undefinedの期日は最後に配置
      const isNullA = dueDateA === null || dueDateA === undefined;
      const isNullB = dueDateB === null || dueDateB === undefined;
      
      if (isNullA && isNullB) return 0;
      if (isNullA) return 1;
      if (isNullB) return -1;
      
      if (ascending) {
        return dueDateA - dueDateB;
      } else {
        return dueDateB - dueDateA;
      }
    });
  }

  sortByPriority(todos, ascending = true) {
    const validTodos = this._validateTodos(todos);
    if (validTodos.length === 0) return [];

    return [...validTodos].sort((a, b) => {
      const priorityStrA = this._safeGetValue(() => a.getPriority(), 'unknown');
      const priorityStrB = this._safeGetValue(() => b.getPriority(), 'unknown');
      const priorityA = this.priorityOrder[priorityStrA] || 0;
      const priorityB = this.priorityOrder[priorityStrB] || 0;
      
      if (ascending) {
        return priorityB - priorityA; // highが先頭
      } else {
        return priorityA - priorityB; // lowが先頭
      }
    });
  }

  sortByTitle(todos, ascending = true) {
    const validTodos = this._validateTodos(todos);
    if (validTodos.length === 0) return [];

    return [...validTodos].sort((a, b) => {
      const titleA = this._safeGetValue(() => a.getTitle(), '').toLowerCase();
      const titleB = this._safeGetValue(() => b.getTitle(), '').toLowerCase();
      
      if (ascending) {
        return titleA.localeCompare(titleB);
      } else {
        return titleB.localeCompare(titleA);
      }
    });
  }

  sortByCompletion(todos, completedFirst = true) {
    const validTodos = this._validateTodos(todos);
    if (validTodos.length === 0) return [];

    return [...validTodos].sort((a, b) => {
      const completedA = this._safeGetValue(() => a.isCompleted(), false);
      const completedB = this._safeGetValue(() => b.isCompleted(), false);
      
      if (completedFirst) {
        return completedB - completedA; // trueが先頭
      } else {
        return completedA - completedB; // falseが先頭
      }
    });
  }
}

export { SortManager };