class TaskFlowApp {
    constructor() {
        this.user = null;
        this.tasks = {
            todo: [],
            completed: [],
            archived: []
        };
        this.datetimeEnabled = false;
        
        this.init();
    }

    async init() {
        // Check authentication
        if (!this.checkAuth()) {
            window.location.href = '../login/index.html';
            return;
        }

        // Set up UI
        this.setupUI();
        this.setupEventListeners();
        
        // Load tasks
        await this.loadTasks();
        
        // Render tasks
        this.renderAllTasks();
        
        // Set minimum date to today
        this.setMinDate();
    }

    checkAuth() {
        // For demo purposes, create a mock user if none exists
        let userData = localStorage.getItem('taskflow_user');
        if (!userData) {
            // Create demo user
            this.user = {
                name: 'Demo User',
                dateOfBirth: '1990-01-01'
            };
            localStorage.setItem('taskflow_user', JSON.stringify(this.user));
            return true;
        }
        
        try {
            this.user = JSON.parse(userData);
            return this.user && this.user.name;
        } catch (error) {
            console.error('Auth check failed:', error);
            return false;
        }
    }

    setupUI() {
        // Set user name and avatar
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        
        userName.textContent = `Welcome, ${this.user.name}!`;
        userAvatar.src = `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${encodeURIComponent(this.user.name)}`;
        userAvatar.alt = `${this.user.name}'s Avatar`;
    }

    setupEventListeners() {
        // Sign out button
        document.getElementById('signOutBtn').addEventListener('click', () => {
            this.signOut();
        });

        // Task form
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Task input validation
        document.getElementById('taskInput').addEventListener('input', (e) => {
            const btn = document.getElementById('addTaskBtn');
            btn.disabled = !e.target.value.trim();
        });

        // DateTime toggle
        document.getElementById('datetimeToggle').addEventListener('click', () => {
            this.toggleDateTime();
        });
    }

