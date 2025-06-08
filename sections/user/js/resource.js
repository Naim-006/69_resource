// DOM Elements
const resourceForm = document.getElementById('resourceForm');
const resourcesList = document.getElementById('resourcesList');
const searchInput = document.getElementById('searchResource');
const searchBtn = document.getElementById('searchBtn');
const subjectFilter = document.getElementById('subjectFilter');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const currentPageSpan = document.getElementById('currentPage');
const totalPagesSpan = document.getElementById('totalPages');
const toggleFormBtn = document.getElementById('toggleFormBtn');
const resourceFormContainer = document.getElementById('resourceFormContainer');
const shareResourceHeader = document.getElementById('shareResourceHeader');
const cancelShareBtn = document.getElementById('cancelShareBtn');

// Pagination settings
let currentPage = 1;
const itemsPerPage = 5;
let filteredResources = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  // Set up event listeners
  setupEventListeners();
  
  // Load initial resources
  fetchResources();
});

// Set up event listeners
function setupEventListeners() {
  // Resource form submission
  resourceForm.addEventListener('submit', handleResourceSubmit);
  
  // Search functionality
  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keyup', e => {
    if (e.key === 'Enter') handleSearch();
  });
  
  // Subject filter
  subjectFilter.addEventListener('change', handleSubjectFilter);
  
  // Pagination
  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      fetchResources();
    }
  });
  
  nextPageBtn.addEventListener('click', () => {
    const totalPages = parseInt(totalPagesSpan.textContent);
    if (currentPage < totalPages) {
      currentPage++;
      fetchResources();
    }
  });
  
  // Toggle resource form
  toggleFormBtn.addEventListener('click', toggleResourceForm);
  shareResourceHeader.addEventListener('click', (e) => {
    // Only toggle if the click is not on the button itself
    if (e.target !== toggleFormBtn && !toggleFormBtn.contains(e.target)) {
      toggleResourceForm();
    }
  });
  
  // Cancel share button
  cancelShareBtn.addEventListener('click', () => {
    resourceForm.reset();
    toggleResourceForm(false);
  });
}

// Toggle resource form visibility
function toggleResourceForm(show) {
  if (show === undefined) {
    // Toggle
    const isVisible = resourceFormContainer.style.display !== 'none';
    resourceFormContainer.style.display = isVisible ? 'none' : 'block';
    toggleFormBtn.classList.toggle('active', !isVisible);
  } else {
    // Set to specific state
    resourceFormContainer.style.display = show ? 'block' : 'none';
    toggleFormBtn.classList.toggle('active', show);
  }
}

// Handle resource form submission
async function handleResourceSubmit(e) {
  e.preventDefault();
  
  // Get form values
  const title = document.getElementById('resourceTitle').value;
  const link = document.getElementById('resourceLink').value;
  const description = document.getElementById('resourceDescription').value;
  const subject = document.getElementById('resourceSubject').value;
  
  // Create resource object
  const resourceData = {
    title,
    link,
    description,
    subject
  };
  
  try {
    // Get auth token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      showNotification('You need to login first!', 'error');
      setTimeout(() => {
        window.location.href = '../../auth/login.html';
      }, 2000);
      return;
    }
    
    // Send to API with auth token
    const response = await fetch('/api/resources', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(resourceData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to add resource');
    }
    
    // Reset form
    resourceForm.reset();
    
    // Hide form
    toggleResourceForm(false);
    
    // Refresh resources list
    currentPage = 1;
    fetchResources();
    
    // Show success notification
    showNotification('Resource shared successfully!', 'success');
  } catch (error) {
    console.error('Error adding resource:', error);
    showNotification('Failed to share resource. Please try again.', 'error');
  }
}

// Handle search functionality
function handleSearch() {
  currentPage = 1;
  fetchResources();
}

// Handle subject filter change
function handleSubjectFilter() {
  currentPage = 1;
  fetchResources();
}

// Fetch resources from API
async function fetchResources() {
  try {
    // Show loading state
    resourcesList.innerHTML = '<div class="empty-state">Loading resources...</div>';
    
    // Get filter values
    const subject = subjectFilter.value;
    const search = searchInput.value;
    
    // Fetch from API with query parameters
    const response = await fetch(
      `/api/resources?page=${currentPage}&limit=${itemsPerPage}&subject=${subject}&search=${search}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch resources');
    }
    
    const data = await response.json();
    
    // Update pagination UI
    currentPageSpan.textContent = data.currentPage;
    totalPagesSpan.textContent = data.totalPages;
    prevPageBtn.disabled = data.currentPage === 1;
    nextPageBtn.disabled = data.currentPage === data.totalPages || data.totalPages === 0;
    
    // Render resources
    if (data.resources && data.resources.length > 0) {
      resourcesList.innerHTML = data.resources.map(resource => renderResourceItem(resource)).join('');
    } else {
      resourcesList.innerHTML = '<div class="empty-state">No resources found. Try changing your search or filter.</div>';
    }
  } catch (error) {
    console.error('Error fetching resources:', error);
    resourcesList.innerHTML = '<div class="empty-state">Failed to load resources. Please try again later.</div>';
    showNotification('Failed to load resources. Please try again later.', 'error');
  }
}

// Render a single resource item
function renderResourceItem(resource) {
  // Format date in Bangladeshi format (DD/MM/YYYY at HH:MM)
  const date = new Date(resource.createdAt);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const formattedDate = `${day}/${month}/${year} at ${hours}:${minutes}`;
  
  // Get subject display name
  const subjectDisplayName = getSubjectDisplayName(resource.subject);
  
  // Determine icon based on subject
  const icon = getSubjectIcon(resource.subject);
  
  // Ensure authorName has a value
  const authorName = resource.authorName || 'Demo User';
  
  return `
    <div class="resource-item" data-id="${resource._id}">
      <div class="resource-icon">
        <i class="${icon}"></i>
      </div>
      <div class="resource-info">
        <h3 class="resource-title">${resource.title}</h3>
        <div class="resource-meta">
          <div>
            <span class="resource-author">Shared by: ${authorName}</span>
            <span class="resource-subject">${subjectDisplayName}</span>
          </div>
          <span class="resource-date">${formattedDate}</span>
        </div>
        ${resource.description ? `<p class="resource-description">${resource.description}</p>` : ''}
        <div class="resource-link">
          <a href="${resource.link}" target="_blank">
            <i class="fas fa-external-link-alt"></i> Open Resource
          </a>
        </div>
      </div>
    </div>
  `;
}

// Get subject display name
function getSubjectDisplayName(subject) {
  const subjects = {
    'computer': 'Computer Science',
    'math': 'Mathematics',
    'physics': 'Physics',
    'chemistry': 'Chemistry',
    'english': 'English',
    'accounting': 'Accounting',
    'statistic': 'Statistics',
    'others': 'Others'
  };
  
  return subjects[subject] || 'Unknown';
}

// Get icon based on subject
function getSubjectIcon(subject) {
  const icons = {
    'computer': 'fas fa-laptop-code',
    'math': 'fas fa-square-root-alt',
    'physics': 'fas fa-atom',
    'chemistry': 'fas fa-flask',
    'english': 'fas fa-book',
    'accounting': 'fas fa-calculator',
    'statistic': 'fas fa-chart-bar',
    'others': 'fas fa-file-alt'
  };
  
  return icons[subject] || 'fas fa-file-alt';
}

// Show notification
function showNotification(message, type) {
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