// Courses Page Functionality

// Global variables
let currentUser = null;
let courses = [];
let currentPage = 1;
let totalPages = 1;
let coursesPerPage = 8;
let currentFilters = {
  search: '',
  semester: '',
  batch: '',
  onlyMyCourses: false // Filter for CR's courses
};

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
  // Initialize page
  initCoursesPage();
  
  // Set up event listeners
  setupEventListeners();
});

// Initialize courses page
async function initCoursesPage() {
  try {
    // Get auth token
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '../../auth/login.html';
      return;
    }
    
    // Get user data
    await loadUserData();
    
    // Update UI based on user role
    updateUIForUserRole();
    
    // Fetch available semesters and batches for filters
    await loadFilterOptions();
    
    // Fetch courses
    await fetchCourses();
    
  } catch (error) {
    console.error('Error initializing courses page:', error);
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

// Update UI based on user role
function updateUIForUserRole() {
  // Show CR-specific UI elements if user is a CR
  const crActions = document.getElementById('crActions');
  const crEmptyAction = document.getElementById('crEmptyAction');
  const myCourseFilter = document.getElementById('myCourseFilter');
  
  if (currentUser.isCR) {
    if (crActions) crActions.classList.remove('hidden');
    if (crEmptyAction) crEmptyAction.classList.remove('hidden');
    if (myCourseFilter) myCourseFilter.classList.remove('hidden');
  } else {
    if (crActions) crActions.classList.add('hidden');
    if (crEmptyAction) crEmptyAction.classList.add('hidden');
    if (myCourseFilter) myCourseFilter.classList.add('hidden');
  }
}

// Load filter options
async function loadFilterOptions() {
  try {
    // Get auth token
    const token = localStorage.getItem('token');
    
    // Fetch available semesters and batches from the API
    const response = await fetch('/api/user/courses/filters', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch filter options');
    }
    
    const data = await response.json();
    const { semesters, batches } = data;
    
    const semesterFilter = document.getElementById('semesterFilter');
    const batchFilter = document.getElementById('batchFilter');
    
    // Clear existing options (except the default "All" option)
    while (semesterFilter.options.length > 1) {
      semesterFilter.remove(1);
    }
    
    while (batchFilter.options.length > 1) {
      batchFilter.remove(1);
    }
    
    // Add semester options
    if (semesters && semesters.length > 0) {
      semesters.forEach(semester => {
        const option = document.createElement('option');
        option.value = semester;
        option.textContent = semester;
        semesterFilter.appendChild(option);
      });
    } else {
      // Fallback options if API doesn't return any
      const fallbackSemesters = ['Spring 2023', 'Summer 2023', 'Fall 2023', 'Spring 2024', 'Summer 2024', 'Fall 2024', 'Spring 2025'];
      fallbackSemesters.forEach(semester => {
        const option = document.createElement('option');
        option.value = semester;
        option.textContent = semester;
        semesterFilter.appendChild(option);
      });
    }
    
    // Add batch options
    if (batches && batches.length > 0) {
      batches.forEach(batch => {
        const option = document.createElement('option');
        option.value = batch;
        option.textContent = `Batch ${batch}`;
        batchFilter.appendChild(option);
      });
    } else {
      // Fallback options if API doesn't return any
      const fallbackBatches = ['66', '67', '68', '69', '70'];
      fallbackBatches.forEach(batch => {
        const option = document.createElement('option');
        option.value = batch;
        option.textContent = `Batch ${batch}`;
        batchFilter.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading filter options:', error);
    
    // Fallback options if API call fails
    const semesterFilter = document.getElementById('semesterFilter');
    const batchFilter = document.getElementById('batchFilter');
    
    // Add fallback semester options
    const fallbackSemesters = ['Spring 2023', 'Summer 2023', 'Fall 2023', 'Spring 2024', 'Summer 2024', 'Fall 2024', 'Spring 2025'];
    fallbackSemesters.forEach(semester => {
      const option = document.createElement('option');
      option.value = semester;
      option.textContent = semester;
      semesterFilter.appendChild(option);
    });
    
    // Add fallback batch options
    const fallbackBatches = ['66', '67', '68', '69', '70'];
    fallbackBatches.forEach(batch => {
      const option = document.createElement('option');
      option.value = batch;
      option.textContent = `Batch ${batch}`;
      batchFilter.appendChild(option);
    });
  }
}

// Fetch courses
async function fetchCourses() {
  try {
    const coursesGrid = document.getElementById('coursesGrid');
    const loadingContainer = document.querySelector('.loading-container');
    const emptyState = document.querySelector('.empty-state');
    const pagination = document.querySelector('.pagination');
    
    // Step 1: Clear the grid first (except loading and empty state)
    clearCoursesGrid();
    
    // Step 2: Show loading state clearly
    if (loadingContainer) {
      loadingContainer.classList.remove('hidden');
      console.log("Loading state shown");
    }
    
    if (emptyState) {
      emptyState.classList.add('hidden');
    }
    
    if (pagination) {
      pagination.classList.add('hidden');
    }
    
    // Build query parameters
    const params = new URLSearchParams({
      page: currentPage,
      limit: coursesPerPage,
      include_password: 'true' // Add this parameter to request passwords for CR users
    });
    
    if (currentFilters.search) {
      params.append('search', currentFilters.search);
    }
    
    if (currentFilters.semester) {
      params.append('semester', currentFilters.semester);
    }
    
    if (currentFilters.batch) {
      params.append('batch', currentFilters.batch);
    }
    
    // If user is CR and wants to see only their courses
    if (currentUser.isCR && currentFilters.onlyMyCourses) {
      params.append('createdBy', currentUser._id);
    }
    
    // Get auth token
    const token = localStorage.getItem('token');
    
    // Simulate delay to ensure spinner is visible (if API is too fast)
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Fetch courses from API
    const response = await fetch(`/api/user/courses?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch courses');
    }
    
    const data = await response.json();
    
    // Process courses to include needed information
    courses = data.courses.map(course => {
      // Check if current user is the creator of this course
      const isCreator = currentUser.isCR && currentUser._id === course.createdBy;
      
      // If user is creator, we need to make a separate call to get the password
      if (isCreator && !course.coursePassword) {
        console.log(`Fetching password for course: ${course.courseName}`);
        fetchCoursePassword(course._id);
      }
      
      return {
        ...course,
        isCreator
      };
    }) || [];
    
    totalPages = data.totalPages || Math.ceil(courses.length / coursesPerPage) || 1;
    
    // Debug log to check courses data
    console.log(`Fetched ${courses.length} courses. Filters:`, currentFilters);
    
    // Step 3: Hide loading state
    if (loadingContainer) {
      loadingContainer.classList.add('hidden');
      console.log("Loading state hidden");
    }
    
    // Step 4: Show empty state if no courses
    if (!courses || courses.length === 0) {
      if (emptyState) {
        emptyState.classList.remove('hidden');
        console.log("Empty state shown");
      }
      if (pagination) {
        pagination.classList.add('hidden');
      }
    } else {
      // Step 5: Hide empty state and display courses
      if (emptyState) {
        emptyState.classList.add('hidden');
      }
      
      // Display courses
      displayCourses(courses);
      
      // Update pagination
      if (pagination && totalPages > 1) {
        pagination.classList.remove('hidden');
        updatePagination();
      }
    }
    
  } catch (error) {
    console.error('Error fetching courses:', error);
    
    const loadingContainer = document.querySelector('.loading-container');
    if (loadingContainer) {
      loadingContainer.classList.add('hidden');
    }
    
    showError('কোর্স লোড করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
  }
}

// Fetch course password for CR's own courses
async function fetchCoursePassword(courseId) {
  try {
    // Get auth token
    const token = localStorage.getItem('token');
    
    // Make a specific API call to get the course with password
    const response = await fetch(`/api/user/courses/${courseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch course password');
    }
    
    const data = await response.json();
    
    if (data.success && data.course && data.course.coursePassword) {
      // Update the course in our local array
      const courseIndex = courses.findIndex(c => c._id === courseId);
      if (courseIndex !== -1) {
        courses[courseIndex].coursePassword = data.course.coursePassword;
        console.log(`Updated password for course: ${courses[courseIndex].courseName}`);
        
        // Clear the courses grid first
        clearCoursesGrid();
        
        // Re-display the courses to show the password
        displayCourses(courses);
      }
    }
  } catch (error) {
    console.error('Error fetching course password:', error);
  }
}

// Clear the courses grid but keep loading and empty state
function clearCoursesGrid() {
  const coursesGrid = document.getElementById('coursesGrid');
  if (!coursesGrid) return;
  
  // Save loading container and empty state elements
  const loadingContainer = document.querySelector('.loading-container');
  const emptyState = document.querySelector('.empty-state');
  
  // Clear the grid
  coursesGrid.innerHTML = '';
  
  // Re-add loading container and empty state
  if (loadingContainer) {
    coursesGrid.appendChild(loadingContainer);
  } else {
    // Create loading container if it doesn't exist
    const newLoadingContainer = document.createElement('div');
    newLoadingContainer.className = 'loading-container';
    newLoadingContainer.innerHTML = `
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <p>Loading courses...</p>
    `;
    coursesGrid.appendChild(newLoadingContainer);
  }
  
  if (emptyState) {
    coursesGrid.appendChild(emptyState);
  } else {
    // Create empty state if it doesn't exist
    const newEmptyState = document.createElement('div');
    newEmptyState.className = 'empty-state hidden';
    newEmptyState.innerHTML = `
      <i class="fas fa-graduation-cap"></i>
      <h3>No Courses Found</h3>
      <p>There are no courses available for your section or matching your search criteria.</p>
      <div id="crEmptyAction" class="hidden">
        <a href="create-course.html" class="btn btn-primary">
          <i class="fas fa-plus-circle"></i> Create Your First Course
        </a>
      </div>
    `;
    coursesGrid.appendChild(newEmptyState);
    
    // Show CR action if user is CR
    if (currentUser && currentUser.isCR) {
      const crEmptyAction = newEmptyState.querySelector('#crEmptyAction');
      if (crEmptyAction) {
        crEmptyAction.classList.remove('hidden');
      }
    }
  }
}

// Display courses in the grid
function displayCourses(courses) {
  const coursesGrid = document.getElementById('coursesGrid');
  if (!coursesGrid) return;
  
  // Get loading and empty state elements
  const loadingContainer = document.querySelector('.loading-container');
  const emptyState = document.querySelector('.empty-state');
  
  // Hide loading and empty state
  if (loadingContainer) loadingContainer.classList.add('hidden');
  if (emptyState) emptyState.classList.add('hidden');
  
  // Debug log to help track CR status and course creators
  console.log("Current user:", currentUser);
  
  // Render each course
  courses.forEach(course => {
    // Debug log to track each course's creator
    console.log(`Course: ${course.courseName}, CreatedBy: ${course.createdBy}, CurrentUser: ${currentUser._id}`);
    
    const courseCard = document.createElement('div');
    courseCard.className = 'course-card';
    
    // Create thumbnail
    const thumbnail = document.createElement('div');
    thumbnail.className = 'course-thumbnail';
    
    if (course.thumbnail) {
      thumbnail.innerHTML = `<img src="${course.thumbnail}" alt="${course.courseName}">`;
    } else {
      thumbnail.innerHTML = `<div class="placeholder"><i class="fas fa-graduation-cap"></i></div>`;
    }
    
    // Check if current user is the creator of this course
    const isCreator = currentUser.isCR && currentUser._id === course.createdBy;
    
    // Log if this user is the creator of this course
    if (isCreator) {
      console.log(`User is creator of course: ${course.courseName}`);
    }
    
    // Create course info badge for CR's course
    let crInfo = '';
    if (course.crName) {
      crInfo = `
        <div class="cr-badge${isCreator ? ' my-course' : ''}">
          <i class="fas fa-user-shield"></i> CR: ${course.crName}
        </div>
      `;
    }
    
    // Add CR badge to thumbnail
    thumbnail.innerHTML += crInfo;
    
    // Create content
    const content = document.createElement('div');
    content.className = 'course-content';
    
    // Create action buttons for course creator
    let actionButtons = '';
    if (isCreator) {
      actionButtons = `
        <div class="cr-actions">
          <button class="action-btn edit-btn" data-course-id="${course._id}" title="Edit Course">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn delete-btn" data-course-id="${course._id}" title="Delete Course">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      `;
    }
    
    // Create password section if user is creator
    let passwordSection = '';
    if (isCreator) {
      // Get course password directly from API
      const coursePassword = course.coursePassword || 'Not available';
      
      passwordSection = `
        <div class="course-password-section">
          <div class="password-header">
            <span class="password-value">${coursePassword}</span>
            <button class="password-edit-btn" data-course-id="${course._id}" title="Edit Password">
              <i class="fas fa-pencil-alt"></i>
            </button>
          </div>
          <div class="password-note">Only you can see this password</div>
        </div>
      `;
    }
    
    content.innerHTML = `
      <div class="course-header">
        <h3 class="course-title">${course.courseName}</h3>
        ${actionButtons}
      </div>
      <div class="course-details">
        <div class="teacher-info"><i class="fas fa-user"></i> <strong>Teacher:</strong> ${course.teacherName}</div>
        <div class="dept-info"><i class="fas fa-graduation-cap"></i> ${course.department || 'CSE'}</div>
        <div class="batch-section-info"><i class="fas fa-users"></i> <span class="batch-section">Batch ${course.batch} (Section ${course.section})</span></div>
        <div class="semester-info"><i class="fas fa-calendar"></i> ${course.semester}</div>
        ${course.crEmail ? `<div class="cr-email-info"><i class="fas fa-envelope"></i> ${course.crEmail}</div>` : ''}
      </div>
      ${passwordSection}
      <div class="course-actions">
        ${course.isEnrolled 
          ? `<button class="btn btn-success" disabled><i class="fas fa-check-circle"></i> Enrolled</button>`
          : `<button class="btn btn-primary enroll-btn" data-course-id="${course._id}"><i class="fas fa-sign-in-alt"></i> Enroll Now</button>`
        }
      </div>
    `;
    
    // Add to grid
    courseCard.appendChild(thumbnail);
    courseCard.appendChild(content);
    coursesGrid.appendChild(courseCard);
  });
  
  // Add event listeners
  addCourseEventListeners();
}

// Add event listeners to course cards
function addCourseEventListeners() {
  // Enroll buttons
  document.querySelectorAll('.enroll-btn').forEach(button => {
    button.addEventListener('click', () => {
      const courseId = button.getAttribute('data-course-id');
      showEnrollmentModal(courseId);
    });
  });
  
  // Edit buttons
  document.querySelectorAll('.edit-btn').forEach(button => {
    button.addEventListener('click', () => {
      const courseId = button.getAttribute('data-course-id');
      editCourse(courseId);
    });
  });
  
  // Delete buttons
  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', () => {
      const courseId = button.getAttribute('data-course-id');
      showDeleteConfirmation(courseId);
    });
  });
  
  // Password edit buttons
  document.querySelectorAll('.password-edit-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const courseId = button.getAttribute('data-course-id');
      showPasswordEditModal(courseId);
    });
  });
}