    setMinDate() {
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];
        document.getElementById('dueDateInput').min = dateString;
    }

    toggleDateTime() {
        this.datetimeEnabled = !this.datetimeEnabled;
        const toggle = document.getElementById('datetimeToggle');
        const inputs = document.getElementById('datetimeInputs');
        
        if (this.datetimeEnabled) {
            toggle.classList.add('active');
            inputs.classList.add('show');
        } else {
            toggle.classList.remove('active');
            inputs.classList.remove('show');
            // Clear the inputs
            document.getElementById('dueDateInput').value = '';
            document.getElementById('dueTimeInput').value = '';
        }
    }

    async loadTasks() {
        try {
            const existingTasks = localStorage.getItem('taskflow_tasks');
            
            if (existingTasks) {
                this.tasks = JSON.parse(existingTasks);
            }
            // No more dummy data loading - start with empty tasks
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.showToast('Error loading tasks', 'error');
        }
    }

    addTask() {
        const taskInput = document.getElementById('taskInput');
        const dueDateInput = document.getElementById('dueDateInput');
        const dueTimeInput = document.getElementById('dueTimeInput');
        const taskText = taskInput.value.trim();
        
        if (!taskText) {
            this.showToast('Please enter a task', 'error');
            return;
        }

        const newTask = {
            id: Date.now() + Math.random(),
            text: taskText,
            timestamp: this.formatTimestamp(new Date()),
            createdAt: new Date().toISOString()
        };

        // Add due date and time if enabled
        if (this.datetimeEnabled && dueDateInput.value) {
            const dueDate = dueDateInput.value;
            const dueTime = dueTimeInput.value || '23:59'; // Default to end of day if no time specified
            newTask.dueDate = dueDate;
            newTask.dueTime = dueTime;
            newTask.dueDatetime = new Date(`${dueDate}T${dueTime}`).toISOString();
        }

        this.tasks.todo.push(newTask);
        this.saveTasks();
        this.renderAllTasks();
        
        // Clear inputs and reset form
        taskInput.value = '';
        dueDateInput.value = '';
        dueTimeInput.value = '';
        document.getElementById('addTaskBtn').disabled = true;
        
        // Reset datetime toggle if it was enabled
        if (this.datetimeEnabled) {
            this.toggleDateTime();
        }
        
        this.showToast('Task added successfully!', 'success');
    }

    moveTask(taskId, fromStage, toStage) {
        const taskIndex = this.tasks[fromStage].findIndex(task => task.id === taskId);
        if (taskIndex === -1) return;

        const task = this.tasks[fromStage][taskIndex];
        // Update timestamp
        task.timestamp = this.formatTimestamp(new Date());
        
        // Move task
        this.tasks[fromStage].splice(taskIndex, 1);
        this.tasks[toStage].push(task);
        
        this.saveTasks();
        this.renderAllTasks();
        this.showToast(`Task moved to ${toStage}!`, 'success');
    }

    saveTasks() {
        try {
            localStorage.setItem('taskflow_tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Error saving tasks:', error);
            this.showToast('Error saving tasks', 'error');
        }
    }

    renderAllTasks() {
        this.renderTasks('todo');
        this.renderTasks('completed');
        this.renderTasks('archived');
        this.updateCounters();
    }

    renderTasks(stage) {
        const container = document.getElementById(`${stage}Tasks`);
        const tasks = this.tasks[stage];

        if (tasks.length === 0) {
            const emptyMessage = stage === 'todo' ? 
                'No tasks yet. Add your first task above!' : 
                `No ${stage} tasks yet`;
            
            container.innerHTML = `
                <div class="empty-state">
                    <p>${emptyMessage}</p>
                </div>
            `;
            return;
        }

        // Sort tasks by due date (if they have one)
        const sortedTasks = [...tasks].sort((a, b) => {
            if (!a.dueDatetime && !b.dueDatetime) return 0;
            if (!a.dueDatetime) return 1;
            if (!b.dueDatetime) return -1;
            return new Date(a.dueDatetime) - new Date(b.dueDatetime);
        });

        container.innerHTML = sortedTasks.map(task => {
            const dueDateInfo = this.getDueDateInfo(task);
            return `
                <div class="task-card slide-in ${dueDateInfo.class}">
                    <div class="task-content">
                        <div class="task-text">${this.escapeHtml(task.text)}</div>
                        <div class="task-metadata">
                            <div class="task-timestamp">
                                🕐 Last modified: ${task.timestamp}
                            </div>
                            ${dueDateInfo.html}
                        </div>
                    </div>
                    <div class="task-actions">
                        ${this.getTaskButtons(task.id, stage)}
                    </div>
                </div>
            `;
        }).join('');
    }

    getDueDateInfo(task) {
        if (!task.dueDatetime) {
            return { class: '', html: '' };
        }

        const now = new Date();
        const dueDate = new Date(task.dueDatetime);
        const timeDiff = dueDate - now;
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        let className = '';
        let icon = '📅';
        let status = '';

        if (timeDiff < 0) {
            className = 'overdue';
            icon = '⚠️';
            status = ' (Overdue)';
        } else if (daysDiff <= 1) {
            className = 'due-soon';
            icon = '⏰';
            status = daysDiff === 0 ? ' (Due today)' : ' (Due tomorrow)';
        }

        const formattedDate = this.formatDueDate(dueDate);
        
        return {
            class: className,
            html: `
                <div class="task-due-date ${className}">
                    ${icon} Due: ${formattedDate}${status}
                </div>
            `
        };
    }

    formatDueDate(date) {
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    getTaskButtons(taskId, stage) {
        switch (stage) {
            case 'todo':
                return `
                    <button class="task-btn btn-complete" onclick="app.moveTask(${taskId}, 'todo', 'completed')">
                        Mark as Completed
                    </button>
                    <button class="task-btn btn-archive" onclick="app.moveTask(${taskId}, 'todo', 'archived')">
                        Archive
                    </button>
                `;
            case 'completed':
                return `
                    <button class="task-btn btn-todo" onclick="app.moveTask(${taskId}, 'completed', 'todo')">
                        Move to Todo
                    </button>
                    <button class="task-btn btn-archive" onclick="app.moveTask(${taskId}, 'completed', 'archived')">
                        Archive
                    </button>
                `;
            case 'archived':
                return `
                    <button class="task-btn btn-todo" onclick="app.moveTask(${taskId}, 'archived', 'todo')">
                        Move to Todo
                    </button>
                    <button class="task-btn btn-complete" onclick="app.moveTask(${taskId}, 'archived', 'completed')">
                        Move to Completed
                    </button>
                `;
            default:
                return '';
        }
    }

    updateCounters() {
        document.getElementById('todoCounter').textContent = this.tasks.todo.length;
        document.getElementById('completedCounter').textContent = this.tasks.completed.length;
        document.getElementById('archivedCounter').textContent = this.tasks.archived.length;
    }

    formatTimestamp(date) {
        return date.toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `${type}-toast`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    signOut() {
        if (confirm('Are you sure you want to sign out?')) {
            localStorage.removeItem('taskflow_user');
            localStorage.removeItem('taskflow_tasks');
            window.location.href = '../login/index.html';
        }
    }
}

// Initialize the application when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TaskFlowApp();
});