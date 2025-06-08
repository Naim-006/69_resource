// User Dashboard Script

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Update user name and section in header (without login check)
    document.getElementById('userName').textContent = 'Student Name';
    document.getElementById('userSection').textContent = 'Section 1';

    // Load dashboard data
    loadDashboardData();
});

// Load dashboard data
async function loadDashboardData() {
    try {
        // Load demo data for the dashboard
        loadUpcomingSessions();
        loadLatestResources();
        loadRecentAnnouncements();
        loadUpcomingExams();
        updateNotificationBadges();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Failed to load dashboard data', 'error');
    }
}

// Load upcoming sessions with demo data
function loadUpcomingSessions() {
    const sessionsList = document.getElementById('upcomingSessions');
    
    // Demo data for sessions
    const demoSessions = [
        {
            title: 'Mathematics Problem Solving',
            date: new Date(Date.now() + 86400000), // tomorrow
            description: 'Session on advanced problem-solving techniques for calculus and linear algebra.',
            link: '#'
        },
        {
            title: 'Computer Science: Data Structures',
            date: new Date(Date.now() + 172800000), // day after tomorrow
            description: 'Learn about trees, graphs, and their implementations.',
            link: '#'
        },
        {
            title: 'Physics: Wave Mechanics',
            date: new Date(Date.now() + 259200000), // 3 days from now
            description: 'Understanding wave properties and quantum mechanics basics.',
            link: null
        }
    ];
    
    // Render sessions
    sessionsList.innerHTML = demoSessions.map(session => `
        <div class="session-item">
            <div class="item-header">
                <span class="item-title">${session.title}</span>
                <span class="item-date">${formatDateTime(session.date)}</span>
            </div>
            <p class="item-description">${session.description}</p>
            ${session.link ? `<a href="${session.link}" class="btn btn-sm btn-primary">Join Session</a>` : ''}
        </div>
    `).join('');
}

// Load latest resources with demo data
function loadLatestResources() {
    const resourcesList = document.getElementById('latestResources');
    
    // Demo data for resources
    const demoResources = [
        {
            title: 'Complete Guide to Calculus',
            createdAt: new Date(Date.now() - 86400000), // yesterday
            description: 'Comprehensive guide covering derivatives, integrals, and applications.',
            subject: 'math',
            link: '#'
        },
        {
            title: 'Programming in Python',
            createdAt: new Date(Date.now() - 172800000), // 2 days ago
            description: 'Learn Python from basics to advanced concepts with examples.',
            subject: 'computer',
            link: '#'
        },
        {
            title: 'English Grammar Essentials',
            createdAt: new Date(Date.now() - 259200000), // 3 days ago
            description: 'Complete reference for English grammar rules and usage.',
            subject: 'english',
            link: '#'
        }
    ];
    
    // Render resources
    resourcesList.innerHTML = demoResources.map(resource => `
        <div class="resource-item">
            <div class="resource-icon">
                <i class="fas fa-file-alt"></i>
            </div>
            <div class="resource-info">
                <div class="item-header">
                    <span class="item-title">${resource.title}</span>
                    <span class="item-date">${formatDate(resource.createdAt)}</span>
                </div>
                <p class="item-description">${resource.description}</p>
                <span class="resource-subject">${getSubjectName(resource.subject)}</span>
                <div class="item-actions">
                    <a href="${resource.link}" class="btn btn-sm btn-primary">View Resource</a>
                </div>
            </div>
        </div>
    `).join('');
}