// Show error message in the courses grid
function showError(message) {
  const coursesGrid = document.getElementById('coursesGrid');
  if (!coursesGrid) return;
  
  // Clear grid
  coursesGrid.innerHTML = '';
  
  // Create and add error message
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-state';
  errorDiv.innerHTML = `
    <i class="fas fa-exclamation-circle"></i>
    <h3>কোর্স লোড করতে সমস্যা হয়েছে</h3>
    <p>${message}</p>
    <button class="btn btn-primary" onclick="fetchCourses()">আবার চেষ্টা করুন</button>
  `;
  
  coursesGrid.appendChild(errorDiv);
}

// Update pagination
function updatePagination() {
  const pageInfo = document.getElementById('pageInfo');
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');
  
  if (pageInfo) {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  }
  
  if (prevPageBtn) {
    prevPageBtn.disabled = currentPage <= 1;
  }
  
  if (nextPageBtn) {
    nextPageBtn.disabled = currentPage >= totalPages;
  }
}

// Show enrollment modal
function showEnrollmentModal(courseId) {
  const course = courses.find(c => c._id === courseId);
  
  if (!course) return;
  
  const enrollModal = document.getElementById('enrollModal');
  const enrollCourseName = document.getElementById('enrollCourseName');
  const enrollTeacher = document.getElementById('enrollTeacher');
  const enrollSemester = document.getElementById('enrollSemester');
  const enrollCR = document.getElementById('enrollCR');
  
  if (enrollCourseName) enrollCourseName.textContent = course.courseName;
  if (enrollTeacher) enrollTeacher.textContent = `Teacher: ${course.teacherName}`;
  if (enrollSemester) enrollSemester.textContent = `Semester: ${course.semester}`;
  if (enrollCR && course.crName) enrollCR.textContent = `CR: ${course.crName}`;
  
  // Store course ID for enrollment
  enrollModal.setAttribute('data-course-id', courseId);
  
  // Show modal
  enrollModal.classList.add('show');
}

