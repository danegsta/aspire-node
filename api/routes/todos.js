const express = require('express');
const router = express.Router();
const todoService = require('../services/todoService');
const cache = require('../services/cache');

// Get all todos
router.get('/', async (req, res) => {
  try {
    const { todos, cacheHit } = await todoService.getAllTodos();
    
    // Add cache status header
    res.set('X-Cache', cacheHit ? 'HIT' : 'MISS');
    
    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// Get a specific todo by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await todoService.getTodoById(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    const { todo, cacheHit } = result;
    
    res.set('X-Cache', cacheHit ? 'HIT' : 'MISS');
    res.json(todo);
  } catch (error) {
    console.error('Error fetching todo:', error);
    res.status(500).json({ error: 'Failed to fetch todo' });
  }
});

// Create a new todo
router.post('/', async (req, res) => {
  try {
    const newTodo = await todoService.createTodo(req.body);
    res.status(201).json(newTodo);
  } catch (error) {
    console.error('Error creating todo:', error);
    
    if (error.message === 'Title is required') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// Update a todo
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTodo = await todoService.updateTodo(id, req.body);
    
    if (!updatedTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.json(updatedTodo);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// Delete a todo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTodo = await todoService.deleteTodo(id);
    
    if (!deletedTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// Toggle todo completion status
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const toggledTodo = await todoService.toggleTodo(id);
    
    if (!toggledTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.json(toggledTodo);
  } catch (error) {
    console.error('Error toggling todo:', error);
    res.status(500).json({ error: 'Failed to toggle todo' });
  }
});

// Clear cache endpoint (for development/debugging)
router.delete('/cache', async (req, res) => {
  try {
    await cache.invalidateCache();
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

module.exports = router;