// User Profile Functionality

document.addEventListener('DOMContentLoaded', () => {
  // Initialize profile page
  initProfile();
  
  // Setup password change functionality
  setupPasswordChange();
});

// Initialize profile page
function initProfile() {
  // Check if user is logged in
  const token = localStorage.getItem('token');
  if (!token) {
    showNotification('Please login to view your profile', 'error');
    setTimeout(() => {
      window.location.href = '../../auth/login.html';
    }, 2000);
    return;
  }
  
  // Fetch user profile data
  fetchUserProfile();
}

// Fetch user profile data from API or localStorage
async function fetchUserProfile() {
  try {
    // Always fetch from API first to get the latest data
    const token = localStorage.getItem('token');
    
    const response = await fetch('/api/user/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    const data = await response.json();
    
    // Save user data to localStorage
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Display user data
    displayUserProfile(data.user);
    
    // Update section badge
    const sectionBadge = document.getElementById('userSection');
    if (sectionBadge && data.user.section) {
      sectionBadge.textContent = data.user.section || 'No Section';
    }
  } catch (error) {
    console.error('Error fetching profile from API:', error);
    
    // Fallback to localStorage if API call fails
    const userData = JSON.parse(localStorage.getItem('user'));
    
    if (userData) {
      // Display user data from localStorage as fallback
      displayUserProfile(userData);
      
      // Update section badge
      const sectionBadge = document.getElementById('userSection');
      if (sectionBadge) {
        sectionBadge.textContent = userData.section || 'No Section';
      }
    } else {
      document.getElementById('profileInfo').innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          Failed to load profile data. Please try again.
        </div>
      `;
    }
  }
}

// Display user profile data with inline editing capabilities
function displayUserProfile(userData) {
  const profileInfoElement = document.getElementById('profileInfo');
  
  // Always fetch fresh data from the server to ensure verification status is current
  refreshUserVerificationStatus();
  
  // Check if user is a CR
  const isCR = userData.isCR || false;
  
  // Create HTML for each editable field
  const html = `
    <div class="info-row">
      <div class="info-label">Full Name</div>
      <div class="info-value" id="fullNameValue">
        ${userData.fullName || 'Not provided'}
        <i class="fas fa-edit info-edit" data-field="fullName"></i>
      </div>
      <div class="info-edit-input" id="fullNameEdit">
        <input type="text" id="fullNameInput" value="${userData.fullName || ''}" placeholder="Enter your full name">
        <i class="fas fa-check info-action save" data-field="fullName"></i>
        <i class="fas fa-times info-action cancel" data-field="fullName"></i>
      </div>
    </div>
    
    <div class="info-row">
      <div class="info-label">Email</div>
      <div class="info-value">
        ${userData.email || 'Not provided'}
        <span class="info-status ${userData.isVerified ? 'status-verified' : 'status-pending'}">
          ${userData.isVerified ? 'Verified' : 'Pending'}
        </span>
      </div>
    </div>
    
    <div class="info-row">
      <div class="info-label">Batch</div>
      <div class="info-value" id="batchValue">
        ${userData.batch || 'Not provided'}
        ${!isCR ? `<i class="fas fa-edit info-edit" data-field="batch"></i>` : 
        `<span class="locked-field-note"><i class="fas fa-lock"></i> Locked (CR)</span>`}
      </div>
      ${!isCR ? `
      <div class="info-edit-input" id="batchEdit">
        <input type="text" id="batchInput" value="${userData.batch || ''}" placeholder="e.g. 1, 69, 420..." maxlength="4">
        <i class="fas fa-check info-action save" data-field="batch"></i>
        <i class="fas fa-times info-action cancel" data-field="batch"></i>
        <div class="error-message-text" id="batchError">Batch must be a number between 1-1000</div>
      </div>
      ` : ''}
    </div>
    
    <div class="info-row">
      <div class="info-label">Section</div>
      <div class="info-value" id="sectionValue">
        ${userData.section || 'Not provided'}
        ${!isCR ? `<i class="fas fa-edit info-edit" data-field="section"></i>` : 
        `<span class="locked-field-note"><i class="fas fa-lock"></i> Locked (CR)</span>`}
      </div>
      ${!isCR ? `
      <div class="info-edit-input" id="sectionEdit">
        <input type="text" id="sectionInput" value="${userData.section || ''}" placeholder="e.g. A, B, C..." maxlength="1">
        <i class="fas fa-check info-action save" data-field="section"></i>
        <i class="fas fa-times info-action cancel" data-field="section"></i>
        <div class="error-message-text" id="sectionError">Section must be a single letter (A-Z)</div>
      </div>
      ` : ''}
    </div>
    
    <div class="info-row">
      <div class="info-label">Semester</div>
      <div class="info-value" id="semesterValue">
        ${userData.semester || 'Not provided'}
        ${!isCR ? `<i class="fas fa-edit info-edit" data-field="semester"></i>` : 
        `<span class="locked-field-note"><i class="fas fa-lock"></i> Locked (CR)</span>`}
      </div>
      ${!isCR ? `
      <div class="info-edit-input" id="semesterEdit">
        <select id="semesterInput">
          <option value="">Select Semester</option>
          ${generateSemesterOptions()}
        </select>
        <i class="fas fa-check info-action save" data-field="semester"></i>
        <i class="fas fa-times info-action cancel" data-field="semester"></i>
      </div>
      ` : ''}
    </div>
    
    <div class="info-row">
      <div class="info-label">Account Status</div>
      <div class="info-value">
        ${userData.isAdmin ? 'Administrator' : (userData.isCR ? 'Class Representative' : 'Student')}
      </div>
    </div>
    
    <div class="info-row">
      <div class="info-label">Joined</div>
      <div class="info-value">${formatDate(userData.createdAt)}</div>
    </div>
  `;
  
  profileInfoElement.innerHTML = html;
  
  // Add CR restriction note if user is a CR
  if (isCR) {
    const noteElement = document.createElement('div');
    noteElement.className = 'cr-restriction-note';
    noteElement.innerHTML = '<i class="fas fa-info-circle"></i> As a Class Representative, you cannot change your batch, section, or semester.';
    profileInfoElement.insertBefore(noteElement, profileInfoElement.firstChild);
  }
  
  // Set selected semester if exists
  if (userData.semester && !isCR) {
    document.getElementById('semesterInput').value = userData.semester;
  }
  
  // Add validation for section and batch inputs (only for non-CR users)
  if (!isCR) {
    const sectionInput = document.getElementById('sectionInput');
    const batchInput = document.getElementById('batchInput');
    
    if (sectionInput) {
      sectionInput.addEventListener('input', function() {
        validateSection(this);
      });
    }
    
    if (batchInput) {
      batchInput.addEventListener('input', function() {
        validateBatch(this);
      });
    }
  }
  
  // Setup edit icons click event
  document.querySelectorAll('.info-edit').forEach(icon => {
    icon.addEventListener('click', function() {
      const field = this.getAttribute('data-field');
      toggleFieldEdit(field, true);
    });
  });
  
  // Setup save buttons click event
  document.querySelectorAll('.info-action.save').forEach(icon => {
    icon.addEventListener('click', function() {
      const field = this.getAttribute('data-field');
      saveField(field);
    });
  });
  
  // Setup cancel buttons click event
  document.querySelectorAll('.info-action.cancel').forEach(icon => {
    icon.addEventListener('click', function() {
      const field = this.getAttribute('data-field');
      toggleFieldEdit(field, false);
    });
  });
}

// Toggle field edit mode
function toggleFieldEdit(field, show) {
  const valueElement = document.getElementById(`${field}Value`);
  const editElement = document.getElementById(`${field}Edit`);
  
  if (show) {
    valueElement.style.display = 'none';
    editElement.classList.add('active');
    
    // Focus on the input
    const input = document.getElementById(`${field}Input`);
    if (input) {
      input.focus();
    }
  } else {
    valueElement.style.display = 'flex';
    editElement.classList.remove('active');
    
    // Reset validation
    const input = document.getElementById(`${field}Input`);
    if (input) {
      input.classList.remove('input-error');
    }
    
    // Reset error messages
    if (field === 'section') {
      document.getElementById('sectionError').style.display = 'none';
    } else if (field === 'batch') {
      document.getElementById('batchError').style.display = 'none';
    }
  }
}

// Save field value
async function saveField(field) {
  try {
    // Get user data
    const userData = JSON.parse(localStorage.getItem('user'));
    
    // Double check if user is CR and trying to edit restricted fields
    if (userData.isCR && (field === 'batch' || field === 'section' || field === 'semester')) {
      showNotification('As a Class Representative, you cannot change your batch, section, or semester.', 'error');
      toggleFieldEdit(field, false);
      return;
    }
    
    // Get value
    let value;
    switch (field) {
      case 'fullName':
        value = document.getElementById('fullNameInput').value.trim();
        if (!value) {
          showNotification('Full name cannot be empty', 'error');
          return;
        }
        break;
      case 'batch':
        value = document.getElementById('batchInput').value.trim();
        if (value && !validateBatch(document.getElementById('batchInput'))) {
          showNotification('Please enter a valid batch number (1-1000)', 'error');
          return;
        }
        break;
      case 'section':
        value = document.getElementById('sectionInput').value.trim().toUpperCase();
        if (value && !validateSection(document.getElementById('sectionInput'))) {
          showNotification('Please enter a valid section (A-Z)', 'error');
          return;
        }
        break;
      case 'semester':
        value = document.getElementById('semesterInput').value;
        break;
      default:
        throw new Error('Invalid field');
    }
    
    // Get auth token
    const token = localStorage.getItem('token');
    if (!token) {
      showNotification('Authentication error. Please login again.', 'error');
      setTimeout(() => {
        window.location.href = '../../auth/login.html';
      }, 2000);
      return;
    }
    
    // Create update data
    const updateData = {
      [field]: value
    };
    
    // Update field on server
    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Check for specific error message from server
      const errorMessage = data.message || 'Failed to update profile';
      showNotification(errorMessage, 'error');
      toggleFieldEdit(field, false);
      return;
    }
    
    // Update user data in localStorage
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Update displayed value
    const valueElement = document.getElementById(`${field}Value`);
    if (valueElement) {
      valueElement.innerHTML = `
        ${value || 'Not provided'}
        <i class="fas fa-edit info-edit" data-field="${field}"></i>
      `;
      
      // Add click event to new edit icon
      valueElement.querySelector('.info-edit').addEventListener('click', function() {
        toggleFieldEdit(field, true);
      });
    }
    
    // Update section badge if section was changed
    if (field === 'section') {
      const sectionBadge = document.getElementById('userSection');
      if (sectionBadge) {
        sectionBadge.textContent = value || 'No Section';
      }
    }
    
    // Hide edit input
    toggleFieldEdit(field, false);
    
    // Show success notification
    showNotification('Profile updated successfully', 'success');
    
  } catch (error) {
    console.error(`Error saving ${field}:`, error);
    showNotification('Failed to update profile. Please try again.', 'error');
  }
}

// Generate semester options for the dropdown
function generateSemesterOptions() {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];
  const seasons = ['Spring', 'Summer', 'Fall'];
  
  let options = '';
  
  years.forEach(year => {
    seasons.forEach(season => {
      options += `<option value="${season} ${year}">${season} ${year}</option>`;
    });
  });
  
  return options;
}

// Validate section input (A-Z or a-z)
function validateSection(input) {
  const value = input.value.trim();
  const sectionError = document.getElementById('sectionError');
  
  if (value === '') {
    input.classList.remove('input-error');
    sectionError.style.display = 'none';
    return true;
  }
  
  const isValid = /^[a-zA-Z]$/.test(value);
  
  if (isValid) {
    input.classList.remove('input-error');
    sectionError.style.display = 'none';
    return true;
  } else {
    input.classList.add('input-error');
    sectionError.style.display = 'block';
    return false;
  }
}

// Validate batch input (1-1000)
function validateBatch(input) {
  const value = input.value.trim();
  const batchError = document.getElementById('batchError');
  
  if (value === '') {
    input.classList.remove('input-error');
    batchError.style.display = 'none';
    return true;
  }
  
  const numValue = parseInt(value);
  const isValid = !isNaN(numValue) && numValue >= 1 && numValue <= 1000;
  
  if (isValid) {
    input.classList.remove('input-error');
    batchError.style.display = 'none';
    return true;
  } else {
    input.classList.add('input-error');
    batchError.style.display = 'block';
    return false;
  }
}

// Setup password change functionality
function setupPasswordChange() {
  const changePasswordForm = document.getElementById('changePasswordForm');
  const currentPasswordInput = document.getElementById('currentPassword');
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const strengthBar = document.getElementById('strengthBar');
  const strengthText = document.getElementById('strengthText');
  const passwordMatch = document.getElementById('passwordMatch');
  const togglePasswordButtons = document.querySelectorAll('.toggle-password');
  
  // Handle password visibility toggle
  togglePasswordButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target');
      const targetInput = document.getElementById(targetId);
      
      if (targetInput.type === 'password') {
        targetInput.type = 'text';
        button.classList.remove('fa-eye');
        button.classList.add('fa-eye-slash');
      } else {
        targetInput.type = 'password';
        button.classList.remove('fa-eye-slash');
        button.classList.add('fa-eye');
      }
    });
  });
  
  // Check password strength
  newPasswordInput.addEventListener('input', () => {
    const password = newPasswordInput.value;
    const strength = checkPasswordStrength(password);
    
    // Update strength bar
    strengthBar.className = '';
    strengthBar.classList.add('strength-bar');
    
    if (password.length === 0) {
      strengthBar.style.width = '0';
      strengthText.textContent = 'Password strength';
    } else if (strength === 'weak') {
      strengthBar.classList.add('strength-weak');
      strengthText.textContent = 'Weak';
    } else if (strength === 'medium') {
      strengthBar.classList.add('strength-medium');
      strengthText.textContent = 'Medium';
    } else {
      strengthBar.classList.add('strength-strong');
      strengthText.textContent = 'Strong';
    }
    
    // Check if passwords match
    checkPasswordsMatch();
  });
  
  // Check if passwords match
  confirmPasswordInput.addEventListener('input', checkPasswordsMatch);
  
  function checkPasswordsMatch() {
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (confirmPassword.length === 0) {
      passwordMatch.textContent = '';
      passwordMatch.className = 'match-text';
    } else if (newPassword === confirmPassword) {
      passwordMatch.textContent = 'Passwords match';
      passwordMatch.className = 'match-text match';
    } else {
      passwordMatch.textContent = 'Passwords do not match';
      passwordMatch.className = 'match-text not-match';
    }
  }
  
  // Handle password change form submission
  changePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form data
    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    // Validate form data
    if (!currentPassword || !newPassword || !confirmPassword) {
      showNotification('All fields are required', 'error');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }
    
    if (newPassword.length < 8) {
      showNotification('Password must be at least 8 characters long', 'error');
      return;
    }
    
    if (checkPasswordStrength(newPassword) === 'weak') {
      showNotification('Please use a stronger password', 'error');
      return;
    }
    
    // Create password data object
    const passwordData = {
      currentPassword,
      newPassword
    };
    
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // Send update request to API
      const response = await fetch('/api/user/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(passwordData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }
      
      // Show success notification
      showNotification('Password changed successfully', 'success');
      
      // Reset form
      changePasswordForm.reset();
      strengthBar.style.width = '0';
      strengthText.textContent = 'Password strength';
      passwordMatch.textContent = '';
      passwordMatch.className = 'match-text';
    } catch (error) {
      console.error('Error changing password:', error);
      showNotification(error.message || 'Failed to change password. Please try again.', 'error');
    }
  });
}

// Check password strength
function checkPasswordStrength(password) {
  if (password.length < 8) {
    return 'weak';
  }
  
  // Count character types
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  
  const characterTypeCount = [hasUppercase, hasLowercase, hasNumbers, hasSpecial].filter(Boolean).length;
  
  if (characterTypeCount === 1) {
    return 'weak';
  } else if (characterTypeCount === 2) {
    return 'medium';
  } else {
    return 'strong';
  }
}

// Format date
function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Unknown';
  }
  
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// Show notification
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

// Refresh user verification status from server
async function refreshUserVerificationStatus() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const response = await fetch('/api/user/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) return;
    
    const data = await response.json();
    
    // Update only the verification status in localStorage
    const userData = JSON.parse(localStorage.getItem('user')) || {};
    userData.isVerified = data.user.isVerified;
    localStorage.setItem('user', JSON.stringify(userData));
    
  } catch (error) {
    console.error('Error refreshing verification status:', error);
  }
} 