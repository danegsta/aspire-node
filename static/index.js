class TodoApp {
    constructor() {
        this.apiBase = '/api';
        this.todos = [];
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadTodos();
    }

    bindEvents() {
        // Form submission
        document.getElementById('add-todo-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTodo();
        });

        // Refresh button
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.loadTodos();
        });

        // Clear cache button
        document.getElementById('clear-cache-btn').addEventListener('click', () => {
            this.clearCache();
        });
    }

    updateStatus(type, message) {
        const statusEl = document.getElementById('api-status');
        statusEl.className = `status ${type}`;
        statusEl.textContent = message;
    }

    async apiRequest(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.apiBase}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();
            
            // Check for cache header
            const cacheStatus = response.headers.get('X-Cache');
            if (cacheStatus) {
                this.updateCacheInfo(cacheStatus);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    updateCacheInfo(cacheStatus) {
        const cacheInfoEl = document.getElementById('cache-info');
        if (cacheStatus) {
            cacheInfoEl.textContent = `Cache: ${cacheStatus}`;
            cacheInfoEl.style.display = 'block';
        } else {
            cacheInfoEl.style.display = 'none';
        }
    }

    async loadTodos() {
        try {
            this.showLoading();
            this.hideError();
            
            this.todos = await this.apiRequest('/todos');
            this.renderTodos();
            this.updateStats();
            
        } catch (error) {
            this.showError(`Failed to load todos: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    async addTodo() {
        const form = document.getElementById('add-todo-form');
        const formData = new FormData(form);
        
        const todoData = {
            title: formData.get('title').trim(),
            description: formData.get('description').trim() || undefined
        };

        if (!todoData.title) {
            this.showError('Title is required');
            return;
        }

        try {
            const newTodo = await this.apiRequest('/todos', {
                method: 'POST',
                body: JSON.stringify(todoData)
            });

            // Add to local todos array
            this.todos.unshift(newTodo);
            
            // Clear form
            form.reset();
            
            // Re-render
            this.renderTodos();
            this.updateStats();
            
            this.hideError();
            
        } catch (error) {
            this.showError(`Failed to add todo: ${error.message}`);
        }
    }

    async toggleTodo(id) {
        try {
            const updatedTodo = await this.apiRequest(`/todos/${id}/toggle`, {
                method: 'PATCH'
            });

            // Update local todo
            const index = this.todos.findIndex(todo => todo.id === id);
            if (index !== -1) {
                this.todos[index] = updatedTodo;
                this.renderTodos();
                this.updateStats();
            }
            
        } catch (error) {
            this.showError(`Failed to toggle todo: ${error.message}`);
        }
    }

    async deleteTodo(id) {
        if (!confirm('Are you sure you want to delete this todo?')) {
            return;
        }

        try {
            await this.apiRequest(`/todos/${id}`, {
                method: 'DELETE'
            });

            // Remove from local todos
            this.todos = this.todos.filter(todo => todo.id !== id);
            this.renderTodos();
            this.updateStats();
            
        } catch (error) {
            this.showError(`Failed to delete todo: ${error.message}`);
        }
    }

    async editTodo(id, currentTitle, currentDescription) {
        const newTitle = prompt('Edit title:', currentTitle);
        if (newTitle === null) return; // User cancelled
        
        const newDescription = prompt('Edit description:', currentDescription || '');
        if (newDescription === null) return; // User cancelled

        const updatedData = {
            title: newTitle.trim(),
            description: newDescription.trim() || undefined
        };

        if (!updatedData.title) {
            this.showError('Title cannot be empty');
            return;
        }

        try {
            const updatedTodo = await this.apiRequest(`/todos/${id}`, {
                method: 'PUT',
                body: JSON.stringify(updatedData)
            });

            // Update local todo
            const index = this.todos.findIndex(todo => todo.id === id);
            if (index !== -1) {
                this.todos[index] = updatedTodo;
                this.renderTodos();
            }
            
        } catch (error) {
            this.showError(`Failed to update todo: ${error.message}`);
        }
    }

    async clearCache() {
        try {
            await this.apiRequest('/cache', {
                method: 'DELETE'
            });
            
            // Reload todos to see the effect
            await this.loadTodos();
            
        } catch (error) {
            this.showError(`Failed to clear cache: ${error.message}`);
        }
    }

    renderTodos() {
        const container = document.getElementById('todos-container');
        
        if (this.todos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No todos yet. Add your first todo above!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.todos.map(todo => `
            <div class="todo-item ${todo.completed ? 'completed' : ''}">
                <div class="todo-header">
                    <div>
                        <div class="todo-title ${todo.completed ? 'completed' : ''}">${this.escapeHtml(todo.title)}</div>
                        ${todo.description ? `<div class="todo-description">${this.escapeHtml(todo.description)}</div>` : ''}
                    </div>
                </div>
                <div class="todo-meta">
                    Created: ${this.formatDate(todo.created_at)}
                    ${todo.updated_at !== todo.created_at ? `• Updated: ${this.formatDate(todo.updated_at)}` : ''}
                </div>
                <div class="todo-actions">
                    <button onclick="todoApp.toggleTodo(${todo.id})" class="${todo.completed ? 'secondary' : ''}">
                        ${todo.completed ? 'Mark Incomplete' : 'Mark Complete'}
                    </button>
                    <button onclick="todoApp.editTodo(${todo.id}, '${this.escapeForJs(todo.title)}', '${this.escapeForJs(todo.description || '')}')" class="secondary">
                        Edit
                    </button>
                    <button onclick="todoApp.deleteTodo(${todo.id})" class="danger">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.completed).length;
        const pending = total - completed;

        document.getElementById('total-count').textContent = total;
        document.getElementById('completed-count').textContent = completed;
        document.getElementById('pending-count').textContent = pending;

        const statsEl = document.getElementById('stats');
        statsEl.style.display = total > 0 ? 'flex' : 'none';
    }

    showLoading() {
        document.getElementById('loading').style.display = 'block';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    showError(message) {
        const errorEl = document.getElementById('error-message');
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }

    hideError() {
        document.getElementById('error-message').style.display = 'none';
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeForJs(text) {
        if (!text) return '';
        return text.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString();
    }
}

// Initialize the app when the page loads
let todoApp;
document.addEventListener('DOMContentLoaded', () => {
    todoApp = new TodoApp();
});