// Load recent announcements with demo data
function loadRecentAnnouncements() {
    const announcementsList = document.getElementById('recentAnnouncements');
    
    // Demo data for announcements
    const demoAnnouncements = [
        {
            title: 'Schedule Change: Mathematics',
            createdAt: new Date(Date.now() - 43200000), // 12 hours ago
            content: 'The mathematics class scheduled for tomorrow has been moved to Room 302 at the same time.'
        },
        {
            title: 'Exam Preparation Week',
            createdAt: new Date(Date.now() - 86400000), // 1 day ago
            content: 'Next week will be dedicated to exam preparation. Additional study sessions will be available.'
        },
        {
            title: 'New Resources Added',
            createdAt: new Date(Date.now() - 172800000), // 2 days ago
            content: 'New study materials for Computer Science, Physics, and Mathematics have been added to the resources section.'
        }
    ];
    
    // Render announcements
    announcementsList.innerHTML = demoAnnouncements.map(announcement => `
        <div class="announcement-item">
            <div class="item-header">
                <span class="item-title">${announcement.title}</span>
                <span class="item-date">${formatDate(announcement.createdAt)}</span>
            </div>
            <p class="item-content">${announcement.content}</p>
        </div>
    `).join('');
}

// Load upcoming exams with demo data
function loadUpcomingExams() {
    const examsList = document.getElementById('upcomingExams');
    
    // Demo data for exams
    const demoExams = [
        {
            title: 'Mid-term: Mathematics',
            date: new Date(Date.now() + 604800000), // 1 week from now
            description: 'Covers chapters 1-5 from the textbook.',
            duration: 120,
            subject: 'math'
        },
        {
            title: 'Programming: Python Basics',
            date: new Date(Date.now() + 691200000), // 8 days from now
            description: 'Practical programming test on Python fundamentals.',
            duration: 90,
            subject: 'computer'
        },
        {
            title: 'Physics: Mechanics',
            date: new Date(Date.now() + 777600000), // 9 days from now
            description: 'Covers Newton\'s laws, kinematics, and dynamics.',
            duration: 120,
            subject: 'physics'
        }
    ];
    
    // Render exams
    examsList.innerHTML = demoExams.map(exam => `
        <div class="exam-item">
            <div class="item-header">
                <span class="item-title">${exam.title}</span>
                <span class="item-date">${formatDateTime(exam.date)}</span>
            </div>
            <p class="item-description">${exam.description}</p>
            <div class="item-meta">
                <span><i class="fas fa-clock"></i> Duration: ${exam.duration} minutes</span> | 
                <span><i class="fas fa-book"></i> Subject: ${getSubjectName(exam.subject)}</span>
            </div>
        </div>
    `).join('');
}

// Update notification badges with demo data
function updateNotificationBadges() {
    // Set some demo notification counts
    document.getElementById('sessionCount').textContent = '2';
    document.getElementById('examCount').textContent = '3';
    document.getElementById('announcementCount').textContent = '1';
}

// Helper: Get subject name from code
function getSubjectName(subjectCode) {
    const subjects = {
        'computer': 'Computer Science',
        'math': 'Mathematics',
        'physics': 'Physics',
        'chemistry': 'Chemistry',
        'english': 'English',
        'accounting': 'Accounting',
        'statistic': 'Statistics',
        'others': 'Other'
    };
    
    return subjects[subjectCode] || subjectCode;
}

// Helper: Format date
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Helper: Format date and time
function formatDateTime(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Show notification
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after animation
    setTimeout(() => {
        notification.remove();
    }, 4000);
}

/*
 * In a real application with MongoDB, we would use code like this:
 * ------------------------------------------------------------------
 * 
async function fetchDataFromMongoDB(endpoint) {
    try {
        const response = await fetch(`/api/${endpoint}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${endpoint}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        throw error;
    }
}

async function loadDashboardData() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        // Fetch all data in parallel
        const [sessions, resources, announcements, exams] = await Promise.all([
            fetchDataFromMongoDB(`sessions?section=${currentUser.section}`),
            fetchDataFromMongoDB(`resources?section=${currentUser.section}`),
            fetchDataFromMongoDB(`announcements?section=${currentUser.section}`),
            fetchDataFromMongoDB(`exams?section=${currentUser.section}`)
        ]);
        
        // Now process and display the data
        displayUpcomingSessions(sessions);
        displayLatestResources(resources);
        displayRecentAnnouncements(announcements);
        displayUpcomingExams(exams);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Failed to load dashboard data', 'error');
    }
}
*/ 