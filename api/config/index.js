// Configuration constants and settings
const config = {
  port: process.env.PORT || 3000,
  database: {
    connectionString: process.env.TODOS_URI
  },
  redis: {
    url: process.env.CACHE_URI
  },
  cache: {
    keys: {
      ALL_TODOS: 'todos:all',
      TODO_PREFIX: 'todo:',
    },
    ttl: 300 // 5 minutes
  }
};

module.exports = config;