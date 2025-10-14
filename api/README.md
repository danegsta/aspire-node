# TODO API

A RESTful Express.js API for managing todos with PostgreSQL database integration.

## Environment Variables

- `TODOS_URI` - PostgreSQL connection string (automatically provided by Aspire)
- `CACHE_URI` - Redis connection string (automatically provided by Aspire)
- `PORT` - Server port (default: 3000)

## API Endpoints

### General
- `GET /` - API information and available endpoints
- `GET /health` - Health check endpoint

### Todos
- `GET /api/todos` - Get all todos
- `GET /api/todos/:id` - Get a specific todo by ID
- `POST /api/todos` - Create a new todo
- `PUT /api/todos/:id` - Update a todo
- `DELETE /api/todos/:id` - Delete a todo
- `PATCH /api/todos/:id/toggle` - Toggle todo completion status
- `DELETE /api/cache` - Clear cache (development/debugging)

## Caching Features

The API uses Redis for caching to improve performance:

- **Cache TTL**: 5 minutes (300 seconds)
- **Cached Endpoints**: `GET /api/todos` and `GET /api/todos/:id`
- **Cache Headers**: Responses include `X-Cache: HIT` or `X-Cache: MISS` headers
- **Cache Invalidation**: Automatic cache clearing on data mutations (POST, PUT, PATCH, DELETE)
- **Cache Management**: Use `DELETE /api/cache` to manually clear all cached data

## Request/Response Examples

### Create a Todo
```bash
POST /api/todos
Content-Type: application/json

{
  "title": "Learn Aspire",
  "description": "Complete the Aspire tutorial"
}
```

### Update a Todo
```bash
PUT /api/todos/1
Content-Type: application/json

{
  "title": "Learn Aspire (Updated)",
  "completed": true
}
```

## Database Schema

The API automatically creates a `todos` table with the following structure:

```sql
CREATE TABLE todos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Running the API

The API will be automatically started by the Aspire AppHost along with PostgreSQL when you run the application.

To run standalone (requires PostgreSQL):
```bash
cd api
npm install
TODOS_URI="postgresql://username:password@localhost/todos" npm start
```