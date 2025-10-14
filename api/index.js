// Initialize telemetry FIRST, before any other imports
require('./telemetry/index.js');

const express = require('express');
const config = require('./config');
const { initializeDatabase, closeDatabase } = require('./db');
const { initializeCache, closeCache, isConnected } = require('./services/cache');
const { setupMiddleware } = require('./middleware');

// Import routes
const indexRoutes = require('./routes');
const todoRoutes = require('./routes/todos');

const app = express();

// Setup middleware
setupMiddleware(app);

// Setup routes
app.use('/', indexRoutes);
app.use('/api/todos', todoRoutes);

// Initialize services
async function initialize() {
  try {
    await initializeDatabase();
    await initializeCache();
    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Error initializing services:', error);
    throw error;
  }
}

// Start server
async function startServer() {
  await initialize();
  
  app.listen(config.port, () => {
    console.log(`TODO API server running on port ${config.port}`);
    console.log(`Database connection: ${config.database.connectionString ? 'Configured' : 'Not configured'}`);
    console.log(`Cache connection: ${config.redis.url ? 'Configured' : 'Not configured'}`);
    console.log(`Redis status: ${isConnected() ? 'Connected' : 'Disconnected'}`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  try {
    await closeCache();
    await closeDatabase();
    console.log('All connections closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the application
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});