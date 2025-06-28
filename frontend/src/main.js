// Simple utility functions
function formatDate(date) {
    if (!date) return 'N/A';
    try {
        return new Date(date).toLocaleDateString();
    } catch (error) {
        return 'Invalid date';
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}

// Global state
let currentSection = 'dashboard';
let classes = [];
let subjects = [];
let topics = [];
let tasks = [];
let progress = [];

// Chart instances
let progressChart = null;
let analyticsChart = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Syllabus Tracker Pro...');
    initializeApp();
    setupEventListeners();
    loadDashboard();
});

// Initialize the application
function initializeApp() {
    // Set up navigation
    setupNavigation();
    
    // Initialize charts
    initializeCharts();
    
    // Load initial data
    loadInitialData();
}

// Set up navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            item.classList.add('active');
            
            // Get section from data attribute
            const section = item.getAttribute('data-section');
            showSection(section);
        });
    });
}

// Show specific section
function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.section-content').forEach(el => {
        el.classList.add('hidden');
    });
    
    // Show target section
    const targetSection = document.getElementById(`${section}-section`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }
    
    // Update page title
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        pageTitle.textContent = getSectionTitle(section);
    }
    
    // Load section-specific data
    loadSectionData(section);
    
    currentSection = section;
}

// Get section title
function getSectionTitle(section) {
    const titles = {
        dashboard: 'Dashboard',
        classes: 'Class Management',
        'manage-class': 'Manage Class',
        subjects: 'Subject & KPIs',
        topics: 'Topics & Tasks',
        tasks: 'Task Management',
        progress: 'Progress Tracking',
        analytics: 'Analytics',
        reports: 'Reports',
        'scheduled-reports': 'Scheduled Reports'
    };
    return titles[section] || 'Dashboard';
}

// Load section-specific data
function loadSectionData(section) {
    switch (section) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'classes':
            loadClasses();
            break;
        case 'manage-class':
            loadManageClass();
            break;
        case 'subjects':
            loadSubjects();
            break;
        case 'topics':
            loadTopics();
            break;
        case 'tasks':
            loadTasks();
            break;
        case 'progress':
            loadProgress();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'reports':
            loadReports();
            break;
        case 'scheduled-reports':
            loadScheduledReports();
            break;
    }
}

// Set up event listeners
function setupEventListeners() {
    // Search functionality
    const classSearch = document.getElementById('class-search');
    if (classSearch) {
        classSearch.addEventListener('input', debounce(handleClassSearch, 300));
    }
    
    // Filter functionality
    const classFilter = document.getElementById('class-filter');
    if (classFilter) {
        classFilter.addEventListener('change', handleClassFilter);
    }
    
    // Manage class select
    const manageClassSelect = document.getElementById('manage-class-select');
    if (manageClassSelect) {
        manageClassSelect.addEventListener('change', handleManageClassChange);
    }
    
    // Topic subject select
    const topicSubjectSelect = document.getElementById('topic-subject-select');
    if (topicSubjectSelect) {
        topicSubjectSelect.addEventListener('change', handleTopicSubjectChange);
    }
    
    // Modal close buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal') || e.target.closest('.modal-close')) {
            const modal = e.target.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        }
    });
}

