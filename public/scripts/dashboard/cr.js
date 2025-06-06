// CR Dashboard Script

// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.dashboard-section');
const headerUserName = document.getElementById('headerUserName');
const logoutBtn = document.getElementById('logoutBtn');

// Modal Elements
const modals = document.querySelectorAll('.modal');
const closeModalBtns = document.querySelectorAll('.close-modal');
const addResourceBtn = document.getElementById('addResourceBtn');
const addSessionBtn = document.getElementById('addSessionBtn');
const addRecordingBtn = document.getElementById('addRecordingBtn');

// Current user
let currentUser = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in and is CR
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || (currentUser.role !== 'cr' && currentUser.role !== 'co_cr')) {
        window.location.href = '../auth/login.html';
        return;
    }

    // Initialize dashboard
    initializeDashboard();
    setupEventListeners();
});

// Initialize dashboard components
function initializeDashboard() {
    // Set user info in header
    headerUserName.textContent = currentUser.fullName;

    // Load initial data
    loadDashboardData();
}

// Load dashboard data
function loadDashboardData() {
    loadSectionOverview();
    loadSectionMembers();
    loadSectionResources();
    loadSectionSessions();
    loadSectionRecordings();
    loadSectionExams();
    loadSectionAnnouncements();
    loadPendingApprovals();
}

// Load section overview
function loadSectionOverview() {
    const students = JSON.parse(localStorage.getItem('users') || '[]')
        .filter(user => user.role === 'student' && user.section === currentUser.section);
    
    const resources = JSON.parse(localStorage.getItem('resources') || '[]')
        .filter(resource => resource.section === currentUser.section);
    
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]')
        .filter(session => session.section === currentUser.section);
    
    const recordings = JSON.parse(localStorage.getItem('recordings') || '[]')
        .filter(recording => recording.section === currentUser.section);
    
    document.getElementById('sectionMemberCount').textContent = students.length;
    document.getElementById('resourceCount').textContent = resources.length;
    document.getElementById('upcomingSessionCount').textContent = sessions.length;
    document.getElementById('recordingCount').textContent = recordings.length;

    // Load upcoming events
    loadUpcomingEvents();
}

// Load upcoming events
function loadUpcomingEvents() {
    const eventsList = document.getElementById('upcomingEventsList');
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]')
        .filter(session => session.section === currentUser.section)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);

    if (sessions.length === 0) {
        eventsList.innerHTML = '<p class="no-data">No upcoming events</p>';
        return;
    }

    eventsList.innerHTML = sessions.map(session => `
        <div class="event-card">
            <div class="event-icon">
                <i class="fas fa-calendar"></i>
            </div>
            <div class="event-info">
                <h4>${session.title}</h4>
                <p>${new Date(session.date).toLocaleString()}</p>
            </div>
        </div>
    `).join('');
}

// Load section members
function loadSectionMembers() {
    const membersList = document.getElementById('sectionMembers');
    const students = JSON.parse(localStorage.getItem('users') || '[]')
        .filter(user => user.role === 'student' && user.section === currentUser.section);

    if (students.length === 0) {
        membersList.innerHTML = '<p class="no-data">No members found</p>';
        return;
    }

    membersList.innerHTML = students.map(student => `
        <div class="member-card">
            <div class="member-info">
                <h4>${student.fullName}</h4>
                <p>${student.email}</p>
                <p>Student ID: ${student.studentId}</p>
            </div>
        </div>
    `).join('');
}

// Load section resources
function loadSectionResources() {
    const resourcesList = document.getElementById('resourcesList');
    const resources = JSON.parse(localStorage.getItem('resources') || '[]')
        .filter(resource => resource.section === currentUser.section);

    if (resources.length === 0) {
        resourcesList.innerHTML = '<p class="no-data">No resources available</p>';
        return;
    }

    resourcesList.innerHTML = resources.map(resource => `
        <div class="resource-card">
            <div class="resource-info">
                <h4>${resource.title}</h4>
                <p>${resource.description}</p>
                <p class="text-muted">Subject: ${resource.subject}</p>
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
    `).join('');
}

