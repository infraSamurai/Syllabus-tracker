// Syllabus Tracker Pro JS - extracted from idea.txt
// All logic for navigation, state, API calls, and UI updates
// ... (rest of the JS from idea.txt) ...
/*
  NOTE: This file contains all JS from idea.txt.
  For maintainability, keep only JS here.
*/

// API Configuration
const API_BASE = '/api';

// State Management
const state = {
    subjects: [],
    classes: [],
    tasks: [],
    kpis: [],
    currentPage: 'dashboard',
    charts: {},
    progressHistory: [],
    milestones: []
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async function() {
    await initializeApp();
    await initializeAllSections();
    setupEventListeners();
    showPage('dashboard');
});

async function initializeApp() {
    try {
        // Show loading state
        showLoadingState();
        
        // Load all data
        await Promise.all([
            loadClasses(),
            loadSubjects(),
            loadKPIs(),
            loadTasks(),
            loadProgressHistory()
        ]);
        
        // Initialize components
        initializeSidebar();
        initializeSearch();
        initializeNotifications();
        
        hideLoadingState();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showAlert('Failed to load application data', 'danger');
    }
}

function setupEventListeners() {
    document.getElementById('subjectForm').addEventListener('submit', saveSubject);
    document.getElementById('chapterForm').addEventListener('submit', saveChapter);
    document.getElementById('topicForm').addEventListener('submit', saveTopic);
    document.getElementById('classForm').addEventListener('submit', saveClass);
}

function renderAll() {
    renderSubjects();
    renderClasses();
    updateDashboard();
    renderProgressView();
    renderSubjectsKPIList();
    renderTasksGrouped();
}

// Navigation
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    const page = document.getElementById(pageId + '-page');
    if (page) {
        page.style.display = 'block';
    }
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    // Highlight the nav item for the current page
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        if (item.getAttribute('onclick') && item.getAttribute('onclick').includes(`showPage('${pageId}')`)) {
            item.classList.add('active');
        }
    });
    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'subjects': 'Subject Management & KPIs',
        'analytics': 'Analytics & Insights',
        'tasks': 'Daily Tasks',
        'report-builder': 'Custom Report Builder',
        'scheduled-reports': 'Scheduled Reports',
        'export': 'Export Data',
        'classes': 'Class Management',
        'progress': 'Progress Tracking',
        'milestones': 'Milestones & Rewards'
    };
    document.getElementById('page-title').textContent = titles[pageId] || 'Syllabus Tracker Pro';
    if (pageId === 'dashboard') {
        initializeDashboardCharts();
    } else if (pageId === 'analytics') {
        initializeAnalyticsCharts();
    }
    if (pageId === 'syllabus-management') {
        renderSyllabusDrilldown();
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
    document.querySelectorAll('.tab-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function addKPIField() {
    const kpiList = document.getElementById('kpi-list');
    const newKPI = document.createElement('div');
    newKPI.className = 'kpi-item';
    newKPI.style.marginTop = '8px';
    newKPI.innerHTML = '<input type="text" class="form-input" placeholder="Enter KPI...">';
    kpiList.appendChild(newKPI);
}

// Data persistence (API)
async function loadData() {
    try {
        const [subjectsRes, classesRes] = await Promise.all([
            fetch(`${API_BASE}/syllabus/subjects`),
            fetch(`${API_BASE}/classes`)
        ]);
        if (!subjectsRes.ok || !classesRes.ok) throw new Error('Network response was not ok.');
        state.subjects = await subjectsRes.json();
        state.classes = await classesRes.json();
    } catch (e) {
        state.subjects = [];
        state.classes = [];
        showAlert('Failed to load data from server. Is the backend running?', 'danger');
    }
}

// --- Class Management ---
function renderClasses() {
    const classList = document.getElementById('class-list');
    if (!classList) return;
    
    classList.innerHTML = '';
    
    if (state.classes.length === 0) {
        classList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🏫</div>
                <h3>No classes found</h3>
                <p>Click "Add Class" to create a new class and assign subjects to it.</p>
            </div>`;
        return;
    }

    const classSearchInput = document.getElementById('class-search-input');
    const searchTerm = classSearchInput ? classSearchInput.value.toLowerCase() : '';

    const filteredClasses = state.classes.filter(cls => cls.name.toLowerCase().includes(searchTerm));

    if (filteredClasses.length === 0) {
        classList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🧐</div>
                <h3>No classes match your search</h3>
                <p>Try a different search term or add a new class.</p>
            </div>`;
        return;
    }

    filteredClasses.forEach(cls => {
        const subjectCount = state.subjects.filter(s => s.class && s.class._id === cls._id).length;

        const card = document.createElement('div');
        card.className = 'class-card';
        card.innerHTML = `
            <div class="class-card-header">
                <div class="class-card-icon">🏫</div>
                <div class="class-card-title">${cls.name}</div>
            </div>
            <div class="class-card-body">
                <p>${cls.description || 'No description provided.'}</p>
            </div>
            <div class="class-card-stats">
                <div class="stat">
                    <span class="stat-value">${subjectCount}</span>
                    <span class="stat-label">Subjects</span>
                </div>
            </div>
            <div class="class-card-actions">
                <button class="btn btn-secondary btn-small" onclick="openClassModal('${cls._id}')">
                    <span class="icon">✏️</span> Edit
                </button>
                <button class="btn btn-danger btn-small" onclick="deleteClass('${cls._id}')">
                    <span class="icon">🗑️</span> Delete
                </button>
                <button class="btn btn-primary btn-small" onclick="openAddSubjectModal('${cls._id}')">
                    <span class="icon">➕</span> Add Subject
                </button>
            </div>
        `;
        classList.appendChild(card);
    });
}

window.openClassModal = function(classId = null) {
    const form = document.getElementById('classForm');
    form.reset();
    const modalTitle = document.getElementById('classModalTitle');
    
    if (classId) {
        const cls = state.classes.find(c => c._id === classId);
        if (!cls) return;
        editMode = { type: 'class', id: classId };
        modalTitle.textContent = 'Edit Class';
        document.getElementById('className').value = cls.name;
        document.getElementById('classDescription').value = cls.description || '';
    } else {
        editMode = { type: 'class' };
        modalTitle.textContent = 'Add New Class';
    }
    openModal('classModal');
};

async function saveClass(e) {
    if (e) e.preventDefault();
    
    const form = document.getElementById('classForm');
    const editMode = form.dataset.editMode === 'true';
    const editId = form.dataset.editId;
    
    const classData = {
        name: document.getElementById('className').value,
        code: document.getElementById('classCode').value,
        description: document.getElementById('classDescription').value,
        capacity: parseInt(document.getElementById('classCapacity').value) || 0
    };
    
    try {
        let response;
        if (editMode) {
            response = await fetch(`${API_BASE}/classes/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(classData)
            });
        } else {
            response = await fetch(`${API_BASE}/classes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(classData)
            });
        }
        
        if (!response.ok) throw new Error('Failed to save class');
        
        await loadClasses();
        closeModal('addClassModal');
        form.reset();
        form.dataset.editMode = 'false';
        form.dataset.editId = '';
        
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Add Class';
        }
        
        showAlert(editMode ? 'Class updated successfully!' : 'Class added successfully!', 'success');
    } catch (error) {
        console.error('Error saving class:', error);
        showAlert('Failed to save class: ' + error.message, 'error');
    }
}

window.deleteClass = async function(classId) {
    if (!confirm('Are you sure you want to delete this class? This might affect subjects using it.')) return;
    try {
        const res = await fetch(`${API_BASE}/classes/${classId}`, { method: 'DELETE' });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message);
        }
        await loadData();
        renderAll();
        showAlert('Class deleted!', 'success');
    } catch (e) {
        showAlert(e.message, 'warning');
    }
};

// --- Subject Management ---
function populateClassDropdown(selectedClassId = null) {
    const select = document.getElementById('subjectClass');
    select.innerHTML = '<option value="">-- Select a Class --</option>';
    state.classes.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls._id;
        option.textContent = cls.name;
        if (cls._id === selectedClassId) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

window.addSubject = function() {
    editMode = null;
    document.getElementById('subjectForm').reset();
    document.querySelector('#subjectModal .modal-title').textContent = 'Add New Subject';
    populateClassDropdown();
    openModal('subjectModal');
};

window.editSubject = function(subjectId) {
    const subject = state.subjects.find(s => s._id === subjectId);
    if (!subject) return;
    editMode = { type: 'subject', id: subjectId };
    document.querySelector('#addSubjectModal .modal-title').textContent = 'Edit Subject';
    document.getElementById('subjectName').value = subject.name;
    document.getElementById('subjectCode').value = subject.code;
    document.getElementById('subjectDescription').value = subject.description || '';
    populateClassDropdown(subject.class ? subject.class._id : null);
    document.getElementById('subjectDepartment').value = subject.department;
    document.getElementById('subjectDeadline').value = subject.deadline ? subject.deadline.split('T')[0] : '';
    openModal('addSubjectModal');
};

async function saveSubject(e) {
    e.preventDefault();
    const classId = selectedSyllabusClassId || document.getElementById('subjectClass').value;
    const subjectData = {
        name: document.getElementById('subjectName').value,
        code: document.getElementById('subjectCode').value,
        class: classId,
        department: document.getElementById('subjectDepartment').value,
        deadline: document.getElementById('subjectDeadline').value,
        description: document.getElementById('subjectDescription').value,
    };
    // No need to check for subjectData.class, as it comes from the dropdown
    try {
        let response;
        if (editMode && editMode.type === 'subject' && editMode.id) {
            response = await fetch(`${API_BASE}/syllabus/subjects/${editMode.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subjectData)
            });
        } else {
            response = await fetch(`${API_BASE}/syllabus/subjects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subjectData)
            });
        }
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save subject.');
        }
        await loadData();
        renderAll();
        closeModal('addSubjectModal');
        showAlert('Subject saved successfully!', 'success');
    } catch (e) {
        showAlert(e.message, 'danger');
    }
}

window.deleteSubject = async function(subjectId) {
    if (!confirm('Delete this subject and all its chapters/topics?')) return;
    try {
        await fetch(`${API_BASE}/syllabus/subjects/${subjectId}`, { method: 'DELETE' });
        await loadData();
        // If the deleted subject was selected, clear selection
        if (selectedSyllabusSubjectId === subjectId) selectedSyllabusSubjectId = null;
        renderSyllabusDrilldown();
        await loadTasks(); // Refresh the task list
        renderAll();
        showAlert('Subject deleted!', 'success');
    } catch (e) {
        showAlert(e.message, 'danger');
    }
};

