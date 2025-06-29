/**
 * TodoItem クラス - 個別のToDoタスクを表現
 * TDD（t_wada方式）で実装完了
 */

const VALID_PRIORITIES = Object.freeze(['high', 'medium', 'low']);
const REQUIRED_JSON_FIELDS = Object.freeze(['id', 'title', 'description', 'priority', 'completed', 'createdAt', 'updatedAt']);

const ERROR_MESSAGES = Object.freeze({
  INVALID_PRIORITY: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`,
  EMPTY_TITLE: 'Title cannot be empty',
  INVALID_DATE: 'Due date must be a valid ISO string',
  INVALID_JSON: 'Invalid JSON data for TodoItem'
});

class TodoItem {
  /**
   * TodoItemを初期化
   * @param {string} id - 一意のID
   * @param {string} title - タスクのタイトル
   * @param {string} description - タスクの説明
   * @param {'high'|'medium'|'low'} priority - 優先度
   * @param {string|null} dueDate - 期日（ISO形式文字列）
   * @param {boolean} completed - 完了状態
   */
  constructor(id, title, description, priority, dueDate, completed) {
    this._validatePriority(priority);
    
    this._id = id;
    this._title = title;
    this._description = description;
    this._priority = priority;
    this._dueDate = dueDate;
    this._completed = completed;
    
    const now = new Date().toISOString();
    this._createdAt = now;
    this._updatedAt = now;
  }

  /**
   * IDを取得
   * @returns {string} ID
   */
  getId() {
    return this._id;
  }

  /**
   * タイトルを取得
   * @returns {string} タイトル
   */
  getTitle() {
    return this._title;
  }

  /**
   * タイトルを設定
   * @param {string} title - 新しいタイトル
   * @throws {Error} タイトルが空の場合
   */
  setTitle(title) {
    if (!title || title.trim() === '') {
      throw new Error(ERROR_MESSAGES.EMPTY_TITLE);
    }
    this._title = title;
    this._updateTimestamp();
  }

  /**
   * 説明を取得
   * @returns {string} 説明
   */
  getDescription() {
    return this._description;
  }

  /**
   * 説明を設定
   * @param {string} description - 新しい説明
   */
  setDescription(description) {
    this._description = description;
    this._updateTimestamp();
  }

  /**
   * 優先度を取得
   * @returns {'high'|'medium'|'low'} 優先度
   */
  getPriority() {
    return this._priority;
  }

  /**
   * 優先度を設定
   * @param {'high'|'medium'|'low'} priority - 新しい優先度
   * @throws {Error} 無効な優先度の場合
   */
  setPriority(priority) {
    this._validatePriority(priority);
    this._priority = priority;
    this._updateTimestamp();
  }

  /**
   * 期日を取得
   * @returns {string|null} 期日（ISO形式文字列）
   */
  getDueDate() {
    return this._dueDate;
  }

  /**
   * 期日を設定
   * @param {string|null} dueDate - 新しい期日（ISO形式文字列）
   * @throws {Error} 無効な日付形式の場合
   */
  setDueDate(dueDate) {
    if (dueDate && !this._isValidISOString(dueDate)) {
      throw new Error(ERROR_MESSAGES.INVALID_DATE);
    }
    this._dueDate = dueDate;
    this._updateTimestamp();
  }

  /**
   * 完了状態を確認
   * @returns {boolean} 完了状態
   */
  isCompleted() {
    return this._completed;
  }

  /**
   * 完了状態を切り替え
   */
  toggleCompleted() {
    this._completed = !this._completed;
    this._updateTimestamp();
  }

  /**
   * 作成日時を取得
   * @returns {string} 作成日時（ISO形式文字列）
   */
  getCreatedAt() {
    return this._createdAt;
  }

  /**
   * 更新日時を取得
   * @returns {string} 更新日時（ISO形式文字列）
   */
  getUpdatedAt() {
    return this._updatedAt;
  }

  /**
   * JSON形式でデータを出力
   * @returns {Object} JSONオブジェクト
   */
  toJSON() {
    return {
      id: this._id,
      title: this._title,
      description: this._description,
      priority: this._priority,
      dueDate: this._dueDate,
      completed: this._completed,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }

  /**
   * JSONデータからTodoItemを復元（静的メソッド）
   * @param {Object} data - JSONデータ
   * @returns {TodoItem} 復元されたTodoItemインスタンス
   * @throws {Error} 無効なJSONデータの場合
   */
  static fromJSON(data) {
    if (!data || typeof data !== 'object') {
      throw new Error(ERROR_MESSAGES.INVALID_JSON);
    }

    for (const field of REQUIRED_JSON_FIELDS) {
      if (!(field in data)) {
        throw new Error(ERROR_MESSAGES.INVALID_JSON);
      }
    }

    const todo = new TodoItem(
      data.id,
      data.title,
      data.description,
      data.priority,
      data.dueDate,
      data.completed
    );

    // 既存の日時を復元
    todo._createdAt = data.createdAt;
    todo._updatedAt = data.updatedAt;

    return todo;
  }

  // プライベートメソッド
  /**
   * updatedAtを現在時刻で更新
   * @private
   */
  _updateTimestamp() {
    this._updatedAt = new Date().toISOString();
  }

  /**
   * 優先度の有効性を検証
   * @private
   * @param {string} priority - 検証する優先度
   * @throws {Error} 無効な優先度の場合
   */
  _validatePriority(priority) {
    if (!VALID_PRIORITIES.includes(priority)) {
      throw new Error(ERROR_MESSAGES.INVALID_PRIORITY);
    }
  }

  /**
   * ISO文字列の有効性を検証
   * @private
   * @param {string} dateString - 検証する日付文字列
   * @returns {boolean} 有効な場合true
   */
  _isValidISOString(dateString) {
    try {
      const date = new Date(dateString);
      return date.toISOString() === dateString;
    } catch {
      return false;
    }
  }
}

export { TodoItem };