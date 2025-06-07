// Global variables
let currentUser;

document.addEventListener('DOMContentLoaded', function() {
    try {
        // Check if user is logged in
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            window.location.href = '../auth/login.html';
            return;
        }

        // Update user info in header
        document.getElementById('headerUserName').textContent = currentUser.fullName;

        // Navigation
        const navItems = document.querySelectorAll('.nav-item');
        const sections = document.querySelectorAll('.dashboard-section');

        navItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('data-section');

                // Update active states
                navItems.forEach(nav => nav.classList.remove('active'));
                sections.forEach(section => section.classList.remove('active'));

                this.classList.add('active');
                document.getElementById(targetId).classList.add('active');
            });
        });

        // Logout functionality
        document.getElementById('logoutBtn').addEventListener('click', function() {
            localStorage.removeItem('currentUser');
            window.location.href = '../auth/login.html';
        });

        // Load initial data
        loadOverview();
        loadResources();
        loadSessions();
        loadRecordings();
        loadExams();
        loadAnnouncements();

        // Filter functionality
        setupFilters();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        alert('There was an error loading the dashboard. Please try again.');
    }
});

// Load overview data
function loadOverview() {
    try {
        // Load resources count
        const resources = JSON.parse(localStorage.getItem('resources') || '[]')
            .filter(r => r.section === currentUser.section);
        document.getElementById('resourceCount').textContent = resources.length;

        // Load upcoming sessions count
        const sessions = JSON.parse(localStorage.getItem('sessions') || '[]')
            .filter(s => s.section === currentUser.section);
        const upcomingSessions = sessions.filter(s => new Date(s.date) > new Date());
        document.getElementById('upcomingSessionCount').textContent = upcomingSessions.length;

        // Load recordings count
        const recordings = JSON.parse(localStorage.getItem('recordings') || '[]')
            .filter(r => r.section === currentUser.section);
        document.getElementById('recordingCount').textContent = recordings.length;

        // Load upcoming exams count
        const exams = JSON.parse(localStorage.getItem('exams') || '[]')
            .filter(e => e.section === currentUser.section);
        const upcomingExams = exams.filter(e => new Date(e.date) > new Date());
        document.getElementById('upcomingExamCount').textContent = upcomingExams.length;

        // Load upcoming events
        loadUpcomingEvents();
    } catch (error) {
        console.error('Error loading overview:', error);
        document.getElementById('resourceCount').textContent = '0';
        document.getElementById('upcomingSessionCount').textContent = '0';
        document.getElementById('recordingCount').textContent = '0';
        document.getElementById('upcomingExamCount').textContent = '0';
        document.getElementById('upcomingEventsList').innerHTML = '<p class="no-data">Error loading events</p>';
    }
}

// Load upcoming events
function loadUpcomingEvents() {
    try {
        const sessions = JSON.parse(localStorage.getItem('sessions') || '[]')
            .filter(s => s.section === currentUser.section);
        const exams = JSON.parse(localStorage.getItem('exams') || '[]')
            .filter(e => e.section === currentUser.section);
        
        const now = new Date();
        const events = [
            ...sessions.map(s => ({
                ...s,
                type: 'session',
                date: new Date(s.date)
            })),
            ...exams.map(e => ({
                ...e,
                type: 'exam',
                date: new Date(e.date)
            }))
        ].filter(e => e.date > now)
         .sort((a, b) => a.date - b.date);

        const upcomingEventsList = document.getElementById('upcomingEventsList');
        upcomingEventsList.innerHTML = events.length ? events.map(event => `
            <div class="event-card ${event.type}">
                <div class="event-icon">
                    <i class="fas fa-${event.type === 'session' ? 'chalkboard-teacher' : 'file-alt'}"></i>
                </div>
                <div class="event-info">
                    <h4>${event.title}</h4>
                    <p>${event.subject}</p>
                    <p class="event-date">${formatDateTime(event.date)}</p>
                </div>
            </div>
        `).join('') : '<p class="no-data">No upcoming events</p>';
    } catch (error) {
        console.error('Error loading upcoming events:', error);
        document.getElementById('upcomingEventsList').innerHTML = '<p class="no-data">Error loading events</p>';
    }
}

// Load and display resources
function loadResources() {
    try {
        const resources = JSON.parse(localStorage.getItem('resources') || '[]')
            .filter(r => r.section === currentUser.section);

        // Update subject filter
        const subjects = [...new Set(resources.map(r => r.subject))];
        const resourceSubject = document.getElementById('resourceSubject');
        resourceSubject.innerHTML = `
            <option value="">All Subjects</option>
            ${subjects.map(subject => `
                <option value="${subject}">${subject}</option>
            `).join('')}
        `;

        displayResources(resources);
    } catch (error) {
        console.error('Error loading resources:', error);
        document.getElementById('resourcesList').innerHTML = '<p class="no-data">Error loading resources</p>';
    }
}

