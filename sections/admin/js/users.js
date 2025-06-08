// Global variables
let currentPage = 1;
let totalPages = 1;
let usersPerPage = 10;
let currentFilter = 'all';
let currentSearch = '';
let users = [];
let selectedUser = null;

// DOM elements
const usersTableBody = document.getElementById('usersTableBody');
const userSearch = document.getElementById('userSearch');
const roleFilter = document.getElementById('roleFilter');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const userModal = document.getElementById('userModal');
const closeModal = document.getElementById('closeModal');
const userDetails = document.getElementById('userDetails');
const deleteUserBtn = document.getElementById('deleteUserBtn');
const updateRoleBtn = document.getElementById('updateRoleBtn');
const cancelBtn = document.getElementById('cancelBtn');
const adminName = document.getElementById('adminName');

// Check if user is logged in and is an admin
document.addEventListener('DOMContentLoaded', () => {
  // Set admin name if available
  const userData = JSON.parse(localStorage.getItem('userData'));
  if (userData) {
    adminName.textContent = userData.fullName || 'Admin';
  }
  
  // Initialize the page
  fetchUsers();
  
  // Set up event listeners
  setupEventListeners();
});

// Set up event listeners
function setupEventListeners() {
  // Search input
  userSearch.addEventListener('input', debounce(() => {
    currentSearch = userSearch.value.trim();
    currentPage = 1;
    fetchUsers();
  }, 300));
  
  // Role filter
  roleFilter.addEventListener('change', () => {
    currentFilter = roleFilter.value;
    currentPage = 1;
    fetchUsers();
  });
  
  // Pagination
  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      fetchUsers();
    }
  });
  
  nextPageBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      fetchUsers();
    }
  });
  
  // Modal
  closeModal.addEventListener('click', () => {
    userModal.classList.remove('active');
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === userModal) {
      userModal.classList.remove('active');
    }
  });
}

// Fetch users from API
async function fetchUsers() {
  try {
    showLoading();
    
    // Get auth token
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/auth/login.html';
      return;
    }
    
    // Build query parameters
    const params = new URLSearchParams({
      page: currentPage,
      limit: usersPerPage
    });
    
    if (currentFilter !== 'all') {
      params.append('role', currentFilter);
    }
    
    if (currentSearch) {
      params.append('search', currentSearch);
    }
    
    // Fetch users
    const response = await fetch(`/api/admin/users?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    const data = await response.json();
    users = data.users;
    totalPages = data.totalPages;
    
    // Update UI
    renderUsers(users);
    updatePagination();
    
  } catch (error) {
    console.error('Error fetching users:', error);
    usersTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="error-cell">
          <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <span>Failed to load users. Please try again.</span>
            <button class="btn btn-primary btn-sm" onclick="fetchUsers()">Retry</button>
          </div>
        </td>
      </tr>
    `;
  }
}

