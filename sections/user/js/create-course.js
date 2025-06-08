// Create Course Functionality for CR

// Constants and Configuration
const IMGBB_API_KEY = window.envConfig ? window.envConfig.IMGBB_API_KEY : ''; // ImgBB API Key
const IMGBB_API_URL = window.envConfig ? window.envConfig.IMGBB_API_URL : '';
const MAX_FILE_SIZE = window.envConfig ? window.envConfig.MAX_FILE_SIZE : 10 * 1024 * 1024; // 10MB (increased from 2MB)

// Global variables
let currentUser = null;
let thumbnailURL = null;

// DOM elements
document.addEventListener('DOMContentLoaded', function() {
  // Initialize DOM elements only after page is loaded
  const courseForm = document.getElementById('createCourseForm');
  const courseName = document.getElementById('courseName');
  const teacherName = document.getElementById('teacherName');
  const coursePassword = document.getElementById('coursePassword');
  const togglePassword = document.getElementById('togglePassword');
  const userBatch = document.getElementById('userBatch');
  const userSectionDisplay = document.getElementById('userSectionDisplay');
  const userSemester = document.getElementById('userSemester');
  const thumbnailPreview = document.getElementById('thumbnailPreview');
  const thumbnailFile = document.getElementById('thumbnailFile');
  const thumbnailUrl = document.getElementById('thumbnailUrl');
  const applyUrlBtn = document.getElementById('applyUrlBtn');
  const uploadProgress = document.getElementById('uploadProgress');
  const progressFill = document.querySelector('.progress-fill');
  const progressText = document.querySelector('.progress-text');
  const cancelBtn = document.getElementById('cancelBtn');
  const createBtn = document.getElementById('createBtn');
  const nonCRMessage = document.getElementById('nonCRMessage');
  const crContent = document.getElementById('crContent');
  const missingProfileInfo = document.getElementById('missingProfileInfo');
  const userSection = document.getElementById('userSection');

  // Initialize the page
  initCreateCourse();
  
  // Set up event listeners
  if (thumbnailFile) {
    thumbnailFile.addEventListener('change', handleFileUpload);
  }
  
  if (applyUrlBtn) {
    applyUrlBtn.addEventListener('click', applyThumbnailUrl);
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      window.location.href = 'courses.html';
    });
  }
  
  if (courseForm) {
    courseForm.addEventListener('submit', handleFormSubmit);
  }
  
  // Password toggle
  if (togglePassword) {
    togglePassword.addEventListener('click', () => {
      // Toggle password visibility
      if (coursePassword.type === 'password') {
        coursePassword.type = 'text';
        togglePassword.innerHTML = '<i class="fas fa-eye-slash"></i>';
      } else {
        coursePassword.type = 'password';
        togglePassword.innerHTML = '<i class="fas fa-eye"></i>';
      }
    });
  }

  // Initialize the create course page
  async function initCreateCourse() {
    try {
      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '../../auth/login.html';
        return;
      }
      
      // Load user data
      await loadUserData();
      
      // Check if user is a CR
      if (!currentUser.isCR) {
        // Show message for non-CR users
        nonCRMessage.classList.remove('hidden');
        crContent.classList.add('hidden');
        return;
      }
      
      // Show CR content
      nonCRMessage.classList.add('hidden');
      crContent.classList.remove('hidden');
      
      // Check if user has section, batch, and semester set
      if (!currentUser.section || !currentUser.batch || !currentUser.semester) {
        // Show missing profile info message
        missingProfileInfo.classList.remove('hidden');
        courseForm.classList.add('hidden');
        return;
      }
      
      // Display user's section, batch, and semester
      userBatch.textContent = currentUser.batch || 'Not set';
      userSectionDisplay.textContent = currentUser.section || 'Not set';
      userSemester.textContent = currentUser.semester || 'Not set';
      
      // Show the course form
      courseForm.classList.remove('hidden');
      missingProfileInfo.classList.add('hidden');
      
    } catch (error) {
      console.error('Error initializing create course page:', error);
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
        if (userSection) {
          userSection.textContent = currentUser.section || 'No Section';
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
        if (userSection) {
          userSection.textContent = currentUser.section || 'No Section';
        }
      } catch (parseError) {
        console.error('Error parsing user data:', parseError);
        throw new Error('Invalid user data');
      }
    }
  }
  
  // Apply thumbnail URL
  function applyThumbnailUrl() {
    const url = thumbnailUrl.value.trim();
    
    if (!url) {
      showNotification('Please enter a URL', 'error');
      return;
    }
    
    if (!isValidUrl(url)) {
      showNotification('Please enter a valid URL', 'error');
      return;
    }
    
    // Apply the URL
    thumbnailURL = url;
    
    // Update preview
    thumbnailPreview.innerHTML = `<img src="${url}" alt="Thumbnail Preview">`;
    thumbnailPreview.classList.remove('empty');
    
    // Clear input
    thumbnailUrl.value = '';
    
    showNotification('Thumbnail URL applied', 'success');
  }
  
  // Handle file upload
  async function handleFileUpload(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      showNotification('Please select an image file', 'error');
      return;
    }
    
    // Check file size (max 10MB)
    if (file.size > MAX_FILE_SIZE) {
      showNotification('Image size should be less than 10MB', 'error');
      return;
    }
    
    try {
      // Show upload progress
      uploadProgress.classList.remove('hidden');
      progressFill.style.width = '0%';
      progressText.textContent = '0%';
      
      // Simulate progress (will be replaced with actual upload progress in production)
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 5;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${progress}%`;
        
        if (progress >= 90) {
          clearInterval(progressInterval);
        }
      }, 100);
      
      // Upload to ImgBB
      const formData = new FormData();
      formData.append('image', file);
      formData.append('key', IMGBB_API_KEY);
      
      const response = await fetch(IMGBB_API_URL, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      // Complete progress
      clearInterval(progressInterval);
      progressFill.style.width = '100%';
      progressText.textContent = '100%';
      
      if (data.success) {
        // Set thumbnail URL
        thumbnailURL = data.data.url;
        
        // Update preview
        thumbnailPreview.innerHTML = `<img src="${thumbnailURL}" alt="Thumbnail Preview">`;
        thumbnailPreview.classList.remove('empty');
        
        showNotification('Image uploaded successfully', 'success');
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showNotification('Failed to upload image. Please try again or use a URL instead.', 'error');
    } finally {
      // Hide progress after delay
      setTimeout(() => {
        uploadProgress.classList.add('hidden');
      }, 1000);
    }
  }

  // Handle form submission
  async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Get form values
    const courseNameValue = courseName.value.trim();
    const teacherNameValue = teacherName.value.trim();
    const coursePasswordValue = coursePassword.value.trim();
    
    // Validate form values
    if (!courseNameValue) {
      showNotification('কোর্সের নাম দিন', 'error');
      courseName.focus();
      return;
    }
    
    if (!teacherNameValue) {
      showNotification('শিক্ষকের নাম দিন', 'error');
      teacherName.focus();
      return;
    }
    
    if (!coursePasswordValue || coursePasswordValue.length < 4) {
      showNotification('কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড দিন', 'error');
      coursePassword.focus();
      return;
    }
    
    try {
      // Disable submit button
      createBtn.disabled = true;
      createBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
      
      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '../../auth/login.html';
        return;
      }
      
      // Make sure we have current user data with section, batch, and semester
      if (!currentUser || !currentUser.section || !currentUser.batch || !currentUser.semester) {
        showNotification('আপনার প্রোফাইলে সেকশন, ব্যাচ এবং সেমিস্টার সেট করুন', 'error');
        setTimeout(() => {
          window.location.href = 'profile.html';
        }, 2000);
        return;
      }
      
      // Create course data
      const courseData = {
        courseName: courseNameValue,
        teacherName: teacherNameValue,
        coursePassword: coursePasswordValue,
        thumbnail: thumbnailURL,
        // Include CR's section, batch and semester
        section: currentUser.section,
        batch: currentUser.batch,
        semester: currentUser.semester,
        department: 'CSE' // Default department
      };
      
      console.log('Sending course data:', courseData);
      
      // Send API request to new endpoint
      const response = await fetch('/api/user/courses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(courseData)
      });
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Non-JSON response received:', await response.text());
        throw new Error('Server returned an invalid response format');
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create course');
      }
      
      // Show success notification
      showNotification('কোর্স সফলভাবে তৈরি করা হয়েছে', 'success');
      
      // Redirect to courses page after delay
      setTimeout(() => {
        window.location.href = 'courses.html';
      }, 2000);
      
    } catch (error) {
      console.error('Error creating course:', error);
      showNotification(error.message || 'কোর্স তৈরি করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।', 'error');
      
      // Re-enable submit button
      createBtn.disabled = false;
      createBtn.innerHTML = 'Create Course';
    }
  }
});

// Check if URL is valid
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
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