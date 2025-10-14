const { createClient } = require('redis');
const config = require('../config');

// Redis connection
const redis = createClient({
  url: config.redis.url
});

redis.on('error', (err) => console.error('Redis Client Error', err));
redis.on('connect', () => console.log('Connected to Redis'));

// Initialize Redis connection
async function initializeCache() {
  try {
    await redis.connect();
    console.log('Redis initialized successfully');
  } catch (error) {
    console.error('Error initializing Redis:', error);
    throw error;
  }
}

// Cache helper functions
async function getCachedTodos() {
  try {
    const cached = await redis.get(config.cache.keys.ALL_TODOS);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

async function setCachedTodos(todos) {
  try {
    await redis.setEx(config.cache.keys.ALL_TODOS, config.cache.ttl, JSON.stringify(todos));
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

async function getCachedTodo(id) {
  try {
    const cached = await redis.get(`${config.cache.keys.TODO_PREFIX}${id}`);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

async function setCachedTodo(id, todo) {
  try {
    await redis.setEx(`${config.cache.keys.TODO_PREFIX}${id}`, config.cache.ttl, JSON.stringify(todo));
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

async function invalidateCache() {
  try {
    await redis.del(config.cache.keys.ALL_TODOS);
    // Get all todo keys and delete them
    const keys = await redis.keys(`${config.cache.keys.TODO_PREFIX}*`);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (error) {
    console.error('Redis cache invalidation error:', error);
  }
}

// Graceful shutdown
async function closeCache() {
  await redis.disconnect();
  console.log('Redis connection closed');
}

// Check if Redis is connected
function isConnected() {
  return redis.isOpen;
}

module.exports = {
  initializeCache,
  getCachedTodos,
  setCachedTodos,
  getCachedTodo,
  setCachedTodo,
  invalidateCache,
  closeCache,
  isConnected
};