// Display resources
function displayResources(resources) {
    try {
        const resourcesList = document.getElementById('resourcesList');
        resourcesList.innerHTML = resources.length ? resources.map(resource => `
            <div class="resource-card">
                <div class="resource-icon">
                    <i class="fas fa-${getResourceIcon(resource.type)}"></i>
                </div>
                <div class="resource-info">
                    <h4>${resource.title}</h4>
                    <p>${resource.subject}</p>
                    <p class="resource-description">${resource.description}</p>
                    <a href="${resource.link}" target="_blank" class="btn btn-primary">
                        <i class="fas fa-external-link-alt"></i> View Resource
                    </a>
                </div>
            </div>
        `).join('') : '<p class="no-data">No resources available</p>';
    } catch (error) {
        console.error('Error displaying resources:', error);
        document.getElementById('resourcesList').innerHTML = '<p class="no-data">Error displaying resources</p>';
    }
}

// Get resource icon
function getResourceIcon(type) {
    const icons = {
        'pdf': 'file-pdf',
        'doc': 'file-word',
        'ppt': 'file-powerpoint',
        'video': 'video',
        'link': 'link'
    };
    return icons[type] || 'file';
}

// Load and display study sessions
function loadSessions() {
    try {
        const sessions = JSON.parse(localStorage.getItem('sessions') || '[]')
            .filter(s => s.section === currentUser.section);

        // Update subject filter
        const subjects = [...new Set(sessions.map(s => s.subject))];
        const sessionSubject = document.getElementById('sessionSubject');
        sessionSubject.innerHTML = `
            <option value="">All Subjects</option>
            ${subjects.map(subject => `
                <option value="${subject}">${subject}</option>
            `).join('')}
        `;

        displaySessions(sessions);
    } catch (error) {
        console.error('Error loading sessions:', error);
        document.getElementById('sessionsList').innerHTML = '<p class="no-data">Error loading sessions</p>';
    }
}

// Display sessions
function displaySessions(sessions) {
    try {
        const sessionsList = document.getElementById('sessionsList');
        sessionsList.innerHTML = sessions.length ? sessions.map(session => `
            <div class="session-card">
                <div class="session-info">
                    <h4>${session.title}</h4>
                    <p>${session.subject}</p>
                    <p class="session-date">${formatDateTime(session.date)}</p>
                    <p class="session-description">${session.description}</p>
                    <a href="${session.link}" target="_blank" class="btn btn-primary">
                        <i class="fas fa-video"></i> Join Session
                    </a>
                </div>
            </div>
        `).join('') : '<p class="no-data">No sessions available</p>';
    } catch (error) {
        console.error('Error displaying sessions:', error);
        document.getElementById('sessionsList').innerHTML = '<p class="no-data">Error displaying sessions</p>';
    }
}

// Load and display recordings
function loadRecordings() {
    try {
        const recordings = JSON.parse(localStorage.getItem('recordings') || '[]')
            .filter(r => r.section === currentUser.section);

        // Update subject filter
        const subjects = [...new Set(recordings.map(r => r.subject))];
        const recordingSubject = document.getElementById('recordingSubject');
        recordingSubject.innerHTML = `
            <option value="">All Subjects</option>
            ${subjects.map(subject => `
                <option value="${subject}">${subject}</option>
            `).join('')}
        `;

        displayRecordings(recordings);
    } catch (error) {
        console.error('Error loading recordings:', error);
        document.getElementById('recordingsList').innerHTML = '<p class="no-data">Error loading recordings</p>';
    }
}

// Display recordings
function displayRecordings(recordings) {
    try {
        const recordingsList = document.getElementById('recordingsList');
        recordingsList.innerHTML = recordings.length ? recordings.map(recording => `
            <div class="recording-card">
                <div class="recording-info">
                    <h4>${recording.title}</h4>
                    <p>${recording.subject}</p>
                    <p class="recording-date">${formatDateTime(recording.date)}</p>
                    <p class="recording-description">${recording.description}</p>
                    <a href="${recording.link}" target="_blank" class="btn btn-primary">
                        <i class="fas fa-play"></i> Watch Recording
                    </a>
                </div>
            </div>
        `).join('') : '<p class="no-data">No recordings available</p>';
    } catch (error) {
        console.error('Error displaying recordings:', error);
        document.getElementById('recordingsList').innerHTML = '<p class="no-data">Error displaying recordings</p>';
    }
}

// Load and display exams
function loadExams() {
    try {
        const exams = JSON.parse(localStorage.getItem('exams') || '[]')
            .filter(e => e.section === currentUser.section);

        // Update subject filter
        const subjects = [...new Set(exams.map(e => e.subject))];
        const examSubject = document.getElementById('examSubject');
        examSubject.innerHTML = `
            <option value="">All Subjects</option>
            ${subjects.map(subject => `
                <option value="${subject}">${subject}</option>
            `).join('')}
        `;

        displayExams(exams);
    } catch (error) {
        console.error('Error loading exams:', error);
        document.getElementById('examsList').innerHTML = '<p class="no-data">Error loading exams</p>';
    }
}