// --- Chapter & Topic Management ---
async function saveChapter(e) {
    e.preventDefault();
    const chapterData = {
        title: document.getElementById('chapterTitle').value,
        number: parseInt(document.getElementById('chapterNumber').value),
        deadline: document.getElementById('chapterDeadline').value,
        description: document.getElementById('chapterDescription').value,
        subject: document.getElementById('chapterSubjectId').value
    };

    try {
        let response;
        if (editMode && editMode.type === 'chapter' && editMode.id) {
            response = await fetch(`${API_BASE}/syllabus/chapters/${editMode.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(chapterData)
            });
        } else {
            response = await fetch(`${API_BASE}/syllabus/chapters`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(chapterData)
            });
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save chapter.');
        }

        await loadData();
        renderAll();
        closeModal('chapterModal');
        showAlert('Chapter saved successfully!', 'success');
    } catch (e) {
        showAlert(e.message, 'danger');
    }
}

async function saveTopic(e) {
    e.preventDefault();
    const topicData = {
        title: document.getElementById('topicTitle').value,
        deadline: document.getElementById('topicDeadline').value,
        notes: document.getElementById('topicNotes').value,
        chapter: document.getElementById('topicChapterId').value
    };

    try {
        let response;
        if (editMode && editMode.type === 'topic' && editMode.id) {
            response = await fetch(`${API_BASE}/syllabus/topics/${editMode.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(topicData)
            });
        } else {
            response = await fetch(`${API_BASE}/syllabus/topics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(topicData)
            });
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save topic.');
        }

        await loadData();
        renderAll();
        closeModal('topicModal');
        showAlert('Topic saved successfully!', 'success');
    } catch (e) {
        showAlert(e.message, 'danger');
    }
}

// --- Rendering Functions ---
function renderSubjects() {
    const subjectList = document.getElementById('subject-list');
    if(!subjectList) return;
    subjectList.innerHTML = '';
    
    if (state.subjects.length === 0) {
        subjectList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📚</div>
                <h3>No Subjects Created</h3>
                <p>Click the "+ Add Subject" button to get started.</p>
            </div>`;
        return;
    }
    
    state.subjects.forEach(subject => {
        const totalTopics = subject.chapters ? subject.chapters.flatMap(c => c.topics || []).length : 0;
        const completedTopics = subject.chapters ? subject.chapters.flatMap(c => c.topics || []).filter(t => t.completed).length : 0;
        const progress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
        const classInfo = subject.class ? `<div class="subject-card-class">${subject.class.name}</div>` : '<div></div>';

        let progressColorClass = 'low';
        if (progress > 66) progressColorClass = 'high';
        else if (progress > 33) progressColorClass = 'medium';

        const card = document.createElement('div');
        card.className = 'subject-card-full';
        card.id = `subject-${subject._id}`;
        card.innerHTML = `
            <div class="subject-card-header">
                ${classInfo}
                <div class="subject-card-actions">
                    <span class="subject-card-code">${subject.code}</span>
                    <button class="btn-icon" onclick="editSubject('${subject._id}')" title="Edit Subject">✏️</button>
                    <button class="btn-icon" onclick="deleteSubject('${subject._id}')" title="Delete Subject">🗑️</button>
                </div>
            </div>
            <div class="subject-card-title">${subject.name}</div>
            <div class="subject-card-progress">
                <div class="progress-bar-container">
                    <div class="progress-bar ${progressColorClass}" style="width: ${progress.toFixed(2)}%;"></div>
                </div>
                <div class="progress-text">${completedTopics} of ${totalTopics} topics completed</div>
            </div>
            <div class="subject-card-details">
                <div class="chapters-container">
                    ${renderChapters(subject)}
                </div>
                <div class="subject-card-footer">
                     <button class="btn btn-secondary btn-sm" onclick="addChapter('${subject._id}')">+ Add Chapter</button>
                </div>
            </div>
        `;
        subjectList.appendChild(card);
    });
}

function renderChapters(subject) {
    if (!subject.chapters || subject.chapters.length === 0) {
        return '<p class="empty-state-sm">No chapters yet. Click "+ Add Chapter" below.</p>';
    }
    return subject.chapters.sort((a,b) => a.number - b.number).reduce((acc, chapter) => {
        const allTopicsCompleted = chapter.topics.length > 0 && chapter.topics.every(t => t.completed);
        acc += `
            <div class="chapter-card ${allTopicsCompleted ? 'completed' : ''}">
                <div class="chapter-header">
                    <h5>${chapter.number}. ${chapter.title}</h5>
                    <div class="chapter-actions">
                        <button class="btn-icon" onclick="editChapter('${chapter._id}')">✏️</button>
                        <button class="btn-icon" onclick="deleteChapter('${chapter._id}')">🗑️</button>
                    </div>
                </div>
                <ul class="topics-list">
                    ${renderTopics(chapter)}
                </ul>
                <form class="quick-add-topic-form" onsubmit="addTopicInline(event, '${chapter._id}')">
                    <input type="text" class="form-input" name="topicTitle" placeholder="Add a new topic..." required>
                    <input type="date" class="form-input" name="topicDeadline" required>
                    <button type="submit" class="btn btn-primary btn-add-topic">+</button>
                </form>
            </div>
        `;
        return acc;
    }, '');
}

function renderTopics(chapter) {
    if (!chapter.topics || chapter.topics.length === 0) {
        return '<li class="empty-state-sm">No topics yet.</li>';
    }
    return chapter.topics.reduce((acc, topic) => {
        const isOverdue = !topic.completed && new Date(topic.deadline) < new Date();
        const formattedDeadline = new Date(topic.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        acc += `
            <li class="topic-item ${isOverdue ? 'overdue' : ''}">
                <input type="checkbox" class="topic-item-checkbox" onchange="toggleTopic('${topic._id}')" ${topic.completed ? 'checked' : ''}>
                <div style="flex-grow: 1;">
                    <span class="${topic.completed ? 'completed' : ''}">${topic.title}</span>
                    <div class="topic-item-deadline">Due: ${formattedDeadline} ${isOverdue ? ' (Overdue)' : ''}</div>
                </div>
                <div class="topic-actions">
                    <button class="btn-icon" onclick="editTopic('${topic._id}')" title="Edit Topic">✏️</button>
                    <button class="btn-icon" onclick="deleteTopic('${topic._id}')" title="Delete Topic">🗑️</button>
                </div>
            </li>
        `;
        return acc;
    }, '');
}

async function toggleTopic(topicId) {
    const topic = findTopic(topicId);
    if (!topic) return;

    try {
        const res = await fetch(`${API_BASE}/syllabus/topics/${topicId}/toggle`, {
            method: 'PATCH'
        });
        if (!res.ok) throw new Error('Failed to update topic status');
        await loadData();
        renderAll();
    } catch (e) {
        showAlert(e.message, 'danger');
    }
}

window.addTopicInline = async function(event, chapterId) {
    event.preventDefault();
    const form = event.target;
    const title = form.elements.topicTitle.value;
    const deadline = form.elements.topicDeadline.value;

    if (!title || !deadline) {
        showAlert('Please provide a title and a deadline for the topic.', 'danger');
        return;
    }

    const topicData = { title, deadline, chapter: chapterId };

    try {
        const response = await fetch(`${API_BASE}/syllabus/topics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(topicData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save topic.');
        }

        form.reset();
        await loadData();
        renderAll();
        showAlert('Topic added successfully!', 'success');
    } catch (e) {
        showAlert(e.message, 'danger');
    }
};

window.addChapter = (subjectId) => {
    editMode = null;
    document.querySelector('#chapterModal .modal-title').textContent = 'Add New Chapter';
    document.getElementById('chapterForm').reset();
    document.getElementById('chapterSubjectId').value = subjectId;
    openModal('chapterModal');
};

window.editChapter = (chapterId) => {
    const chapter = findChapter(chapterId);
    if (!chapter) return;
    editMode = { type: 'chapter', id: chapterId };
    document.querySelector('#chapterModal .modal-title').textContent = 'Edit Chapter';
    document.getElementById('chapterForm').reset();
    document.getElementById('chapterTitle').value = chapter.title;
    document.getElementById('chapterNumber').value = chapter.number;
    document.getElementById('chapterDeadline').value = chapter.deadline ? chapter.deadline.split('T')[0] : '';
    document.getElementById('chapterDescription').value = chapter.description || '';
    document.getElementById('chapterSubjectId').value = chapter.subject;
    openModal('chapterModal');
}

window.deleteChapter = async(chapterId) => {
    if (!confirm('Delete this chapter and all its topics?')) return;
    try {
        await fetch(`${API_BASE}/syllabus/chapters/${chapterId}`, { method: 'DELETE' });
        await loadData();
        renderSyllabusDrilldown();
        await loadTasks(); // Refresh the task list
        renderAll();
        // Removed showAlert for chapter deleted
    } catch (e) {
        showAlert(e.message, 'danger');
    }
}

window.addTopic = (chapterId) => {
    editMode = null;
    document.querySelector('#topicModal .modal-title').textContent = 'Add New Topic';
    document.getElementById('topicForm').reset();
    document.getElementById('topicChapterId').value = chapterId;
    openModal('addTopicModal');
}

window.editTopic = (topicId) => {
    const topic = findTopic(topicId);
    if (!topic) return;
    editMode = { type: 'topic', id: topicId };
    document.querySelector('#topicModal .modal-title').textContent = 'Edit Topic';
    document.getElementById('topicForm').reset();
    document.getElementById('topicTitle').value = topic.title;
    document.getElementById('topicDeadline').value = topic.deadline ? topic.deadline.split('T')[0] : '';
    document.getElementById('topicNotes').value = topic.notes || '';
    document.getElementById('topicChapterId').value = topic.chapter;
    openModal('topicModal');
}

window.deleteTopic = async (topicId) => {
    if (!confirm('Delete this topic?')) return;
    try {
        await fetch(`${API_BASE}/syllabus/topics/${topicId}`, { method: 'DELETE' });
        await loadData();
        renderSyllabusDrilldown();
        await loadTasks(); // Refresh the task list
        renderAll();
        showAlert('Topic deleted!', 'success');
    } catch (e) {
        showAlert(e.message, 'danger');
    }
}

function findChapter(chapterId) {
    for (const subject of state.subjects) {
        const chapter = subject.chapters.find(c => c._id === chapterId);
        if (chapter) return chapter;
    }
    return null;
}

function findTopic(topicId) {
    for (const subject of state.subjects) {
        for (const chapter of subject.chapters) {
            const topic = chapter.topics.find(t => t._id === topicId);
            if (topic) return { subject, chapter, topic };
        }
    }
    return {};
}

window.toggleDashboardDetails = function(element) {
    const details = element.nextElementSibling;
    if (details.style.display === 'none') {
        details.style.display = 'block';
        element.classList.add('active');
    } else {
        details.style.display = 'none';
        element.classList.remove('active');
    }
}

// Dashboard Update
function updateDashboard() {
    const totalSubjectsEl = document.getElementById('totalSubjects');
    const totalChaptersEl = document.getElementById('totalChapters');
    const totalTopicsEl = document.getElementById('totalTopics');
    const completedTopicsEl = document.getElementById('completedTopics');
    const overallProgressEl = document.getElementById('overallProgress');
    const overallProgressBarEl = document.getElementById('overallProgressBar');
    const overviewContainer = document.getElementById('dashboard-overview');
    const lastUpdatedEl = document.getElementById('dashboard-last-updated');

    let totalChapters = 0;
    let totalTopics = 0;
    let completedTopics = 0;

    state.subjects.forEach(subject => {
        totalChapters += subject.chapters.length;
        subject.chapters.forEach(chapter => {
            totalTopics += chapter.topics.length;
            completedTopics += chapter.topics.filter(t => t.completed).length;
        });
    });

    const overallProgress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

    // Animate stat changes
    function animateStat(el, newValue) {
        if (!el) return;
        if (el.textContent != newValue) {
            el.classList.add('dashboard-animate');
            setTimeout(() => el.classList.remove('dashboard-animate'), 700);
        }
        el.textContent = newValue;
    }
    
    // Update stats with null checks
    animateStat(totalSubjectsEl, state.subjects.length);
    animateStat(totalChaptersEl, totalChapters);
    animateStat(totalTopicsEl, totalTopics);
    animateStat(completedTopicsEl, completedTopics);
    animateStat(overallProgressEl, `${Math.round(overallProgress)}%`);
    
    // Update progress bar
    if (overallProgressBarEl) {
        overallProgressBarEl.style.width = `${overallProgress}%`;
    }

    // Update last updated timestamp
    if (lastUpdatedEl) {
        const now = new Date();
        lastUpdatedEl.textContent = `Last updated: ${now.toLocaleString()}`;
    }

    // Only update overview if container exists
    if (!overviewContainer) return;

    // Group subjects by class
    const groupedByClass = {};
    state.subjects.forEach(subject => {
        const className = subject.class?.name || 'Unassigned';
        if (!groupedByClass[className]) groupedByClass[className] = [];
        groupedByClass[className].push(subject);
    });

    overviewContainer.innerHTML = '';
    // Top 3 subjects by progress
    const topSubjects = [...state.subjects]
        .sort((a, b) => {
            const aTotal = a.chapters.reduce((sum, c) => sum + c.topics.length, 0);
            const aCompleted = a.chapters.reduce((sum, c) => sum + c.topics.filter(t => t.completed).length, 0);
            const aProgress = aTotal > 0 ? aCompleted / aTotal : 0;
            const bTotal = b.chapters.reduce((sum, c) => sum + c.topics.length, 0);
            const bCompleted = b.chapters.reduce((sum, c) => sum + c.topics.filter(t => t.completed).length, 0);
            const bProgress = bTotal > 0 ? bCompleted / bTotal : 0;
            return bProgress - aProgress;
        })
        .slice(0, 3);
    const topGrid = document.createElement('div');
    topGrid.className = 'grid-container';
    topSubjects.forEach(subject => {
        const totalTopics = subject.chapters.reduce((sum, chap) => sum + chap.topics.length, 0);
        const completedTopics = subject.chapters.reduce((sum, chap) => sum + chap.topics.filter(t => t.completed).length, 0);
        const progress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
        const progressColor = progress >= 80 ? 'high' : progress >= 40 ? 'medium' : 'low';
        const groupEl = document.createElement('div');
        groupEl.className = 'dashboard-subject-group';
        groupEl.innerHTML = `
            <div class="dashboard-summary-card">
                <div class="dashboard-summary-title">${subject.name}</div>
                <div class="progress-bar-container">
                    <div class="progress-bar ${progressColor}" style="width: ${progress}%"></div>
                </div>
                <div class="dashboard-summary-classes">${subject.class?.name || 'Unassigned'}</div>
            </div>
        `;
        topGrid.appendChild(groupEl);
    });
    overviewContainer.appendChild(topGrid);
    // Show All button
    if (state.subjects.length > 3) {
        const showAllBtn = document.createElement('button');
        showAllBtn.className = 'btn btn-secondary btn-sm';
        showAllBtn.textContent = 'Show All';
        let expanded = false;
        let allGroupsEl = null;
        showAllBtn.onclick = () => {
            expanded = !expanded;
            showAllBtn.textContent = expanded ? 'Hide All' : 'Show All';
            if (expanded) {
                allGroupsEl = renderClassAccordion(groupedByClass);
                overviewContainer.appendChild(allGroupsEl);
            } else if (allGroupsEl) {
                overviewContainer.removeChild(allGroupsEl);
            }
        };
        overviewContainer.appendChild(showAllBtn);
    }
}

function renderClassAccordion(groupedByClass) {
    const container = document.createElement('div');
    container.className = 'accordion-container';
    let openGroup = null;
    Object.entries(groupedByClass).forEach(([className, subjects], idx) => {
        const groupEl = document.createElement('div');
        groupEl.className = 'dashboard-subject-group';
        const header = document.createElement('div');
        header.className = 'dashboard-summary-card';
        header.innerHTML = `<div class="dashboard-summary-title">${className}</div>`;
        const details = document.createElement('div');
        details.className = 'dashboard-details';
        details.style.display = 'none';
        subjects.forEach(subject => {
            const totalTopics = subject.chapters.reduce((sum, chap) => sum + chap.topics.length, 0);
            const completedTopics = subject.chapters.reduce((sum, chap) => sum + chap.topics.filter(t => t.completed).length, 0);
            const progress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
            const progressColor = progress >= 80 ? 'high' : progress >= 40 ? 'medium' : 'low';
            const detailItem = document.createElement('div');
            detailItem.className = 'dashboard-detail-item';
            detailItem.innerHTML = `
                <div class="dashboard-detail-class">${subject.name} (Code: ${subject.code})</div>
                <div class="progress-bar-container">
                    <div class="progress-bar ${progressColor}" style="width: ${progress}%"></div>
                </div>
                <div class="progress-text">${Math.round(progress)}%</div>
            `;
            details.appendChild(detailItem);
        });
        header.onclick = () => {
            if (openGroup && openGroup !== details) {
                openGroup.style.display = 'none';
                if (openGroup.previousElementSibling) {
                    openGroup.previousElementSibling.classList.remove('active');
                }
            }
            if (details.style.display === 'none') {
                details.style.display = 'block';
                header.classList.add('active');
                openGroup = details;
            } else {
                details.style.display = 'none';
                header.classList.remove('active');
                openGroup = null;
            }
        };
        groupEl.appendChild(header);
        groupEl.appendChild(details);
        container.appendChild(groupEl);
    });
    return container;
}

// Progress View
function renderProgressView() {
    const progressView = document.getElementById('progressView');
    if (!progressView) return;
    progressView.innerHTML = '';

    if (state.subjects.length === 0) {
        progressView.innerHTML = `<div class="empty-state">
            <div class="empty-state-icon">📈</div>
            <h3>No progress data available</h3>
            <p>Add subjects and chapters to see progress tracking</p>
        </div>`;
        return;
    }

    const list = document.createElement('div');
    list.className = 'progress-list';

    state.subjects.forEach(subject => {
        const totalTopics = subject.chapters.reduce((sum, chap) => sum + chap.topics.length, 0);
        const completedTopics = subject.chapters.reduce((sum, chap) => sum + chap.topics.filter(t => t.completed).length, 0);
        const progress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
        const progressColor = progress >= 80 ? 'high' : progress >= 40 ? 'medium' : 'low';

        const item = document.createElement('div');
        item.className = 'progress-view-item';

        item.innerHTML = `
            <div class="progress-item-title">
                ${subject.name}
                <span class="class-tag">${subject.class && subject.class.name ? subject.class.name : ''}</span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar ${progressColor}" style="width: ${progress}%"></div>
            </div>
            <div class="progress-text">${completedTopics} / ${totalTopics} Topics Completed (${Math.round(progress)}%)</div>
            <div class="progress-item-stats">
                Due: ${subject.deadline ? new Date(subject.deadline).toLocaleDateString() : ''}
            </div>
        `;
        list.appendChild(item);
    });

    progressView.appendChild(list);
}

// Alert utility
function showAlert(message, type = 'info') {
    const container = document.getElementById('alert-container');
    if(!container) return;
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    container.appendChild(alert);
    
    // Animate out
    setTimeout(() => {
        alert.classList.add('fade-out');
        alert.addEventListener('transitionend', () => alert.remove());
    }, 3000);
}

// Close modals when clicking outside
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal(modal.id);
        }
    });
});

// --- Daily Tasks Management ---
let tasks = [];

async function loadTasks() {
    const taskList = document.getElementById('task-list');
    if (!taskList) return;
    
    const dateInput = document.getElementById('taskDate');
    const selectedDate = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
    
    try {
        const response = await fetch(`${API_BASE}/tasks?date=${selectedDate}`);
        if (!response.ok) throw new Error('Failed to load tasks');
        tasks = await response.json();
        renderTasks();
    } catch (error) {
        showAlert('Failed to load tasks: ' + error.message, 'danger');
        tasks = [];
        renderTasks();
    }
}

function renderTasks() {
    const taskList = document.getElementById('task-list');
    if (!taskList) return;
    
    if (tasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h3>No tasks for selected date</h3>
                <p>Click "Generate Tasks" to create daily tasks from your syllabus</p>
            </div>`;
        return;
    }
    
    const container = document.createElement('div');
    container.className = 'task-list';
    
    tasks.forEach(task => {
        // Check if task is overdue based on notes (which contain deadline info)
        const isOverdue = checkIfTaskIsOverdue(task);
        
        const taskCard = document.createElement('div');
        taskCard.className = `task-card ${task.completed ? 'completed' : ''} priority-${task.priority} ${isOverdue ? 'overdue' : ''}`;
        taskCard.innerHTML = `
            <div class="task-header">
                <div class="task-info">
                    <h4>${task.title} ${isOverdue ? '⚠️' : ''}</h4>
                    <div class="task-meta">
                        <span class="task-subject">${task.subject ? task.subject.name : 'Unknown Subject'}</span>
                        <span class="task-class">${task.class ? task.class.name : 'Unknown Class'}</span>
                        <span class="task-priority priority-${task.priority}">${task.priority}</span>
                        ${isOverdue ? '<span class="task-overdue-badge">OVERDUE</span>' : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn-icon" onclick="toggleTaskComplete('${task._id}')" title="${task.completed ? 'Mark Incomplete' : 'Mark Complete'}">
                        ${task.completed ? '✅' : '⭕'}
                    </button>
                    <button class="btn-icon" onclick="addTaskNote('${task._id}')" title="Add Note">📝</button>
                </div>
            </div>
            ${task.notes ? `<div class="task-notes">📝 ${task.notes}</div>` : ''}
        `;
        container.appendChild(taskCard);
    });
    
    taskList.innerHTML = '';
    taskList.appendChild(container);
}

function checkIfTaskIsOverdue(task) {
    // Extract deadline from task notes (format: "Deadline: MM/DD/YYYY")
    if (task.notes && task.notes.includes('Deadline:')) {
        const deadlineMatch = task.notes.match(/Deadline:\s*([^\s]+)/);
        if (deadlineMatch) {
            const deadlineDate = new Date(deadlineMatch[1]);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            deadlineDate.setHours(0, 0, 0, 0);
            
            return deadlineDate < today;
        }
    }
    return false;
}

window.generateDailyTasks = async function() {
    try {
        const startDate = document.getElementById('taskStartDate').value;
        const endDate = document.getElementById('taskEndDate').value;
        const taskType = document.getElementById('taskType').value;

        if (!startDate || !endDate) {
            showAlert('Please select both start and end dates', 'error');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            showAlert('Start date must be before end date', 'error');
            return;
        }

        showAlert('Generating tasks for next incomplete topics...', 'info');

        const response = await fetch(`${API_BASE}/tasks/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startDate, endDate, type: taskType })
        });

        if (response.ok) {
            const result = await response.json();
            showAlert(result.message, 'success');
            if (result.overdueCount > 0) {
                showOverdueTopicsAlert(result.overdueTopics, result.overdueCount);
            }
            closeModal('generateTasksModal');
            loadTasks();
        } else {
            const error = await response.json();
            showAlert(error.message || 'Failed to generate tasks', 'danger');
        }
    } catch (e) {
        showAlert(e.message, 'danger');
    }
};

function showOverdueTopicsAlert(overdueTopics, count) {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;
    
    const overdueAlert = document.createElement('div');
    overdueAlert.className = 'alert alert-warning overdue-alert';
    overdueAlert.innerHTML = `
        <div class="overdue-header">
            <span class="overdue-icon">⚠️</span>
            <strong>${count} Overdue Topic${count > 1 ? 's' : ''} Found!</strong>
            <button class="alert-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
        <div class="overdue-list">
            ${overdueTopics.map(topic => `
                <div class="overdue-item">
                    <div class="overdue-subject">${topic.subject} (${topic.class})</div>
                    <div class="overdue-topic">${topic.topic}</div>
                    <div class="overdue-deadline">
                        <span class="overdue-days">${topic.daysOverdue} day${topic.daysOverdue > 1 ? 's' : ''} overdue</span>
                        <span class="overdue-date">Due: ${new Date(topic.deadline).toLocaleDateString()}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    alertContainer.appendChild(overdueAlert);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (overdueAlert.parentElement) {
            overdueAlert.remove();
        }
    }, 10000);
}

window.toggleTaskComplete = async function(taskId) {
    try {
        const response = await fetch(`${API_BASE}/tasks/${taskId}/complete`, { method: 'PATCH' });
        if (!response.ok) throw new Error('Failed to update task');
        await loadTasks();
        renderAll();
    } catch (error) {
        showAlert('Failed to update task: ' + error.message, 'danger');
    }
};

window.addTaskNote = async function(taskId) {
    const note = prompt('Enter a note for this task:');
    if (!note) return;
    
    try {
        const response = await fetch(`${API_BASE}/tasks/${taskId}/note`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes: note })
        });
        if (!response.ok) throw new Error('Failed to add note');
        await loadTasks();
        showAlert('Note added successfully!', 'success');
    } catch (error) {
        showAlert('Failed to add note: ' + error.message, 'danger');
    }
};

// --- Reports Management ---
async function loadReports() {
    const reportContent = document.getElementById('report-content');
    if (!reportContent) return;
    
    reportContent.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">📊</div>
            <h3>No reports generated yet</h3>
            <p>Click "Weekly Report" or "Monthly Report" to generate analytics</p>
        </div>`;
}

window.generateWeeklyReport = async function() {
    try {
        const response = await fetch(`${API_BASE}/reports/weekly`);
        if (!response.ok) throw new Error('Failed to generate weekly report');
        const report = await response.json();
        renderWeeklyReport(report);
    } catch (error) {
        showAlert('Failed to generate weekly report: ' + error.message, 'danger');
    }
};

window.generateMonthlyReport = async function() {
    try {
        const response = await fetch(`${API_BASE}/reports/monthly`);
        if (!response.ok) throw new Error('Failed to generate monthly report');
        const report = await response.json();
        renderMonthlyReport(report);
    } catch (error) {
        showAlert('Failed to generate monthly report: ' + error.message, 'danger');
    }
};

function renderWeeklyReport(report) {
    const reportContent = document.getElementById('report-content');
    if (!reportContent) return;
    
    reportContent.innerHTML = `
        <div class="report-header">
            <h3>📅 Weekly Report</h3>
            <p>Generated: ${new Date(report.generatedAt).toLocaleString()}</p>
            <p>Week: ${new Date(report.week.start).toLocaleDateString()} - ${new Date(report.week.end).toLocaleDateString()}</p>
        </div>
        
        <div class="report-section">
            <h4>👨‍🏫 Teacher Progress</h4>
            <div class="report-grid">
                ${(report.teacherProgress || []).map(t => `
                    <div class="report-card">
                        <h5>${t.teacherName || 'Unknown Teacher'}</h5>
                        <div class="progress-bar-container">
                            <div class="progress-bar ${(t.avgCompletion || 0) >= 80 ? 'high' : (t.avgCompletion || 0) >= 40 ? 'medium' : 'low'}" style="width: ${t.avgCompletion || 0}%"></div>
                        </div>
                        <p>${Math.round(t.avgCompletion || 0)}% completion</p>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="report-section">
            <h4>📚 Topics Overview</h4>
            <div class="report-stats">
                <div class="stat-item">
                    <span class="stat-value">${report.topics?.covered || 0}</span>
                    <span class="stat-label">Topics Covered</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${report.topics?.planned || 0}</span>
                    <span class="stat-label">Topics Planned</span>
                </div>
            </div>
        </div>
        
        <div class="report-section">
            <h4>🏫 Class Progress</h4>
            <div class="report-grid">
                ${(report.classProgress || []).map(c => `
                    <div class="report-card">
                        <h5>${c.className || 'Unknown Class'}</h5>
                        <div class="progress-bar-container">
                            <div class="progress-bar ${(c.avgCompletion || 0) >= 80 ? 'high' : (c.avgCompletion || 0) >= 40 ? 'medium' : 'low'}" style="width: ${c.avgCompletion || 0}%"></div>
                        </div>
                        <p>${Math.round(c.avgCompletion || 0)}% completion</p>
                    </div>
                `).join('')}
            </div>
        </div>
        
        ${(report.upcomingDeadlines || []).length > 0 ? `
            <div class="report-section">
                <h4>⚠️ Upcoming Deadlines</h4>
                <div class="deadline-list">
                    ${report.upcomingDeadlines.map(d => `
                        <div class="deadline-item">
                            <strong>${d.title}</strong>
                            <span class="deadline-date">Due: ${new Date(d.deadline).toLocaleDateString()}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;
}

function renderMonthlyReport(report) {
    const reportContent = document.getElementById('report-content');
    if (!reportContent) return;
    
    reportContent.innerHTML = `
        <div class="report-header">
            <h3>📊 Monthly Report</h3>
            <p>Generated: ${new Date(report.generatedAt).toLocaleString()}</p>
            <p>Month: ${new Date(report.month.start).toLocaleDateString()} - ${new Date(report.month.end).toLocaleDateString()}</p>
        </div>
        
        <div class="report-section">
            <h4>🏢 Department Analytics</h4>
            <div class="report-grid">
                ${(report.departmentAnalytics || []).map(d => `
                    <div class="report-card">
                        <h5>${d._id || 'Unknown Department'}</h5>
                        <div class="progress-bar-container">
                            <div class="progress-bar ${(d.avgProgress || 0) >= 80 ? 'high' : (d.avgProgress || 0) >= 40 ? 'medium' : 'low'}" style="width: ${d.avgProgress || 0}%"></div>
                        </div>
                        <p>${Math.round(d.avgProgress || 0)}% completion</p>
                        <p>${d.totalSubjects || 0} subjects, ${d.subjectsBehind || 0} behind</p>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="report-section">
            <h4>👨‍🏫 Teacher Performance</h4>
            <div class="report-grid">
                ${(report.teacherPerformance || []).map(t => `
                    <div class="report-card">
                        <h5>${t.teacherName || 'Unknown Teacher'}</h5>
                        <div class="progress-bar-container">
                            <div class="progress-bar ${(t.avgCompletion || 0) >= 80 ? 'high' : (t.avgCompletion || 0) >= 40 ? 'medium' : 'low'}" style="width: ${t.avgCompletion || 0}%"></div>
                        </div>
                        <p>${Math.round(t.avgCompletion || 0)}% completion</p>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="report-section">
            <h4>📈 Completion Projections</h4>
            <div class="projection-list">
                ${(report.projections || []).map(p => `
                    <div class="projection-item">
                        <strong>${p.subject || 'Unknown Subject'}</strong> (${p.class || 'No Class'})
                        <div class="projection-details">
                            <span>Current: ${Math.round(p.currentCompletion || 0)}%</span>
                            ${p.projectedCompletionDate ? `<span>Projected: ${new Date(p.projectedCompletionDate).toLocaleDateString()}</span>` : '<span>No projection available</span>'}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="report-section">
            <h4>⚠️ Areas Needing Attention</h4>
            <div class="attention-grid">
                <div class="attention-section">
                    <h5>Low Progress Subjects</h5>
                    ${(report.areasNeedingAttention?.lowProgressSubjects || []).map(s => `
                        <div class="attention-item">
                            <strong>${s.subject || 'Unknown Subject'}</strong> (${s.code || 'No Code'}) - ${s.department || 'No Department'}
                            <span class="progress-text">${Math.round(s.percentageComplete || 0)}%</span>
                        </div>
                    `).join('')}
                </div>
                <div class="attention-section">
                    <h5>Overdue Topics</h5>
                    ${(report.areasNeedingAttention?.overdueTopics || []).map(t => `
                        <div class="attention-item">
                            <strong>${t.title}</strong>
                            <span class="overdue-date">Due: ${new Date(t.deadline).toLocaleDateString()}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

window.downloadWeeklyPDF = async function() {
    try {
        showAlert('Generating weekly PDF report...', 'info');
        
        const response = await fetch(`${API_BASE}/pdf/weekly`);
        if (!response.ok) throw new Error('Failed to generate PDF');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'weekly-syllabus-report.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showAlert('Weekly PDF report downloaded successfully!', 'success');
    } catch (error) {
        showAlert('Failed to download PDF: ' + error.message, 'error');
        console.error('Error:', error);
    }
};

window.downloadMonthlyPDF = async function() {
    try {
        showAlert('Generating monthly PDF report...', 'info');
        
        const response = await fetch(`${API_BASE}/pdf/monthly`);
        if (!response.ok) throw new Error('Failed to generate PDF');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'monthly-syllabus-report.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showAlert('Monthly PDF report downloaded successfully!', 'success');
    } catch (error) {
        showAlert('Failed to download PDF: ' + error.message, 'error');
        console.error('Error:', error);
    }
};

window.downloadDailyTaskPDF = async function() {
    try {
        const dateInput = document.getElementById('taskDate');
        const selectedDate = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
        
        if (!selectedDate) {
            showAlert('Please select a date first', 'error');
            return;
        }
        
        showAlert('Generating daily task PDF report...', 'info');
        
        const response = await fetch(`${API_BASE}/pdf/daily-tasks?date=${selectedDate}`);
        if (!response.ok) throw new Error('Failed to generate PDF');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `daily-tasks-${selectedDate}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showAlert('Daily task PDF report downloaded successfully!', 'success');
    } catch (error) {
        showAlert('Failed to download PDF: ' + error.message, 'error');
        console.error('Error:', error);
    }
};

// Utility: Placeholder for unimplemented features
function notImplemented(feature) {
    showAlert(`${feature} is not implemented yet.`, 'info');
}

// Attach event listeners for all static buttons after DOM is loaded
function setupStaticButtonListeners() {
    // Edit KPIs
    document.querySelectorAll('.btn-secondary.btn-sm').forEach(btn => {
        if (btn.textContent.includes('Edit KPIs')) {
            btn.onclick = () => notImplemented('Edit KPIs');
        }
        if (btn.textContent.includes('View Details')) {
            btn.onclick = () => notImplemented('View Details');
        }
    });
    // Quick Action
    const quickActionBtn = document.querySelector('button[onclick*="openModal(\'quickActionModal\')"]');
    if (quickActionBtn) quickActionBtn.onclick = () => notImplemented('Quick Action Modal');
    // Save Template
    document.querySelectorAll('.btn-secondary').forEach(btn => {
        if (btn.textContent.includes('Save Template')) {
            btn.onclick = () => notImplemented('Save Template');
        }
    });
    // Generate Report
    document.querySelectorAll('.btn-primary').forEach(btn => {
        if (btn.textContent.includes('Generate Report')) {
            btn.onclick = () => notImplemented('Generate Report');
        }
    });
    // View All (Recent Activity)
    document.querySelectorAll('.card-header .btn.btn-secondary.btn-sm').forEach(btn => {
        if (btn.textContent.includes('View All')) {
            btn.onclick = () => notImplemented('View All Activity');
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    setupStaticButtonListeners();
});

// Render KPIs and topics grouped by class and subject
function renderSubjectsKPIList() {
    const container = document.getElementById('subject-list');
    if (!container) return;
    container.innerHTML = '';
    if (!state.classes.length) {
        container.innerHTML = '<div class="empty-state">No classes found.</div>';
        return;
    }
    state.classes.forEach(cls => {
        // Class-level KPIs (collective for all subjects in this class)
        const classKPIs = state.kpis ? state.kpis.filter(k => k.class === cls.id || k.class === cls._id) : [];
        const achievedCount = classKPIs.filter(k => k.achieved).length;
        const kpiStatus = achievedCount === classKPIs.length ? 'achieved' : achievedCount > 0 ? 'pending' : 'failed';
        const classCard = document.createElement('div');
        classCard.className = 'kpi-card kpi-class-card';
        classCard.innerHTML = `
            <div class="kpi-header kpi-class-header" style="cursor:pointer;" onclick="toggleClassKPIExpand('${cls.id || cls._id}')">
                <h4 class="kpi-title">${cls.name} (Class KPI)</h4>
                <div class="kpi-status ${kpiStatus}">
                    ${kpiStatus === 'achieved' ? '✓' : kpiStatus === 'pending' ? '⏱' : '✗'}
                </div>
            </div>
            <div class="kpi-items kpi-class-items" id="kpi-class-items-${cls.id || cls._id}" style="display:none;"></div>
        `;
        container.appendChild(classCard);
    });
}

window.toggleClassKPIExpand = function(classId) {
    const items = document.getElementById(`kpi-class-items-${classId}`);
    if (!items) return;
    if (items.style.display === 'none' || items.style.display === '') {
        // Render subject-wise KPIs for this class
        const subjects = state.subjects.filter(s => s.class === classId || (s.class && (s.class._id === classId || s.class.id === classId)));
        items.innerHTML = '';
        if (!subjects.length) {
            items.innerHTML = '<div class="empty-state-sm">No subjects found for this class.</div>';
        } else {
            subjects.forEach(subject => {
                const subjectKPIs = state.kpis ? state.kpis.filter(k => k.subject === subject.id || k.subject === subject._id) : [];
                const achievedCount = subjectKPIs.filter(k => k.achieved).length;
                const kpiStatus = achievedCount === subjectKPIs.length ? 'achieved' : achievedCount > 0 ? 'pending' : 'failed';
                const subjectBlock = document.createElement('div');
                subjectBlock.className = 'kpi-card kpi-subject-card';
                subjectBlock.innerHTML = `
                    <div class="kpi-header kpi-subject-header">
                        <h5 class="kpi-title">${subject.name}</h5>
                        <div class="kpi-status ${kpiStatus}">
                            ${kpiStatus === 'achieved' ? '✓' : kpiStatus === 'pending' ? '⏱' : '✗'}
                        </div>
                    </div>
                    <div class="kpi-items">
                        ${subjectKPIs.map(kpi => `
                            <div class="kpi-item">
                                <input type="checkbox" class="kpi-checkbox" 
                                       ${kpi.achieved ? 'checked' : ''} 
                                       onchange="updateKPI('${kpi.id}', this.checked)">
                                <span class="kpi-label">${kpi.title} (${kpi.current}/${kpi.target})</span>
                            </div>
                        `).join('')}
                    </div>
                `;
                items.appendChild(subjectBlock);
            });
        }
        items.style.display = 'block';
    } else {
        items.style.display = 'none';
    }
};

// KPI logic
window.addKPI = function(subjectId) {
    const subject = state.subjects.find(s => s._id === subjectId);
    if (!subject.kpis) subject.kpis = [];
    subject.kpis.push({ label: 'New KPI', achieved: false });
    renderSubjectsKPIList();
    saveKPIs(subjectId);
};
window.deleteKPI = function(subjectId, idx) {
    const subject = state.subjects.find(s => s._id === subjectId);
    if (!subject.kpis) return;
    subject.kpis.splice(idx, 1);
    renderSubjectsKPIList();
    saveKPIs(subjectId);
};
window.toggleKPI = function(subjectId, idx) {
    const subject = state.subjects.find(s => s._id === subjectId);
    if (!subject.kpis) return;
    subject.kpis[idx].achieved = !subject.kpis[idx].achieved;
    renderSubjectsKPIList();
    saveKPIs(subjectId);
};
window.updateKPI = function(subjectId, idx, label) {
    const subject = state.subjects.find(s => s._id === subjectId);
    if (!subject.kpis) return;
    subject.kpis[idx].label = label;
    saveKPIs(subjectId);
};
function saveKPIs(subjectId) {
    const subject = state.subjects.find(s => s._id === subjectId);
    fetch(`${API_BASE}/syllabus/subjects/${subjectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kpis: subject.kpis })
    }).then(() => loadData());
}
window.editKPIs = function(subjectId) {
    // Focus the first KPI label for editing
    setTimeout(() => {
        const el = document.querySelector(`#kpi-items-${subjectId} .kpi-label`);
        if (el) el.focus();
    }, 100);
};

// Topic/task completion logic
window.toggleTopicComplete = async function(topicId) {
    await fetch(`${API_BASE}/syllabus/topics/${topicId}/toggle`, { method: 'PATCH' });
    await loadData();
    renderAll();
};

// Render tasks grouped by class and subject (interactive)
function renderTasksGrouped() {
    const container = document.getElementById('task-list');
    if (!container) return;
    container.innerHTML = '';
    if (!state.classes.length) {
        container.innerHTML = '<div class="empty-state">No classes found.</div>';
        return;
    }
    state.classes.forEach(cls => {
        const classTasks = state.tasks.filter(task => task.class && task.class._id === cls._id);
        if (!classTasks.length) return;
        const classBlock = document.createElement('div');
        classBlock.className = 'class-block';
        classBlock.innerHTML = `<h4>${cls.name}</h4>`;
        // Group tasks by subject
        const subjectsInClass = {};
        classTasks.forEach(task => {
            if (!task.subject || !task.subject._id) return;
            if (!subjectsInClass[task.subject._id]) {
                subjectsInClass[task.subject._id] = { subject: task.subject, tasks: [] };
            }
            subjectsInClass[task.subject._id].tasks.push(task);
        });
        Object.values(subjectsInClass).forEach(({ subject, tasks }) => {
            const subjectBlock = document.createElement('div');
            subjectBlock.className = 'subject-block';
            subjectBlock.innerHTML = `<div class="kpi-title">${subject.name} (${subject.code || ''})</div>`;
            const taskList = document.createElement('ul');
            taskList.className = 'tasks-list';
            tasks.forEach(task => {
                const isOverdue = checkIfTaskIsOverdue(task);
                const li = document.createElement('li');
                li.className = `task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`;
                li.innerHTML = `
                    <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTaskComplete('${task._id}')">
                    <span>${task.title}</span>
                    <span class="task-deadline">(Due: ${task.notes ? task.notes.replace('Deadline: ', '') : 'N/A'})</span>
                    <span class="task-priority">[${task.priority}]</span>
                    <button class="btn btn-secondary btn-sm" onclick="editTaskNote('${task._id}', '${task.notes ? task.notes.replace(/'/g, "\\'") : ''}')">📝 Note</button>
                `;
                taskList.appendChild(li);
            });
            subjectBlock.appendChild(taskList);
            classBlock.appendChild(subjectBlock);
        });
        container.appendChild(classBlock);
    });
}

window.editTaskNote = function(taskId, currentNote) {
    const note = prompt('Edit note for this task:', currentNote || '');
    if (note === null) return;
    fetch(`${API_BASE}/tasks/${taskId}/note`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: note })
    }).then(() => {
        showAlert('Note updated!', 'success');
        loadTasks();
    });
};

// --- Modal Openers for Add Buttons ---
window.openAddClassModal = function() {
    document.getElementById('classForm').reset();
    editMode = { type: 'class' };
    openModal('addClassModal');
};
window.openAddSubjectModal = function(classId = null) {
    document.getElementById('subjectForm').reset();
    editMode = { type: 'subject' };
    populateClassDropdown(classId);
    openModal('addSubjectModal');
};
window.openAddChapterModal = function(subjectId) {
    document.getElementById('chapterForm').reset();
    editMode = { type: 'chapter', subjectId };
    document.getElementById('chapterSubjectId').value = subjectId;
    openModal('addChapterModal');
};
window.openAddTopicModal = function(chapterId) {
    document.getElementById('topicForm').reset();
    editMode = { type: 'topic', chapterId };
    document.getElementById('topicChapterId').value = chapterId;
    openModal('addTopicModal');
};

// --- Task Tabs Logic ---
function showTaskTab(tab) {
    document.querySelectorAll('.task-list-tab').forEach(el => el.style.display = 'none');
    document.getElementById(`task-list-${tab}`).style.display = 'block';
    document.querySelectorAll('#tasks-page .tab-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`#tasks-page .tab-item[onclick*="${tab}"]`).classList.add('active');
}

function renderTasks() {
    // Filter tasks by type (assuming tasks have a 'type' property: 'daily', 'weekly', 'monthly')
    ['daily', 'weekly', 'monthly'].forEach(type => {
        const container = document.getElementById(`task-list-${type}`);
        if (!container) return;
        const filtered = state.tasks.filter(t => t.type === type);
        if (!filtered.length) {
            container.innerHTML = `<div class="empty-state">No ${type} tasks found.</div>`;
            return;
        }
        container.innerHTML = filtered.map(task => `
            <div class="task-item${task.completed ? ' completed' : ''}">
                <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTaskComplete('${task.id}')">
                <span>${task.title}</span>
                <span class="task-deadline">(Due: ${task.due || 'N/A'})</span>
            </div>
        `).join('');
    });
}

// --- KPI Section: Classes Only ---
function renderKPISection() {
    const container = document.getElementById('subjects-kpi-list');
    if (!container) return;
    container.innerHTML = '';
    if (!state.classes.length) {
        container.innerHTML = '<div class="empty-state">No classes found.</div>';
        return;
    }
    state.classes.forEach(cls => {
        const classKPIs = state.kpis ? state.kpis.filter(k => k.class === cls.id || k.class === cls._id) : [];
        const achievedCount = classKPIs.filter(k => k.achieved).length;
        const kpiStatus = achievedCount === classKPIs.length ? 'achieved' : 
                         achievedCount > 0 ? 'pending' : 'failed';
        const classBlock = document.createElement('div');
        classBlock.className = 'kpi-card kpi-class-card';
        classBlock.innerHTML = `
            <div class="kpi-header kpi-class-header" style="cursor:pointer;" onclick="toggleClassKPIExpand('${cls.id || cls._id}')">
                <h4 class="kpi-title">${cls.name}</h4>
                <div class="kpi-status ${kpiStatus}">
                    ${kpiStatus === 'achieved' ? '✓' : kpiStatus === 'pending' ? '⏱' : '✗'}
                </div>
            </div>
            <div class="kpi-items kpi-class-items" id="kpi-class-items-${cls.id || cls._id}" style="display:none;"></div>
        `;
        container.appendChild(classBlock);
    });
}

window.toggleClassKPIExpand = function(classId) {
    const items = document.getElementById(`kpi-class-items-${classId}`);
    if (!items) return;
    if (items.style.display === 'none' || items.style.display === '') {
        // Render subject-wise KPIs for this class
        const subjects = state.subjects.filter(s => s.class === classId || (s.class && (s.class._id === classId || s.class.id === classId)));
        items.innerHTML = '';
        if (!subjects.length) {
            items.innerHTML = '<div class="empty-state-sm">No subjects found for this class.</div>';
        } else {
            subjects.forEach(subject => {
                const subjectKPIs = state.kpis ? state.kpis.filter(k => k.subject === subject.id || k.subject === subject._id) : [];
                const achievedCount = subjectKPIs.filter(k => k.achieved).length;
                const kpiStatus = achievedCount === subjectKPIs.length ? 'achieved' : 
                                 achievedCount > 0 ? 'pending' : 'failed';
                const subjectBlock = document.createElement('div');
                subjectBlock.className = 'kpi-card kpi-subject-card';
                subjectBlock.innerHTML = `
                    <div class="kpi-header kpi-subject-header">
                        <h5 class="kpi-title">${subject.name}</h5>
                        <div class="kpi-status ${kpiStatus}">
                            ${kpiStatus === 'achieved' ? '✓' : kpiStatus === 'pending' ? '⏱' : '✗'}
                        </div>
                    </div>
                    <div class="kpi-items">
                        ${subjectKPIs.length ? subjectKPIs.map(kpi => `
                            <div class="kpi-item">
                                <input type="checkbox" class="kpi-checkbox" 
                                       ${kpi.achieved ? 'checked' : ''} 
                                       onchange="updateKPI('${kpi.id}', this.checked)">
                                <span class="kpi-label">${kpi.title} (${kpi.current}/${kpi.target})</span>
                            </div>
                        `).join('') : '<div class="kpi-item">No KPIs for this subject.</div>'}
                    </div>
                `;
                items.appendChild(subjectBlock);
            });
        }
        items.style.display = 'block';
    } else {
        items.style.display = 'none';
    }
};

// --- Subject Progress Section ---
function renderSubjectProgress() {
    const container = document.getElementById('subject-progress-list');
    if (!container) return;
    container.innerHTML = '';
    if (!state.subjects.length) {
        container.innerHTML = '<div class="empty-state">No subjects found.</div>';
        return;
    }
    state.subjects.forEach(subject => {
        const subjectBlock = document.createElement('div');
        subjectBlock.className = 'subject-block';
        subjectBlock.innerHTML = `<h4>${subject.name}</h4>`;
        (subject.chapters || []).forEach(chapter => {
            const chapterBlock = document.createElement('div');
            chapterBlock.className = 'chapter-block';
            chapterBlock.innerHTML = `<strong>Chapter ${chapter.number}: ${chapter.title}</strong>`;
            const topicList = document.createElement('ul');
            topicList.className = 'topics-list';
            (chapter.topics || []).forEach(topic => {
                const li = document.createElement('li');
                li.className = `topic-item${topic.completed ? ' completed' : ''}`;
                li.innerHTML = `
                    <input type="checkbox" ${topic.completed ? 'checked' : ''} onchange="toggleTopicComplete('${topic._id}')">
                    <span>${topic.title}</span>
                    <span class="topic-deadline">(Due: ${topic.deadline ? new Date(topic.deadline).toLocaleDateString() : 'N/A'})</span>
                `;
                topicList.appendChild(li);
            });
            chapterBlock.appendChild(topicList);
            subjectBlock.appendChild(chapterBlock);
        });
        container.appendChild(subjectBlock);
    });
}

// --- App Initialization and Chart Logic ---
async function initializeApp() {
    await loadData();
    renderAll();
    initializeDashboardCharts();
}

function initializeDashboardCharts() {
    // Render dashboard stats
    updateDashboard();
    // Render dashboard progress chart
    if (window.Chart && document.getElementById('progressChart')) {
        const ctx = document.getElementById('progressChart').getContext('2d');
        if (state.charts.progress) state.charts.progress.destroy();
        const labels = (state.progressHistory || []).map(entry => {
            const date = new Date(entry.date);
            return `${date.getDate()}/${date.getMonth() + 1}`;
        });
        state.charts.progress = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Mathematics',
                        data: (state.progressHistory || []).map(entry => entry.mathematics),
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        tension: 0.3
                    },
                    {
                        label: 'Science',
                        data: (state.progressHistory || []).map(entry => entry.science),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.3
                    },
                    {
                        label: 'English',
                        data: (state.progressHistory || []).map(entry => entry.english),
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { callback: (value) => value + '%' }
                    }
                }
            }
        });
    }
    // Department comparison chart
    if (window.Chart && document.getElementById('departmentChart')) {
        const ctx = document.getElementById('departmentChart').getContext('2d');
        if (state.charts.department) state.charts.department.destroy();
        // Group subjects by department
        const departmentProgress = {};
        (state.subjects || []).forEach(subject => {
            if (!departmentProgress[subject.department]) departmentProgress[subject.department] = [];
            departmentProgress[subject.department].push(subject.progress || 0);
        });
        const departmentAverages = {};
        for (const dept in departmentProgress) {
            const avg = departmentProgress[dept].reduce((a, b) => a + b, 0) / departmentProgress[dept].length;
            departmentAverages[dept] = avg;
        }
        state.charts.department = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(departmentAverages),
                datasets: [{
                    label: 'Average Progress %',
                    data: Object.values(departmentAverages),
                    backgroundColor: [
                        '#6366f1', '#8b5cf6', '#10b981', '#f59e0b'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { callback: (value) => value + '%' }
                    }
                }
            }
        });
    }
    // Forecast chart
    if (window.Chart && document.getElementById('forecastChart')) {
        const ctx = document.getElementById('forecastChart').getContext('2d');
        if (state.charts.forecast) state.charts.forecast.destroy();
        // Generate forecast data
        const mathData = (state.progressHistory || []).map(entry => entry.mathematics);
        const forecastData = [];
        const lastValue = mathData[mathData.length - 1] || 0;
        const growthRate = 1.5; // 1.5% per day
        for (let i = 0; i < 14; i++) {
            forecastData.push(Math.min(100, lastValue + (i * growthRate)));
        }
        state.charts.forecast = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [...Array(mathData.length).keys()].map(i => `Day ${i + 1}`).concat(
                    [...Array(14).keys()].map(i => `F ${i + 1}`)
                ),
                datasets: [
                    {
                        label: 'Actual Progress',
                        data: mathData.concat(Array(14).fill(null)),
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        tension: 0.3
                    },
                    {
                        label: 'Forecast',
                        data: [...Array(mathData.length).fill(null)].concat(forecastData),
                        borderColor: '#ef4444',
                        borderDash: [5, 5],
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { callback: (value) => value + '%' }
                    }
                }
            }
        });
    }
}

function initializeAnalyticsCharts() {
    // Comparative analysis chart
    if (window.Chart && document.getElementById('comparativeChart')) {
        const ctx = document.getElementById('comparativeChart').getContext('2d');
        if (state.charts.comparative) state.charts.comparative.destroy();
        state.charts.comparative = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Progress Rate', 'KPI Completion', 'Task Completion', 'Milestone Progress', 'Resource Usage'],
                datasets: [
                    {
                        label: 'Mathematics',
                        data: [85, 75, 90, 60, 80],
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.2)'
                    },
                    {
                        label: 'Science',
                        data: [68, 60, 75, 50, 65],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.2)'
                    },
                    {
                        label: 'English',
                        data: [82, 90, 85, 70, 75],
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.2)'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { display: true },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                }
            }
        });
    }
    // Trend analysis chart
    if (window.Chart && document.getElementById('trendChart')) {
        const ctx = document.getElementById('trendChart').getContext('2d');
        if (state.charts.trend) state.charts.trend.destroy();
        const labels = (state.progressHistory || []).map(entry => {
            const date = new Date(entry.date);
            return `${date.getDate()}/${date.getMonth() + 1}`;
        });
        state.charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Mathematics',
                        data: (state.progressHistory || []).map(entry => entry.mathematics),
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        tension: 0.3
                    },
                    {
                        label: 'Science',
                        data: (state.progressHistory || []).map(entry => entry.science),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.3
                    },
                    {
                        label: 'English',
                        data: (state.progressHistory || []).map(entry => entry.english),
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { callback: (value) => value + '%' }
                    }
                }
            }
        });
    }
}

