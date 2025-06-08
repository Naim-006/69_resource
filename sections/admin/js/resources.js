// DOM Elements
const resourcesList = document.getElementById('resourcesList');
const resourceSearch = document.getElementById('resourceSearch');
const statusFilter = document.getElementById('statusFilter');
const subjectFilter = document.getElementById('subjectFilter');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const currentPageSpan = document.getElementById('currentPage');
const totalPagesSpan = document.getElementById('totalPages');
const resourceModal = document.getElementById('resourceModal');
const resourceDetails = document.getElementById('resourceDetails');
const closeModal = document.getElementById('closeModal');
const approveBtn = document.getElementById('approveBtn');
const rejectBtn = document.getElementById('rejectBtn');
const pendingBtn = document.getElementById('pendingBtn');
const editResourceModal = document.getElementById('editResourceModal');
const editResourceForm = document.getElementById('editResourceForm');
const closeEditModal = document.getElementById('closeEditModal');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const deleteModal = document.getElementById('deleteModal');
const closeDeleteModal = document.getElementById('closeDeleteModal');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// Pagination settings
let currentPage = 1;
const itemsPerPage = 5;
let selectedResource = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in and is admin
  checkAdminAuth();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load initial resources
  fetchResources();
});

// Check admin authentication
function checkAdminAuth() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token || !user.isAdmin) {
    console.log('Admin authentication failed:', { token: !!token, isAdmin: user.isAdmin });
    window.location.href = '../../auth/login.html';
    return;
  }
  
  // Set admin name
  if (user.fullName) {
    document.getElementById('adminName').textContent = user.fullName;
  }
}

// Set up event listeners
function setupEventListeners() {
  // Search functionality
  resourceSearch.addEventListener('keyup', debounce(() => {
    currentPage = 1;
    fetchResources();
  }, 300));
  
  // Filters
  statusFilter.addEventListener('change', () => {
    currentPage = 1;
    fetchResources();
  });
  
  subjectFilter.addEventListener('change', () => {
    currentPage = 1;
    fetchResources();
  });
  
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
  
  // Modal close buttons
  closeModal.addEventListener('click', () => {
    resourceModal.classList.remove('active');
  });
  
  closeEditModal.addEventListener('click', () => {
    editResourceModal.classList.remove('active');
  });
  
  cancelEditBtn.addEventListener('click', () => {
    editResourceModal.classList.remove('active');
  });
  
  closeDeleteModal.addEventListener('click', () => {
    deleteModal.classList.remove('active');
  });
  
  cancelDeleteBtn.addEventListener('click', () => {
    deleteModal.classList.remove('active');
  });
  
  // Status update buttons
  approveBtn.addEventListener('click', () => {
    if (selectedResource) {
      updateResourceStatus(selectedResource._id, 'approved');
    }
  });
  
  rejectBtn.addEventListener('click', () => {
    if (selectedResource) {
      updateResourceStatus(selectedResource._id, 'rejected');
    }
  });
  
  pendingBtn.addEventListener('click', () => {
    if (selectedResource) {
      updateResourceStatus(selectedResource._id, 'pending');
    }
  });
  
  // Edit form submission
  editResourceForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (selectedResource) {
      updateResource(selectedResource._id);
    }
  });
  
  // Confirm delete button
  confirmDeleteBtn.addEventListener('click', () => {
    if (selectedResource) {
      deleteResource(selectedResource._id);
    }
  });
}

