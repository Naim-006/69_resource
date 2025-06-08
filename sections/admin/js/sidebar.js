// Admin Sidebar JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // Initialize sidebar
  initSidebar();
  
  // Set admin name if available
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.fullName) {
    const adminNameElement = document.getElementById('adminName');
    if (adminNameElement) {
      adminNameElement.textContent = user.fullName;
    }
  }
});

// Initialize sidebar functionality
function initSidebar() {
  // Load sidebar if it's not already in the DOM
  const sidebarContainer = document.getElementById('sidebar-container');
  if (sidebarContainer && !sidebarContainer.querySelector('.sidebar')) {
    loadSidebar();
  } else {
    // If sidebar is already in the DOM, just set up the event listeners
    setupSidebarEventListeners();
    setActivePage();
  }
}

// Load sidebar HTML
async function loadSidebar() {
  try {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) {
      console.error('Sidebar container not found');
      return;
    }

    const response = await fetch('./components/sidebar.html');
    if (!response.ok) {
      throw new Error(`Failed to load sidebar: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    sidebarContainer.innerHTML = html;
    
    // Set up event listeners after loading
    setupSidebarEventListeners();
    
    // Set active page
    setActivePage();
  } catch (error) {
    console.error('Error loading sidebar:', error);
    // Fallback: If fetch fails, try to load the sidebar directly
    sidebarContainer.innerHTML = `
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2><i class="fas fa-user-shield"></i> Admin Dashboard</h2>
          <i class="fas fa-times menu-toggle" id="menuToggle"></i>
        </div>
        <nav class="sidebar-nav">
          <a href="dashboard.html" class="nav-item" data-page="dashboard">
            <i class="fas fa-tachometer-alt"></i> Dashboard
          </a>
          <a href="users.html" class="nav-item" data-page="users">
            <i class="fas fa-users"></i> Users
          </a>
          <a href="resources.html" class="nav-item" data-page="resources">
            <i class="fas fa-book"></i> Resources
          </a>
          <a href="sections.html" class="nav-item" data-page="sections">
            <i class="fas fa-layer-group"></i> Sections
          </a>
          <a href="settings.html" class="nav-item" data-page="settings">
            <i class="fas fa-cog"></i> Settings
          </a>
        </nav>
        <div class="sidebar-footer">
          <button id="logoutBtn" class="btn btn-danger"><i class="fas fa-sign-out-alt"></i> Logout</button>
        </div>
      </aside>
    `;
    
    // Set up event listeners for fallback sidebar
    setupSidebarEventListeners();
    setActivePage();
  }
}

// Set up sidebar event listeners
function setupSidebarEventListeners() {
  // Menu toggle button
  const menuToggle = document.getElementById('menuToggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      const sidebar = document.querySelector('.sidebar');
      // Check if we're in mobile view
      if (window.innerWidth <= 992) {
        sidebar.classList.remove('active');
        const overlay = document.getElementById('sidebarOverlay');
        if (overlay) overlay.classList.remove('active');
      } else {
        // Desktop view - toggle collapsed state
        sidebar.classList.toggle('collapsed');
      }
    });
  }
  
  // Mobile menu toggle
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
      const sidebar = document.querySelector('.sidebar');
      const overlay = document.getElementById('sidebarOverlay');
      sidebar.classList.toggle('active');
      overlay.classList.toggle('active');
    });
  }
  
  // Sidebar overlay
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      const sidebar = document.querySelector('.sidebar');
      sidebar.classList.remove('active');
      sidebarOverlay.classList.remove('active');
    });
  }
  
  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '../../auth/login.html';
    });
  }
}

// Set active page in sidebar
function setActivePage() {
  // Get current page from URL
  const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
  
  // Remove active class from all nav items
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.classList.remove('active');
  });
  
  // Add active class to current page
  const activeItem = document.querySelector(`.nav-item[data-page="${currentPage}"]`);
  if (activeItem) {
    activeItem.classList.add('active');
  } else {
    // Default to dashboard if no match
    const dashboardItem = document.querySelector('.nav-item[data-page="dashboard"]');
    if (dashboardItem) {
      dashboardItem.classList.add('active');
    }
  }
} 