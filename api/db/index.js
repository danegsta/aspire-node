const { Pool } = require('pg');
const config = require('../config');

// Database connection
const pool = new Pool({
  connectionString: config.database.connectionString
});

// Initialize database table
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Graceful shutdown
async function closeDatabase() {
  await pool.end();
  console.log('Database connection closed');
}

module.exports = {
  pool,
  initializeDatabase,
  closeDatabase
};