// Load initial data
async function loadInitialData() {
    try {
        // For now, use mock data until API is connected
        classes = [
            { id: 1, name: 'Grade 10', section: 'A', description: 'Grade 10 Section A', status: 'active', subjects: [] },
            { id: 2, name: 'Grade 11', section: 'B', description: 'Grade 11 Section B', status: 'active', subjects: [] }
        ];
        
        subjects = [
            { id: 1, name: 'Mathematics', description: 'Advanced Mathematics', class: { id: 1, name: 'Grade 10' }, progress: 75 },
            { id: 2, name: 'Physics', description: 'Physics Fundamentals', class: { id: 1, name: 'Grade 10' }, progress: 60 },
            { id: 3, name: 'Chemistry', description: 'Chemistry Basics', class: { id: 2, name: 'Grade 11' }, progress: 45 }
        ];
        
        topics = [
            { id: 1, name: 'Algebra Basics', description: 'Introduction to algebraic concepts', subject: { id: 1, name: 'Mathematics' }, deadline: '2024-02-15', tasks: [] },
            { id: 2, name: 'Linear Equations', description: 'Solving linear equations', subject: { id: 1, name: 'Mathematics' }, deadline: '2024-02-20', tasks: [] },
            { id: 3, name: 'Mechanics', description: 'Basic mechanics concepts', subject: { id: 2, name: 'Physics' }, deadline: '2024-02-25', tasks: [] }
        ];
        
        tasks = [
            { id: 1, title: 'Complete Chapter 5', description: 'Finish mathematics chapter 5', topic: { id: 1, name: 'Algebra Basics' }, type: 'explanation', dueDate: '2024-01-15', priority: 'high', completed: false },
            { id: 2, title: 'Physics Lab Report', description: 'Submit physics lab report', topic: { id: 3, name: 'Mechanics' }, type: 'copy-check', dueDate: '2024-01-20', priority: 'medium', completed: true },
            { id: 3, title: 'Practice Problems', description: 'Solve practice problems', topic: { id: 2, name: 'Linear Equations' }, type: 'question-answer', dueDate: '2024-01-25', priority: 'low', completed: false }
        ];
        
        // Update dashboard stats
        updateDashboardStats();
        
    } catch (error) {
        console.error('Error loading initial data:', error);
        showNotification('Error loading data', 'error');
    }
}

