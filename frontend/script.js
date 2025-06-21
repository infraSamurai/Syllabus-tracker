// API base URL
const API_BASE = '/api';

// Data storage
let subjects = [];
let classes = [];
let editMode = null; // { type: 'subject'|'chapter'|'topic'|'class', id: string }

// Initialize app
document.addEventListener('DOMContentLoaded', async function() {
    await loadData();
    renderAll();
    setupEventListeners();
    const today = new Date().toISOString().split('T')[0];
    ['subjectDeadline', 'chapterDeadline', 'topicDeadline'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.min = today;
    });
});

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
}

// Tab management
function showTab(tabName, event) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');
    
    if (tabName === 'dashboard') updateDashboard();
    else if (tabName === 'progress') renderProgressView();
    else if (tabName === 'classes') renderClasses();
}

// Modal management
window.openModal = function(modalId) {
    document.getElementById(modalId).classList.add('active');
}

window.closeModal = function(modalId) {
    document.getElementById(modalId).classList.remove('active');
    const form = document.querySelector(`#${modalId} form`);
    if(form) form.reset();
    editMode = null;
}

// Data persistence (API)
async function loadData() {
    try {
        const [subjectsRes, classesRes] = await Promise.all([
            fetch(`${API_BASE}/syllabus/subjects`),
            fetch(`${API_BASE}/classes`)
        ]);
        if (!subjectsRes.ok || !classesRes.ok) throw new Error('Network response was not ok.');
        subjects = await subjectsRes.json();
        classes = await classesRes.json();
    } catch (e) {
        subjects = [];
        classes = [];
        showAlert('Failed to load data from server. Is the backend running?', 'danger');
    }
}

// --- Class Management ---
function renderClasses() {
    const classList = document.getElementById('class-list');
    if (!classList) return;
    classList.innerHTML = '';
    if (classes.length === 0) {
        classList.innerHTML = '<div class="empty-state"><p>No classes found. Add one to get started!</p></div>';
        return;
    }
    classes.forEach(cls => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h4>${cls.name}</h4>
            <p>${cls.description || 'No description'}</p>
            <div class="card-actions">
                <button class="btn btn-secondary" onclick="openClassModal('${cls._id}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteClass('${cls._id}')">Delete</button>
            </div>
        `;
        classList.appendChild(card);
    });
}

window.openClassModal = function(classId = null) {
    const form = document.getElementById('classForm');
    form.reset();
    const modalTitle = document.querySelector('#classModal .modal-title');
    
    if (classId) {
        const cls = classes.find(c => c._id === classId);
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
    e.preventDefault();
    const classData = {
        name: document.getElementById('className').value,
        description: document.getElementById('classDescription').value,
    };

    try {
        let response;
        if (editMode && editMode.type === 'class' && editMode.id) {
            response = await fetch(`${API_BASE}/classes/${editMode.id}`, {
                method: 'PATCH',
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
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to save class');
        }
        
        await loadData();
        renderAll();
        closeModal('classModal');
        showAlert('Class saved successfully!', 'success');
    } catch (error) {
        showAlert(error.message, 'danger');
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
    classes.forEach(cls => {
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
    const subject = subjects.find(s => s._id === subjectId);
    if (!subject) return;
    editMode = { type: 'subject', id: subjectId };
    document.querySelector('#subjectModal .modal-title').textContent = 'Edit Subject';
    document.getElementById('subjectName').value = subject.name;
    document.getElementById('subjectCode').value = subject.code;
    populateClassDropdown(subject.class ? subject.class._id : null);
    document.getElementById('subjectDepartment').value = subject.department;
    document.getElementById('subjectDeadline').value = subject.deadline ? subject.deadline.split('T')[0] : '';
    document.getElementById('subjectDescription').value = subject.description || '';
    openModal('subjectModal');
};

async function saveSubject(e) {
    e.preventDefault();
    const subjectData = {
        name: document.getElementById('subjectName').value,
        code: document.getElementById('subjectCode').value,
        class: document.getElementById('subjectClass').value,
        department: document.getElementById('subjectDepartment').value,
        deadline: document.getElementById('subjectDeadline').value,
        description: document.getElementById('subjectDescription').value,
    };
    
    if (!subjectData.class) {
        showAlert('Please select a class for the subject.', 'danger');
        return;
    }
    
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
        closeModal('subjectModal');
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
    
    if (subjects.length === 0) {
        subjectList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📚</div>
                <h3>No Subjects Created</h3>
                <p>Click the "+ Add Subject" button to get started.</p>
            </div>`;
        return;
    }
    
    subjects.forEach(subject => {
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
        renderAll();
        showAlert('Chapter deleted!', 'success');
    } catch (e) {
        showAlert(e.message, 'danger');
    }
}

window.addTopic = (chapterId) => {
    editMode = null;
    document.querySelector('#topicModal .modal-title').textContent = 'Add New Topic';
    document.getElementById('topicForm').reset();
    document.getElementById('topicChapterId').value = chapterId;
    openModal('topicModal');
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
        renderAll();
        showAlert('Topic deleted!', 'success');
    } catch (e) {
        showAlert(e.message, 'danger');
    }
}

