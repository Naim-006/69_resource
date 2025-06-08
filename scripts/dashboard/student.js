document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = '../../../auth/login.html';
        return;
    }

    // Update user info in header
    document.getElementById('userName').textContent = currentUser.fullName;
    document.getElementById('headerUserName').textContent = currentUser.fullName;
    document.getElementById('userEmail').textContent = currentUser.email;

    // Navigation
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const sections = document.querySelectorAll('.content-section');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);

            // Update active states
            navLinks.forEach(l => l.parentElement.classList.remove('active'));
            this.parentElement.classList.add('active');

            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetId) {
                    section.classList.add('active');
                }
            });
        });
    });

    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('currentUser');
        window.location.href = '../../../auth/login.html';
    });

    // Load initial data
    loadResources();
    loadSessions();
    loadRecordings();
    loadExams();
    loadAnnouncements();

    // Filter functionality
    setupFilters();
});

// Load and display resources
function loadResources() {
    const resourcesGrid = document.getElementById('resourcesGrid');
    // Get resources from localStorage (replace with actual API call)
    const resources = JSON.parse(localStorage.getItem('resources') || '[]')
        .filter(r => r.section === currentUser.section);

    if (resources.length === 0) {
        resourcesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book-open fa-3x"></i>
                <p>No resources available yet</p>
            </div>
        `;
        return;
    }

    resourcesGrid.innerHTML = resources.map(resource => `
        <div class="card resource-card">
            <div class="card-header">
                <span class="badge badge-${resource.subject}">${resource.subject}</span>
                <h3>${resource.title}</h3>
            </div>
            <p>${resource.description}</p>
            <div class="card-footer">
                <span class="text-muted">Shared by ${resource.sharedBy}</span>
                <a href="${resource.link}" class="btn btn-primary btn-sm" target="_blank">
                    <i class="fas fa-external-link-alt"></i> View
                </a>
            </div>
        </div>
    `).join('');
}

// Load and display study sessions
function loadSessions() {
    const sessionsList = document.getElementById('sessionsList');
    // Get sessions from localStorage (replace with actual API call)
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]')
        .filter(s => s.section === currentUser.section);

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
            <div class="card-header">
                <span class="badge badge-${session.subject}">${session.subject}</span>
                <h3>${session.topic}</h3>
            </div>
            <div class="session-details">
                <p><i class="fas fa-clock"></i> ${formatDateTime(session.date)}</p>
                <p><i class="fas fa-user"></i> Hosted by ${session.host}</p>
                ${session.notes ? `<p><i class="fas fa-sticky-note"></i> ${session.notes}</p>` : ''}
            </div>
            ${session.zoomLink ? `
                <div class="session-actions">
                    <a href="${session.zoomLink}" class="btn btn-primary" target="_blank">
                        <i class="fas fa-video"></i> Join Session
                    </a>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Load and display recordings
function loadRecordings() {
    const recordingsGrid = document.getElementById('recordingsGrid');
    // Get recordings from localStorage (replace with actual API call)
    const recordings = JSON.parse(localStorage.getItem('recordings') || '[]')
        .filter(r => r.section === currentUser.section);

    if (recordings.length === 0) {
        recordingsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-video-slash fa-3x"></i>
                <p>No recordings available</p>
            </div>
        `;
        return;
    }

    recordingsGrid.innerHTML = recordings.map(recording => `
        <div class="card recording-card">
            <div class="card-header">
                <span class="badge badge-${recording.subject}">${recording.subject}</span>
                <h3>${recording.title}</h3>
            </div>
            <div class="video-container">
                <iframe src="${getEmbedUrl(recording.youtubeUrl)}" frameborder="0" allowfullscreen></iframe>
            </div>
            <p>${recording.description}</p>
            <div class="card-footer">
                <span class="text-muted">Recorded by ${recording.recordedBy}</span>
                <span class="text-muted">${formatDate(recording.date)}</span>
            </div>
        </div>
    `).join('');
}

// Load and display exams
function loadExams() {
    const examsList = document.getElementById('examsList');
    // Get exams from localStorage (replace with actual API call)
    const exams = JSON.parse(localStorage.getItem('exams') || '[]')
        .filter(e => e.section === currentUser.section);

    if (exams.length === 0) {
        examsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-question fa-3x"></i>
                <p>No upcoming exams</p>
            </div>
        `;
        return;
    }

    examsList.innerHTML = exams.map(exam => `
        <div class="card exam-card">
            <div class="card-header">
                <span class="badge badge-${exam.type}">${exam.type}</span>
                <h3>${exam.title}</h3>
            </div>
            <div class="exam-details">
                <p><i class="fas fa-book"></i> ${exam.subject}</p>
                <p><i class="fas fa-clock"></i> ${formatDateTime(exam.date)}</p>
                ${exam.duration ? `<p><i class="fas fa-hourglass-half"></i> ${exam.duration}</p>` : ''}
                ${exam.location ? `<p><i class="fas fa-map-marker-alt"></i> ${exam.location}</p>` : ''}
            </div>
            <div class="exam-timer" id="exam-timer-${exam.id}">
                ${getCountdownText(exam.date)}
            </div>
            ${exam.notes ? `
                <div class="exam-notes">
                    <h4>Notes:</h4>
                    <p>${exam.notes}</p>
                </div>
            ` : ''}
        </div>
    `).join('');

    // Start countdown timers
    exams.forEach(exam => {
        startCountdownTimer(`exam-timer-${exam.id}`, exam.date);
    });
}

// Load and display announcements
function loadAnnouncements() {
    const announcementsList = document.getElementById('announcementsList');
    // Get announcements from localStorage (replace with actual API call)
    const announcements = JSON.parse(localStorage.getItem('announcements') || '[]')
        .filter(a => a.section === currentUser.section);

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
            <div class="card-header">
                <h3>${announcement.title}</h3>
                <span class="text-muted">${formatDateTime(announcement.date)}</span>
            </div>
            <p>${announcement.content}</p>
            <div class="card-footer">
                <span class="text-muted">Posted by ${announcement.postedBy}</span>
            </div>
        </div>
    `).join('');
}

// Setup filter functionality
function setupFilters() {
    // Resource filters
    const resourceSubject = document.getElementById('resourceSubject');
    const resourceSearch = document.getElementById('resourceSearch');

    resourceSubject.addEventListener('change', filterResources);
    resourceSearch.addEventListener('input', filterResources);

    // Session filters
    const sessionSubject = document.getElementById('sessionSubject');
    sessionSubject.addEventListener('change', filterSessions);

    // Recording filters
    const recordingSubject = document.getElementById('recordingSubject');
    const recordingSearch = document.getElementById('recordingSearch');

    recordingSubject.addEventListener('change', filterRecordings);
    recordingSearch.addEventListener('input', filterRecordings);

    // Exam filters
    const examSubject = document.getElementById('examSubject');
    examSubject.addEventListener('change', filterExams);
}

// Filter functions
function filterResources() {
    const subject = document.getElementById('resourceSubject').value;
    const search = document.getElementById('resourceSearch').value.toLowerCase();
    
    const resources = document.querySelectorAll('.resource-card');
    resources.forEach(resource => {
        const resourceSubject = resource.querySelector('.badge').textContent.toLowerCase();
        const resourceTitle = resource.querySelector('h3').textContent.toLowerCase();
        const resourceDesc = resource.querySelector('p').textContent.toLowerCase();

        const subjectMatch = subject === 'all' || resourceSubject === subject;
        const searchMatch = !search || 
            resourceTitle.includes(search) || 
            resourceDesc.includes(search);

        resource.style.display = subjectMatch && searchMatch ? 'block' : 'none';
    });
}

function filterSessions() {
    const subject = document.getElementById('sessionSubject').value;
    
    const sessions = document.querySelectorAll('.session-card');
    sessions.forEach(session => {
        const sessionSubject = session.querySelector('.badge').textContent.toLowerCase();
        session.style.display = subject === 'all' || sessionSubject === subject ? 'block' : 'none';
    });
}

function filterRecordings() {
    const subject = document.getElementById('recordingSubject').value;
    const search = document.getElementById('recordingSearch').value.toLowerCase();
    
    const recordings = document.querySelectorAll('.recording-card');
    recordings.forEach(recording => {
        const recordingSubject = recording.querySelector('.badge').textContent.toLowerCase();
        const recordingTitle = recording.querySelector('h3').textContent.toLowerCase();
        const recordingDesc = recording.querySelector('p').textContent.toLowerCase();

        const subjectMatch = subject === 'all' || recordingSubject === subject;
        const searchMatch = !search || 
            recordingTitle.includes(search) || 
            recordingDesc.includes(search);

        recording.style.display = subjectMatch && searchMatch ? 'block' : 'none';
    });
}

function filterExams() {
    const subject = document.getElementById('examSubject').value;
    
    const exams = document.querySelectorAll('.exam-card');
    exams.forEach(exam => {
        const examSubject = exam.querySelector('.badge').textContent.toLowerCase();
        exam.style.display = subject === 'all' || examSubject === subject ? 'block' : 'none';
    });
}

// Utility functions
function formatDateTime(date) {
    return new Date(date).toLocaleString();
}

function formatDate(date) {
    return new Date(date).toLocaleDateString();
}

function getEmbedUrl(youtubeUrl) {
    const videoId = youtubeUrl.split('v=')[1];
    return `https://www.youtube.com/embed/${videoId}`;
}

function getCountdownText(date) {
    const now = new Date();
    const examDate = new Date(date);
    const diff = examDate - now;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${days}d ${hours}h ${minutes}m until exam`;
}

function startCountdownTimer(elementId, targetDate) {
    const timerElement = document.getElementById(elementId);
    if (!timerElement) return;

    function updateTimer() {
        const now = new Date();
        const target = new Date(targetDate);
        const diff = target - now;

        if (diff <= 0) {
            timerElement.innerHTML = 'Exam has started!';
            timerElement.classList.add('expired');
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        timerElement.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s until exam`;
    }

    updateTimer();
    setInterval(updateTimer, 1000);
} 