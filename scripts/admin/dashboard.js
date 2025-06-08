// Admin Dashboard Script

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in and is admin
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = '../../auth/login.html';
        return;
    }

    // Update admin name in header
    document.getElementById('adminName').textContent = currentUser.fullName || 'Admin';

    // Initialize mobile menu toggle
    initializeMobileMenu();

    // Load dashboard data
    loadDashboardData();
    
    // Setup event listeners
    setupEventListeners();
});

// Initialize mobile menu toggle
function initializeMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('expanded');
        });
    }
}

// Setup event listeners
function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
}

// Load dashboard data
async function loadDashboardData() {
    try {
        // Load overview statistics
        loadOverviewStats();
        
        // Load recent notifications
        loadRecentNotifications();
        
        // Load upcoming events
        loadUpcomingEvents();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Failed to load dashboard data', 'error');
    }
}

// Load overview statistics
function loadOverviewStats() {
    // In a real application, this would fetch data from an API
    // For now, we'll load from localStorage
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const resources = JSON.parse(localStorage.getItem('resources') || '[]');
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    
    // Update stats in the UI
    document.getElementById('totalStudents').textContent = users.filter(u => u.role === 'student').length;
    document.getElementById('totalCRs').textContent = users.filter(u => u.role === 'cr').length;
    document.getElementById('totalResources').textContent = resources.length;
    
    // Calculate upcoming sessions (sessions with a date in the future)
    const upcomingSessionsCount = sessions.filter(s => {
        return new Date(s.date) > new Date();
    }).length;
    
    document.getElementById('upcomingSessions').textContent = upcomingSessionsCount;
}

// Load recent notifications
function loadRecentNotifications() {
    const notificationsList = document.getElementById('recentNotifications');
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    
    if (notifications.length === 0) {
        notificationsList.innerHTML = '<p class="empty-state">No recent notifications</p>';
        return;
    }
    
    // Sort notifications by date (newest first)
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Take only the 5 most recent notifications
    const recentNotifications = notifications.slice(0, 5);
    
    // Render notifications
    notificationsList.innerHTML = recentNotifications.map(notification => `
        <div class="notification-item">
            <div class="notification-header">
                <span class="notification-title">${notification.title}</span>
                <span class="notification-date">${formatDate(notification.createdAt)}</span>
            </div>
            <p class="notification-content">${notification.message}</p>
        </div>
    `).join('');
}

// Load upcoming events
function loadUpcomingEvents() {
    const eventsList = document.getElementById('upcomingEvents');
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    const exams = JSON.parse(localStorage.getItem('exams') || '[]');
    
    // Combine sessions and exams into a single events array
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
    ];
    
    // Filter for upcoming events only
    const upcomingEvents = events.filter(event => event.date > new Date());
    
    if (upcomingEvents.length === 0) {
        eventsList.innerHTML = '<p class="empty-state">No upcoming events</p>';
        return;
    }
    
    // Sort by date (soonest first)
    upcomingEvents.sort((a, b) => a.date - b.date);
    
    // Take only the next 5 events
    const nextEvents = upcomingEvents.slice(0, 5);
    
    // Render events
    eventsList.innerHTML = nextEvents.map(event => `
        <div class="event-item ${event.type}">
            <div class="event-icon">
                <i class="fas ${event.type === 'session' ? 'fa-calendar-alt' : 'fa-clipboard-list'}"></i>
            </div>
            <div class="event-info">
                <h4 class="event-title">${event.title}</h4>
                <p class="event-date">${formatDateTime(event.date)}</p>
                <p class="event-description">${event.description}</p>
            </div>
        </div>
    `).join('');
}

// Helper: Format date
function formatDate(dateString) {
    const date = new Date(dateString);
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

// Handle logout
function handleLogout() {
    localStorage.removeItem('currentUser');
    window.location.href = '../../auth/login.html';
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