// Edit course
function editCourse(courseId) {
  // Redirect to edit course page
  window.location.href = `edit-course.html?id=${courseId}`;
}

// Show delete confirmation
function showDeleteConfirmation(courseId) {
  const course = courses.find(c => c._id === courseId);
  
  if (!course) return;
  
  const deleteModal = document.getElementById('deleteModal');
  const deleteCourseName = document.getElementById('deleteCourseName');
  
  if (deleteCourseName) deleteCourseName.textContent = course.courseName;
  
  // Store course ID for deletion
  deleteModal.setAttribute('data-course-id', courseId);
  
  // Show modal
  deleteModal.classList.add('show');
}

// Show password edit modal
function showPasswordEditModal(courseId) {
  const course = courses.find(c => c._id === courseId);
  
  if (!course || !course.coursePassword) return;
  
  const passwordModal = document.getElementById('passwordModal');
  const courseNameEl = document.getElementById('passwordModalCourseName');
  const currentPasswordEl = document.getElementById('currentPassword');
  
  if (courseNameEl) courseNameEl.textContent = course.courseName;
  if (currentPasswordEl) currentPasswordEl.value = course.coursePassword;
  
  // Store course ID for password update
  passwordModal.setAttribute('data-course-id', courseId);
  
  // Show modal
  passwordModal.classList.add('show');
  
  // Focus on password input
  if (currentPasswordEl) {
    setTimeout(() => {
      currentPasswordEl.focus();
      currentPasswordEl.select();
    }, 100);
  }
}