function renderSyllabusManagementTable() {
    const container = document.getElementById('syllabus-management-table');
    if (!container) return;
    container.innerHTML = '';
    if (!state.subjects.length) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📚</div><h3>No Subjects</h3><p>Click "+ Add Subject" to get started.</p></div>`;
        return;
    }
    let html = `<table class="syllabus-table">
        <thead>
            <tr>
                <th>Subject</th>
                <th>Chapter</th>
                <th>Topic</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>`;
    state.subjects.forEach(subject => {
        if (!subject.chapters || !subject.chapters.length) {
            html += `<tr><td>${subject.name}</td><td colspan="5"><button class="btn btn-secondary btn-sm" onclick="addChapter('${subject._id}')">+ Add Chapter</button></td></tr>`;
            return;
        }
        subject.chapters.forEach(chapter => {
            if (!chapter.topics || !chapter.topics.length) {
                html += `<tr><td>${subject.name}</td><td>${chapter.title}</td><td colspan="4"><button class="btn btn-secondary btn-sm" onclick="addTopicModal('${chapter._id}')">+ Add Topic</button></td></tr>`;
                return;
            }
            chapter.topics.forEach(topic => {
                const isOverdue = !topic.completed && topic.deadline && new Date(topic.deadline) < new Date();
                const deadlineStr = topic.deadline ? new Date(topic.deadline).toLocaleDateString() : '';
                html += `<tr>
                    <td>${subject.name}</td>
                    <td>${chapter.title}</td>
                    <td>${topic.title}</td>
                    <td${isOverdue ? ' style="color:#ef4444;font-weight:bold;"' : ''}>${deadlineStr}${isOverdue ? ' (Overdue)' : ''}</td>
                    <td>${topic.completed ? '✅' : '⏳'}</td>
                    <td>
                        <button class="btn-icon" onclick="editTopic('${topic._id}')" title="Edit Topic">✏️</button>
                        <button class="btn-icon" onclick="deleteTopic('${topic._id}')" title="Delete Topic">🗑️</button>
                    </td>
                </tr>`;
            });
            // Add row for adding a topic
            html += `<tr><td></td><td></td><td colspan="4"><button class="btn btn-secondary btn-sm" onclick="addTopicModal('${chapter._id}')">+ Add Topic</button></td></tr>`;
        });
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

window.addTopicModal = function(chapterId) {
    document.getElementById('topicForm').reset();
    editMode = null;
    document.getElementById('topicChapterId').value = chapterId;
    document.querySelector('#addTopicModal .modal-title').textContent = 'Add New Topic';
    openModal('addTopicModal');
};

// Track selected class and subject for Syllabus Management
let selectedSyllabusClassId = null;
let selectedSyllabusSubjectId = null;

function renderSyllabusDrilldown() {
    const classDropdowns = document.getElementById('syllabus-class-dropdowns');
    const details = document.getElementById('syllabus-details');
    if (!classDropdowns || !details) return;
    classDropdowns.innerHTML = '';
    details.innerHTML = '';
    if (!state.classes.length) {
        classDropdowns.innerHTML = `<div class=\"empty-state\"><div class=\"empty-state-icon\">🏫</div><h3>No Classes</h3><p>Click \"+ Add Class\" to get started.</p></div>`;
        return;
    }
    // Render a single select dropdown for classes
    const select = document.createElement('select');
    select.className = 'form-select syllabus-class-select';
    select.innerHTML = '<option value=\"\">-- Select a Class --</option>';
    state.classes.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls._id;
        option.textContent = cls.name;
        if (cls._id === selectedSyllabusClassId) option.selected = true;
        select.appendChild(option);
    });
    select.onchange = function() {
        if (this.value) {
            selectedSyllabusClassId = this.value;
            selectedSyllabusSubjectId = null;
            selectSyllabusClass(this.value);
        } else {
            selectedSyllabusClassId = null;
            selectedSyllabusSubjectId = null;
            details.innerHTML = '';
        }
    };
    classDropdowns.appendChild(select);
    // If a class is already selected, show its subjects
    if (selectedSyllabusClassId) {
        selectSyllabusClass(selectedSyllabusClassId, true);
    }
}

