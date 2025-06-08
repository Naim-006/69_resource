// Edit Course Page Functionality

// Global variables
let currentUser = null;
let currentCourseId = null;

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
  // Initialize page
  initEditCoursePage();
  
  // Set up event listeners
  setupEventListeners();
});

// Initialize edit course page
async function initEditCoursePage() {
  try {
    // Get auth token
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '../../auth/login.html';
      return;
    }
    
    // Get user data
    await loadUserData();
    
    // Check if user is CR
    if (!currentUser.isCR) {
      // Redirect non-CR users to courses page
      window.location.href = 'courses.html';
      return;
    }
    
    // Get course ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');
    
    if (!courseId) {
      // No course ID provided, redirect to courses page
      window.location.href = 'courses.html';
      return;
    }
    
    currentCourseId = courseId;
    
    // Load course data
    await loadCourseData(courseId);
    
  } catch (error) {
    console.error('Error initializing edit course page:', error);
    showNotification('পেজ লোড করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।', 'error');
  }
}

// Load user data
async function loadUserData() {
  try {
    // First try to get from API
    const token = localStorage.getItem('token');
    
    const response = await fetch('/api/user/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Update section badge
      const sectionBadge = document.getElementById('userSection');
      if (sectionBadge && currentUser.section) {
        sectionBadge.textContent = `Section ${currentUser.section}`;
      } else if (sectionBadge) {
        sectionBadge.textContent = 'No Section';
      }
    } else {
      throw new Error('Failed to fetch user data');
    }
  } catch (apiError) {
    console.error('Error fetching user data from API:', apiError);
    
    // Fallback to localStorage if API call fails
    const userData = localStorage.getItem('user');
    
    if (!userData) {
      throw new Error('No user data available');
    }
    
    try {
      currentUser = JSON.parse(userData);
      
      // Update section badge
      const sectionBadge = document.getElementById('userSection');
      if (sectionBadge && currentUser.section) {
        sectionBadge.textContent = `Section ${currentUser.section}`;
      } else if (sectionBadge) {
        sectionBadge.textContent = 'No Section';
      }
    } catch (parseError) {
      console.error('Error parsing user data:', parseError);
      throw new Error('Invalid user data');
    }
  }
}

// Load course data
async function loadCourseData(courseId) {
  try {
    // Show loading overlay
    const loadingOverlay = document.querySelector('.form-loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.classList.remove('hidden');
    }
    
    // Get auth token
    const token = localStorage.getItem('token');
    
    // Fetch course from API
    const response = await fetch(`/api/user/courses/${courseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch course data');
    }
    
    const data = await response.json();
    const course = data.course;
    
    // Check if user is the creator of this course
    if (!course || currentUser._id !== course.createdBy) {
      // Not the course creator, redirect to courses page
      window.location.href = 'courses.html';
      return;
    }
    
    // Fill form with course data
    fillFormWithCourseData(course);
    
    // Hide loading overlay
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
    }
    
  } catch (error) {
    console.error('Error loading course data:', error);
    
    // Hide loading overlay
    const loadingOverlay = document.querySelector('.form-loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
    }
    
    showNotification('কোর্স লোড করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।', 'error');
  }
}

// Fill form with course data
function fillFormWithCourseData(course) {
  const courseNameInput = document.getElementById('courseName');
  const teacherNameInput = document.getElementById('teacherName');
  const coursePasswordInput = document.getElementById('coursePassword');
  const sectionInput = document.getElementById('section');
  const batchInput = document.getElementById('batch');
  const semesterSelect = document.getElementById('semester');
  const departmentInput = document.getElementById('department');
  const thumbnailInput = document.getElementById('thumbnail');
  
  if (courseNameInput) courseNameInput.value = course.courseName || '';
  if (teacherNameInput) teacherNameInput.value = course.teacherName || '';
  if (coursePasswordInput) coursePasswordInput.value = course.coursePassword || '';
  if (sectionInput) sectionInput.value = course.section || '';
  if (batchInput) batchInput.value = course.batch || '';
  if (departmentInput) departmentInput.value = course.department || '';
  if (thumbnailInput) thumbnailInput.value = course.thumbnail || '';
  
  // Add semester option and select it
  if (semesterSelect && course.semester) {
    // Clear existing options except the first one
    while (semesterSelect.options.length > 1) {
      semesterSelect.remove(1);
    }
    
    // Add the course semester as an option
    const option = document.createElement('option');
    option.value = course.semester;
    option.textContent = course.semester;
    semesterSelect.appendChild(option);
    
    // Select the semester
    semesterSelect.value = course.semester;
  }
}

// Set up event listeners
function setupEventListeners() {
  // Form submission
  const editCourseForm = document.getElementById('editCourseForm');
  if (editCourseForm) {
    editCourseForm.addEventListener('submit', (e) => {
      e.preventDefault();
      updateCourse();
    });
  }
  
  // Password toggle
  const togglePasswordVisible = document.getElementById('toggleEditPassword');
  if (togglePasswordVisible) {
    togglePasswordVisible.addEventListener('click', () => {
      const passwordInput = document.getElementById('coursePassword');
      if (passwordInput) {
        if (passwordInput.type === 'password') {
          passwordInput.type = 'text';
          togglePasswordVisible.className = 'fas fa-eye-slash toggle-password';
        } else {
          passwordInput.type = 'password';
          togglePasswordVisible.className = 'fas fa-eye toggle-password';
        }
      }
    });
  }
}

// Update course
async function updateCourse() {
  try {
    // Get form data
    const courseName = document.getElementById('courseName').value;
    const teacherName = document.getElementById('teacherName').value;
    const coursePassword = document.getElementById('coursePassword').value;
    const thumbnail = document.getElementById('thumbnail').value;
    
    // Validate required fields
    if (!courseName || !teacherName || !coursePassword) {
      showNotification('সব প্রয়োজনীয় ফিল্ড পূরণ করুন।', 'error');
      return;
    }
    
    // Validate password
    if (coursePassword.length < 4) {
      showNotification('পাসওয়ার্ড কমপক্ষে ৪টি অক্ষর হতে হবে।', 'error');
      return;
    }
    
    // Prepare course data - only updatable fields
    const courseData = {
      courseName,
      teacherName,
      coursePassword
    };
    
    // Add thumbnail if provided
    if (thumbnail) courseData.thumbnail = thumbnail;
    
    // Disable form
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    }
    
    // Get auth token
    const token = localStorage.getItem('token');
    
    // Send update request to API
    const response = await fetch(`/api/user/courses/${currentCourseId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(courseData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update course');
    }
    
    const data = await response.json();
    
    // Show success notification
    showNotification('কোর্স সফলভাবে আপডেট করা হয়েছে।', 'success');
    
    // Redirect to courses page after a short delay
    setTimeout(() => {
      window.location.href = 'courses.html';
    }, 1500);
    
  } catch (error) {
    console.error('Error updating course:', error);
    showNotification(error.message || 'কোর্স আপডেট করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।', 'error');
    
    // Re-enable form
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = 'Update Course';
    }
  }
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