// Delete course
async function deleteCourse(courseId) {
  try {
    // Get auth token
    const token = localStorage.getItem('token');
    
    // Send delete request to API
    const response = await fetch(`/api/user/courses/${courseId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete course');
    }
    
    // Show success notification
    showNotification('কোর্স সফলভাবে মুছে ফেলা হয়েছে', 'success');
    
    // Refresh courses
    fetchCourses();
    
    // Hide delete modal
    const deleteModal = document.getElementById('deleteModal');
    if (deleteModal) deleteModal.classList.remove('show');
    
  } catch (error) {
    console.error('Error deleting course:', error);
    showNotification('কোর্স মুছতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।', 'error');
  }
}

// Update course password
async function updateCoursePassword(courseId, newPassword) {
  try {
    // Validate password
    if (!newPassword || newPassword.length < 4) {
      showNotification('কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড দিন', 'error');
      return false;
    }
    
    // Get auth token
    const token = localStorage.getItem('token');
    
    // Send update request to API
    const response = await fetch(`/api/user/courses/${courseId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ coursePassword: newPassword })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update password');
    }
    
    const data = await response.json();
    
    // Update course in local array
    const courseIndex = courses.findIndex(c => c._id === courseId);
    if (courseIndex !== -1) {
      courses[courseIndex].coursePassword = newPassword;
    }
    
    // Show success notification
    showNotification('পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে', 'success');
    
    // Clear the courses grid first
    clearCoursesGrid();
    
    // Then display courses (instead of just re-rendering on top)
    displayCourses(courses);
    
    return true;
    
  } catch (error) {
    console.error('Error updating course password:', error);
    showNotification(error.message || 'পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।', 'error');
    return false;
  }
}

