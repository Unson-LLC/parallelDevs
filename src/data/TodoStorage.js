// TodoStorage.js - LocalStorageを使用したデータ永続化

class TodoStorage {
  constructor() {
    this.storageKey = 'todo-app-data';
    this.defaultSettings = {
      theme: 'light',
      defaultSort: 'createdDate',
      defaultSortOrder: 'asc'
    };
  }

  getStorageKey() {
    return this.storageKey;
  }

  save(todos) {
    if (!this._isLocalStorageAvailable()) {
      throw new Error('LocalStorageが利用できません');
    }
    
    try {
      const existingData = this._getExistingData();
      const data = {
        todos: todos || [],
        settings: existingData.settings || this.defaultSettings
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('データの保存に失敗しました:', error);
      throw new Error('LocalStorageへの保存に失敗しました');
    }
  }

  load() {
    if (!this._isLocalStorageAvailable()) {
      return [];
    }
    
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) {
        return [];
      }
      const parsed = JSON.parse(data);
      return parsed.todos || [];
    } catch (error) {
      console.error('データの読み込みに失敗しました:', error);
      return [];
    }
  }

  clear() {
    if (!this._isLocalStorageAvailable()) {
      throw new Error('LocalStorageが利用できません');
    }
    
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('データの削除に失敗しました:', error);
      throw new Error('LocalStorageからの削除に失敗しました');
    }
  }

  exportData() {
    if (!this._isLocalStorageAvailable()) {
      return JSON.stringify({ todos: [], settings: this.defaultSettings });
    }
    
    try {
      const data = localStorage.getItem(this.storageKey);
      return data || JSON.stringify({ todos: [], settings: this.defaultSettings });
    } catch (error) {
      console.error('データのエクスポートに失敗しました:', error);
      return JSON.stringify({ todos: [], settings: this.defaultSettings });
    }
  }

  importData(jsonData) {
    if (!this._isLocalStorageAvailable()) {
      throw new Error('LocalStorageが利用できません');
    }
    
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed.todos || !Array.isArray(parsed.todos)) {
        throw new Error('無効なデータ形式です');
      }
      
      // settingsが存在しない場合はデフォルト値を設定
      const dataToSave = {
        todos: parsed.todos,
        settings: parsed.settings || this.defaultSettings
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('データのインポートに失敗しました:', error);
      throw new Error('データのインポートに失敗しました');
    }
  }
  
  // プライベートメソッド
  _isLocalStorageAvailable() {
    try {
      return typeof localStorage !== 'undefined' && localStorage !== null;
    } catch (e) {
      return false;
    }
  }
  
  _getExistingData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : { todos: [], settings: this.defaultSettings };
    } catch (error) {
      return { todos: [], settings: this.defaultSettings };
    }
  }
}

module.exports = { TodoStorage };