// Load dashboard
async function loadDashboard() {
    try {
        // Mock analytics data
        const analyticsData = {
            progress: [
                { subject: 'Mathematics', progress: 75 },
                { subject: 'Physics', progress: 60 },
                { subject: 'Chemistry', progress: 45 }
            ],
            recentActivity: [
                { description: 'Added new class: Grade 12', timestamp: new Date() },
                { description: 'Updated progress for Mathematics', timestamp: new Date(Date.now() - 86400000) },
                { description: 'Completed Physics Lab Report', timestamp: new Date(Date.now() - 172800000) }
            ]
        };
        
        // Update charts
        updateProgressChart(analyticsData.progress);
        updateRecentActivity(analyticsData.recentActivity);
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Load classes
async function loadClasses() {
    try {
        renderClasses();
    } catch (error) {
        console.error('Error loading classes:', error);
        showNotification('Error loading classes', 'error');
    }
}

// Load manage class
async function loadManageClass() {
    try {
        populateClassSelects();
        renderManageClass();
    } catch (error) {
        console.error('Error loading manage class:', error);
        showNotification('Error loading manage class', 'error');
    }
}

// Load subjects
async function loadSubjects() {
    try {
        renderSubjects();
    } catch (error) {
        console.error('Error loading subjects', error);
        showNotification('Error loading subjects', 'error');
    }
}

// Load topics
async function loadTopics() {
    try {
        populateTopicSubjectSelects();
        renderTopics();
    } catch (error) {
        console.error('Error loading topics:', error);
        showNotification('Error loading topics', 'error');
    }
}

// Load tasks
async function loadTasks() {
    try {
        renderTasks();
    } catch (error) {
        console.error('Error loading tasks:', error);
        showNotification('Error loading tasks', 'error');
    }
}

// Load progress
async function loadProgress() {
    try {
        progress = [
            { id: 1, topic: 'Algebra Basics', subject: { name: 'Mathematics' }, percentage: 75, date: new Date(), notes: 'Good progress on linear equations' },
            { id: 2, topic: 'Mechanics', subject: { name: 'Physics' }, percentage: 60, date: new Date(Date.now() - 86400000), notes: 'Need more practice with forces' }
        ];
        renderProgress();
    } catch (error) {
        console.error('Error loading progress:', error);
        showNotification('Error loading progress', 'error');
    }
}

// Load analytics
async function loadAnalytics() {
    try {
        // Mock analytics data
        console.log('Loading analytics...');
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Load reports
function loadReports() {
    // Implementation for reports
    console.log('Loading reports...');
}

// Load scheduled reports
async function loadScheduledReports() {
    try {
        console.log('Loading scheduled reports...');
    } catch (error) {
        console.error('Error loading scheduled reports:', error);
    }
}

// Populate class selects
function populateClassSelects() {
    const classSelects = [
        document.getElementById('manage-class-select'),
        document.getElementById('subject-class-select'),
        document.getElementById('topic-subject-select-modal')
    ];
    
    classSelects.forEach(select => {
        if (select) {
            select.innerHTML = '<option value="">Select Class</option>';
            classes.forEach(classItem => {
                const option = document.createElement('option');
                option.value = classItem.id;
                option.textContent = `${classItem.name} - ${classItem.section}`;
                select.appendChild(option);
            });
        }
    });
}

// Populate topic subject selects
function populateTopicSubjectSelects() {
    const subjectSelects = [
        document.getElementById('topic-subject-select'),
        document.getElementById('task-topic-select'),
        document.getElementById('progress-subject-select')
    ];
    
    subjectSelects.forEach(select => {
        if (select) {
            select.innerHTML = '<option value="">Select Subject</option>';
            subjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject.id;
                option.textContent = subject.name;
                select.appendChild(option);
            });
        }
    });
}

// Handle manage class change
function handleManageClassChange(e) {
    const classId = e.target.value;
    if (classId) {
        renderManageClass(classId);
    } else {
        document.getElementById('class-details').innerHTML = '<p class="text-gray-500 text-center py-8">Select a class to manage</p>';
    }
}

// Handle topic subject change
function handleTopicSubjectChange(e) {
    const subjectId = e.target.value;
    if (subjectId) {
        renderTopics(subjectId);
    } else {
        renderTopics();
    }
}

// Render functions
function renderClasses() {
    const grid = document.getElementById('classes-grid');
    if (!grid) return;
    
    grid.innerHTML = classes.map(classItem => `
        <div class="class-item">
            <div class="flex items-center justify-between mb-4">
                <h4 class="text-lg font-semibold text-gray-900">${classItem.name}</h4>
                <span class="badge ${classItem.status === 'active' ? 'badge-success' : 'badge-gray'}">
                    ${classItem.status}
                </span>
            </div>
            <p class="text-sm text-gray-600 mb-4">${classItem.description || 'No description'}</p>
            <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">${classItem.subjects?.length || 0} subjects</span>
                <div class="flex gap-2">
                    <button class="btn btn-sm btn-secondary" onclick="editClass('${classItem.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteClass('${classItem.id}')">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderManageClass(classId = null) {
    const container = document.getElementById('class-details');
    if (!container) return;
    
    if (!classId) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">Select a class to manage</p>';
        return;
    }
    
    const selectedClass = classes.find(c => c.id == classId);
    if (!selectedClass) return;
    
    const classSubjects = subjects.filter(s => s.class.id == classId);
    
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h4 class="card-title">${selectedClass.name} - ${selectedClass.section}</h4>
                <p class="card-description">${selectedClass.description || 'No description'}</p>
            </div>
            <div class="card-content">
                <div class="flex items-center justify-between mb-4">
                    <h5 class="font-medium text-gray-900">Subjects (${classSubjects.length})</h5>
                    <button class="btn btn-primary btn-sm" onclick="openModal('addSubjectModal')">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        Add Subject
                    </button>
                </div>
                <div class="space-y-3">
                    ${classSubjects.map(subject => `
                        <div class="subject-item">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h6 class="font-medium text-gray-900">${subject.name}</h6>
                                    <p class="text-sm text-gray-600">${subject.description || 'No description'}</p>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="badge badge-primary">${subject.progress || 0}%</span>
                                    <button class="btn btn-sm btn-secondary" onclick="editSubject('${subject.id}')">Edit</button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteSubject('${subject.id}')">Delete</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                    ${classSubjects.length === 0 ? '<p class="text-gray-500 text-center py-4">No subjects added yet</p>' : ''}
                </div>
            </div>
        </div>
    `;
}

function renderSubjects() {
    const list = document.getElementById('subjects-list');
    if (!list) return;
    
    // Group subjects by class
    const subjectsByClass = subjects.reduce((acc, subject) => {
        const className = subject.class?.name || 'Unknown Class';
        if (!acc[className]) acc[className] = [];
        acc[className].push(subject);
        return acc;
    }, {});
    
    list.innerHTML = Object.entries(subjectsByClass).map(([className, classSubjects]) => `
        <div class="card">
            <div class="card-header">
                <h4 class="card-title">${className}</h4>
                <p class="card-description">${classSubjects.length} subjects</p>
            </div>
            <div class="card-content">
                <div class="space-y-4">
                    ${classSubjects.map(subject => `
                        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div class="flex items-center gap-4">
                                <div class="progress-circle w-16 h-16">
                                    <svg class="w-full h-full" viewBox="0 0 36 36">
                                        <path class="bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                                        <path class="progress" stroke-dasharray="${subject.progress || 0}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                                    </svg>
                                    <span class="absolute text-sm font-medium">${subject.progress || 0}%</span>
                                </div>
                                <div>
                                    <h5 class="font-medium text-gray-900">${subject.name}</h5>
                                    <p class="text-sm text-gray-600">${subject.description || 'No description'}</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <button class="btn btn-sm btn-primary" onclick="manageKPIs('${subject.id}')">KPIs</button>
                                <button class="btn btn-sm btn-secondary" onclick="editSubject('${subject.id}')">Edit</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

function renderTopics(subjectId = null) {
    const list = document.getElementById('topics-list');
    if (!list) return;
    
    let filteredTopics = topics;
    if (subjectId) {
        filteredTopics = topics.filter(topic => topic.subject.id == subjectId);
    }
    
    if (filteredTopics.length === 0) {
        list.innerHTML = '<p class="text-gray-500 text-center py-8">No topics found</p>';
        return;
    }
    
    list.innerHTML = filteredTopics.map(topic => `
        <div class="topic-item">
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <h5 class="font-medium text-gray-900">${topic.name}</h5>
                    <p class="text-sm text-gray-600">${topic.description || 'No description'}</p>
                    <div class="flex items-center gap-4 mt-2">
                        <span class="text-xs text-gray-500">Subject: ${topic.subject.name}</span>
                        <span class="text-xs text-gray-500">Deadline: ${formatDate(topic.deadline)}</span>
                        <span class="text-xs text-gray-500">Tasks: ${topic.tasks?.length || 0}</span>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button class="btn btn-sm btn-primary" onclick="addTaskToTopic('${topic.id}')">Add Task</button>
                    <button class="btn btn-sm btn-secondary" onclick="editTopic('${topic.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTopic('${topic.id}')">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderTasks() {
    const list = document.getElementById('tasks-list');
    if (!list) return;
    
    list.innerHTML = tasks.map(task => `
        <div class="task-item">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} 
                           onchange="toggleTask('${task.id}')" 
                           class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500">
                    <div>
                        <h5 class="font-medium text-gray-900 ${task.completed ? 'line-through' : ''}">${task.title}</h5>
                        <p class="text-sm text-gray-600">${task.description || 'No description'}</p>
                        <div class="flex items-center gap-4 mt-1">
                            <span class="text-xs text-gray-500">Topic: ${task.topic?.name || 'Unknown'}</span>
                            <span class="text-xs text-gray-500">Due: ${formatDate(task.dueDate)}</span>
                            <span class="badge ${getTaskTypeBadge(task.type)}">${getTaskTypeLabel(task.type)}</span>
                            <span class="badge ${getPriorityBadge(task.priority)}">${task.priority}</span>
                        </div>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button class="btn btn-sm btn-secondary" onclick="editTask('${task.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTask('${task.id}')">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderProgress() {
    const list = document.getElementById('progress-list');
    if (!list) return;
    
    list.innerHTML = progress.map(entry => `
        <div class="card">
            <div class="card-content">
                <div class="flex items-center justify-between">
                    <div>
                        <h5 class="font-medium text-gray-900">${entry.topic}</h5>
                        <p class="text-sm text-gray-600">${entry.subject?.name || 'Unknown Subject'}</p>
                        <p class="text-sm text-gray-500">${formatDate(entry.date)}</p>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold text-primary-600">${entry.percentage}%</div>
                        <div class="w-32 bg-gray-200 rounded-full h-2 mt-2">
                            <div class="bg-primary-600 h-2 rounded-full" style="width: ${entry.percentage}%"></div>
                        </div>
                    </div>
                </div>
                ${entry.notes ? `<p class="text-sm text-gray-600 mt-2">${entry.notes}</p>` : ''}
            </div>
        </div>
    `).join('');
}

// Update functions
function updateDashboardStats() {
    document.getElementById('total-classes').textContent = classes.length;
    document.getElementById('total-subjects').textContent = subjects.length;
    document.getElementById('active-tasks').textContent = tasks.filter(t => !t.completed).length;
    
    // Calculate overall progress
    const totalProgress = subjects.reduce((sum, subject) => sum + (subject.progress || 0), 0);
    const averageProgress = subjects.length > 0 ? Math.round(totalProgress / subjects.length) : 0;
    document.getElementById('overall-progress').textContent = `${averageProgress}%`;
}

function updateProgressChart(data) {
    const ctx = document.getElementById('progressChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (progressChart) {
        progressChart.destroy();
    }
    
    progressChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(d => d.subject),
            datasets: [{
                data: data.map(d => d.progress),
                backgroundColor: [
                    '#3b82f6',
                    '#10b981',
                    '#f59e0b',
                    '#ef4444',
                    '#8b5cf6'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateRecentActivity(activities) {
    const container = document.getElementById('recent-activity');
    if (!container) return;
    
    container.innerHTML = activities.map(activity => `
        <div class="flex items-start gap-3">
            <div class="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
            <div class="flex-1">
                <p class="text-sm text-gray-900">${activity.description}</p>
                <p class="text-xs text-gray-500">${formatDate(activity.timestamp)}</p>
            </div>
        </div>
    `).join('');
}

// Initialize charts
function initializeCharts() {
    // Charts will be initialized when data is loaded
}

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Form handling functions
async function saveClass() {
    const name = document.getElementById('class-name-input').value;
    const section = document.getElementById('class-section-input').value;
    const description = document.getElementById('class-description-input').value;
    
    if (!name) {
        showNotification('Class name is required', 'error');
        return;
    }
    
    try {
        // Mock API call
        const newClass = {
            id: Date.now(),
            name,
            section,
            description,
            status: 'active',
            subjects: []
        };
        
        classes.push(newClass);
        showNotification('Class created successfully', 'success');
        closeModal('addClassModal');
        loadClasses();
        updateDashboardStats();
    } catch (error) {
        console.error('Error creating class:', error);
        showNotification('Error creating class', 'error');
    }
}

async function saveSubject() {
    const name = document.getElementById('subject-name-input').value;
    const classId = document.getElementById('subject-class-select').value;
    const description = document.getElementById('subject-description-input').value;
    
    if (!name || !classId) {
        showNotification('Subject name and class are required', 'error');
        return;
    }
    
    try {
        // Mock API call
        const selectedClass = classes.find(c => c.id == classId);
        const newSubject = {
            id: Date.now(),
            name,
            description,
            class: { id: selectedClass.id, name: selectedClass.name },
            progress: 0
        };
        
        subjects.push(newSubject);
        showNotification('Subject created successfully', 'success');
        closeModal('addSubjectModal');
        loadSubjects();
        updateDashboardStats();
    } catch (error) {
        console.error('Error creating subject:', error);
        showNotification('Error creating subject', 'error');
    }
}

async function saveTopic() {
    const name = document.getElementById('topic-name-input').value;
    const subjectId = document.getElementById('topic-subject-select-modal').value;
    const description = document.getElementById('topic-description-input').value;
    const deadline = document.getElementById('topic-deadline-input').value;
    
    if (!name || !subjectId) {
        showNotification('Topic name and subject are required', 'error');
        return;
    }
    
    try {
        // Mock API call
        const selectedSubject = subjects.find(s => s.id == subjectId);
        const newTopic = {
            id: Date.now(),
            name,
            description,
            subject: { id: selectedSubject.id, name: selectedSubject.name },
            deadline,
            tasks: []
        };
        
        topics.push(newTopic);
        showNotification('Topic created successfully', 'success');
        closeModal('addTopicModal');
        loadTopics();
    } catch (error) {
        console.error('Error creating topic:', error);
        showNotification('Error creating topic', 'error');
    }
}

async function saveTask() {
    const title = document.getElementById('task-title-input').value;
    const topicId = document.getElementById('task-topic-select').value;
    const type = document.getElementById('task-type-select').value;
    const dueDate = document.getElementById('task-due-date-input').value;
    const priority = document.getElementById('task-priority-select').value;
    const description = document.getElementById('task-description-input').value;
    
    if (!title || !topicId || !dueDate) {
        showNotification('Title, topic, and due date are required', 'error');
        return;
    }
    
    try {
        // Mock API call
        const selectedTopic = topics.find(t => t.id == topicId);
        const newTask = {
            id: Date.now(),
            title,
            topic: { id: selectedTopic.id, name: selectedTopic.name },
            type,
            dueDate,
            priority,
            description,
            completed: false
        };
        
        tasks.push(newTask);
        showNotification('Task created successfully', 'success');
        closeModal('addTaskModal');
        loadTasks();
        updateDashboardStats();
    } catch (error) {
        console.error('Error creating task:', error);
        showNotification('Error creating task', 'error');
    }
}

async function saveProgress() {
    const subjectId = document.getElementById('progress-subject-select').value;
    const topic = document.getElementById('progress-topic-input').value;
    const percentage = document.getElementById('progress-percentage-input').value;
    const notes = document.getElementById('progress-notes-input').value;
    
    if (!subjectId || !topic || !percentage) {
        showNotification('Subject, topic, and percentage are required', 'error');
        return;
    }
    
    try {
        // Mock API call
        const newProgress = {
            id: Date.now(),
            subjectId,
            topic,
            percentage: parseInt(percentage),
            notes,
            date: new Date(),
            subject: { name: 'Mathematics' } // Mock subject name
        };
        
        progress.push(newProgress);
        showNotification('Progress saved successfully', 'success');
        closeModal('addProgressModal');
        loadProgress();
    } catch (error) {
        console.error('Error saving progress:', error);
        showNotification('Error saving progress', 'error');
    }
}

// Utility functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = cn(
        'fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm',
        type === 'success' && 'bg-green-500 text-white',
        type === 'error' && 'bg-red-500 text-white',
        type === 'warning' && 'bg-yellow-500 text-white',
        type === 'info' && 'bg-primary-500 text-white'
    );
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function handleClassSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filteredClasses = classes.filter(classItem => 
        classItem.name.toLowerCase().includes(searchTerm) ||
        classItem.description?.toLowerCase().includes(searchTerm)
    );
    renderFilteredClasses(filteredClasses);
}

function handleClassFilter(e) {
    const filterValue = e.target.value;
    let filteredClasses = classes;
    
    if (filterValue) {
        filteredClasses = classes.filter(classItem => classItem.status === filterValue);
    }
    
    renderFilteredClasses(filteredClasses);
}

function renderFilteredClasses(filteredClasses) {
    const grid = document.getElementById('classes-grid');
    if (!grid) return;
    
    if (filteredClasses.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <p class="text-gray-500">No classes found</p>
            </div>
        `;
        return;
    }
    
    // Reuse the existing render logic
    const originalClasses = classes;
    classes = filteredClasses;
    renderClasses();
    classes = originalClasses;
}

function getPriorityColor(priority) {
    const colors = {
        low: 'text-green-600 bg-green-100',
        medium: 'text-yellow-600 bg-yellow-100',
        high: 'text-red-600 bg-red-100',
    };
    return colors[priority] || colors.medium;
}

function getPriorityBadge(priority) {
    const badges = {
        low: 'badge-success',
        medium: 'badge-warning',
        high: 'badge-danger',
    };
    return badges[priority] || 'badge-gray';
}

function getTaskTypeLabel(type) {
    const labels = {
        explanation: 'Explanation',
        'question-answer': 'Q&A Writing',
        'copy-check': 'Copy Check',
    };
    return labels[type] || 'Unknown';
}

function getTaskTypeBadge(type) {
    const badges = {
        explanation: 'badge-primary',
        'question-answer': 'badge-success',
        'copy-check': 'badge-warning',
    };
    return badges[type] || 'badge-gray';
}

// Export functions for global access
window.openModal = openModal;
window.closeModal = closeModal;
window.saveClass = saveClass;
window.saveSubject = saveSubject;
window.saveTopic = saveTopic;
window.saveTask = saveTask;
window.saveProgress = saveProgress;
window.editClass = (id) => console.log('Edit class:', id);
window.deleteClass = (id) => console.log('Delete class:', id);
window.editSubject = (id) => console.log('Edit subject:', id);
window.deleteSubject = (id) => console.log('Delete subject:', id);
window.manageKPIs = (id) => console.log('Manage KPIs for subject:', id);
window.editTopic = (id) => console.log('Edit topic:', id);
window.deleteTopic = (id) => console.log('Delete topic:', id);
window.addTaskToTopic = (id) => {
    document.getElementById('task-topic-select').value = id;
    openModal('addTaskModal');
};
window.editTask = (id) => console.log('Edit task:', id);
window.deleteTask = (id) => console.log('Delete task:', id);
window.toggleTask = (id) => console.log('Toggle task:', id); 