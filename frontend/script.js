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

    // Initialize date inputs with default values
    const todayDate = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(todayDate.getDate() + 30);
    
    document.getElementById('taskStartDate').value = todayDate.toISOString().split('T')[0];
    document.getElementById('taskEndDate').value = thirtyDaysLater.toISOString().split('T')[0];
    document.getElementById('taskDate').value = todayDate.toISOString().split('T')[0];
    
    updateDashboard();
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
    else if (tabName === 'tasks') loadTasks();
    else if (tabName === 'reports') loadReports();
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

    const filteredClasses = classes.filter(cls => cls.name.toLowerCase().includes(searchTerm));

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
        const subjectCount = subjects.filter(s => s.class && s.class._id === cls._id).length;

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
        await loadTasks(); // Refresh the task list
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
        await loadTasks(); // Refresh the task list
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
    const overviewContainer = document.getElementById('dashboard-overview');

    let totalChapters = 0;
    let totalTopics = 0;
    let completedTopics = 0;

    subjects.forEach(subject => {
        totalChapters += subject.chapters.length;
        subject.chapters.forEach(chapter => {
            totalTopics += chapter.topics.length;
            completedTopics += chapter.topics.filter(t => t.completed).length;
        });
    });

    const overallProgress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

    if(totalSubjectsEl) totalSubjectsEl.textContent = subjects.length;
    if(totalChaptersEl) totalChaptersEl.textContent = totalChapters;
    if(totalTopicsEl) totalTopicsEl.textContent = totalTopics;
    if(completedTopicsEl) completedTopicsEl.textContent = completedTopics;
    if(overallProgressEl) overallProgressEl.textContent = `${Math.round(overallProgress)}%`;

    // Group subjects by name for the overview
    const groupedSubjects = subjects.reduce((acc, subject) => {
        if (!acc[subject.name]) {
            acc[subject.name] = [];
        }
        acc[subject.name].push(subject);
        return acc;
    }, {});

    overviewContainer.innerHTML = '';
    if (Object.keys(groupedSubjects).length === 0) {
        overviewContainer.innerHTML = `<div class="empty-state">
            <div class="empty-state-icon">📚</div>
            <h3>No subjects added yet</h3>
            <p>Start by adding subjects in the "Manage Subjects" tab</p>
        </div>`;
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'grid-container';

    for (const subjectName in groupedSubjects) {
        const classSubjects = groupedSubjects[subjectName];
        
        const groupTotalTopics = classSubjects.reduce((sum, s) => sum + s.chapters.reduce((c_sum, c) => c_sum + c.topics.length, 0), 0);
        const groupCompletedTopics = classSubjects.reduce((sum, s) => sum + s.chapters.reduce((c_sum, c) => c_sum + c.topics.filter(t => t.completed).length, 0), 0);
        const groupProgress = groupTotalTopics > 0 ? (groupCompletedTopics / groupTotalTopics) * 100 : 0;
        const progressColor = groupProgress >= 80 ? 'high' : groupProgress >= 40 ? 'medium' : 'low';

        const groupEl = document.createElement('div');
        groupEl.className = 'dashboard-subject-group';

        const summaryCard = document.createElement('div');
        summaryCard.className = 'dashboard-summary-card';
        summaryCard.innerHTML = `
            <div class="dashboard-summary-title">${subjectName}</div>
            <div class="progress-bar-container">
                <div class="progress-bar ${progressColor}" style="width: ${groupProgress}%"></div>
            </div>
            <div class="dashboard-summary-classes">${classSubjects.length} ${classSubjects.length > 1 ? 'classes' : 'class'}</div>
        `;

        const detailsContainer = document.createElement('div');
        detailsContainer.className = 'dashboard-details';
        detailsContainer.style.display = 'none';

        classSubjects.forEach(subject => {
            const totalTopics = subject.chapters.reduce((sum, chap) => sum + chap.topics.length, 0);
            const completedTopics = subject.chapters.reduce((sum, chap) => sum + chap.topics.filter(t => t.completed).length, 0);
            const progress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
            const progressColor = progress >= 80 ? 'high' : progress >= 40 ? 'medium' : 'low';

            const detailItem = document.createElement('div');
            detailItem.className = 'dashboard-detail-item';
            detailItem.innerHTML = `
                <div class="dashboard-detail-class">
                    ${subject.class.name} (Subject Code: ${subject.code})
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar ${progressColor}" style="width: ${progress}%"></div>
                </div>
                <div class="progress-text">${Math.round(progress)}%</div>
            `;
            detailsContainer.appendChild(detailItem);
        });

        groupEl.appendChild(summaryCard);
        groupEl.appendChild(detailsContainer);

        summaryCard.addEventListener('click', () => {
            summaryCard.classList.toggle('active');
            detailsContainer.style.display = detailsContainer.style.display === 'none' ? 'block' : 'none';
        });

        grid.appendChild(groupEl);
    }
    overviewContainer.appendChild(grid);
}


// Progress View
function renderProgressView() {
    const progressView = document.getElementById('progressView');
    progressView.innerHTML = '';

    if (subjects.length === 0) {
        progressView.innerHTML = `<div class="empty-state">
            <div class="empty-state-icon">📈</div>
            <h3>No progress data available</h3>
            <p>Add subjects and chapters to see progress tracking</p>
        </div>`;
        return;
    }

    const list = document.createElement('div');
    list.className = 'progress-list';

    subjects.forEach(subject => {
        const totalTopics = subject.chapters.reduce((sum, chap) => sum + chap.topics.length, 0);
        const completedTopics = subject.chapters.reduce((sum, chap) => sum + chap.topics.filter(t => t.completed).length, 0);
        const progress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
        const progressColor = progress >= 80 ? 'high' : progress >= 40 ? 'medium' : 'low';

        const item = document.createElement('div');
        item.className = 'progress-view-item'; // Use the new class here

        item.innerHTML = `
            <div class="progress-item-title">
                ${subject.name}
                <span class="class-tag">${subject.class.name}</span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar ${progressColor}" style="width: ${progress}%"></div>
            </div>
            <div class="progress-text">${completedTopics} / ${totalTopics} Topics Completed (${Math.round(progress)}%)</div>
            <div class="progress-item-stats">
                Due: ${new Date(subject.deadline).toLocaleDateString()}
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
        
        if (!startDate || !endDate) {
            showAlert('Please select both start and end dates', 'error');
            return;
        }
        
        if (new Date(startDate) > new Date(endDate)) {
            showAlert('Start date must be before end date', 'error');
            return;
        }
        
        showAlert('Generating daily tasks for next incomplete topics...', 'info');
        
        const response = await fetch(`${API_BASE}/tasks/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startDate, endDate })
        });
        
        if (response.ok) {
            const result = await response.json();
            
            // Show the main success message
            showAlert(result.message, 'success');
            
            // If there are overdue topics, show them prominently
            if (result.overdueCount > 0) {
                showOverdueTopicsAlert(result.overdueTopics, result.overdueCount);
            }
            
            loadTasks(); // Refresh the task list
        } else {
            const error = await response.json();
            showAlert(error.message || 'Failed to generate tasks', 'error');
        }
    } catch (error) {
        showAlert('Error generating tasks', 'error');
        console.error('Error:', error);
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
        const response = await fetch(`${API_BASE}/tasks/${taskId}/complete`, {
            method: 'PATCH'
        });
        if (!response.ok) throw new Error('Failed to update task');
        await loadTasks();
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