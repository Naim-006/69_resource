import { 
    validateRegistrationForm, 
    setupStudentIdAutoFill, 
    validateLoginForm,
    validateForm,
    showValidationErrors,
    clearValidationErrors
} from '../utils/validation.js';

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in and is admin
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = '../auth/login.html';
        return;
    }

    // Update admin name in header
    document.getElementById('adminName').textContent = currentUser.fullName;

    // Initialize all sections
    initializeDashboard();
    setupEventListeners();
});

function initializeDashboard() {
    // Load initial data
    loadDashboardData();
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = item.getAttribute('data-section');
            showSection(targetSection);
        });
    });

    // Form submissions
    document.getElementById('sectionForm')?.addEventListener('submit', handleSectionSubmit);
    document.getElementById('resourceForm')?.addEventListener('submit', handleResourceSubmit);
    document.getElementById('sessionForm')?.addEventListener('submit', handleSessionSubmit);
    document.getElementById('recordingForm')?.addEventListener('submit', handleRecordingSubmit);
    document.getElementById('examForm')?.addEventListener('submit', handleExamSubmit);
    document.getElementById('announcementForm')?.addEventListener('submit', handleAnnouncementSubmit);
    document.getElementById('userForm')?.addEventListener('submit', handleUserSubmit);

    // Filter changes
    document.getElementById('resourceFilter')?.addEventListener('change', filterResources);
    document.getElementById('sessionFilter')?.addEventListener('change', filterSessions);
    document.getElementById('recordingFilter')?.addEventListener('change', filterRecordings);
    document.getElementById('examFilter')?.addEventListener('change', filterExams);
    document.getElementById('userFilter')?.addEventListener('change', filterUsers);

    // Add buttons
    document.getElementById('addResourceBtn')?.addEventListener('click', () => showModal('resourceModal'));
    document.getElementById('addSessionBtn')?.addEventListener('click', () => showModal('sessionModal'));
    document.getElementById('addRecordingBtn')?.addEventListener('click', () => showModal('recordingModal'));
    document.getElementById('addExamBtn')?.addEventListener('click', () => showModal('examModal'));
    document.getElementById('addAnnouncementBtn')?.addEventListener('click', () => showModal('announcementModal'));
    document.getElementById('addUserBtn')?.addEventListener('click', () => showModal('userModal'));

    // Close buttons
    document.querySelectorAll('.close-btn, .close-modal').forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal.id);
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
}

// Section Navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === sectionId) {
            item.classList.add('active');
        }
    });
}

// Dashboard Stats
function updateDashboardStats() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const resources = JSON.parse(localStorage.getItem('resources') || '[]');
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');

    // Update stats
    document.getElementById('totalStudents').textContent = users.filter(u => u.role === 'student').length;
    document.getElementById('totalCRs').textContent = users.filter(u => u.role === 'cr').length;
    document.getElementById('totalResources').textContent = resources.length;
    document.getElementById('upcomingSessions').textContent = sessions.filter(s => new Date(s.date) > new Date()).length;
}

// Form Handlers
async function handleSectionSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const sectionData = {
        id: Date.now().toString(),
        number: formData.get('sectionNumber'),
        capacity: formData.get('sectionCapacity'),
        description: formData.get('sectionDescription'),
        createdAt: new Date().toISOString()
    };

    try {
        const sections = JSON.parse(localStorage.getItem('sections') || '[]');
        sections.push(sectionData);
        localStorage.setItem('sections', JSON.stringify(sections));
        
        closeModal('sectionModal');
        loadSections();
        showSuccess('Section added successfully');
        e.target.reset();
    } catch (error) {
        showError('Failed to add section');
    }
}

async function handleResourceSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const resourceData = {
        id: Date.now().toString(),
        title: formData.get('title'),
        subject: formData.get('subject'),
        description: formData.get('description'),
        link: formData.get('link'),
        createdAt: new Date().toISOString()
    };

    try {
        const resources = JSON.parse(localStorage.getItem('resources') || '[]');
        resources.push(resourceData);
        localStorage.setItem('resources', JSON.stringify(resources));
        
        closeModal('resourceModal');
        loadResources();
        showSuccess('Resource added successfully');
        e.target.reset();
    } catch (error) {
        showError('Failed to add resource');
    }
}

async function handleSessionSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const sessionData = {
        id: Date.now().toString(),
        title: formData.get('title'),
        subject: formData.get('subject'),
        date: formData.get('date'),
        description: formData.get('description'),
        link: formData.get('link'),
        createdAt: new Date().toISOString()
    };

    try {
        const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
        sessions.push(sessionData);
        localStorage.setItem('sessions', JSON.stringify(sessions));
        
        closeModal('sessionModal');
        loadSessions();
        showSuccess('Session scheduled successfully');
        e.target.reset();
    } catch (error) {
        showError('Failed to schedule session');
    }
}

