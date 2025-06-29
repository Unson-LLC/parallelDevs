import { FilterControls } from '../../ui/FilterControls.js';

describe('FilterControls', () => {
  let container;
  let filterControls;
  let mockOnFilterChange;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'filter-controls-test';
    document.body.appendChild(container);
    
    mockOnFilterChange = jest.fn();
    filterControls = new FilterControls('filter-controls-test', mockOnFilterChange);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('constructor', () => {
    test('should initialize with containerId and onFilterChange callback', () => {
      expect(filterControls).toBeDefined();
      expect(filterControls.containerId).toBe('filter-controls-test');
      expect(filterControls.onFilterChange).toBe(mockOnFilterChange);
    });

    test('should throw error if containerId is not provided', () => {
      expect(() => new FilterControls(null, mockOnFilterChange)).toThrow();
    });

    test('should throw error if onFilterChange is not provided', () => {
      expect(() => new FilterControls('test-container', null)).toThrow();
    });
  });

  describe('render', () => {
    test('should render filter controls UI', () => {
      filterControls.render();
      
      const renderedContainer = document.getElementById('filter-controls-test');
      expect(renderedContainer.innerHTML).not.toBe('');
      expect(renderedContainer.querySelector('.filter-controls')).toBeTruthy();
    });

    test('should render completion filter dropdown', () => {
      filterControls.render();
      
      const completionFilter = container.querySelector('[data-testid="completion-filter"]');
      expect(completionFilter).toBeTruthy();
      expect(completionFilter.tagName).toBe('SELECT');
    });

    test('should render priority filter dropdown', () => {
      filterControls.render();
      
      const priorityFilter = container.querySelector('[data-testid="priority-filter"]');
      expect(priorityFilter).toBeTruthy();
      expect(priorityFilter.tagName).toBe('SELECT');
    });

    test('should render search input', () => {
      filterControls.render();
      
      const searchInput = container.querySelector('[data-testid="search-input"]');
      expect(searchInput).toBeTruthy();
      expect(searchInput.tagName).toBe('INPUT');
      expect(searchInput.type).toBe('text');
    });
  });

  describe('handleCompletionFilterChange', () => {
    test('should call onFilterChange with completion filter', () => {
      filterControls.handleCompletionFilterChange('completed');
      
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        type: 'completion',
        value: 'completed'
      });
    });
  });

  describe('handlePriorityFilterChange', () => {
    test('should call onFilterChange with priority filter', () => {
      filterControls.handlePriorityFilterChange('high');
      
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        type: 'priority', 
        value: 'high'
      });
    });
  });

  describe('handleSearchInput', () => {
    test('should call onFilterChange with search query', () => {
      filterControls.handleSearchInput('test query');
      
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        type: 'search',
        value: 'test query'
      });
    });
  });

  describe('resetFilters', () => {
    test('should reset all filters to default values', () => {
      filterControls.render();
      filterControls.resetFilters();
      
      const completionFilter = container.querySelector('[data-testid="completion-filter"]');
      const priorityFilter = container.querySelector('[data-testid="priority-filter"]');
      const searchInput = container.querySelector('[data-testid="search-input"]');
      
      expect(completionFilter.value).toBe('all');
      expect(priorityFilter.value).toBe('all');
      expect(searchInput.value).toBe('');
    });

    test('should call onFilterChange with reset type', () => {
      filterControls.render();
      filterControls.resetFilters();
      
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        type: 'reset',
        value: null
      });
    });
  });

  describe('bindEvents', () => {
    beforeEach(() => {
      filterControls.render();
    });

    test('should bind completion filter change event', () => {
      const completionFilter = container.querySelector('[data-testid="completion-filter"]');
      
      completionFilter.value = 'completed';
      completionFilter.dispatchEvent(new Event('change'));
      
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        type: 'completion',
        value: 'completed'
      });
    });

    test('should bind priority filter change event', () => {
      const priorityFilter = container.querySelector('[data-testid="priority-filter"]');
      
      priorityFilter.value = 'high';
      priorityFilter.dispatchEvent(new Event('change'));
      
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        type: 'priority',
        value: 'high'
      });
    });

    test('should bind search input event', () => {
      const searchInput = container.querySelector('[data-testid="search-input"]');
      
      searchInput.value = 'test search';
      searchInput.dispatchEvent(new Event('input'));
      
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        type: 'search',
        value: 'test search'
      });
    });

    test('should bind sort change event', () => {
      const sortSelect = container.querySelector('[data-testid="sort-select"]');
      
      sortSelect.value = 'priority-asc';
      sortSelect.dispatchEvent(new Event('change'));
      
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        type: 'sort',
        value: { sortBy: 'priority', ascending: true }
      });
    });

    test('should bind reset button click event', () => {
      const resetButton = container.querySelector('[data-testid="reset-filters"]');
      
      resetButton.click();
      
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        type: 'reset',
        value: null
      });
    });
  });

  describe('handleSortChange', () => {
    test('should call onFilterChange with sort configuration', () => {
      filterControls.handleSortChange('title', true);
      
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        type: 'sort',
        value: { sortBy: 'title', ascending: true }
      });
    });

    test('should handle descending sort', () => {
      filterControls.handleSortChange('created', false);
      
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        type: 'sort',
        value: { sortBy: 'created', ascending: false }
      });
    });
  });

  describe('updateActiveFilters', () => {
    beforeEach(() => {
      filterControls.render();
    });

    test('should display active filters', () => {
      const filters = {
        completion: 'completed',
        priority: 'high',
        search: 'test'
      };
      
      filterControls.updateActiveFilters(filters);
      
      const activeFiltersContainer = container.querySelector('[data-testid="active-filters"]');
      const filterTags = activeFiltersContainer.querySelectorAll('.active-filter-tag');
      
      expect(filterTags.length).toBe(3);
      expect(filterTags[0].textContent).toBe('completion: completed');
      expect(filterTags[1].textContent).toBe('priority: high');
      expect(filterTags[2].textContent).toBe('search: test');
    });

    test('should ignore empty or default filter values', () => {
      const filters = {
        completion: 'all',
        priority: '',
        search: 'active search'
      };
      
      filterControls.updateActiveFilters(filters);
      
      const activeFiltersContainer = container.querySelector('[data-testid="active-filters"]');
      const filterTags = activeFiltersContainer.querySelectorAll('.active-filter-tag');
      
      expect(filterTags.length).toBe(1);
      expect(filterTags[0].textContent).toBe('search: active search');
    });

    test('should clear active filters when empty object passed', () => {
      filterControls.updateActiveFilters({});
      
      const activeFiltersContainer = container.querySelector('[data-testid="active-filters"]');
      const filterTags = activeFiltersContainer.querySelectorAll('.active-filter-tag');
      
      expect(filterTags.length).toBe(0);
    });
  });

  describe('accessibility', () => {
    beforeEach(() => {
      filterControls.render();
    });

    test('should have proper labels for form controls', () => {
      const completionLabel = container.querySelector('label[for="completion-filter"]');
      const priorityLabel = container.querySelector('label[for="priority-filter"]');
      const searchLabel = container.querySelector('label[for="search-input"]');
      
      expect(completionLabel).toBeTruthy();
      expect(priorityLabel).toBeTruthy();
      expect(searchLabel).toBeTruthy();
      
      expect(completionLabel.textContent).toBe('状態:');
      expect(priorityLabel.textContent).toBe('優先度:');
      expect(searchLabel.textContent).toBe('検索:');
    });

    test('should have search input placeholder', () => {
      const searchInput = container.querySelector('[data-testid="search-input"]');
      expect(searchInput.placeholder).toBe('タスクを検索...');
    });
  });

  describe('edge cases', () => {
    test('should handle multiple rapid filter changes', () => {
      filterControls.handleCompletionFilterChange('pending');
      filterControls.handlePriorityFilterChange('high');
      filterControls.handleSearchInput('urgent');
      
      expect(mockOnFilterChange).toHaveBeenCalledTimes(3);
      expect(mockOnFilterChange).toHaveBeenNthCalledWith(1, {
        type: 'completion',
        value: 'pending'
      });
      expect(mockOnFilterChange).toHaveBeenNthCalledWith(2, {
        type: 'priority',
        value: 'high'
      });
      expect(mockOnFilterChange).toHaveBeenNthCalledWith(3, {
        type: 'search',
        value: 'urgent'
      });
    });

    test('should handle empty search queries', () => {
      filterControls.handleSearchInput('');
      
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        type: 'search',
        value: ''
      });
    });

    test('should handle special characters in search', () => {
      const specialQuery = '特殊文字@#$%^&*()テスト';
      filterControls.handleSearchInput(specialQuery);
      
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        type: 'search',
        value: specialQuery
      });
    });
  });
});