function findChapter(chapterId) {
    for (const subject of subjects) {
        const chapter = subject.chapters.find(c => c._id === chapterId);
        if (chapter) return chapter;
    }
    return null;
}

function findTopic(topicId) {
    for (const subject of subjects) {
        for (const chapter of subject.chapters) {
            const topic = chapter.topics.find(t => t._id === topicId);
            if (topic) return topic;
        }
    }
    return null;
}

// Dashboard Update
function updateDashboard() {
    const totalSubjects = subjects.length;
    const totalChapters = subjects.reduce((sum, s) => sum + (s.chapters ? s.chapters.length : 0), 0);
    const allTopics = subjects.flatMap(s => s.chapters ? s.chapters.flatMap(c => c.topics || []) : []);
    const totalTopics = allTopics.length;
    const completedTopics = allTopics.filter(t => t.completed).length;
    const overallProgress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

    document.getElementById('totalSubjects').textContent = totalSubjects;
    document.getElementById('totalChapters').textContent = totalChapters;
    document.getElementById('totalTopics').textContent = totalTopics;
    document.getElementById('completedTopics').textContent = completedTopics;
    document.getElementById('overallProgress').textContent = `${overallProgress.toFixed(0)}%`;
    
    const overviewContainer = document.getElementById('dashboard-overview');
    if (!overviewContainer) return;

    if (subjects.length === 0) {
        overviewContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📚</div>
                <h3>No subjects added yet</h3>
                <p>Start by adding subjects in the "Manage Subjects" tab</p>
            </div>
        `;
        return;
    }
    
    const groupedByClass = subjects.reduce((acc, subject) => {
        const className = subject.class ? subject.class.name : 'Uncategorized';
        if (!acc[className]) acc[className] = [];
        acc[className].push(subject);
        return acc;
    }, {});

    overviewContainer.innerHTML = Object.entries(groupedByClass).map(([className, classSubjects]) => `
        <div class="class-group">
            <h4>${className}</h4>
            <div class="grid-container">
                ${classSubjects.map(subject => {
                    const subjectTopics = subject.chapters ? subject.chapters.flatMap(c => c.topics || []) : [];
                    const completed = subjectTopics.filter(t => t.completed).length;
                    const total = subjectTopics.length;
                    const progress = total > 0 ? (completed / total) * 100 : 0;
                    return `
                        <div class="card">
                            <div class="card-title">${subject.name}</div>
                            <div class="progress-bar-container">
                                <div class="progress-bar" style="width: ${progress.toFixed(2)}%;"></div>
                            </div>
                            <div class="progress-text">${completed} / ${total} Topics</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `).join('');
}


// Progress View
function renderProgressView() {
    const container = document.getElementById('progressView');
    if (!container) return;
    if (subjects.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📈</div>
                <h3>No progress data available</h3>
                <p>Add subjects and chapters to see progress tracking</p>
            </div>
        `;
        return;
    }
    container.innerHTML = `
        <ul class="progress-list">
            ${subjects.map(subject => {
                const subjectTopics = subject.chapters ? subject.chapters.flatMap(c => c.topics || []) : [];
                const completed = subjectTopics.filter(t => t.completed).length;
                const total = subjectTopics.length;
                const progress = total > 0 ? (completed / total) * 100 : 0;
                return `
                    <li class="progress-item">
                        <div class="progress-item-title">${subject.name} <span class="class-tag">${subject.class ? subject.class.name : ''}</span></div>
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${progress.toFixed(2)}%;">${progress.toFixed(0)}%</div>
                        </div>
                        <div class="progress-item-stats">${completed} / ${total} topics completed</div>
                    </li>
                `;
            }).join('')}
        </ul>
    `;
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