async function handleRecordingSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const recordingData = {
        id: Date.now().toString(),
        title: formData.get('title'),
        subject: formData.get('subject'),
        description: formData.get('description'),
        videoUrl: formData.get('videoUrl'),
        createdAt: new Date().toISOString()
    };

    try {
        const recordings = JSON.parse(localStorage.getItem('recordings') || '[]');
        recordings.push(recordingData);
        localStorage.setItem('recordings', JSON.stringify(recordings));
        
        closeModal('recordingModal');
        loadRecordings();
        showSuccess('Recording added successfully');
        e.target.reset();
    } catch (error) {
        showError('Failed to add recording');
    }
}

async function handleExamSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const examData = {
        id: Date.now().toString(),
        title: formData.get('title'),
        subject: formData.get('subject'),
        date: formData.get('date'),
        duration: formData.get('duration'),
        description: formData.get('description'),
        createdAt: new Date().toISOString()
    };

    try {
        const exams = JSON.parse(localStorage.getItem('exams') || '[]');
        exams.push(examData);
        localStorage.setItem('exams', JSON.stringify(exams));
        
        closeModal('examModal');
        loadExams();
        showSuccess('Exam added successfully');
        e.target.reset();
    } catch (error) {
        showError('Failed to add exam');
    }
}

async function handleAnnouncementSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const announcementData = {
        id: Date.now().toString(),
        title: formData.get('title'),
        content: formData.get('content'),
        createdAt: new Date().toISOString()
    };

    try {
        const announcements = JSON.parse(localStorage.getItem('announcements') || '[]');
        announcements.push(announcementData);
        localStorage.setItem('announcements', JSON.stringify(announcements));
        
        closeModal('announcementModal');
        loadAnnouncements();
        showSuccess('Announcement added successfully');
        e.target.reset();
    } catch (error) {
        showError('Failed to add announcement');
    }
}

async function handleUserSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userData = {
        id: Date.now().toString(),
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role'),
        studentId: formData.get('studentId'),
        section: formData.get('section'),
        createdAt: new Date().toISOString()
    };

    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        users.push(userData);
        localStorage.setItem('users', JSON.stringify(users));
        
        closeModal('userModal');
        loadUsers();
        showSuccess('User added successfully');
        e.target.reset();
    } catch (error) {
        showError('Failed to add user');
    }
}

