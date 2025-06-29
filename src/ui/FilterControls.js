class FilterControls {
  constructor(containerId, onFilterChange) {
    this.validateConstructorParams(containerId, onFilterChange);
    
    this.containerId = containerId;
    this.onFilterChange = onFilterChange;
    this.container = document.getElementById(containerId);
    
    if (!this.container) {
      throw new Error(`Container with id '${containerId}' not found`);
    }

    this.searchTimeout = null;
    this.searchDelay = 300; // リアルタイム検索のデバウンス時間
  }

  validateConstructorParams(containerId, onFilterChange) {
    if (!containerId) {
      throw new Error('containerId is required');
    }
    if (!onFilterChange || typeof onFilterChange !== 'function') {
      throw new Error('onFilterChange callback is required and must be a function');
    }
  }

  render() {
    this.container.innerHTML = this.createFilterControlsHTML();
    this.bindEvents();
  }

  createFilterControlsHTML() {
    return `
      <div class="filter-controls" role="search" aria-label="タスクフィルターコントロール">
        ${this.createFilterGroupHTML('completion', '状態', this.getCompletionOptions())}
        ${this.createFilterGroupHTML('priority', '優先度', this.getPriorityOptions())}
        ${this.createSearchInputHTML()}
        ${this.createSortSelectHTML()}
        ${this.createResetButtonHTML()}
        ${this.createActiveFiltersHTML()}
      </div>
    `;
  }

  createFilterGroupHTML(type, label, options) {
    const selectId = `${type}-filter`;
    const optionsHTML = options.map(option => 
      `<option value="${option.value}">${option.label}</option>`
    ).join('');

    return `
      <div class="filter-group">
        <label for="${selectId}">${label}:</label>
        <select id="${selectId}" data-testid="${selectId}" aria-label="${label}フィルター">
          ${optionsHTML}
        </select>
      </div>
    `;
  }

  getCompletionOptions() {
    return [
      { value: 'all', label: 'すべて' },
      { value: 'pending', label: '未完了' },
      { value: 'completed', label: '完了済み' }
    ];
  }

  getPriorityOptions() {
    return [
      { value: 'all', label: 'すべて' },
      { value: 'high', label: '高' },
      { value: 'medium', label: '中' },
      { value: 'low', label: '低' }
    ];
  }

  createSearchInputHTML() {
    return `
      <div class="filter-group">
        <label for="search-input">検索:</label>
        <input 
          type="text" 
          id="search-input" 
          data-testid="search-input" 
          placeholder="タスクを検索..."
          aria-label="タスク検索"
          aria-describedby="search-help">
        <div id="search-help" class="sr-only">
          タスクのタイトルまたは説明で検索します
        </div>
      </div>
    `;
  }

  createSortSelectHTML() {
    const sortOptions = [
      { value: 'created-desc', label: '作成日（新しい順）' },
      { value: 'created-asc', label: '作成日（古い順）' },
      { value: 'updated-desc', label: '更新日（新しい順）' },
      { value: 'updated-asc', label: '更新日（古い順）' },
      { value: 'priority-desc', label: '優先度（高い順）' },
      { value: 'priority-asc', label: '優先度（低い順）' },
      { value: 'title-asc', label: 'タイトル（昇順）' },
      { value: 'title-desc', label: 'タイトル（降順）' }
    ];

    const optionsHTML = sortOptions.map(option => 
      `<option value="${option.value}">${option.label}</option>`
    ).join('');

    return `
      <div class="filter-group">
        <label for="sort-select">並び順:</label>
        <select id="sort-select" data-testid="sort-select" aria-label="並び順選択">
          ${optionsHTML}
        </select>
      </div>
    `;
  }

  createResetButtonHTML() {
    return `
      <div class="filter-actions">
        <button 
          id="reset-filters" 
          data-testid="reset-filters"
          aria-label="すべてのフィルターをリセット"
          title="すべてのフィルターを初期状態に戻します">
          リセット
        </button>
      </div>
    `;
  }

  createActiveFiltersHTML() {
    return `
      <div class="active-filters" data-testid="active-filters" aria-live="polite">
        <!-- アクティブフィルターが表示される -->
      </div>
    `;
  }

  bindEvents() {
    const completionFilter = this.container.querySelector('#completion-filter');
    const priorityFilter = this.container.querySelector('#priority-filter');
    const searchInput = this.container.querySelector('#search-input');
    const sortSelect = this.container.querySelector('#sort-select');
    const resetButton = this.container.querySelector('#reset-filters');

    completionFilter.addEventListener('change', (e) => {
      this.handleCompletionFilterChange(e.target.value);
    });

    priorityFilter.addEventListener('change', (e) => {
      this.handlePriorityFilterChange(e.target.value);
    });

    searchInput.addEventListener('input', (e) => {
      this.handleSearchInput(e.target.value);
    });

    sortSelect.addEventListener('change', (e) => {
      const [sortBy, order] = e.target.value.split('-');
      const ascending = order === 'asc';
      this.handleSortChange(sortBy, ascending);
    });

    resetButton.addEventListener('click', () => {
      this.resetFilters();
    });
  }

  handleCompletionFilterChange(filter) {
    this.onFilterChange({
      type: 'completion',
      value: filter
    });
  }

  handlePriorityFilterChange(priority) {
    this.onFilterChange({
      type: 'priority',
      value: priority
    });
  }

  handleSearchInput(query) {
    // デバウンス処理によるリアルタイム検索
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.onFilterChange({
        type: 'search',
        value: query
      });
    }, this.searchDelay);
  }

  handleSortChange(sortBy, ascending) {
    this.onFilterChange({
      type: 'sort',
      value: { sortBy, ascending }
    });
  }

  updateActiveFilters(filters) {
    const activeFiltersContainer = this.container.querySelector('.active-filters');
    
    if (!filters || Object.keys(filters).length === 0) {
      activeFiltersContainer.innerHTML = '';
      return;
    }

    const activeFilterTags = this.createActiveFilterTags(filters);
    activeFiltersContainer.innerHTML = activeFilterTags.length > 0 
      ? `<div class="active-filters-list">${activeFilterTags.join('')}</div>`
      : '';
  }

  createActiveFilterTags(filters) {
    const tags = [];
    
    Object.entries(filters).forEach(([key, value]) => {
      if (this.isActiveFilter(value)) {
        const displayValue = this.getDisplayValue(key, value);
        const displayLabel = this.getDisplayLabel(key);
        
        tags.push(`
          <span class="active-filter-tag" data-filter-type="${key}">
            <span class="filter-label">${displayLabel}:</span>
            <span class="filter-value">${displayValue}</span>
            <button 
              class="remove-filter" 
              data-filter-type="${key}"
              aria-label="${displayLabel}フィルターを削除"
              title="${displayLabel}フィルターを削除">
              ×
            </button>
          </span>
        `);
      }
    });
    
    return tags;
  }

  isActiveFilter(value) {
    return value && value !== 'all' && value !== '';
  }

  getDisplayValue(key, value) {
    const displayMaps = {
      completion: { pending: '未完了', completed: '完了済み' },
      priority: { high: '高', medium: '中', low: '低' }
    };
    
    return displayMaps[key]?.[value] || value;
  }

  getDisplayLabel(key) {
    const labelMap = {
      completion: '状態',
      priority: '優先度',
      search: '検索'
    };
    
    return labelMap[key] || key;
  }

  resetFilters() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = null;
    }

    this.setFormControlsToDefault();
    this.updateActiveFilters({});
    
    this.onFilterChange({
      type: 'reset',
      value: null
    });
  }

  setFormControlsToDefault() {
    const controls = [
      { selector: '#completion-filter', defaultValue: 'all' },
      { selector: '#priority-filter', defaultValue: 'all' },
      { selector: '#search-input', defaultValue: '' },
      { selector: '#sort-select', defaultValue: 'created-desc' }
    ];

    controls.forEach(({ selector, defaultValue }) => {
      const element = this.container.querySelector(selector);
      if (element) {
        element.value = defaultValue;
      }
    });
  }

  destroy() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = null;
    }
    
    // イベントリスナーの削除は必要に応じて実装
    this.container.innerHTML = '';
  }
}

export { FilterControls };