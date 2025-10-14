const { pool } = require('../db');
const cache = require('./cache');

class TodoService {
  async getAllTodos() {
    // Try to get from cache first
    let todos = await cache.getCachedTodos();
    let cacheHit = true;
    
    if (!todos) {
      // Cache miss - fetch from database
      const result = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');
      todos = result.rows;
      
      // Cache the results
      await cache.setCachedTodos(todos);
      cacheHit = false;
    }
    
    return { todos, cacheHit };
  }

  async getTodoById(id) {
    // Try to get from cache first
    let todo = await cache.getCachedTodo(id);
    let cacheHit = true;
    
    if (!todo) {
      // Cache miss - fetch from database
      const result = await pool.query('SELECT * FROM todos WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      todo = result.rows[0];
      
      // Cache the result
      await cache.setCachedTodo(id, todo);
      cacheHit = false;
    }
    
    return { todo, cacheHit };
  }

  async createTodo(todoData) {
    const { title, description } = todoData;
    
    if (!title || !title.trim()) {
      throw new Error('Title is required');
    }
    
    const result = await pool.query(
      'INSERT INTO todos (title, description) VALUES ($1, $2) RETURNING *',
      [title.trim(), description?.trim()]
    );
    
    const newTodo = result.rows[0];
    
    // Invalidate cache since data changed
    await cache.invalidateCache();
    
    return newTodo;
  }

  async updateTodo(id, todoData) {
    const { title, description, completed } = todoData;
    
    const result = await pool.query(
      `UPDATE todos 
       SET title = COALESCE($1, title), 
           description = COALESCE($2, description), 
           completed = COALESCE($3, completed),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 
       RETURNING *`,
      [title?.trim(), description?.trim(), completed, id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const updatedTodo = result.rows[0];
    
    // Invalidate cache since data changed
    await cache.invalidateCache();
    
    return updatedTodo;
  }

  async deleteTodo(id) {
    const result = await pool.query('DELETE FROM todos WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    // Invalidate cache since data changed
    await cache.invalidateCache();
    
    return result.rows[0];
  }

  async toggleTodo(id) {
    const result = await pool.query(
      `UPDATE todos 
       SET completed = NOT completed, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const toggledTodo = result.rows[0];
    
    // Invalidate cache since data changed
    await cache.invalidateCache();
    
    return toggledTodo;
  }
}

module.exports = new TodoService();