// Fetch resources from API
async function fetchResources() {
  try {
    // Show loading state
    resourcesList.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Loading resources...</span>
        </div>
      </div>
    `;
    
    // Get filter values
    const status = statusFilter.value !== 'all' ? statusFilter.value : '';
    const subject = subjectFilter.value !== 'all' ? subjectFilter.value : '';
    const search = resourceSearch.value;
    
    // Get auth token
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '../../auth/login.html';
      return;
    }
    
    // Fetch from API with query parameters
    const response = await fetch(
      `/api/admin/resources?page=${currentPage}&limit=${itemsPerPage}&status=${status}&subject=${subject}&search=${search}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch resources');
    }
    
    const data = await response.json();
    
    // Debug: Log the data to see what's coming from the API
    console.log('Resources data:', data);
    
    // Update pagination UI
    currentPageSpan.textContent = data.currentPage;
    totalPagesSpan.textContent = data.totalPages;
    prevPageBtn.disabled = data.currentPage === 1;
    nextPageBtn.disabled = data.currentPage === data.totalPages || data.totalPages === 0;
    
    // Render resources
    if (data.resources && data.resources.length > 0) {
      resourcesList.innerHTML = data.resources.map(resource => renderResourceItem(resource)).join('');
      
      // Add event listeners to action buttons
      document.querySelectorAll('.view-resource').forEach(btn => {
        btn.addEventListener('click', () => {
          const resourceId = btn.getAttribute('data-id');
          viewResource(resourceId);
        });
      });
      
      document.querySelectorAll('.edit-resource').forEach(btn => {
        btn.addEventListener('click', () => {
          const resourceId = btn.getAttribute('data-id');
          showEditForm(resourceId);
        });
      });
      
      document.querySelectorAll('.delete-resource').forEach(btn => {
        btn.addEventListener('click', () => {
          const resourceId = btn.getAttribute('data-id');
          showDeleteConfirmation(resourceId);
        });
      });
      
      document.querySelectorAll('.approve-resource').forEach(btn => {
        btn.addEventListener('click', () => {
          const resourceId = btn.getAttribute('data-id');
          updateResourceStatus(resourceId, 'approved');
        });
      });
      
      document.querySelectorAll('.reject-resource').forEach(btn => {
        btn.addEventListener('click', () => {
          const resourceId = btn.getAttribute('data-id');
          updateResourceStatus(resourceId, 'rejected');
        });
      });
      
      document.querySelectorAll('.pending-resource').forEach(btn => {
        btn.addEventListener('click', () => {
          const resourceId = btn.getAttribute('data-id');
          updateResourceStatus(resourceId, 'pending');
        });
      });
    } else {
      resourcesList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-search"></i>
          <p>No resources found. Try changing your search or filter.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error fetching resources:', error);
    resourcesList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-circle"></i>
        <p>Failed to load resources. Please try again later.</p>
      </div>
    `;
  }
}

// Render a single resource item
function renderResourceItem(resource) {
  // Debug: Log the resource object
  console.log('Resource object:', resource);
  
  // Format date in Bangladeshi format with AM/PM
  const formattedDate = formatBangladeshiDate(resource.createdAt);
  
  // Get subject display name
  const subjectDisplayName = getSubjectDisplayName(resource.subject);
  
  // Determine icon based on subject
  const icon = getSubjectIcon(resource.subject);
  
  // Determine status badge
  const statusBadge = `<span class="resource-status ${resource.status}">${resource.status.charAt(0).toUpperCase() + resource.status.slice(1)}</span>`;
  
  // Determine which action buttons to show based on status
  let actionButtons = '';
  
  if (resource.status === 'pending') {
    actionButtons += `
      <button class="action-btn approve approve-resource" data-id="${resource._id}" title="Approve">
        <i class="fas fa-check"></i>
      </button>
      <button class="action-btn reject reject-resource" data-id="${resource._id}" title="Reject">
        <i class="fas fa-times"></i>
      </button>
    `;
  } else if (resource.status === 'approved') {
    actionButtons += `
      <button class="action-btn pending pending-resource" data-id="${resource._id}" title="Set Pending">
        <i class="fas fa-clock"></i>
      </button>
      <button class="action-btn reject reject-resource" data-id="${resource._id}" title="Reject">
        <i class="fas fa-times"></i>
      </button>
    `;
  } else if (resource.status === 'rejected') {
    actionButtons += `
      <button class="action-btn approve approve-resource" data-id="${resource._id}" title="Approve">
        <i class="fas fa-check"></i>
      </button>
      <button class="action-btn pending pending-resource" data-id="${resource._id}" title="Set Pending">
        <i class="fas fa-clock"></i>
      </button>
    `;
  }
  
  // Add edit and delete buttons for all resources
  actionButtons += `
    <button class="action-btn edit edit-resource" data-id="${resource._id}" title="Edit">
      <i class="fas fa-edit"></i>
    </button>
    <button class="action-btn delete delete-resource" data-id="${resource._id}" title="Delete">
      <i class="fas fa-trash"></i>
    </button>
  `;
  
  // Create author element with or without tooltip based on email availability
  let authorElement = '';
  if (resource.authorEmail) {
    authorElement = `<span class="resource-author author-tooltip">Shared by: <strong>${resource.authorName}</strong><span class="tooltip">${resource.authorEmail}</span></span>`;
  } else {
    authorElement = `<span class="resource-author">Shared by: <strong>${resource.authorName}</strong></span>`;
  }
  
  return `
    <div class="resource-item" data-id="${resource._id}">
      <div class="resource-icon">
        <i class="${icon}"></i>
      </div>
      <div class="resource-info">
        <h3 class="resource-title">${resource.title}</h3>
        <div class="resource-meta">
          <div>
            ${authorElement}
            <span class="resource-subject">${subjectDisplayName}</span>
            ${statusBadge}
          </div>
          <span class="resource-date">${formattedDate}</span>
        </div>
        ${resource.description ? `<p class="resource-description">${resource.description}</p>` : ''}
        <div class="resource-link">
          <a href="${resource.link}" target="_blank">
            <i class="fas fa-external-link-alt"></i> Open Resource
          </a>
        </div>
        <div class="resource-actions">
          <button class="action-btn view-resource" data-id="${resource._id}">
            <i class="fas fa-eye"></i> View Details
          </button>
          ${actionButtons}
        </div>
      </div>
    </div>
  `;
}

// View resource details
async function viewResource(resourceId) {
  try {
    // Show loading state
    resourceDetails.innerHTML = `
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <span>Loading resource details...</span>
      </div>
    `;
    
    resourceModal.classList.add('active');
    
    // Get auth token
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '../../auth/login.html';
      return;
    }
    
    // Fetch resource details
    const response = await fetch(`/api/admin/resources/${resourceId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch resource details');
    }
    
    const resource = await response.json();
    selectedResource = resource;
    
    // Format date
    const formattedDate = formatBangladeshiDate(resource.createdAt);
    
    // Get subject display name
    const subjectDisplayName = getSubjectDisplayName(resource.subject);
    
    // Render resource details
    resourceDetails.innerHTML = `
      <div class="resource-detail">
        <label>Title:</label>
        <div class="resource-detail-value">${resource.title}</div>
      </div>
      <div class="resource-detail">
        <label>Link:</label>
        <div class="resource-detail-link">
          <a href="${resource.link}" target="_blank">
            <i class="fas fa-external-link-alt"></i> ${resource.link}
          </a>
        </div>
      </div>
      <div class="resource-detail">
        <label>Description:</label>
        <div class="resource-detail-value resource-detail-description">${resource.description || 'No description provided'}</div>
      </div>
      <div class="resource-detail">
        <label>Subject:</label>
        <div class="resource-detail-value">${subjectDisplayName}</div>
      </div>
      <div class="resource-detail">
        <label>Status:</label>
        <div class="resource-detail-value">
          <span class="resource-status ${resource.status}">${resource.status.charAt(0).toUpperCase() + resource.status.slice(1)}</span>
        </div>
      </div>
      <div class="resource-detail">
        <label>Shared by:</label>
        <div class="resource-detail-value">${resource.authorName}</div>
      </div>
      <div class="resource-detail">
        <label>Shared on:</label>
        <div class="resource-detail-value">${formattedDate}</div>
      </div>
    `;
    
    // Update footer buttons based on status
    if (resource.status === 'pending') {
      approveBtn.style.display = 'block';
      rejectBtn.style.display = 'block';
      pendingBtn.style.display = 'none';
    } else if (resource.status === 'approved') {
      approveBtn.style.display = 'none';
      rejectBtn.style.display = 'block';
      pendingBtn.style.display = 'block';
    } else if (resource.status === 'rejected') {
      approveBtn.style.display = 'block';
      rejectBtn.style.display = 'none';
      pendingBtn.style.display = 'block';
    }
  } catch (error) {
    console.error('Error fetching resource details:', error);
    resourceDetails.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>Failed to load resource details. Please try again later.</p>
      </div>
    `;
  }
}

// Show edit form
async function showEditForm(resourceId) {
  try {
    // Get auth token
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '../../auth/login.html';
      return;
    }
    
    // Fetch resource details
    const response = await fetch(`/api/admin/resources/${resourceId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch resource details');
    }
    
    const resource = await response.json();
    selectedResource = resource;
    
    // Populate form
    document.getElementById('editResourceTitle').value = resource.title;
    document.getElementById('editResourceLink').value = resource.link;
    document.getElementById('editResourceDescription').value = resource.description || '';
    document.getElementById('editResourceSubject').value = resource.subject;
    document.getElementById('editResourceStatus').value = resource.status;
    
    // Show modal
    editResourceModal.classList.add('active');
  } catch (error) {
    console.error('Error fetching resource details:', error);
    showToast('Failed to load resource details. Please try again later.', 'error');
  }
}

