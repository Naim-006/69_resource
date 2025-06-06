import { 
    validateRegistrationForm, 
    setupStudentIdAutoFill, 
    validateLoginForm 
} from '../utils/validation.js';

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in and is CR
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'cr') {
        window.location.href = '../auth/login.html';
        return;
    }

    // Update CR name in header
    document.getElementById('headerUserName').textContent = currentUser.fullName;

    // Initialize all sections
    initializeDashboard();
    setupEventListeners();
});

function initializeDashboard() {
    // Load initial data
    loadSectionMembers();
    loadResources();
    loadSessions();
    loadRecordings();
    loadExams();
    loadAnnouncements();
    updateDashboardStats();
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
    document.getElementById('resourceForm')?.addEventListener('submit', handleResourceSubmit);
    document.getElementById('sessionForm')?.addEventListener('submit', handleSessionSubmit);
    document.getElementById('recordingForm')?.addEventListener('submit', handleRecordingSubmit);

    // Add buttons
    document.querySelectorAll('[onclick^="showModal"]').forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.getAttribute('onclick').match(/'([^']+)'/)[1];
            showModal(modalId);
        });
    });

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
    const recordings = JSON.parse(localStorage.getItem('recordings') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    // Filter by section
    const sectionUsers = users.filter(u => u.section === currentUser.section);
    const sectionResources = resources.filter(r => r.section === currentUser.section);
    const sectionSessions = sessions.filter(s => s.section === currentUser.section);
    const sectionRecordings = recordings.filter(r => r.section === currentUser.section);

    // Update stats
    document.getElementById('sectionMemberCount').textContent = sectionUsers.length;
    document.getElementById('resourceCount').textContent = sectionResources.length;
    document.getElementById('upcomingSessionCount').textContent = sectionSessions.filter(s => new Date(s.date) > new Date()).length;
    document.getElementById('recordingCount').textContent = sectionRecordings.length;
}

// Form Handlers
async function handleResourceSubmit(e) {
    e.preventDefault();
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const formData = new FormData(e.target);
    const resourceData = {
        id: Date.now().toString(),
        title: formData.get('title'),
        subject: formData.get('subject'),
        description: formData.get('description'),
        link: formData.get('link'),
        section: currentUser.section,
        createdBy: currentUser.id,
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
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const formData = new FormData(e.target);
    const sessionData = {
        id: Date.now().toString(),
        title: formData.get('title'),
        subject: formData.get('subject'),
        date: formData.get('date'),
        description: formData.get('description'),
        link: formData.get('link'),
        section: currentUser.section,
        createdBy: currentUser.id,
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
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const formData = new FormData(e.target);
    const recordingData = {
        id: Date.now().toString(),
        title: formData.get('title'),
        subject: formData.get('subject'),
        description: formData.get('description'),
        videoUrl: formData.get('videoUrl'),
        section: currentUser.section,
        createdBy: currentUser.id,
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

// Data Loading Functions
function loadSectionMembers() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const sectionMembers = users.filter(user => 
        user.section === currentUser.section && user.role === 'student'
    );

    const membersList = document.getElementById('sectionMembers');
    if (!membersList) return;

    membersList.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>Section Members (${sectionMembers.length}/50)</h3>
            </div>
            <div class="card-body">
                <div class="members-grid">
                    ${sectionMembers.map(student => `
                        <div class="member-card">
                            <div class="member-info">
                                <h5>${student.fullName}</h5>
                                <p class="text-muted">${student.email}</p>
                                <p class="text-sm">ID: ${student.studentId}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function loadResources() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const resources = JSON.parse(localStorage.getItem('resources') || '[]');
    const sectionResources = resources.filter(resource => 
        resource.section === currentUser.section
    );

    const resourcesList = document.getElementById('resourcesList');
    if (!resourcesList) return;

    resourcesList.innerHTML = sectionResources.length === 0 ? 
        '<p class="text-muted">No resources available</p>' :
        sectionResources.map(resource => `
            <div class="card resource-card">
                <div class="card-body">
                    <h4>${resource.title}</h4>
                    <p class="text-muted">${resource.description}</p>
                    <div class="flex gap-2 mt-3">
                        <a href="${resource.link}" class="btn btn-sm btn-primary" target="_blank">
                            <i class="fas fa-external-link-alt"></i> Open Link
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
}

function loadSessions() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]')
        .filter(s => s.section === currentUser.section);

    const sessionsList = document.getElementById('sessionsList');
    if (!sessionsList) return;

    if (sessions.length === 0) {
        sessionsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times fa-3x"></i>
                <p>No upcoming sessions</p>
            </div>
        `;
        return;
    }

    sessionsList.innerHTML = sessions.map(session => `
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
                </div>
            </div>
        </div>
    `).join('');
}

function loadRecordings() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const recordings = JSON.parse(localStorage.getItem('recordings') || '[]')
        .filter(r => r.section === currentUser.section);

    const recordingsList = document.getElementById('recordingsList');
    if (!recordingsList) return;

    if (recordings.length === 0) {
        recordingsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-video-slash fa-3x"></i>
                <p>No recordings available</p>
            </div>
        `;
        return;
    }

    recordingsList.innerHTML = recordings.map(recording => `
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
                </div>
            </div>
        </div>
    `).join('');
}

function loadExams() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const exams = JSON.parse(localStorage.getItem('exams') || '[]')
        .filter(e => e.section === currentUser.section);

    const examsList = document.getElementById('examsList');
    if (!examsList) return;

    if (exams.length === 0) {
        examsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt fa-3x"></i>
                <p>No exams scheduled</p>
            </div>
        `;
        return;
    }

    examsList.innerHTML = exams.map(exam => `
        <div class="card exam-card">
            <div class="card-body">
                <h4>${exam.title}</h4>
                <p>${exam.description}</p>
                <div class="exam-meta">
                    <span class="badge">${exam.subject}</span>
                    <span class="badge">${new Date(exam.date).toLocaleString()}</span>
                    <span class="badge">Duration: ${exam.duration} minutes</span>
                </div>
            </div>
        </div>
    `).join('');
}

function loadAnnouncements() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const announcements = JSON.parse(localStorage.getItem('announcements') || '[]')
        .filter(a => a.section === currentUser.section);

    const announcementsList = document.getElementById('announcementsList');
    if (!announcementsList) return;

    if (announcements.length === 0) {
        announcementsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bullhorn fa-3x"></i>
                <p>No announcements</p>
            </div>
        `;
        return;
    }

    announcementsList.innerHTML = announcements.map(announcement => `
        <div class="card announcement-card">
            <div class="card-body">
                <h4>${announcement.title}</h4>
                <p>${announcement.content}</p>
                <div class="announcement-meta">
                    <span class="badge">${new Date(announcement.createdAt).toLocaleString()}</span>
                </div>
            </div>
        </div>
    `).join('');
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