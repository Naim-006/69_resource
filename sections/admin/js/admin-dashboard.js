document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
  const adminName = document.getElementById('adminName');
  const totalUsers = document.getElementById('totalUsers');
  const studentCount = document.getElementById('studentCount');
  const crCount = document.getElementById('crCount');
  const totalResources = document.getElementById('totalResources');
  const pendingResources = document.getElementById('pendingResources');
  const approvedResources = document.getElementById('approvedResources');
  const sectionsList = document.getElementById('sectionsList');
  
  // Check if user is logged in and is admin
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Redirect to login page if not logged in
    window.location.href = '/auth/login.html';
    return;
  }
  
  // Set admin name
  adminName.textContent = userData.fullName || 'Admin';
  
  // Fetch dashboard data
  async function fetchDashboardData() {
    try {
      // Show loading state
      showLoadingState();
      
      // Fetch users statistics
      const usersResponse = await fetch('/api/admin/users/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        totalUsers.textContent = usersData.totalUsers || 0;
        studentCount.textContent = usersData.studentCount || 0;
        crCount.textContent = usersData.crCount || 0;
        console.log('User stats loaded from API:', usersData);
      } else {
        console.error('Failed to fetch user stats:', await usersResponse.text());
        // Use mock data as fallback
        setupMockData();
      }
      
      // Fetch resources statistics
      const resourcesResponse = await fetch('/api/admin/resources/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (resourcesResponse.ok) {
        const resourcesData = await resourcesResponse.json();
        totalResources.textContent = resourcesData.totalResources || 0;
        pendingResources.textContent = resourcesData.pendingResources || 0;
        approvedResources.textContent = resourcesData.approvedResources || 0;
        console.log('Resource stats loaded from API:', resourcesData);
      } else {
        console.error('Failed to fetch resource stats:', await resourcesResponse.text());
        // Use mock data as fallback if not already set
        if (!totalResources.textContent) {
          setupMockData();
        }
      }
      
      // Fetch sections
      const sectionsResponse = await fetch('/api/admin/sections', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (sectionsResponse.ok) {
        const sectionsData = await sectionsResponse.json();
        renderSections(sectionsData);
        console.log('Sections loaded from API:', sectionsData);
      } else {
        console.error('Failed to fetch sections:', await sectionsResponse.text());
        // Use mock data as fallback
        if (sectionsList.querySelector('.empty-state')) {
          setupMockSections();
        }
      }
      
      // Hide loading state
      hideLoadingState();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Use mock data as fallback
      setupMockData();
      hideLoadingState();
    }
  }
  
  // Show loading state
  function showLoadingState() {
    // Add loading indicators to each stat
    document.querySelectorAll('.stat span').forEach(span => {
      span.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    });
    document.querySelectorAll('.stat-item span').forEach(span => {
      span.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    });
    sectionsList.innerHTML = '<p class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading sections...</p>';
  }
  
  // Hide loading state
  function hideLoadingState() {
    // Remove loading indicators (they will be replaced with actual data)
  }
  
  // Render sections
  function renderSections(sections) {
    if (!sections || sections.length === 0) {
      sectionsList.innerHTML = '<p class="empty-state">No sections available</p>';
      return;
    }
    
    sectionsList.innerHTML = sections.map(section => `
      <div class="section-item">
        <span class="section-name">Section ${section.name}</span>
        <div class="section-stats">
          <div class="section-stat">
            <i class="fas fa-users"></i>
            <span>${section.studentCount}</span>
          </div>
          <div class="section-stat">
            <i class="fas fa-user-tie"></i>
            <span>${section.crCount}</span>
          </div>
        </div>
      </div>
    `).join('');
  }
  
  // Set up mock data for development (comment out in production)
  function setupMockData() {
    console.log('Using mock data for dashboard');
    totalUsers.textContent = '120';
    studentCount.textContent = '110';
    crCount.textContent = '10';
    totalResources.textContent = '45';
    pendingResources.textContent = '8';
    approvedResources.textContent = '37';
    
    // Mock sections
    setupMockSections();
  }
  
  function setupMockSections() {
    console.log('Using mock sections data');
    const mockSections = [
      { name: '1', studentCount: 35, crCount: 3 },
      { name: '2', studentCount: 42, crCount: 4 },
      { name: '3', studentCount: 33, crCount: 3 }
    ];
    renderSections(mockSections);
  }
  
  // Initialize dashboard
  fetchDashboardData();
}); 