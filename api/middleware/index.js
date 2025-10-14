const express = require('express');
const cors = require('cors');

// Setup common middleware
function setupMiddleware(app) {
  // Parse JSON requests
  app.use(express.json());
  
  // Enable CORS
  app.use(cors());
  
  // Log requests in development
  if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }
}

module.exports = {
  setupMiddleware
};