// Data Loading Functions
function loadSections() {
    const sections = JSON.parse(localStorage.getItem('sections') || '[]');
    const sectionsList = document.getElementById('sectionsList');
    if (!sectionsList) return;

    sectionsList.innerHTML = sections.map(section => `
        <div class="card section-card">
            <div class="card-body">
                <h4>Section ${section.number}</h4>
                <p>${section.description}</p>
                <div class="section-meta">
                    <span class="badge">Capacity: ${section.capacity}</span>
                </div>
                <div class="section-actions">
                    <button class="btn btn-primary" onclick="editSection('${section.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger" onclick="deleteSection('${section.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function loadResources() {
    const resources = JSON.parse(localStorage.getItem('resources') || '[]');
    const resourceList = document.getElementById('resourceList');
    if (!resourceList) return;

    resourceList.innerHTML = resources.map(resource => `
        <div class="card resource-card">
            <div class="card-body">
                <h4>${resource.title}</h4>
                <p>${resource.description}</p>
                <div class="resource-meta">
                    <span class="badge">${resource.subject}</span>
                </div>
                <div class="resource-actions">
                    <a href="${resource.link}" class="btn btn-primary" target="_blank">
                        <i class="fas fa-external-link-alt"></i> View
                    </a>
                    <button class="btn btn-danger" onclick="deleteResource('${resource.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function loadSessions() {
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    const sessionList = document.getElementById('sessionList');
    if (!sessionList) return;

    sessionList.innerHTML = sessions.map(session => `
        <div class="card session-card">
            <div class="card-body">
                <h4>${session.title}</h4>
                <p>${session.description}</p>
                <div class="session-meta">
                    <span class="badge">${session.subject}</span>
                    <span class="badge">${new Date(session.date).toLocaleString()}</span>
                </div>
                <div class="session-actions">
                    ${session.link ? `
                        <a href="${session.link}" class="btn btn-primary" target="_blank">
                            <i class="fas fa-video"></i> Join
                        </a>
                    ` : ''}
                    <button class="btn btn-danger" onclick="deleteSession('${session.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function loadRecordings() {
    const recordings = JSON.parse(localStorage.getItem('recordings') || '[]');
    const recordingList = document.getElementById('recordingList');
    if (!recordingList) return;

    recordingList.innerHTML = recordings.map(recording => `
        <div class="card recording-card">
            <div class="card-body">
                <h4>${recording.title}</h4>
                <p>${recording.description}</p>
                <div class="recording-meta">
                    <span class="badge">${recording.subject}</span>
                    <span class="badge">${new Date(recording.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="recording-actions">
                    <a href="${recording.videoUrl}" class="btn btn-primary" target="_blank">
                        <i class="fas fa-play"></i> Watch
                    </a>
                    <button class="btn btn-danger" onclick="deleteRecording('${recording.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function loadExams() {
    const exams = JSON.parse(localStorage.getItem('exams') || '[]');
    const examList = document.getElementById('examList');
    if (!examList) return;

    examList.innerHTML = exams.map(exam => `
        <div class="card exam-card">
            <div class="card-body">
                <h4>${exam.title}</h4>
                <p>${exam.description}</p>
                <div class="exam-meta">
                    <span class="badge">${exam.subject}</span>
                    <span class="badge">${new Date(exam.date).toLocaleString()}</span>
                    <span class="badge">Duration: ${exam.duration} minutes</span>
                </div>
                <div class="exam-actions">
                    <button class="btn btn-danger" onclick="deleteExam('${exam.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function loadAnnouncements() {
    const announcements = JSON.parse(localStorage.getItem('announcements') || '[]');
    const announcementList = document.getElementById('announcementList');
    if (!announcementList) return;

    announcementList.innerHTML = announcements.map(announcement => `
        <div class="card announcement-card">
            <div class="card-body">
                <h4>${announcement.title}</h4>
                <p>${announcement.content}</p>
                <div class="announcement-meta">
                    <span class="badge">${new Date(announcement.createdAt).toLocaleString()}</span>
                </div>
                <div class="announcement-actions">
                    <button class="btn btn-danger" onclick="deleteAnnouncement('${announcement.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function loadUsers() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userList = document.getElementById('userList');
    if (!userList) return;

    userList.innerHTML = users.map(user => `
        <div class="card user-card">
            <div class="card-body">
                <h4>${user.fullName}</h4>
                <p>${user.email}</p>
                <div class="user-meta">
                    <span class="badge badge-${user.role}">${user.role.toUpperCase()}</span>
                    ${user.studentId ? `<span class="badge">ID: ${user.studentId}</span>` : ''}
                    ${user.section ? `<span class="badge">Section: ${user.section}</span>` : ''}
                </div>
                <div class="user-actions">
                    <button class="btn btn-primary" onclick="editUser('${user.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger" onclick="deleteUser('${user.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Filter Functions
function filterResources() {
    const filter = document.getElementById('resourceFilter').value;
    const resources = document.querySelectorAll('.resource-card');
    
    resources.forEach(resource => {
        if (filter === 'all' || resource.querySelector('.badge').textContent === filter) {
            resource.style.display = 'block';
        } else {
            resource.style.display = 'none';
        }
    });
}

function filterSessions() {
    const filter = document.getElementById('sessionFilter').value;
    const sessions = document.querySelectorAll('.session-card');
    
    sessions.forEach(session => {
        if (filter === 'all' || session.querySelector('.badge').textContent === filter) {
            session.style.display = 'block';
        } else {
            session.style.display = 'none';
        }
    });
}

function filterRecordings() {
    const filter = document.getElementById('recordingFilter').value;
    const recordings = document.querySelectorAll('.recording-card');
    
    recordings.forEach(recording => {
        if (filter === 'all' || recording.querySelector('.badge').textContent === filter) {
            recording.style.display = 'block';
        } else {
            recording.style.display = 'none';
        }
    });
}

function filterExams() {
    const filter = document.getElementById('examFilter').value;
    const exams = document.querySelectorAll('.exam-card');
    
    exams.forEach(exam => {
        if (filter === 'all' || exam.querySelector('.badge').textContent === filter) {
            exam.style.display = 'block';
        } else {
            exam.style.display = 'none';
        }
    });
}

function filterUsers() {
    const filter = document.getElementById('userFilter').value;
    const users = document.querySelectorAll('.user-card');
    
    users.forEach(user => {
        if (filter === 'all' || user.querySelector('.badge').textContent.toLowerCase() === filter) {
            user.style.display = 'block';
        } else {
            user.style.display = 'none';
        }
    });
}

// Modal Functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Delete Functions
function deleteSection(sectionId) {
    if (!confirm('Are you sure you want to delete this section?')) return;

    try {
        const sections = JSON.parse(localStorage.getItem('sections') || '[]');
        const updatedSections = sections.filter(section => section.id !== sectionId);
        localStorage.setItem('sections', JSON.stringify(updatedSections));
        
        loadSections();
        showSuccess('Section deleted successfully');
    } catch (error) {
        showError('Failed to delete section');
    }
}

function deleteResource(resourceId) {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
        const resources = JSON.parse(localStorage.getItem('resources') || '[]');
        const updatedResources = resources.filter(resource => resource.id !== resourceId);
        localStorage.setItem('resources', JSON.stringify(updatedResources));
        
        loadResources();
        showSuccess('Resource deleted successfully');
    } catch (error) {
        showError('Failed to delete resource');
    }
}

function deleteSession(sessionId) {
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
        const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
        const updatedSessions = sessions.filter(session => session.id !== sessionId);
        localStorage.setItem('sessions', JSON.stringify(updatedSessions));
        
        loadSessions();
        showSuccess('Session deleted successfully');
    } catch (error) {
        showError('Failed to delete session');
    }
}

function deleteRecording(recordingId) {
    if (!confirm('Are you sure you want to delete this recording?')) return;

    try {
        const recordings = JSON.parse(localStorage.getItem('recordings') || '[]');
        const updatedRecordings = recordings.filter(recording => recording.id !== recordingId);
        localStorage.setItem('recordings', JSON.stringify(updatedRecordings));
        
        loadRecordings();
        showSuccess('Recording deleted successfully');
    } catch (error) {
        showError('Failed to delete recording');
    }
}

function deleteExam(examId) {
    if (!confirm('Are you sure you want to delete this exam?')) return;

    try {
        const exams = JSON.parse(localStorage.getItem('exams') || '[]');
        const updatedExams = exams.filter(exam => exam.id !== examId);
        localStorage.setItem('exams', JSON.stringify(updatedExams));
        
        loadExams();
        showSuccess('Exam deleted successfully');
    } catch (error) {
        showError('Failed to delete exam');
    }
}

function deleteAnnouncement(announcementId) {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
        const announcements = JSON.parse(localStorage.getItem('announcements') || '[]');
        const updatedAnnouncements = announcements.filter(announcement => announcement.id !== announcementId);
        localStorage.setItem('announcements', JSON.stringify(updatedAnnouncements));
        
        loadAnnouncements();
        showSuccess('Announcement deleted successfully');
    } catch (error) {
        showError('Failed to delete announcement');
    }
}

function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const updatedUsers = users.filter(user => user.id !== userId);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        
        loadUsers();
        showSuccess('User deleted successfully');
    } catch (error) {
        showError('Failed to delete user');
    }
}

// Edit Functions
function editSection(sectionId) {
    const sections = JSON.parse(localStorage.getItem('sections') || '[]');
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const form = document.getElementById('sectionForm');
    form.querySelector('[name="sectionNumber"]').value = section.number;
    form.querySelector('[name="sectionCapacity"]').value = section.capacity;
    form.querySelector('[name="sectionDescription"]').value = section.description;

    showModal('sectionModal');
}

function editUser(userId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const form = document.getElementById('userForm');
    form.querySelector('[name="fullName"]').value = user.fullName;
    form.querySelector('[name="email"]').value = user.email;
    form.querySelector('[name="role"]').value = user.role;
    form.querySelector('[name="studentId"]').value = user.studentId || '';
    form.querySelector('[name="section"]').value = user.section || '';

    showModal('userModal');
}

// Notification Functions
function showSuccess(message) {
    // TODO: Implement success notification
    console.log('Success:', message);
}

function showError(message) {
    // TODO: Implement error notification
    console.error('Error:', message);
}

// Logout
function handleLogout() {
    localStorage.removeItem('currentUser');
    window.location.href = '../auth/login.html';
}

// Load dashboard data
async function loadDashboardData() {
    try {
        // Load overview stats
        await loadOverviewStats();
        
        // Load sections
        await loadSections();
        
        // Load resources
        await loadResources();
        
        // Load sessions
        await loadSessions();
        
        // Load recordings
        await loadRecordings();
        
        // Load exams
        await loadExams();
        
        // Load announcements
        await loadAnnouncements();
        
        // Load users
        await loadUsers();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}

// Load overview stats
async function loadOverviewStats() {
    try {
        // Simulate API call
        const stats = {
            totalStudents: 150,
            totalCRs: 5,
            totalResources: 45,
            upcomingSessions: 3
        };

        // Update UI
        document.getElementById('totalStudents').textContent = stats.totalStudents;
        document.getElementById('totalCRs').textContent = stats.totalCRs;
        document.getElementById('totalResources').textContent = stats.totalResources;
        document.getElementById('upcomingSessions').textContent = stats.upcomingSessions;
    } catch (error) {
        console.error('Error loading overview stats:', error);
        showNotification('Error loading overview stats', 'error');
    }
}

// Show notification
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Add to document
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Export functions for use in other modules
export {
    showModal,
    showNotification,
    loadDashboardData
}; 