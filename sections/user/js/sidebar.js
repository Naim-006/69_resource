// User Sidebar Functionality

document.addEventListener('DOMContentLoaded', () => {
  // Load sidebar HTML
  loadSidebar();
  
  // Initialize sidebar
  initializeSidebar();
  
  // Set active menu item based on current page
  setActiveMenuItem();
  
  // Setup logout functionality
  setupLogout();
});

// Load sidebar HTML
function loadSidebar() {
  const sidebarContainer = document.getElementById('sidebar-container');
  if (sidebarContainer) {
    // Get user data to check if user is CR
    const userData = JSON.parse(localStorage.getItem('user')) || {};
    const isCR = userData.isCR || false;
    
    // Generate CR-specific menu items
    const crMenuItems = isCR ? `
      <a href="create-course.html" class="nav-item" id="nav-create-course">
        <i class="fas fa-plus-circle"></i> Create Course
      </a>
    ` : '';
    
    sidebarContainer.innerHTML = `
      <!-- User Sidebar Component -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2><i class="fas fa-user-graduate"></i> Student</h2>
        </div>
        <nav class="sidebar-nav">
          <a href="dashboard.html" class="nav-item" id="nav-dashboard">
            <i class="fas fa-tachometer-alt"></i> Dashboard
          </a>
          <a href="profile.html" class="nav-item" id="nav-profile">
            <i class="fas fa-user"></i> My Profile
          </a>
          <a href="resources.html" class="nav-item" id="nav-resources">
            <i class="fas fa-book"></i> Resources
          </a>
          <a href="courses.html" class="nav-item" id="nav-courses">
            <i class="fas fa-graduation-cap"></i> Courses
          </a>
          ${crMenuItems}
          <a href="sessions.html" class="nav-item" id="nav-sessions">
            <i class="fas fa-calendar"></i> Study Sessions
            <span class="notification-badge" id="sessionCount">0</span>
          </a>
          <a href="recordings.html" class="nav-item" id="nav-recordings">
            <i class="fas fa-video"></i> Recordings
          </a>
          <a href="exams.html" class="nav-item" id="nav-exams">
            <i class="fas fa-clipboard-list"></i> Exams
            <span class="notification-badge" id="examCount">0</span>
          </a>
          <a href="announcements.html" class="nav-item" id="nav-announcements">
            <i class="fas fa-bullhorn"></i> Announcements
            <span class="notification-badge" id="announcementCount">0</span>
          </a>
        </nav>
        <div class="sidebar-footer">
          <button id="logoutBtn" class="btn btn-danger"><i class="fas fa-sign-out-alt"></i> Logout</button>
        </div>
      </aside>
      
      <!-- Mobile menu toggle button (outside sidebar) -->
      <div class="mobile-menu-toggle" id="mobileMenuToggle">
        <i class="fas fa-bars"></i>
      </div>
      
      <!-- Overlay for mobile view -->
      <div class="sidebar-overlay" id="sidebarOverlay"></div>
    `;
  }
}

// Initialize sidebar functionality
function initializeSidebar() {
  // Get sidebar elements
  const sidebar = document.querySelector('.sidebar');
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  
  if (!sidebar) return; // Exit if sidebar not found
  
  // Add close button for mobile view
  const closeButton = document.createElement('i');
  closeButton.className = 'fas fa-times sidebar-close';
  closeButton.id = 'sidebarClose';
  sidebar.appendChild(closeButton);
  
  // Toggle sidebar on mobile menu icon click
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.add('expanded');
      sidebarOverlay.classList.add('active');
    });
  }
  
  // Close sidebar when close button is clicked
  const sidebarClose = document.getElementById('sidebarClose');
  if (sidebarClose) {
    sidebarClose.addEventListener('click', () => {
      sidebar.classList.remove('expanded');
      sidebarOverlay.classList.remove('active');
    });
  }
  
  // Close sidebar when overlay is clicked
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.remove('expanded');
      sidebarOverlay.classList.remove('active');
    });
  }
  
  // Handle window resize
  window.addEventListener('resize', () => {
    if (window.innerWidth > 992 && sidebar.classList.contains('expanded')) {
      sidebar.classList.remove('expanded');
      if (sidebarOverlay) {
        sidebarOverlay.classList.remove('active');
      }
    }
  });
}

// Set active menu item based on current page
function setActiveMenuItem() {
  // Get current page filename
  const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
  
  // Remove active class from all menu items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Add active class to current page's menu item
  let activeNavId = 'nav-dashboard'; // Default
  
  if (currentPage.includes('dashboard')) {
    activeNavId = 'nav-dashboard';
  } else if (currentPage.includes('profile')) {
    activeNavId = 'nav-profile';
  } else if (currentPage.includes('resources')) {
    activeNavId = 'nav-resources';
  } else if (currentPage.includes('courses')) {
    activeNavId = 'nav-courses';
  } else if (currentPage.includes('create-course')) {
    activeNavId = 'nav-create-course';
  } else if (currentPage.includes('sessions')) {
    activeNavId = 'nav-sessions';
  } else if (currentPage.includes('recordings')) {
    activeNavId = 'nav-recordings';
  } else if (currentPage.includes('exams')) {
    activeNavId = 'nav-exams';
  } else if (currentPage.includes('announcements')) {
    activeNavId = 'nav-announcements';
  }
  
  // Set active class
  const activeNav = document.getElementById(activeNavId);
  if (activeNav) {
    activeNav.classList.add('active');
  }
}

// Setup logout functionality
function setupLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      // Show notification
      showNotification('Logged out successfully!', 'success');
      
      // Clear any user data from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = '../../index.html';
      }, 2000);
    });
  }
}

// Show notification helper function
function showNotification(message, type = 'success') {
  // Remove any existing notifications
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  // Add to DOM
  document.body.appendChild(notification);
  
  // Remove after animation completes
  setTimeout(() => {
    notification.remove();
  }, 4000);
} 