// Display exams
function displayExams(exams) {
    try {
        const examsList = document.getElementById('examsList');
        examsList.innerHTML = exams.length ? exams.map(exam => `
            <div class="exam-card">
                <div class="exam-info">
                    <h4>${exam.title}</h4>
                    <p>${exam.subject}</p>
                    <p class="exam-date">${formatDateTime(exam.date)}</p>
                    <p class="exam-description">${exam.description}</p>
                    <a href="${exam.link}" target="_blank" class="btn btn-primary">
                        <i class="fas fa-file-alt"></i> View Exam
                    </a>
                </div>
            </div>
        `).join('') : '<p class="no-data">No exams available</p>';
    } catch (error) {
        console.error('Error displaying exams:', error);
        document.getElementById('examsList').innerHTML = '<p class="no-data">Error displaying exams</p>';
    }
}

// Load and display announcements
function loadAnnouncements() {
    try {
        const announcements = JSON.parse(localStorage.getItem('announcements') || '[]')
            .filter(a => a.section === currentUser.section);
        
        const announcementsList = document.getElementById('announcementsList');
        announcementsList.innerHTML = announcements.length ? announcements.map(announcement => `
            <div class="announcement-card">
                <div class="announcement-info">
                    <h4>${announcement.title}</h4>
                    <p class="announcement-date">${formatDateTime(announcement.date)}</p>
                    <p class="announcement-content">${announcement.content}</p>
                </div>
            </div>
        `).join('') : '<p class="no-data">No announcements available</p>';
    } catch (error) {
        console.error('Error loading announcements:', error);
        document.getElementById('announcementsList').innerHTML = '<p class="no-data">Error loading announcements</p>';
    }
}

// Setup filter functionality
function setupFilters() {
    try {
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
    } catch (error) {
        console.error('Error setting up filters:', error);
    }
}

// Filter resources
function filterResources() {
    try {
        const resources = JSON.parse(localStorage.getItem('resources') || '[]')
            .filter(r => r.section === currentUser.section);
        
        const subject = document.getElementById('resourceSubject').value;
        const search = document.getElementById('resourceSearch').value.toLowerCase();
        
        const filtered = resources.filter(r => 
            (!subject || r.subject === subject) &&
            (!search || 
                r.title.toLowerCase().includes(search) ||
                r.description.toLowerCase().includes(search))
        );
        
        displayResources(filtered);
    } catch (error) {
        console.error('Error filtering resources:', error);
        document.getElementById('resourcesList').innerHTML = '<p class="no-data">Error filtering resources</p>';
    }
}

// Filter sessions
function filterSessions() {
    try {
        const sessions = JSON.parse(localStorage.getItem('sessions') || '[]')
            .filter(s => s.section === currentUser.section);
        
        const subject = document.getElementById('sessionSubject').value;
        
        const filtered = sessions.filter(s => 
            !subject || s.subject === subject
        );
        
        displaySessions(filtered);
    } catch (error) {
        console.error('Error filtering sessions:', error);
        document.getElementById('sessionsList').innerHTML = '<p class="no-data">Error filtering sessions</p>';
    }
}

// Filter recordings
function filterRecordings() {
    try {
        const recordings = JSON.parse(localStorage.getItem('recordings') || '[]')
            .filter(r => r.section === currentUser.section);
        
        const subject = document.getElementById('recordingSubject').value;
        const search = document.getElementById('recordingSearch').value.toLowerCase();
        
        const filtered = recordings.filter(r => 
            (!subject || r.subject === subject) &&
            (!search || 
                r.title.toLowerCase().includes(search) ||
                r.description.toLowerCase().includes(search))
        );
        
        displayRecordings(filtered);
    } catch (error) {
        console.error('Error filtering recordings:', error);
        document.getElementById('recordingsList').innerHTML = '<p class="no-data">Error filtering recordings</p>';
    }
}

// Filter exams
function filterExams() {
    try {
        const exams = JSON.parse(localStorage.getItem('exams') || '[]')
            .filter(e => e.section === currentUser.section);
        
        const subject = document.getElementById('examSubject').value;
        
        const filtered = exams.filter(e => 
            !subject || e.subject === subject
        );
        
        displayExams(filtered);
    } catch (error) {
        console.error('Error filtering exams:', error);
        document.getElementById('examsList').innerHTML = '<p class="no-data">Error filtering exams</p>';
    }
}

// Format date and time
function formatDateTime(date) {
    return new Date(date).toLocaleString();
}

// Format date only
function formatDate(date) {
    return new Date(date).toLocaleDateString();
} 