// Set up event listeners
function setupEventListeners() {
  // Search input
  const courseSearch = document.getElementById('courseSearch');
  if (courseSearch) {
    courseSearch.addEventListener('input', debounce(() => {
      currentFilters.search = courseSearch.value.trim();
      currentPage = 1;
      fetchCourses();
    }, 300));
  }
  
  // Semester filter
  const semesterFilter = document.getElementById('semesterFilter');
  if (semesterFilter) {
    semesterFilter.addEventListener('change', () => {
      currentFilters.semester = semesterFilter.value;
      currentPage = 1;
      fetchCourses();
    });
  }
  
  // Batch filter
  const batchFilter = document.getElementById('batchFilter');
  if (batchFilter) {
    batchFilter.addEventListener('change', () => {
      currentFilters.batch = batchFilter.value;
      currentPage = 1;
      fetchCourses();
    });
  }
  
  // My Courses filter (CR only)
  const myCourseCheckbox = document.getElementById('myCourseCheckbox');
  if (myCourseCheckbox) {
    myCourseCheckbox.addEventListener('change', () => {
      currentFilters.onlyMyCourses = myCourseCheckbox.checked;
      currentPage = 1;
      fetchCourses();
    });
  }
  
  // Pagination
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');
  
  if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        fetchCourses();
      }
    });
  }
  
  if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        fetchCourses();
      }
    });
  }
  
  // Enrollment modal
  const enrollModal = document.getElementById('enrollModal');
  const closeEnrollModal = document.getElementById('closeEnrollModal');
  const cancelEnrollment = document.getElementById('cancelEnrollment');
  const enrollForm = document.getElementById('enrollForm');
  
  if (closeEnrollModal) {
    closeEnrollModal.addEventListener('click', () => {
      enrollModal.classList.remove('show');
    });
  }
  
  if (cancelEnrollment) {
    cancelEnrollment.addEventListener('click', () => {
      enrollModal.classList.remove('show');
    });
  }
  
  if (enrollForm) {
    enrollForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const courseId = enrollModal.getAttribute('data-course-id');
      const coursePassword = document.getElementById('coursePassword').value;
      
      enrollInCourse(courseId, coursePassword);
    });
  }
  
  // Password edit modal
  const passwordModal = document.getElementById('passwordModal');
  const closePasswordModal = document.getElementById('closePasswordModal');
  const cancelPasswordEdit = document.getElementById('cancelPasswordEdit');
  const passwordForm = document.getElementById('passwordEditForm');
  const togglePasswordVisible = document.getElementById('togglePasswordModal');
  
  if (closePasswordModal) {
    closePasswordModal.addEventListener('click', () => {
      passwordModal.classList.remove('show');
    });
  }
  
  if (cancelPasswordEdit) {
    cancelPasswordEdit.addEventListener('click', () => {
      passwordModal.classList.remove('show');
    });
  }
  
  if (togglePasswordVisible) {
    togglePasswordVisible.addEventListener('click', () => {
      const passwordInput = document.getElementById('currentPassword');
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
  
  if (passwordForm) {
    passwordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const courseId = passwordModal.getAttribute('data-course-id');
      const newPassword = document.getElementById('currentPassword').value.trim();
      
      updateCoursePassword(courseId, newPassword).then(success => {
        if (success) {
          passwordModal.classList.remove('show');
        }
      });
    });
  }
  
  // Delete modal
  const deleteModal = document.getElementById('deleteModal');
  const closeDeleteModal = document.getElementById('closeDeleteModal');
  const cancelDelete = document.getElementById('cancelDelete');
  const confirmDelete = document.getElementById('confirmDelete');
  
  if (closeDeleteModal) {
    closeDeleteModal.addEventListener('click', () => {
      deleteModal.classList.remove('show');
    });
  }
  
  if (cancelDelete) {
    cancelDelete.addEventListener('click', () => {
      deleteModal.classList.remove('show');
    });
  }
  
  if (confirmDelete) {
    confirmDelete.addEventListener('click', () => {
      const courseId = deleteModal.getAttribute('data-course-id');
      deleteCourse(courseId);
    });
  }
  
  // Close modals when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === enrollModal) {
      enrollModal.classList.remove('show');
    }
    if (e.target === deleteModal) {
      deleteModal.classList.remove('show');
    }
    if (e.target === passwordModal) {
      passwordModal.classList.remove('show');
    }
  });
}