// Render users in the table
function renderUsers(users) {
  if (users.length === 0) {
    usersTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-cell">
          <div class="empty-message">
            <i class="fas fa-users-slash"></i>
            <span>No users found</span>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  // Check if we're on mobile
  const isMobile = window.innerWidth <= 768;
  
  if (isMobile) {
    usersTableBody.innerHTML = users.map(user => {
      // Create section and batch badges
      const sectionBadge = user.section ? 
        `<span class="section-badge">Section ${user.section}</span>` : 
        `<span class="none-badge">No Section</span>`;
      
      const batchBadge = user.batch ? 
        `<span class="batch-badge">Batch ${user.batch}</span>` : 
        `<span class="none-badge">No Batch</span>`;
      
      const semesterBadge = user.semester ? 
        `<span class="semester-badge">${user.semester}</span>` : 
        `<span class="none-badge">No Semester</span>`;
      
      const departmentBadge = `<span class="department-badge">CSE</span>`;
      
      return `
      <tr>
        <td data-label="Name"><span class="user-name">${user.fullName}</span></td>
        <td data-label="Email"><span class="user-email">${user.email}</span></td>
        <td data-label="Info">
          <div class="info-row">
            ${departmentBadge}
            ${batchBadge}
          </div>
          <div class="info-row">
            ${sectionBadge}
            ${semesterBadge}
          </div>
        </td>
        <td data-label="Role">
          ${getRoleBadge(user)}
        </td>
        <td data-label="Status">
          <span class="status-badge ${user.isVerified ? 'verified' : 'unverified'}">
            ${user.isVerified ? 'Verified' : 'Unverified'}
          </span>
        </td>
        <td data-label="Joined">${formatDate(user.createdAt)}</td>
        <td data-label="Actions">
          <div class="action-buttons">
            <button class="action-btn edit" onclick="editUser('${user._id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete" onclick="confirmDelete('${user._id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
    }).join('');
  } else {
    usersTableBody.innerHTML = users.map(user => {
      // Create section and batch badges
      const sectionBadge = user.section ? 
        `<span class="section-badge">Section ${user.section}</span>` : 
        `<span class="none-badge">No Section</span>`;
      
      const batchBadge = user.batch ? 
        `<span class="batch-badge">Batch ${user.batch}</span>` : 
        `<span class="none-badge">No Batch</span>`;
      
      const semesterBadge = user.semester ? 
        `<span class="semester-badge">${user.semester}</span>` : 
        `<span class="none-badge">No Semester</span>`;
      
      const departmentBadge = `<span class="department-badge">CSE</span>`;
      
      return `
      <tr>
        <td><span class="user-name">${user.fullName}</span></td>
        <td><span class="user-email">${user.email}</span></td>
        <td>
          <div class="info-row">
            ${departmentBadge}
            ${batchBadge}
          </div>
          <div class="info-row">
            ${sectionBadge}
            ${semesterBadge}
          </div>
        </td>
        <td>
          ${getRoleBadge(user)}
        </td>
        <td>
          <span class="status-badge ${user.isVerified ? 'verified' : 'unverified'}">
            ${user.isVerified ? 'Verified' : 'Unverified'}
          </span>
        </td>
        <td>${formatDate(user.createdAt)}</td>
        <td>
          <div class="action-buttons">
            <button class="action-btn edit" onclick="editUser('${user._id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete" onclick="confirmDelete('${user._id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
    }).join('');
  }
  
  // Add resize listener to re-render table when window size changes
  window.addEventListener('resize', debounce(() => {
    if ((window.innerWidth <= 768 && !isMobile) || (window.innerWidth > 768 && isMobile)) {
      renderUsers(users);
    }
  }, 250));
}

// Get role badge HTML
function getRoleBadge(user) {
  if (user.isAdmin) {
    return '<span class="role-badge admin">Admin</span>';
  } else if (user.isCR) {
    return '<span class="role-badge cr">CR</span>';
  } else {
    return '<span class="role-badge student">Student</span>';
  }
}

// Update pagination controls
function updatePagination() {
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  prevPageBtn.disabled = currentPage <= 1;
  nextPageBtn.disabled = currentPage >= totalPages;
}

// Show loading state
function showLoading() {
  usersTableBody.innerHTML = `
    <tr>
      <td colspan="7" class="loading-cell">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Loading users...</span>
        </div>
      </td>
    </tr>
  `;
}

// Edit user
window.editUser = function(userId) {
  try {
    const user = users.find(u => u._id === userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    selectedUser = user;
    
    // Show loading in modal
    userDetails.innerHTML = `
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <span>Loading edit form...</span>
      </div>
    `;
    userModal.classList.add('active');
    
    // Display edit form
    showRoleUpdateForm();
    
  } catch (error) {
    console.error('Error preparing edit form:', error);
    userDetails.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <span>Failed to load edit form.</span>
        <button class="btn btn-primary btn-sm" onclick="editUser('${userId}')">Retry</button>
      </div>
    `;
    userModal.classList.add('active');
  }
};

// Generate semester options for the dropdown
function generateSemesterOptions() {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];
  const seasons = ['Spring', 'Summer', 'Fall'];
  
  let options = '<option value="">Select Semester</option>';
  
  years.forEach(year => {
    seasons.forEach(season => {
      options += `<option value="${season} ${year}">${season} ${year}</option>`;
    });
  });
  
  return options;
}

// Show role update form
function showRoleUpdateForm() {
  if (!selectedUser) return;
  
  userDetails.innerHTML = `
    <div class="user-detail">
      <label>Full Name:</label>
      <span class="user-name">${selectedUser.fullName}</span>
    </div>
    <div class="user-detail">
      <label>Email:</label>
      <span class="user-detail-email">${selectedUser.email}</span>
    </div>
    <div class="user-detail">
      <label>Section:</label>
      <input type="text" id="editSection" value="${selectedUser.section || ''}" placeholder="e.g. A, B, C..." maxlength="1">
      <div class="error-message-text" id="sectionError">Section must be a single letter (A-Z)</div>
    </div>
    <div class="user-detail">
      <label>Batch:</label>
      <input type="text" id="editBatch" value="${selectedUser.batch || ''}" placeholder="e.g. 1, 69, 420..." maxlength="4">
      <div class="error-message-text" id="batchError">Batch must be a number between 1-1000</div>
    </div>
    <div class="user-detail">
      <label>Semester:</label>
      <select id="editSemester">
        ${generateSemesterOptions()}
      </select>
    </div>
    <div class="user-detail">
      <label>Role:</label>
      <div class="role-options">
        <label>
          <input type="radio" name="role" value="admin" ${selectedUser.isAdmin ? 'checked' : ''}>
          Admin
        </label>
        <label>
          <input type="radio" name="role" value="cr" ${!selectedUser.isAdmin && selectedUser.isCR ? 'checked' : ''}>
          Class Representative
        </label>
        <label>
          <input type="radio" name="role" value="student" ${!selectedUser.isAdmin && !selectedUser.isCR ? 'checked' : ''}>
          Student
        </label>
      </div>
    </div>
    <div class="user-detail">
      <label>Verification Status:</label>
      <div class="verification-options">
        <label>
          <input type="checkbox" name="isVerified" ${selectedUser.isVerified ? 'checked' : ''}>
          Mark as verified
        </label>
      </div>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn-secondary" id="cancelEditBtn">Cancel</button>
      <button id="saveChangesBtn" class="btn btn-primary">Save Changes</button>
    </div>
  `;
  
  // Show modal if not already visible
  userModal.classList.add('active');
  
  // Set selected semester if exists
  if (selectedUser.semester) {
    document.getElementById('editSemester').value = selectedUser.semester;
  }
  
  // Add input validation
  const sectionInput = document.getElementById('editSection');
  const batchInput = document.getElementById('editBatch');
  
  sectionInput.addEventListener('input', function() {
    validateSection(this);
  });
  
  batchInput.addEventListener('input', function() {
    validateBatch(this);
  });
  
  // Add event listener to save button
  document.getElementById('saveChangesBtn').addEventListener('click', () => {
    if (validateForm()) {
      updateUserRole();
    }
  });
  
  // Add event listener to cancel button
  document.getElementById('cancelEditBtn').addEventListener('click', () => {
    userModal.classList.remove('active');
  });
}

// Validate section input (A-Z or a-z)
function validateSection(input) {
  const value = input.value.trim();
  const sectionError = document.getElementById('sectionError');
  
  if (value === '') {
    input.classList.remove('input-error');
    return true;
  }
  
  const isValid = /^[a-zA-Z]$/.test(value);
  
  if (isValid) {
    input.classList.remove('input-error');
    return true;
  } else {
    input.classList.add('input-error');
    return false;
  }
}

// Validate batch input (1-1000)
function validateBatch(input) {
  const value = input.value.trim();
  const batchError = document.getElementById('batchError');
  
  if (value === '') {
    input.classList.remove('input-error');
    return true;
  }
  
  const numValue = parseInt(value);
  const isValid = !isNaN(numValue) && numValue >= 1 && numValue <= 1000;
  
  if (isValid) {
    input.classList.remove('input-error');
    return true;
  } else {
    input.classList.add('input-error');
    return false;
  }
}

// Validate the entire form
function validateForm() {
  const sectionInput = document.getElementById('editSection');
  const batchInput = document.getElementById('editBatch');
  
  const isSectionValid = validateSection(sectionInput);
  const isBatchValid = validateBatch(batchInput);
  
  return isSectionValid && isBatchValid;
}

// Update user role
async function updateUserRole() {
  try {
    // Get selected role
    const roleValue = document.querySelector('input[name="role"]:checked').value;
    const isVerified = document.querySelector('input[name="isVerified"]').checked;
    const section = document.getElementById('editSection').value.trim().toUpperCase();
    const batch = document.getElementById('editBatch').value.trim();
    const semester = document.getElementById('editSemester').value;
    
    // Get auth token
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/auth/login.html';
      return;
    }
    
    // Update user
    const response = await fetch(`/api/admin/users/${selectedUser._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        isAdmin: roleValue === 'admin',
        isCR: roleValue === 'cr',
        isVerified,
        section: section || null,
        batch: batch || null,
        semester: semester || null
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update user');
    }
    
    // Close modal and refresh users
    userModal.classList.remove('active');
    fetchUsers();
    
  } catch (error) {
    console.error('Error updating user:', error);
    alert('Failed to update user. Please try again.');
  }
}

// Confirm delete user
window.confirmDelete = function(userId) {
  const user = users.find(u => u._id === userId);
  if (user) {
    selectedUser = user;
    
    if (confirm(`Are you sure you want to delete user ${user.fullName}?`)) {
      deleteUser(userId);
    }
  }
};

// Delete user
async function deleteUser(userId) {
  try {
    // Get auth token
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/auth/login.html';
      return;
    }
    
    // Delete user
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete user');
    }
    
    // Close modal and refresh users
    userModal.classList.remove('active');
    fetchUsers();
    
  } catch (error) {
    console.error('Error deleting user:', error);
    alert('Failed to delete user. Please try again.');
  }
}

// Format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
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