// Load section sessions
function loadSectionSessions() {
    const sessionsList = document.getElementById('sessionsList');
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]')
        .filter(session => session.section === currentUser.section)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (sessions.length === 0) {
        sessionsList.innerHTML = '<p class="no-data">No sessions scheduled</p>';
        return;
    }

    sessionsList.innerHTML = sessions.map(session => `
        <div class="session-card">
            <div class="session-info">
                <h4>${session.title}</h4>
                <p>${session.description}</p>
                <p class="text-muted">Subject: ${session.subject}</p>
                <p class="text-muted">Date: ${new Date(session.date).toLocaleString()}</p>
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
    `).join('');
}

// Load section recordings
function loadSectionRecordings() {
    const recordingsList = document.getElementById('recordingsList');
    const recordings = JSON.parse(localStorage.getItem('recordings') || '[]')
        .filter(recording => recording.section === currentUser.section);

    if (recordings.length === 0) {
        recordingsList.innerHTML = '<p class="no-data">No recordings available</p>';
        return;
    }

    recordingsList.innerHTML = recordings.map(recording => `
        <div class="recording-card">
            <div class="recording-info">
                <h4>${recording.title}</h4>
                <p>${recording.description}</p>
                <p class="text-muted">Subject: ${recording.subject}</p>
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
    `).join('');
}

// Load section exams
function loadSectionExams() {
    const examsList = document.getElementById('examsList');
    const exams = JSON.parse(localStorage.getItem('exams') || '[]')
        .filter(exam => exam.section === currentUser.section)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (exams.length === 0) {
        examsList.innerHTML = '<p class="no-data">No exams scheduled</p>';
        return;
    }

    examsList.innerHTML = exams.map(exam => `
        <div class="exam-card">
            <div class="exam-info">
                <h4>${exam.title}</h4>
                <p>${exam.description}</p>
                <p class="text-muted">Subject: ${exam.subject}</p>
                <p class="text-muted">Date: ${new Date(exam.date).toLocaleString()}</p>
            </div>
        </div>
    `).join('');
}

// Load section announcements
function loadSectionAnnouncements() {
    const announcementsList = document.getElementById('announcementsList');
    const announcements = JSON.parse(localStorage.getItem('announcements') || '[]')
        .filter(announcement => announcement.section === currentUser.section)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (announcements.length === 0) {
        announcementsList.innerHTML = '<p class="no-data">No announcements</p>';
        return;
    }

    announcementsList.innerHTML = announcements.map(announcement => `
        <div class="announcement-card">
            <div class="announcement-info">
                <h4>${announcement.title}</h4>
                <p>${announcement.content}</p>
                <p class="text-muted">Posted: ${new Date(announcement.date).toLocaleString()}</p>
            </div>
        </div>
    `).join('');
}

// Load pending approvals
function loadPendingApprovals() {
    const approvalsList = document.getElementById('pendingApprovalsList');
    const requests = JSON.parse(localStorage.getItem('approvalRequests') || '[]')
        .filter(req => req.section === currentUser.section && req.status === 'pending');

    if (requests.length === 0) {
        approvalsList.innerHTML = '<p class="no-data">No pending approvals</p>';
        return;
    }

    approvalsList.innerHTML = requests.map(request => `
        <div class="approval-card">
            <div class="approval-info">
                <h4>${request.fullName}</h4>
                <p>${request.email}</p>
                <p>Student ID: ${request.studentId}</p>
                <p class="text-muted">Requested: ${new Date(request.requestedAt).toLocaleString()}</p>
            </div>
            <div class="approval-actions">
                <button class="btn btn-success" onclick="approveStudent('${request.id}')">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="btn btn-danger" onclick="rejectStudent('${request.id}')">
                    <i class="fas fa-times"></i> Reject
                </button>
            </div>
        </div>
    `).join('');
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = item.dataset.section;
            
            // Update active states
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Show target section
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection) {
                    section.classList.add('active');
                }
            });
        });
    });

    // Close modals
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            modal.style.display = 'none';
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Add resource button
    addResourceBtn.addEventListener('click', () => {
        const modal = document.getElementById('resourceModal');
        if (modal) {
            modal.style.display = 'block';
        }
    });

    // Add session button
    addSessionBtn.addEventListener('click', () => {
        const modal = document.getElementById('sessionModal');
        if (modal) {
            modal.style.display = 'block';
        }
    });

    // Add recording button
    addRecordingBtn.addEventListener('click', () => {
        const modal = document.getElementById('recordingModal');
        if (modal) {
            modal.style.display = 'block';
        }
    });

    // Form submissions
    document.getElementById('resourceForm').addEventListener('submit', handleResourceSubmit);
    document.getElementById('sessionForm').addEventListener('submit', handleSessionSubmit);
    document.getElementById('recordingForm').addEventListener('submit', handleRecordingSubmit);

    // Logout
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = '../auth/login.html';
    });
}