// Update resource
async function updateResource(resourceId) {
  try {
    // Get form values
    const title = document.getElementById('editResourceTitle').value;
    const link = document.getElementById('editResourceLink').value;
    const description = document.getElementById('editResourceDescription').value;
    const subject = document.getElementById('editResourceSubject').value;
    const status = document.getElementById('editResourceStatus').value;
    
    // Get auth token
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '../../auth/login.html';
      return;
    }
    
    // Update resource
    const response = await fetch(`/api/admin/resources/${resourceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title,
        link,
        description,
        subject,
        status
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update resource');
    }
    
    // Close modal and refresh resources
    editResourceModal.classList.remove('active');
    fetchResources();
    
    // Success notification using toast
    showToast('Resource updated successfully!', 'success');
  } catch (error) {
    console.error('Error updating resource:', error);
    showToast('Failed to update resource. Please try again later.', 'error');
  }
}

// Show delete confirmation
function showDeleteConfirmation(resourceId) {
  // Find resource
  fetch(`/api/admin/resources/${resourceId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
    .then(response => response.json())
    .then(resource => {
      selectedResource = resource;
      deleteModal.classList.add('active');
    })
    .catch(error => {
      console.error('Error fetching resource:', error);
      showToast('Failed to load resource. Please try again later.', 'error');
    });
}

// Delete resource
async function deleteResource(resourceId) {
  try {
    // Get auth token
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '../../auth/login.html';
      return;
    }
    
    // Delete resource
    const response = await fetch(`/api/admin/resources/${resourceId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete resource');
    }
    
    // Close modal and refresh resources
    deleteModal.classList.remove('active');
    fetchResources();
    
    // Success notification using toast
    showToast('Resource deleted successfully!', 'success');
  } catch (error) {
    console.error('Error deleting resource:', error);
    showToast('Failed to delete resource. Please try again later.', 'error');
  }
}

// Update resource status
async function updateResourceStatus(resourceId, status) {
  try {
    // Get auth token
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '../../auth/login.html';
      return;
    }
    
    // Update status
    const response = await fetch(`/api/admin/resources/${resourceId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update resource status');
    }
    
    // Close modal and refresh resources
    resourceModal.classList.remove('active');
    fetchResources();
    
    // Success notification using toast
    showToast(`Resource ${status} successfully!`, 'success');
  } catch (error) {
    console.error('Error updating resource status:', error);
    showToast('Failed to update resource status. Please try again later.', 'error');
  }
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

// Debounce function for search input
function debounce(func, delay) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

// Format date in Bangladeshi format (DD/MM/YYYY at hh:mm AM/PM)
function formatBangladeshiDate(dateString) {
  const date = new Date(dateString);
  
  // Add 6 hours to convert to Bangladesh time (UTC+6)
  const bdDate = new Date(date.getTime() + (6 * 60 * 60 * 1000));
  
  const day = String(bdDate.getDate()).padStart(2, '0');
  const month = String(bdDate.getMonth() + 1).padStart(2, '0');
  const year = bdDate.getFullYear();
  
  // 12-hour format with AM/PM
  let hours = bdDate.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutes = String(bdDate.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} at ${hours}:${minutes} ${ampm}`;
}
