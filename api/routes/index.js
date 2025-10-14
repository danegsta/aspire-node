const express = require('express');
const router = express.Router();
const cache = require('../services/cache');
const config = require('../config');

// Health check route
router.get('/health', async (req, res) => {
  try {
    const redisStatus = cache.isConnected() ? 'connected' : 'disconnected';
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      redis: redisStatus,
      database: config.database.connectionString ? 'configured' : 'not configured',
      cache: config.redis.url ? 'configured' : 'not configured'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
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

// Root route with API info
router.get('/', (req, res) => {
  res.json({
    message: 'TODO API with Redis Caching',
    version: '1.0.0',
    features: ['PostgreSQL Database', 'Redis Caching', 'REST API'],
    endpoints: {
      'GET /health': 'Health check',
      'GET /api/todos': 'Get all todos (cached)',
      'GET /api/todos/:id': 'Get a specific todo (cached)',
      'POST /api/todos': 'Create a new todo',
      'PUT /api/todos/:id': 'Update a todo',
      'DELETE /api/todos/:id': 'Delete a todo',
      'PATCH /api/todos/:id/toggle': 'Toggle todo completion',
      'DELETE /api/cache': 'Clear cache (development)'
    },
    cache: {
      ttl: `${config.cache.ttl} seconds`,
      headers: 'X-Cache header indicates HIT/MISS status'
    }
  });
});

module.exports = router;