// Handle resource submission
async function handleResourceSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = {
        id: Date.now().toString(),
        title: form.title.value,
        subject: form.subject.value,
        description: form.description.value,
        link: form.link.value,
        section: currentUser.section,
        createdAt: new Date().toISOString()
    };

    const resources = JSON.parse(localStorage.getItem('resources') || '[]');
    resources.push(formData);
    localStorage.setItem('resources', JSON.stringify(resources));

    // Close modal and reload
    form.closest('.modal').style.display = 'none';
    form.reset();
    loadSectionResources();
}

// Handle session submission
async function handleSessionSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = {
        id: Date.now().toString(),
        title: form.title.value,
        subject: form.subject.value,
        description: form.description.value,
        date: form.date.value,
        link: form.link.value,
        section: currentUser.section,
        createdAt: new Date().toISOString()
    };

    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    sessions.push(formData);
    localStorage.setItem('sessions', JSON.stringify(sessions));

    // Close modal and reload
    form.closest('.modal').style.display = 'none';
    form.reset();
    loadSectionSessions();
}

// Handle recording submission
async function handleRecordingSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = {
        id: Date.now().toString(),
        title: form.title.value,
        subject: form.subject.value,
        description: form.description.value,
        videoUrl: form.videoUrl.value,
        section: currentUser.section,
        createdAt: new Date().toISOString()
    };

    const recordings = JSON.parse(localStorage.getItem('recordings') || '[]');
    recordings.push(formData);
    localStorage.setItem('recordings', JSON.stringify(recordings));

    // Close modal and reload
    form.closest('.modal').style.display = 'none';
    form.reset();
    loadSectionRecordings();
}

// Delete resource
function deleteResource(id) {
    if (confirm('Are you sure you want to delete this resource?')) {
        const resources = JSON.parse(localStorage.getItem('resources') || '[]');
        const updatedResources = resources.filter(resource => resource.id !== id);
        localStorage.setItem('resources', JSON.stringify(updatedResources));
        loadSectionResources();
    }
}

// Delete session
function deleteSession(id) {
    if (confirm('Are you sure you want to delete this session?')) {
        const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
        const updatedSessions = sessions.filter(session => session.id !== id);
        localStorage.setItem('sessions', JSON.stringify(updatedSessions));
        loadSectionSessions();
    }
}

// Delete recording
function deleteRecording(id) {
    if (confirm('Are you sure you want to delete this recording?')) {
        const recordings = JSON.parse(localStorage.getItem('recordings') || '[]');
        const updatedRecordings = recordings.filter(recording => recording.id !== id);
        localStorage.setItem('recordings', JSON.stringify(updatedRecordings));
        loadSectionRecordings();
    }
}

// Approve student
function approveStudent(requestId) {
    const requests = JSON.parse(localStorage.getItem('approvalRequests') || '[]');
    const request = requests.find(req => req.id === requestId);
    
    if (!request) return;
    
    // Update request status
    request.status = 'approved';
    request.updatedAt = new Date().toISOString();
    localStorage.setItem('approvalRequests', JSON.stringify(requests));
    
    // Update user status
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.email === request.email);
    
    if (userIndex !== -1) {
        users[userIndex].status = 'active';
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    // Reload approvals
    loadPendingApprovals();
}

// Reject student
function rejectStudent(requestId) {
    const requests = JSON.parse(localStorage.getItem('approvalRequests') || '[]');
    const request = requests.find(req => req.id === requestId);
    
    if (!request) return;
    
    // Update request status
    request.status = 'rejected';
    request.updatedAt = new Date().toISOString();
    localStorage.setItem('approvalRequests', JSON.stringify(requests));
    
    // Remove user
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.filter(u => u.email !== request.email);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    // Reload approvals
    loadPendingApprovals();
}