// Enroll in course
async function enrollInCourse(courseId, password) {
  try {
    const enrollModal = document.getElementById('enrollModal');
    const confirmEnrollment = document.getElementById('confirmEnrollment');
    
    // Disable button and show loading state
    if (confirmEnrollment) {
      confirmEnrollment.disabled = true;
      confirmEnrollment.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enrolling...';
    }
    
    // Get auth token
    const token = localStorage.getItem('token');
    
    // Send enrollment request to API
    const response = await fetch(`/api/user/courses/${courseId}/enroll`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to enroll in course');
    }
    
    const data = await response.json();
    
    // Update course in local array
    const courseIndex = courses.findIndex(c => c._id === courseId);
    if (courseIndex !== -1) {
      courses[courseIndex].isEnrolled = true;
    }
    
    // Show success notification
    showNotification('কোর্সে সফলভাবে এনরোল করা হয়েছে', 'success');
    
    // Hide modal
    enrollModal.classList.remove('show');
    
    // Reset form
    document.getElementById('enrollForm').reset();
    
    // Clear the courses grid first
    clearCoursesGrid();
    
    // Refresh courses to update UI
    displayCourses(courses);
    
  } catch (error) {
    console.error('Error enrolling in course:', error);
    showNotification(error.message || 'এনরোল করতে সমস্যা হয়েছে। পাসওয়ার্ড সঠিক কিনা যাচাই করুন।', 'error');
  } finally {
    // Reset button state
    const confirmEnrollment = document.getElementById('confirmEnrollment');
    if (confirmEnrollment) {
      confirmEnrollment.disabled = false;
      confirmEnrollment.innerHTML = 'Enroll Now';
    }
  }
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