window.selectSyllabusClass = function(classId, preserveSubject) {
    selectedSyllabusClassId = classId;
    const details = document.getElementById('syllabus-details');
    if (!details) return;
    details.innerHTML = '';
    const cls = state.classes.find(c => c._id === classId);
    if (!cls) return;
    // List subjects for this class as cards
    const subjects = state.subjects.filter(s => s.class && (s.class._id === classId || s.class === classId));
    if (!subjects.length) {
        details.innerHTML = '<div class=\"empty-state-sm\">No subjects for this class.</div>';
        return;
    }
    const cardContainer = document.createElement('div');
    cardContainer.className = 'syllabus-subject-cards';
    subjects.forEach(subject => {
        const card = document.createElement('div');
        card.className = 'syllabus-subject-card';
        card.innerHTML = `
            <div class=\"syllabus-subject-card-header\">
                <span class=\"syllabus-subject-card-title\">${subject.name}</span>
                <span class=\"syllabus-subject-card-actions\">
                    <button class=\"btn-icon\" title=\"Edit Subject\" onclick=\"window.editSubject('${subject._id}')\">✏️</button>
                    <button class=\"btn-icon\" title=\"Delete Subject\" onclick=\"window.deleteSubject('${subject._id}')\">🗑️</button>
                </span>
            </div>
        `;
        // Chapters and topics for this subject
        if (!subject.chapters || !subject.chapters.length) {
            const empty = document.createElement('div');
            empty.className = 'empty-state-sm';
            empty.textContent = 'No chapters for this subject.';
            card.appendChild(empty);
        } else {
            subject.chapters.forEach(chapter => {
                const chapterBlock = document.createElement('div');
                chapterBlock.className = 'syllabus-chapter-block';
                chapterBlock.innerHTML = `<div class=\"syllabus-chapter-title\">${chapter.title}
                    <button class='btn-edit' title='Edit Chapter' onclick='window.editChapter(\"${chapter._id}\")'>✏️</button>
                    <button class='btn-icon' title='Delete Chapter' onclick='window.deleteChapter(\"${chapter._id}\")'>🗑️</button>
                </div>`;
                if (!chapter.topics || !chapter.topics.length) {
                    const empty = document.createElement('div');
                    empty.className = 'empty-state-sm';
                    empty.textContent = 'No topics for this chapter.';
                    chapterBlock.appendChild(empty);
                } else {
                    const topicList = document.createElement('ul');
                    topicList.className = 'syllabus-topic-list';
                    chapter.topics.forEach(topic => {
                        const topicItem = document.createElement('li');
                        topicItem.className = 'syllabus-topic-item';
                        const deadlineStr = topic.deadline ? new Date(topic.deadline).toLocaleDateString() : '';
                        topicItem.innerHTML = `<span class=\"syllabus-topic-title\">${topic.title}
                            <button class='btn-edit' title='Edit Topic' onclick='window.editTopic(\"${topic._id}\")'>✏️</button>
                        </span> <span class=\"syllabus-topic-deadline\">${deadlineStr}</span>`;
                        topicList.appendChild(topicItem);
                    });
                    chapterBlock.appendChild(topicList);
                }
                card.appendChild(chapterBlock);
            });
        }
        cardContainer.appendChild(card);
        // If a subject is selected, scroll to it and highlight (optional)
    });
    details.appendChild(cardContainer);
    // If a subject was selected before, re-select it
    if (preserveSubject && selectedSyllabusSubjectId) {
        // Optionally, scroll to the subject card or highlight it
    }
}

window.selectSyllabusSubject = function(subjectId) {
    selectedSyllabusSubjectId = subjectId;
    // ... (rest of the function if needed)
}

// Subject Management Functions
async function loadSubjectsPage() {
    const container = document.getElementById('subject-kpi-list');
    if (!container) return;
    
    if (state.subjects.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <h3 style="color: var(--gray-500);">No subjects found</h3>
                <p style="color: var(--gray-400); margin-top: 8px;">Create your first subject to get started</p>
                <button class="btn btn-primary" style="margin-top: 16px;" onclick="openModal('addSubjectModal')">
                    + Add First Subject
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    for (const subject of state.subjects) {
        const subjectKPIs = state.kpis.filter(k => k.subject === subject._id);
        const kpiStatus = subjectKPIs.length > 0 ? 
            (subjectKPIs.every(k => k.achieved) ? 'achieved' : 
             subjectKPIs.some(k => k.achieved) ? 'pending' : 'failed') : 'pending';
        
        let totalTopics = 0;
        let completedTopics = 0;
        
        if (subject.chapters) {
            subject.chapters.forEach(chapter => {
                if (chapter.topics) {
                    totalTopics += chapter.topics.length;
                    completedTopics += chapter.topics.filter(t => t.completed).length;
                }
            });
        }
        
        const progress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
        
        const subjectCard = document.createElement('div');
        subjectCard.className = 'card';
        subjectCard.style.marginBottom = '24px';
        
        subjectCard.innerHTML = `
            <div class="card-header">
                <div>
                    <h3 class="card-title">${subject.name} - ${subject.class?.name || 'No Class'}</h3>
                    <div style="color: var(--gray-600); font-size: 14px; margin-top: 4px;">
                        Code: ${subject.code} | Department: ${subject.department} | Deadline: ${new Date(subject.deadline).toLocaleDateString()}
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-secondary btn-sm" onclick="editSubject('${subject._id}')">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteSubject('${subject._id}')">Delete</button>
                </div>
            </div>
            
            <div style="padding: 20px;">
                <!-- KPIs Section -->
                <div style="margin-bottom: 24px;">
                    <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 16px;">
                        <h4 style="font-size: 16px; font-weight: 600;">Key Performance Indicators</h4>
                        <div class="kpi-status ${kpiStatus}" style="margin-left: auto;">${kpiStatus === 'achieved' ? '✓' : kpiStatus === 'pending' ? '⏱' : '✗'}</div>
                    </div>
                    
                    <div class="progress-container">
                        <div class="progress-header">
                            <span class="progress-label">Overall Progress</span>
                            <span class="progress-value">${Math.round(progress)}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    
                    <div class="kpi-items" style="margin-top: 16px;">
                        ${subjectKPIs.map(kpi => `
                            <div class="kpi-item">
                                <input type="checkbox" class="kpi-checkbox" 
                                       ${kpi.achieved ? 'checked' : ''} 
                                       onchange="updateKPI('${kpi._id}', this.checked)">
                                <span class="kpi-label">${kpi.title}</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <button class="btn btn-secondary btn-sm" style="margin-top: 12px;" onclick="openAddKPIModal('${subject._id}')">
                        + Add KPI
                    </button>
                </div>
                
                <!-- Chapters Section -->
                <div>
                    <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 16px;">
                        <h4 style="font-size: 16px; font-weight: 600;">Chapters (${subject.chapters?.length || 0})</h4>
                        <button class="btn btn-primary btn-sm" onclick="openAddChapterModal('${subject._id}')">
                            + Add Chapter
                        </button>
                    </div>
                    
                    <div class="chapters-list">
                        ${renderChaptersForManagement(subject.chapters || [])}
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(subjectCard);
    }
}

function renderChaptersForManagement(chapters) {
    if (chapters.length === 0) {
        return '<p style="color: var(--gray-500); text-align: center; padding: 20px;">No chapters added yet</p>';
    }
    
    return chapters.sort((a, b) => a.number - b.number).map(chapter => {
        const allCompleted = chapter.topics?.length > 0 && chapter.topics.every(t => t.completed);
        
        return `
            <div style="border: 1px solid var(--gray-200); border-radius: 8px; padding: 16px; margin-bottom: 12px; ${allCompleted ? 'background: var(--gray-50);' : ''}">
                <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 12px;">
                    <div>
                        <h5 style="font-weight: 600; margin: 0;">Chapter ${chapter.number}: ${chapter.title}</h5>
                        <div style="font-size: 13px; color: var(--gray-600); margin-top: 4px;">
                            Deadline: ${new Date(chapter.deadline).toLocaleDateString()} | 
                            Topics: ${chapter.topics?.length || 0} | 
                            Status: ${chapter.status}
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-icon" onclick="editChapter('${chapter._id}')">✏️</button>
                        <button class="btn-icon" onclick="deleteChapter('${chapter._id}')">🗑️</button>
                    </div>
                </div>
                
                <div style="margin-left: 20px;">
                    ${renderTopicsForManagement(chapter.topics || [])}
                    <button class="btn btn-secondary btn-sm" style="margin-top: 8px;" onclick="openAddTopicModal('${chapter._id}')">
                        + Add Topic
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderTopicsForManagement(topics) {
    if (topics.length === 0) {
        return '<p style="color: var(--gray-500); font-size: 14px;">No topics added yet</p>';
    }
    
    return topics.map(topic => {
        const isOverdue = !topic.completed && new Date(topic.deadline) < new Date();
        
        return `
            <div style="display: flex; align-items: center; gap: 12px; padding: 8px; border-radius: 6px; margin-bottom: 8px; background: ${topic.completed ? 'var(--gray-50)' : 'white'};">
                <input type="checkbox" ${topic.completed ? 'checked' : ''} 
                       onchange="toggleTopicCompletion('${topic._id}')">
                <div style="flex: 1;">
                    <span style="${topic.completed ? 'text-decoration: line-through; color: var(--gray-500);' : ''} ${isOverdue ? 'color: var(--danger);' : ''}">
                        ${topic.title}
                    </span>
                    <div style="font-size: 12px; color: var(--gray-600);">
                        Due: ${new Date(topic.deadline).toLocaleDateString()} ${isOverdue ? '(Overdue!)' : ''}
                    </div>
                </div>
                <div style="display: flex; gap: 4px;">
                    <button class="btn-icon" onclick="editTopic('${topic._id}')">✏️</button>
                    <button class="btn-icon" onclick="deleteTopic('${topic._id}')">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

// Chapter and Topic Management Functions
async function saveChapter() {
    try {
        const form = document.getElementById('chapterForm');
        const formData = new FormData(form);
        
        const chapterData = {
            subject: document.getElementById('chapterSubjectId').value,
            title: formData.get('title'),
            number: parseInt(formData.get('number')),
            deadline: formData.get('deadline'),
            description: formData.get('description')
        };
        
        if (!chapterData.title || !chapterData.number || !chapterData.deadline) {
            showAlert('Please fill in all required fields', 'warning');
            return;
        }
        
        const response = await fetch(`${API_BASE}/syllabus/chapters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chapterData)
        });
        
        if (!response.ok) throw new Error('Failed to save chapter');
        
        closeModal('addChapterModal');
        showAlert('Chapter created successfully!', 'success');
        await loadSubjects();
        loadPageContent(state.currentPage);
    } catch (error) {
        console.error('Error saving chapter:', error);
        showAlert('Failed to save chapter', 'danger');
    }
}

async function saveTopic() {
    try {
        const form = document.getElementById('topicForm');
        const formData = new FormData(form);
        
        const topicData = {
            chapter: document.getElementById('topicChapterId').value,
            title: formData.get('title'),
            deadline: formData.get('deadline'),
            notes: formData.get('notes')
        };
        
        if (!topicData.title || !topicData.deadline) {
            showAlert('Please fill in all required fields', 'warning');
            return;
        }
        
        const response = await fetch(`${API_BASE}/syllabus/topics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(topicData)
        });
        
        if (!response.ok) throw new Error('Failed to save topic');
        
        closeModal('addTopicModal');
        showAlert('Topic created successfully!', 'success');
        await loadSubjects();
        loadPageContent(state.currentPage);
    } catch (error) {
        console.error('Error saving topic:', error);
        showAlert('Failed to save topic', 'danger');
    }
}

async function toggleTopicCompletion(topicId) {
    try {
        const response = await fetch(`${API_BASE}/syllabus/topics/${topicId}/toggle`, {
            method: 'PATCH'
        });
        
        if (!response.ok) throw new Error('Failed to update topic');
        
        await loadSubjects();
        loadPageContent(state.currentPage);
        showAlert('Topic status updated!', 'success');
    } catch (error) {
        console.error('Error updating topic:', error);
        showAlert('Failed to update topic status', 'danger');
    }
}

// Modal Functions
function openAddChapterModal(subjectId) {
    document.getElementById('chapterSubjectId').value = subjectId;
    openModal('addChapterModal');
}

function openAddTopicModal(chapterId) {
    document.getElementById('topicChapterId').value = chapterId;
    openModal('addTopicModal');
}

async function deleteChapter(chapterId) {
    if (!confirm('Are you sure you want to delete this chapter and all its topics?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/syllabus/chapters/${chapterId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete chapter');
        
        showAlert('Chapter deleted successfully!', 'success');
        await loadSubjects();
        loadPageContent(state.currentPage);
    } catch (error) {
        console.error('Error deleting chapter:', error);
        showAlert('Failed to delete chapter', 'danger');
    }
}

async function deleteTopic(topicId) {
    if (!confirm('Are you sure you want to delete this topic?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/syllabus/topics/${topicId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete topic');
        
        showAlert('Topic deleted successfully!', 'success');
        await loadSubjects();
        loadPageContent(state.currentPage);
    } catch (error) {
        console.error('Error deleting topic:', error);
        showAlert('Failed to delete topic', 'danger');
    }
}

// Global function exports
window.showPage = showPage;
window.openModal = openModal;
window.closeModal = closeModal;
window.saveSubject = saveSubject;
window.saveClass = saveClass;
window.saveChapter = saveChapter;
window.saveTopic = saveTopic;
window.saveTask = saveTask;
window.saveMilestone = saveMilestone;
window.saveScheduledReport = saveScheduledReport;
window.deleteSubject = deleteSubject;
window.deleteClass = deleteClass;
window.deleteChapter = deleteChapter;
window.deleteTopic = deleteTopic;
window.editSubject = editSubject;
window.editClass = editClass;
window.editChapter = editChapter;
window.editTopic = editTopic;
window.toggleTopicCompletion = toggleTopicCompletion;
window.updateKPI = updateKPI;
window.filterClasses = filterClasses;
window.filterSubjects = filterSubjects;
window.exportData = exportData;
window.openAddChapterModal = openAddChapterModal;
window.openAddTopicModal = openAddTopicModal;
window.addKPIField = addKPIField;
window.initializeReportBuilder = initializeReportBuilder;
  
// Missing Functions
async function saveTask() {
    try {
        const form = document.getElementById('taskForm');
        const formData = new FormData(form);
        
        const taskData = {
            title: formData.get('title'),
            dueDate: formData.get('dueDate'),
            priority: formData.get('priority'),
            description: formData.get('description')
        };
        
        if (!taskData.title || !taskData.dueDate) {
            showAlert('Please fill in all required fields', 'warning');
            return;
        }
        
        const response = await fetch(`${API_BASE}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });
        
        if (!response.ok) throw new Error('Failed to save task');
        
        closeModal('addTaskModal');
        showAlert('Task created successfully!', 'success');
        await loadTasks();
        loadPageContent(state.currentPage);
    } catch (error) {
        console.error('Error saving task:', error);
        showAlert('Failed to save task', 'danger');
    }
}

async function saveMilestone() {
    try {
        const form = document.getElementById('milestoneForm');
        const formData = new FormData(form);
        
        const milestoneData = {
            title: formData.get('title'),
            targetDate: formData.get('targetDate'),
            reward: formData.get('reward'),
            description: formData.get('description')
        };
        
        if (!milestoneData.title || !milestoneData.targetDate) {
            showAlert('Please fill in all required fields', 'warning');
            return;
        }
        
        const response = await fetch(`${API_BASE}/milestones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(milestoneData)
        });
        
        if (!response.ok) throw new Error('Failed to save milestone');
        
        closeModal('addMilestoneModal');
        showAlert('Milestone created successfully!', 'success');
        await loadMilestones();
        loadPageContent(state.currentPage);
    } catch (error) {
        console.error('Error saving milestone:', error);
        showAlert('Failed to save milestone', 'danger');
    }
}

async function saveScheduledReport() {
    try {
        const form = document.getElementById('scheduledReportForm');
        const formData = new FormData(form);
        
        const reportData = {
            name: formData.get('name'),
            schedule: formData.get('schedule'),
            recipients: formData.get('recipients')
        };
        
        if (!reportData.name || !reportData.schedule) {
            showAlert('Please fill in all required fields', 'warning');
            return;
        }
        
        const response = await fetch(`${API_BASE}/scheduled-reports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reportData)
        });
        
        if (!response.ok) throw new Error('Failed to save scheduled report');
        
        closeModal('addScheduledReportModal');
        showAlert('Scheduled report created successfully!', 'success');
        await loadScheduledReports();
        loadPageContent(state.currentPage);
    } catch (error) {
        console.error('Error saving scheduled report:', error);
        showAlert('Failed to save scheduled report', 'danger');
    }
}

async function loadMilestones() {
    try {
        const response = await fetch(`${API_BASE}/milestones`);
        if (!response.ok) throw new Error('Failed to load milestones');
        state.milestones = await response.json();
    } catch (error) {
        console.error('Error loading milestones:', error);
        state.milestones = [];
    }
}

async function loadScheduledReports() {
    try {
        const response = await fetch(`${API_BASE}/scheduled-reports`);
        if (!response.ok) throw new Error('Failed to load scheduled reports');
        state.scheduledReports = await response.json();
    } catch (error) {
        console.error('Error loading scheduled reports:', error);
        state.scheduledReports = [];
    }
}

// Global function exports
  
// ===== KPI Management =====
let kpis = [];

async function loadKPIs() {
    try {
        const response = await fetch(`${API_BASE}/kpis`);
        if (!response.ok) throw new Error('Failed to load KPIs');
        kpis = await response.json();
        renderKPIs();
    } catch (error) {
        showAlert('Failed to load KPIs: ' + error.message, 'danger');
    }
}

function renderKPIs() {
    const kpiDashboard = document.getElementById('kpi-dashboard');
    if (!kpiDashboard) return;
    
    if (kpis.length === 0) {
        kpiDashboard.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎯</div>
                <h3>No KPIs created yet</h3>
                <p>Click "Add KPI" to set performance goals</p>
            </div>`;
        return;
    }
    
    // Group KPIs by category
    const kpisByCategory = {
        completion: kpis.filter(k => k.category === 'completion'),
        quality: kpis.filter(k => k.category === 'quality'),
        timeliness: kpis.filter(k => k.category === 'timeliness'),
        engagement: kpis.filter(k => k.category === 'engagement')
    };
    
    kpiDashboard.innerHTML = `
        <div class="kpi-stats">
            <div class="kpi-stat-card">
                <div class="kpi-stat-value">${kpis.length}</div>
                <div class="kpi-stat-label">Total KPIs</div>
            </div>
            <div class="kpi-stat-card success">
                <div class="kpi-stat-value">${kpis.filter(k => k.isAchieved).length}</div>
                <div class="kpi-stat-label">Achieved</div>
            </div>
            <div class="kpi-stat-card warning">
                <div class="kpi-stat-value">${kpis.filter(k => !k.isAchieved && k.current > 0).length}</div>
                <div class="kpi-stat-label">In Progress</div>
            </div>
            <div class="kpi-stat-card">
                <div class="kpi-stat-value">${kpis.filter(k => k.current === 0).length}</div>
                <div class="kpi-stat-label">Not Started</div>
            </div>
        </div>
        
        <div class="kpi-categories">
            ${Object.entries(kpisByCategory).map(([category, items]) => `
                <div class="kpi-category">
                    <h3>${category.charAt(0).toUpperCase() + category.slice(1)}</h3>
                    <div class="kpi-list">
                        ${items.map(kpi => renderKPICard(kpi)).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderKPICard(kpi) {
    const progress = kpi.target > 0 ? (kpi.current / kpi.target) * 100 : 0;
    const progressClass = progress >= 100 ? 'high' : progress >= 50 ? 'medium' : 'low';
    
    return `
        <div class="kpi-card ${kpi.isAchieved ? 'achieved' : ''}">
            <div class="kpi-header">
                <h4>${kpi.title}</h4>
                <div class="kpi-actions">
                    <button class="btn-icon" onclick="updateKPIProgress('${kpi._id}')" title="Update Progress">📊</button>
                    <button class="btn-icon" onclick="editKPI('${kpi._id}')" title="Edit KPI">✏️</button>
                    <button class="btn-icon" onclick="deleteKPI('${kpi._id}')" title="Delete KPI">🗑️</button>
                </div>
            </div>
            <div class="kpi-body">
                ${kpi.description ? `<p class="kpi-description">${kpi.description}</p>` : ''}
                <div class="kpi-progress">
                    <div class="progress-bar-container">
                        <div class="progress-bar ${progressClass}" style="width: ${Math.min(progress, 100)}%"></div>
                    </div>
                    <div class="kpi-values">
                        <span>${kpi.current} / ${kpi.target} ${kpi.unit}</span>
                        <span>${Math.round(progress)}%</span>
                    </div>
                </div>
                ${kpi.subject ? `<div class="kpi-subject">Subject: ${kpi.subject.name}</div>` : ''}
                ${kpi.isAchieved ? `<div class="kpi-achieved">✅ Achieved on ${new Date(kpi.achievedAt).toLocaleDateString()}</div>` : ''}
            </div>
        </div>
    `;
}

window.openKPIModal = function(kpiId = null) {
    const form = document.getElementById('kpiForm');
    form.reset();
    const modalTitle = document.getElementById('kpiModalTitle');
    
    // Populate subject dropdown
    const subjectSelect = document.getElementById('kpiSubject');
    subjectSelect.innerHTML = '<option value="">Select Subject</option>';
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject._id;
        option.textContent = `${subject.name} (${subject.class.name})`;
        subjectSelect.appendChild(option);
    });
    
    if (kpiId) {
        const kpi = kpis.find(k => k._id === kpiId);
        if (!kpi) return;
        editMode = { type: 'kpi', id: kpiId };
        modalTitle.textContent = 'Edit KPI';
        document.getElementById('kpiTitle').value = kpi.title;
        document.getElementById('kpiSubject').value = kpi.subject?._id || '';
        document.getElementById('kpiCategory').value = kpi.category;
        document.getElementById('kpiTarget').value = kpi.target;
        document.getElementById('kpiUnit').value = kpi.unit;
        document.getElementById('kpiDescription').value = kpi.description || '';
    } else {
        editMode = { type: 'kpi' };
        modalTitle.textContent = 'Add New KPI';
    }
    openModal('kpiModal');
};

async function saveKPI(e) {
    e.preventDefault();
    const kpiData = {
        title: document.getElementById('kpiTitle').value,
        subject: document.getElementById('kpiSubject').value,
        category: document.getElementById('kpiCategory').value,
        target: parseFloat(document.getElementById('kpiTarget').value),
        unit: document.getElementById('kpiUnit').value,
        description: document.getElementById('kpiDescription').value
    };
    
    try {
        let response;
        if (editMode && editMode.type === 'kpi' && editMode.id) {
            response = await fetch(`${API_BASE}/kpis/${editMode.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(kpiData)
            });
        } else {
            response = await fetch(`${API_BASE}/kpis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(kpiData)
            });
        }
        
        if (!response.ok) throw new Error('Failed to save KPI');
        
        await loadKPIs();
        closeModal('kpiModal');
        showAlert('KPI saved successfully!', 'success');
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

window.updateKPIProgress = async function(kpiId) {
    const kpi = kpis.find(k => k._id === kpiId);
    if (!kpi) return;
    
    const newValue = prompt(`Update progress for "${kpi.title}" (current: ${kpi.current} ${kpi.unit}):`);
    if (newValue === null || newValue === '') return;
    
    try {
        const response = await fetch(`${API_BASE}/kpis/${kpiId}/progress`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ current: parseFloat(newValue) })
        });
        
        if (!response.ok) throw new Error('Failed to update KPI progress');
        
        await loadKPIs();
        showAlert('KPI progress updated!', 'success');
    } catch (error) {
        showAlert(error.message, 'danger');
    }
};

window.editKPI = function(kpiId) {
    openKPIModal(kpiId);
};

window.deleteKPI = async function(kpiId) {
    if (!confirm('Are you sure you want to delete this KPI?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/kpis/${kpiId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete KPI');
        
        await loadKPIs();
        showAlert('KPI deleted successfully!', 'success');
    } catch (error) {
        showAlert(error.message, 'danger');
    }
};

// ===== Milestone Management =====
let milestones = { unlocked: [], locked: [], totalPoints: 0 };

async function loadMilestones() {
    try {
        const response = await fetch(`${API_BASE}/milestones/my-milestones`);
        if (!response.ok) throw new Error('Failed to load milestones');
        milestones = await response.json();
        renderMilestones();
    } catch (error) {
        showAlert('Failed to load milestones: ' + error.message, 'danger');
    }
}

function renderMilestones() {
    const container = document.getElementById('milestone-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="milestone-stats">
            <div class="milestone-stat">
                <div class="milestone-stat-value">${milestones.unlocked.length}</div>
                <div class="milestone-stat-label">Unlocked</div>
            </div>
            <div class="milestone-stat">
                <div class="milestone-stat-value">${milestones.locked.length}</div>
                <div class="milestone-stat-label">Locked</div>
            </div>
            <div class="milestone-stat">
                <div class="milestone-stat-value">${milestones.totalPoints}</div>
                <div class="milestone-stat-label">Total Points</div>
            </div>
        </div>
        
        <div class="milestone-sections">
            <div class="milestone-section">
                <h3>🏆 Unlocked Achievements</h3>
                <div class="milestone-grid">
                    ${milestones.unlocked.map(m => renderMilestoneCard(m, true)).join('')}
                </div>
            </div>
            
            <div class="milestone-section">
                <h3>🔒 Locked Achievements</h3>
                <div class="milestone-grid">
                    ${milestones.locked.map(m => renderMilestoneCard(m, false)).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderMilestoneCard(milestone, isUnlocked) {
    return `
        <div class="milestone-card ${isUnlocked ? 'unlocked' : 'locked'}">
            <div class="milestone-icon">
                ${milestone.reward.type === 'badge' ? '🏅' : 
                  milestone.reward.type === 'certificate' ? '📜' : '💎'}
            </div>
            <h4>${milestone.title}</h4>
            <p>${milestone.description}</p>
            <div class="milestone-criteria">
                ${getCriteriaText(milestone.criteria)}
            </div>
            <div class="milestone-reward">
                Reward: ${getRewardText(milestone.reward)}
            </div>
            ${isUnlocked ? '<div class="milestone-unlocked">✅ Unlocked!</div>' : ''}
        </div>
    `;
}

function getCriteriaText(criteria) {
    switch (criteria.type) {
        case 'topics_completed':
            return `Complete ${criteria.value} topics`;
        case 'subjects_completed':
            return `Complete ${criteria.value} subjects`;
        case 'kpis_achieved':
            return `Achieve ${criteria.value} KPIs`;
        case 'streak_days':
            return `Maintain ${criteria.value} day streak`;
        default:
            return '';
    }
}

function getRewardText(reward) {
    switch (reward.type) {
        case 'points':
            return `${reward.value} Points`;
        case 'badge':
            return `${reward.value} Badge`;
        case 'certificate':
            return 'Certificate';
        default:
            return reward.value;
    }
}

window.checkMilestones = async function() {
    try {
        showAlert('Checking for new achievements...', 'info');
        const response = await fetch(`${API_BASE}/milestones/check`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to check milestones');
        
        const result = await response.json();
        if (result.newlyUnlocked.length > 0) {
            showAlert(result.message, 'success');
            await loadMilestones();
        } else {
            showAlert('No new milestones unlocked yet. Keep going!', 'info');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
};

// ===== Scheduled Reports Management =====
let scheduledReports = [];

async function loadScheduledReports() {
    try {
        const response = await fetch(`${API_BASE}/scheduled-reports`);
        if (!response.ok) throw new Error('Failed to load scheduled reports');
        scheduledReports = await response.json();
        renderScheduledReports();
    } catch (error) {
        showAlert('Failed to load scheduled reports: ' + error.message, 'danger');
    }
}

function renderScheduledReports() {
    const list = document.getElementById('scheduled-reports-list');
    if (!list) return;
    
    if (scheduledReports.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⏰</div>
                <h3>No scheduled reports</h3>
                <p>Click "Schedule Report" to set up automated report generation</p>
            </div>`;
        return;
    }
    
    list.innerHTML = `
        <div class="scheduled-reports-grid">
            ${scheduledReports.map(report => `
                <div class="scheduled-report-card ${report.isActive ? 'active' : 'inactive'}">
                    <div class="report-header">
                        <h4>${report.name}</h4>
                        <div class="report-status">${report.isActive ? '✅ Active' : '⏸️ Paused'}</div>
                    </div>
                    <div class="report-details">
                        <div class="report-info">
                            <span class="label">Type:</span> ${report.type}
                        </div>
                        <div class="report-info">
                            <span class="label">Format:</span> ${report.format.toUpperCase()}
                        </div>
                        <div class="report-info">
                            <span class="label">Schedule:</span> ${getScheduleText(report)}
                        </div>
                        <div class="report-info">
                            <span class="label">Recipients:</span> ${report.recipients.length} email(s)
                        </div>
                        <div class="report-info">
                            <span class="label">Next Run:</span> ${new Date(report.nextRun).toLocaleString()}
                        </div>
                        ${report.lastRun ? `
                            <div class="report-info">
                                <span class="label">Last Run:</span> ${new Date(report.lastRun).toLocaleString()}
                            </div>
                        ` : ''}
                    </div>
                    <div class="report-actions">
                        <button class="btn btn-secondary btn-small" onclick="toggleScheduledReport('${report._id}')">
                            ${report.isActive ? '⏸️ Pause' : '▶️ Activate'}
                        </button>
                        <button class="btn btn-primary btn-small" onclick="runScheduledReport('${report._id}')">
                            🚀 Run Now
                        </button>
                        <button class="btn btn-danger btn-small" onclick="deleteScheduledReport('${report._id}')">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function getScheduleText(report) {
    switch (report.type) {
        case 'daily':
            return `Daily at ${report.schedule.time}`;
        case 'weekly':
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            return `Weekly on ${days[report.schedule.dayOfWeek]} at ${report.schedule.time}`;
        case 'monthly':
            return `Monthly on day ${report.schedule.dayOfMonth} at ${report.schedule.time}`;
        default:
            return '';
    }
}

window.openScheduledReportModal = function() {
    const form = document.getElementById('scheduledReportForm');
    form.reset();
    document.getElementById('scheduleOptions').style.display = 'none';
    openModal('scheduledReportModal');
};

window.updateScheduleOptions = function() {
    const type = document.getElementById('reportType').value;
    const scheduleOptions = document.getElementById('scheduleOptions');
    const dayOfWeekGroup = document.getElementById('dayOfWeekGroup');
    const dayOfMonthGroup = document.getElementById('dayOfMonthGroup');
    
    if (type) {
        scheduleOptions.style.display = 'grid';
        dayOfWeekGroup.style.display = type === 'weekly' ? 'block' : 'none';
        dayOfMonthGroup.style.display = type === 'monthly' ? 'block' : 'none';
    } else {
        scheduleOptions.style.display = 'none';
    }
};

async function saveScheduledReport(e) {
    if (e) e.preventDefault();
    
    const type = document.getElementById('reportType').value;
    const schedule = {
        time: document.getElementById('reportTime').value
    };
    
    if (type === 'weekly') {
        schedule.dayOfWeek = parseInt(document.getElementById('dayOfWeek').value);
    } else if (type === 'monthly') {
        schedule.dayOfMonth = parseInt(document.getElementById('dayOfMonth').value);
    }
    
    const reportData = {
        name: document.getElementById('reportName').value,
        type: type,
        format: document.getElementById('reportFormat').value,
        recipients: document.getElementById('reportRecipients').value.split(',').map(e => e.trim()),
        schedule: schedule
    };
    
    try {
        const response = await fetch(`${API_BASE}/scheduled-reports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reportData)
        });
        
        if (!response.ok) throw new Error('Failed to create scheduled report');
        
        await loadScheduledReports();
        closeModal('scheduledReportModal');
        showAlert('Scheduled report created successfully!', 'success');
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

window.toggleScheduledReport = async function(reportId) {
    try {
        const response = await fetch(`${API_BASE}/scheduled-reports/${reportId}/toggle`, {
            method: 'PATCH'
        });
        if (!response.ok) throw new Error('Failed to toggle report status');
        
        const result = await response.json();
        await loadScheduledReports();
        showAlert(result.message, 'success');
    } catch (error) {
        showAlert(error.message, 'danger');
    }
};

window.runScheduledReport = async function(reportId) {
    try {
        showAlert('Running report...', 'info');
        const response = await fetch(`${API_BASE}/scheduled-reports/${reportId}/run`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to run report');
        
        const result = await response.json();
        showAlert(result.message, 'success');
        await loadScheduledReports();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
};

window.deleteScheduledReport = async function(reportId) {
    if (!confirm('Are you sure you want to delete this scheduled report?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/scheduled-reports/${reportId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete report');
        
        await loadScheduledReports();
        showAlert('Scheduled report deleted successfully!', 'success');
    } catch (error) {
        showAlert(error.message, 'danger');
    }
};

// ===== Enhanced Report Downloads =====
window.downloadReport = async function(type, format) {
    try {
        showAlert(`Generating ${type} ${format.toUpperCase()} report...`, 'info');
        
        const response = await fetch(`${API_BASE}/export/${type}/${format}`);
        if (!response.ok) throw new Error('Failed to generate report');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const extension = format === 'excel' ? 'xlsx' : format;
        a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.${extension}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showAlert(`${type} ${format.toUpperCase()} report downloaded successfully!`, 'success');
    } catch (error) {
        showAlert('Failed to download report: ' + error.message, 'error');
    }
};

// ===== Update the showTab function to load new data =====
const originalShowTab = window.showTab;
window.showTab = function(tabName, event) {
    originalShowTab(tabName, event);
    
    if (tabName === 'kpis') loadKPIs();
    else if (tabName === 'milestones') loadMilestones();
    else if (tabName === 'scheduled') loadScheduledReports();
};

// ===== Update the DOMContentLoaded event =====
document.addEventListener('DOMContentLoaded', async function() {
    // ... existing initialization code ...
    
    // Add new form event listeners
    document.getElementById('kpiForm').addEventListener('submit', saveKPI);
    document.getElementById('scheduledReportForm').addEventListener('submit', saveScheduledReport);
});

// ===== Add dropdown functionality =====
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('dropdown-toggle')) {
        e.preventDefault();
        const dropdown = e.target.parentElement;
        dropdown.classList.toggle('active');
    } else {
        document.querySelectorAll('.dropdown.active').forEach(d => d.classList.remove('active'));
    }
});
  
// Missing functions for new UI sections
async function saveProgress() {
    try {
        const subjectId = document.getElementById('progress-subject-select').value;
        const topic = document.getElementById('progress-topic-input').value;
        const percentage = document.getElementById('progress-percentage-input').value;
        const notes = document.getElementById('progress-notes-input').value;

        if (!subjectId || !topic || !percentage) {
            showAlert('Please fill in all required fields', 'warning');
            return;
        }

        const progressData = {
            subjectId,
            topic,
            percentage: parseInt(percentage),
            notes,
            date: new Date().toISOString()
        };

        const response = await fetch(`${API_BASE}/progress`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(progressData)
        });

        if (!response.ok) throw new Error('Failed to save progress');

        showAlert('Progress saved successfully!', 'success');
        closeModal('addProgressModal');
        
        // Clear form
        document.getElementById('progress-form').reset();
        
        // Reload progress data
        await loadProgressHistory();
        renderProgressView();
    } catch (error) {
        console.error('Error saving progress:', error);
        showAlert('Failed to save progress: ' + error.message, 'danger');
    }
}

async function exportReport(type, format) {
    try {
        showAlert(`Exporting ${type} report in ${format.toUpperCase()} format...`, 'info');
        
        const response = await fetch(`${API_BASE}/export/${type}?format=${format}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) throw new Error('Failed to export report');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_report.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showAlert(`${type} report exported successfully!`, 'success');
    } catch (error) {
        console.error('Error exporting report:', error);
        showAlert('Failed to export report: ' + error.message, 'danger');
    }
}

// Initialize missing data loading functions
async function loadProgressHistory() {
    try {
        const response = await fetch(`${API_BASE}/progress`);
        if (!response.ok) throw new Error('Failed to load progress history');
        state.progressHistory = await response.json();
    } catch (error) {
        console.error('Error loading progress history:', error);
        state.progressHistory = [];
    }
}

// Enhanced initialization to include all sections
async function initializeAllSections() {
    try {
        await Promise.all([
            loadClasses(),
            loadSubjects(),
            loadKPIs(),
            loadTasks(),
            loadProgressHistory(),
            loadMilestones(),
            loadScheduledReports()
        ]);
        
        // Render all sections
        renderClasses();
        renderSubjects();
        renderKPIs();
        renderTasks();
        renderMilestones();
        renderScheduledReports();
        renderProgressView();
        
    } catch (error) {
        console.error('Error initializing sections:', error);
        showAlert('Some data failed to load', 'warning');
    }
}
  
// Add missing editClass function
window.editClass = function(classId) {
    // Find the class data
    const classData = state.classes.find(c => c._id === classId);
    if (!classData) {
        showAlert('Class not found', 'error');
        return;
    }
    
    // Populate the form
    document.getElementById('className').value = classData.name;
    document.getElementById('classCode').value = classData.code;
    document.getElementById('classDescription').value = classData.description || '';
    document.getElementById('classCapacity').value = classData.capacity || '';
    
    // Update the form to edit mode
    const form = document.getElementById('classForm');
    form.dataset.editMode = 'true';
    form.dataset.editId = classId;
    
    // Update button text
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.textContent = 'Update Class';
    }
    
    // Open the modal
    openModal('addClassModal');
};
  
const TASK_API_BASE = `${API_BASE}/task-generation`;

async function fetchTasksByType(type) {
    const res = await fetch(`${TASK_API_BASE}/tasks?type=${type}`);
    const data = await res.json();
    return data.tasks || [];
}

function renderTasksList(tasks, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!tasks.length) {
        container.innerHTML = '<div class="empty-state">No tasks found.</div>';
        return;
    }
    container.innerHTML = '';
    tasks.forEach(task => {
        const div = document.createElement('div');
        div.className = `task-item ${task.completed ? 'completed' : ''}`;
        div.innerHTML = `
            <div class="task-title">${task.title}</div>
            <div class="task-meta">
                <span class="task-date">${new Date(task.date).toLocaleDateString()}</span>
                <span class="task-priority priority-${task.priority}">${task.priority}</span>
                <span class="task-type">${task.type}</span>
                <span class="task-class">${task.class?.name || ''}</span>
                <span class="task-subject">${task.subject?.name || ''}</span>
            </div>
            <div class="task-notes">${task.notes || ''}</div>
            <button class="btn btn-sm btn-success" ${task.completed ? 'disabled' : ''} onclick="markTaskComplete('${task._id}', '${containerId}')">Mark Complete</button>
        `;
        container.appendChild(div);
    });
}

async function loadDailyTasks() {
    const tasks = await fetchTasksByType('daily');
    renderTasksList(tasks, 'daily-tasks-list');
}
async function loadWeeklyTasks() {
    const tasks = await fetchTasksByType('weekly');
    renderTasksList(tasks, 'weekly-tasks-list');
}
async function loadMonthlyTasks() {
    const tasks = await fetchTasksByType('monthly');
    renderTasksList(tasks, 'monthly-tasks-list');
}

window.markTaskComplete = async function(taskId, containerId) {
    await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true })
    });
    // Reload the relevant list
    if (containerId === 'daily-tasks-list') loadDailyTasks();
    if (containerId === 'weekly-tasks-list') loadWeeklyTasks();
    if (containerId === 'monthly-tasks-list') loadMonthlyTasks();
};

// Manual generation handlers
async function generateTasks(type) {
    await fetch(`${TASK_API_BASE}/${type}`, { method: 'POST' });
    if (type === 'daily') loadDailyTasks();
    if (type === 'weekly') loadWeeklyTasks();
    if (type === 'monthly') loadMonthlyTasks();
    if (type === 'all') {
        loadDailyTasks();
        loadWeeklyTasks();
        loadMonthlyTasks();
    }
}

document.getElementById('generateDailyTasksBtn').onclick = () => generateTasks('daily');
document.getElementById('generateWeeklyTasksBtn').onclick = () => generateTasks('weekly');
document.getElementById('generateMonthlyTasksBtn').onclick = () => generateTasks('monthly');
document.getElementById('generateAllTasksBtn').onclick = () => generateTasks('all');
document.getElementById('refreshDailyTasksBtn').onclick = loadDailyTasks;
document.getElementById('refreshWeeklyTasksBtn').onclick = loadWeeklyTasks;
document.getElementById('refreshMonthlyTasksBtn').onclick = loadMonthlyTasks;

// When tasks page is shown, load all tasks
window.showTab = (function (originalShowTab) {
    return function(tabId, event) {
        originalShowTab(tabId, event);
        if (tabId === 'tasks') {
            loadDailyTasks();
            loadWeeklyTasks();
            loadMonthlyTasks();
        }
    };
})(window.showTab);
  