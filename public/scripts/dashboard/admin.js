// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.dashboard-section');
const approvalBadge = document.getElementById('approvalBadge');
const approvalsList = document.getElementById('approvalsList');
const usersList = document.getElementById('usersList');
const sectionsList = document.getElementById('sectionsList');
const totalUsers = document.getElementById('totalUsers');
const pendingApprovals = document.getElementById('pendingApprovals');
const activeSections = document.getElementById('activeSections');
const activeStudents = document.getElementById('activeStudents');
const recentActivityList = document.getElementById('recentActivityList');
const logoutBtn = document.getElementById('logoutBtn');

// Search and Filter Elements
const approvalSearch = document.getElementById('approvalSearch');
const approvalFilter = document.getElementById('approvalFilter');
const userSearch = document.getElementById('userSearch');
const userFilter = document.getElementById('userFilter');

// Modal Elements
const approvalModal = document.getElementById('approvalModal');
const addUserModal = document.getElementById('addUserModal');
const addSectionModal = document.getElementById('addSectionModal');
const closeModalBtns = document.querySelectorAll('.close-modal');
const approveBtn = document.getElementById('approveBtn');
const rejectBtn = document.getElementById('rejectBtn');
const addUserBtn = document.getElementById('addUserBtn');
const addSectionBtn = document.getElementById('addSectionBtn');

// Form Elements
const addUserForm = document.getElementById('addUserForm');
const addSectionForm = document.getElementById('addSectionForm');
const platformSettingsForm = document.getElementById('platformSettingsForm');

// Current approval being reviewed
let currentApproval = null;

// Check authentication
function checkAuth() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = '../auth/login.html';
    }
}

// Navigation
function setupNavigation() {
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = item.dataset.section;
            
            // Update active states
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Show target section
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection) {
                    section.classList.add('active');
                }
            });
        });
    });
}

// Load dashboard data
function loadDashboardData() {
    try {
        // Load users
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        totalUsers.textContent = users.length;
        activeStudents.textContent = users.filter(user => user.role === 'student' && user.status === 'active').length;

        // Load approvals
        const approvalRequests = JSON.parse(localStorage.getItem('approvalRequests') || '[]');
        const pendingRequests = approvalRequests.filter(req => req.status === 'pending');
        pendingApprovals.textContent = pendingRequests.length;
        approvalBadge.textContent = pendingRequests.length;

        // Load sections
        const sections = new Set(users.map(user => user.section).filter(Boolean));
        activeSections.textContent = sections.size;

        // Load recent activity
        loadRecentActivity();

        // Load initial lists
        loadApprovalsList();
        loadUsersList();
        loadSectionsList();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Failed to load dashboard data. Please try refreshing the page.');
    }
}

// Load recent activity
function loadRecentActivity() {
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const approvalRequests = JSON.parse(localStorage.getItem('approvalRequests') || '[]');
        
        // Combine and sort activities
        const activities = [
            ...users.map(user => ({
                type: 'user',
                action: user.status === 'active' ? 'registered' : 'status_changed',
                user: user.fullName,
                role: user.role,
                timestamp: user.registeredAt || new Date().toISOString()
            })),
            ...approvalRequests.map(req => ({
                type: 'approval',
                action: req.status,
                user: req.fullName,
                role: req.role,
                timestamp: req.processedAt || req.requestedAt
            }))
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
         .slice(0, 10);

        recentActivityList.innerHTML = activities.length ? '' : '<p class="no-data">No recent activity</p>';

        activities.forEach(activity => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `
                <div class="activity-icon">
                    <i class="fas ${getActivityIcon(activity)}"></i>
                </div>
                <div class="activity-details">
                    <p>${formatActivityMessage(activity)}</p>
                    <small>${new Date(activity.timestamp).toLocaleString()}</small>
                </div>
            `;
            recentActivityList.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading recent activity:', error);
        recentActivityList.innerHTML = '<p class="error">Failed to load recent activity</p>';
    }
}

// Get activity icon
function getActivityIcon(activity) {
    switch (activity.type) {
        case 'user':
            return activity.action === 'registered' ? 'fa-user-plus' : 'fa-user-edit';
        case 'approval':
            return activity.action === 'approved' ? 'fa-check-circle' : 'fa-times-circle';
        default:
            return 'fa-info-circle';
    }
}

// Format activity message
function formatActivityMessage(activity) {
    switch (activity.type) {
        case 'user':
            return activity.action === 'registered' 
                ? `${activity.user} (${activity.role}) registered`
                : `${activity.user}'s status was updated`;
        case 'approval':
            return `${activity.user}'s ${activity.role} request was ${activity.action}`;
        default:
            return 'Unknown activity';
    }
}

// Load approvals list
function loadApprovalsList() {
    try {
        const approvalRequests = JSON.parse(localStorage.getItem('approvalRequests') || '[]');
        const searchTerm = approvalSearch.value.toLowerCase();
        const filterValue = approvalFilter.value;

        let filteredRequests = approvalRequests.filter(req => req.status === 'pending');
        
        // Apply search filter
        if (searchTerm) {
            filteredRequests = filteredRequests.filter(req => 
                req.fullName.toLowerCase().includes(searchTerm) ||
                req.email.toLowerCase().includes(searchTerm) ||
                req.studentId.toLowerCase().includes(searchTerm)
            );
        }

        // Apply role filter
        if (filterValue !== 'all') {
            filteredRequests = filteredRequests.filter(req => req.role === filterValue);
        }

        approvalsList.innerHTML = filteredRequests.length ? '' : '<p class="no-data">No pending approvals</p>';

        filteredRequests.forEach(request => {
            const card = document.createElement('div');
            card.className = 'approval-card';
            card.innerHTML = `
                <div class="approval-info">
                    <h4>${request.fullName}</h4>
                    <p><strong>Email:</strong> ${request.email}</p>
                    <p><strong>Role:</strong> ${request.role === 'cr' ? 'CR' : 'Co-CR'}</p>
                    <p><strong>Section:</strong> ${request.section}</p>
                    <p><strong>Requested:</strong> ${new Date(request.requestedAt).toLocaleDateString()}</p>
                </div>
                <div class="approval-actions">
                    <button class="btn btn-primary review-btn" data-id="${request.email}">
                        <i class="fas fa-eye"></i> Review
                    </button>
                </div>
            `;

            card.querySelector('.review-btn').addEventListener('click', () => {
                showApprovalModal(request);
            });

            approvalsList.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading approvals list:', error);
        approvalsList.innerHTML = '<p class="error">Failed to load approvals</p>';
    }
}

// Load users list
function loadUsersList() {
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const searchTerm = userSearch.value.toLowerCase();
        const filterValue = userFilter.value;

        let filteredUsers = [...users];
        
        // Apply search filter
        if (searchTerm) {
            filteredUsers = filteredUsers.filter(user => 
                user.fullName.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm) ||
                user.studentId.toLowerCase().includes(searchTerm)
            );
        }

        // Apply role filter
        if (filterValue !== 'all') {
            filteredUsers = filteredUsers.filter(user => user.role === filterValue);
        }

        usersList.innerHTML = filteredUsers.length ? '' : '<p class="no-data">No users found</p>';

        filteredUsers.forEach(user => {
            const card = document.createElement('div');
            card.className = 'user-card';
            card.innerHTML = `
                <div class="user-info">
                    <h4>${user.fullName}</h4>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Role:</strong> ${user.role}</p>
                    <p><strong>Section:</strong> ${user.section || 'N/A'}</p>
                    <p><strong>Status:</strong> <span class="status-badge ${user.status}">${user.status}</span></p>
                </div>
                <div class="user-actions">
                    <button class="btn btn-primary edit-btn" data-id="${user.email}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger delete-btn" data-id="${user.email}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;

            card.querySelector('.edit-btn').addEventListener('click', () => {
                showEditUserModal(user);
            });

            card.querySelector('.delete-btn').addEventListener('click', () => {
                if (confirm(`Are you sure you want to delete ${user.fullName}?`)) {
                    deleteUser(user.email);
                }
            });

            usersList.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading users list:', error);
        usersList.innerHTML = '<p class="error">Failed to load users</p>';
    }
}

// Load sections list
function loadSectionsList() {
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const sections = new Set(users.map(user => user.section).filter(Boolean));
        
        sectionsList.innerHTML = sections.size ? '' : '<p class="no-data">No sections found</p>';

        sections.forEach(section => {
            const sectionUsers = users.filter(user => user.section === section);
            const cr = sectionUsers.find(user => user.role === 'cr');
            const coCr = sectionUsers.find(user => user.role === 'co-cr');
            const studentCount = sectionUsers.filter(user => user.role === 'student').length;

            const card = document.createElement('div');
            card.className = 'section-card';
            card.innerHTML = `
                <div class="section-info">
                    <h4>${section}</h4>
                    <p><strong>Students:</strong> ${studentCount}</p>
                    <p><strong>CR:</strong> ${cr ? cr.fullName : 'Not assigned'}</p>
                    <p><strong>Co-CR:</strong> ${coCr ? coCr.fullName : 'Not assigned'}</p>
                </div>
                <div class="section-actions">
                    <button class="btn btn-primary edit-btn" data-section="${section}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger delete-btn" data-section="${section}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;

            card.querySelector('.edit-btn').addEventListener('click', () => {
                showEditSectionModal(section);
            });

            card.querySelector('.delete-btn').addEventListener('click', () => {
                if (confirm(`Are you sure you want to delete section ${section}?`)) {
                    deleteSection(section);
                }
            });

            sectionsList.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading sections list:', error);
        sectionsList.innerHTML = '<p class="error">Failed to load sections</p>';
    }
}

// Show approval modal
function showApprovalModal(approval) {
    currentApproval = approval;
    
    // Fill modal with approval details
    document.getElementById('approvalName').textContent = approval.fullName;
    document.getElementById('approvalEmail').textContent = approval.email;
    document.getElementById('approvalStudentId').textContent = approval.studentId;
    document.getElementById('approvalRole').textContent = approval.role === 'cr' ? 'CR' : 'Co-CR';
    document.getElementById('approvalSection').textContent = approval.section;
    document.getElementById('approvalDate').textContent = new Date(approval.requestedAt).toLocaleString();

    // Show modal
    approvalModal.style.display = 'block';
}

// Show add user modal
function showAddUserModal() {
    // Load sections into select
    const sectionSelect = document.getElementById('newUserSection');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const sections = new Set(users.map(user => user.section).filter(Boolean));
    
    sectionSelect.innerHTML = '';
    sections.forEach(section => {
        const option = document.createElement('option');
        option.value = section;
        option.textContent = section;
        sectionSelect.appendChild(option);
    });

    // Show modal
    addUserModal.style.display = 'block';
}

// Show add section modal
function showAddSectionModal() {
    addSectionModal.style.display = 'block';
}

// Handle approval
function handleApproval(approved) {
    if (!currentApproval) return;

    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const approvalRequests = JSON.parse(localStorage.getItem('approvalRequests') || '[]');

        // Update user status
        const userIndex = users.findIndex(u => u.email === currentApproval.email);
        if (userIndex !== -1) {
            users[userIndex].status = approved ? 'active' : 'rejected';
        }

        // Update approval request status
        const requestIndex = approvalRequests.findIndex(r => r.email === currentApproval.email);
        if (requestIndex !== -1) {
            approvalRequests[requestIndex].status = approved ? 'approved' : 'rejected';
            approvalRequests[requestIndex].processedAt = new Date().toISOString();
        }

        // Save changes
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('approvalRequests', JSON.stringify(approvalRequests));

        // Close modal and reload data
        approvalModal.style.display = 'none';
        currentApproval = null;
        loadDashboardData();
    } catch (error) {
        console.error('Error handling approval:', error);
        showError('Failed to process approval. Please try again.');
    }
}

// Handle add user
function handleAddUser(event) {
    event.preventDefault();

    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const newUser = {
            email: document.getElementById('newUserEmail').value,
            fullName: document.getElementById('newUserFullName').value,
            studentId: document.getElementById('newUserStudentId').value,
            role: document.getElementById('newUserRole').value,
            section: document.getElementById('newUserSection').value,
            password: document.getElementById('newUserPassword').value,
            status: 'active',
            registeredAt: new Date().toISOString()
        };

        // Check if user already exists
        if (users.some(user => user.email === newUser.email)) {
            showError('User with this email already exists');
            return;
        }

        // Add user
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        // Close modal and reload data
        addUserModal.style.display = 'none';
        addUserForm.reset();
        loadDashboardData();
    } catch (error) {
        console.error('Error adding user:', error);
        showError('Failed to add user. Please try again.');
    }
}

// Handle add section
function handleAddSection(event) {
    event.preventDefault();

    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const newSection = document.getElementById('newSectionName').value;
        const description = document.getElementById('newSectionDescription').value;

        // Check if section already exists
        if (users.some(user => user.section === newSection)) {
            showError('Section already exists');
            return;
        }

        // Add section to settings
        const settings = JSON.parse(localStorage.getItem('settings') || '{}');
        if (!settings.sections) {
            settings.sections = [];
        }
        settings.sections.push({
            name: newSection,
            description: description,
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('settings', JSON.stringify(settings));

        // Close modal and reload data
        addSectionModal.style.display = 'none';
        addSectionForm.reset();
        loadDashboardData();
    } catch (error) {
        console.error('Error adding section:', error);
        showError('Failed to add section. Please try again.');
    }
}

// Handle platform settings
function handlePlatformSettings(event) {
    event.preventDefault();

    try {
        const settings = {
            platformName: document.getElementById('platformName').value,
            maxFileSize: parseInt(document.getElementById('maxFileSize').value),
            allowedFileTypes: document.getElementById('allowedFileTypes').value.split(',').map(type => type.trim())
        };

        localStorage.setItem('settings', JSON.stringify(settings));
        showSuccess('Settings saved successfully');
    } catch (error) {
        console.error('Error saving settings:', error);
        showError('Failed to save settings. Please try again.');
    }
}

// Delete user
function deleteUser(email) {
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const updatedUsers = users.filter(user => user.email !== email);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        loadDashboardData();
    } catch (error) {
        console.error('Error deleting user:', error);
        showError('Failed to delete user. Please try again.');
    }
}

// Delete section
function deleteSection(section) {
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const settings = JSON.parse(localStorage.getItem('settings') || '{}');

        // Update users
        users.forEach(user => {
            if (user.section === section) {
                user.section = null;
            }
        });
        localStorage.setItem('users', JSON.stringify(users));

        // Update settings
        if (settings.sections) {
            settings.sections = settings.sections.filter(s => s.name !== section);
            localStorage.setItem('settings', JSON.stringify(settings));
        }

        loadDashboardData();
    } catch (error) {
        console.error('Error deleting section:', error);
        showError('Failed to delete section. Please try again.');
    }
}

// Show error message
function showError(message) {
    // Implement error message display
    alert(message); // Replace with better UI
}

// Show success message
function showSuccess(message) {
    // Implement success message display
    alert(message); // Replace with better UI
}

// Setup event listeners
function setupEventListeners() {
    // Close modals
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            approvalModal.style.display = 'none';
            addUserModal.style.display = 'none';
            addSectionModal.style.display = 'none';
            currentApproval = null;
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === approvalModal) {
            approvalModal.style.display = 'none';
            currentApproval = null;
        }
        if (e.target === addUserModal) {
            addUserModal.style.display = 'none';
        }
        if (e.target === addSectionModal) {
            addSectionModal.style.display = 'none';
        }
    });

    // Approve button
    approveBtn.addEventListener('click', () => handleApproval(true));

    // Reject button
    rejectBtn.addEventListener('click', () => handleApproval(false));

    // Add user button
    addUserBtn.addEventListener('click', showAddUserModal);

    // Add section button
    addSectionBtn.addEventListener('click', showAddSectionModal);

    // Form submissions
    addUserForm.addEventListener('submit', handleAddUser);
    addSectionForm.addEventListener('submit', handleAddSection);
    platformSettingsForm.addEventListener('submit', handlePlatformSettings);

    // Search and filter
    approvalSearch.addEventListener('input', loadApprovalsList);
    approvalFilter.addEventListener('change', loadApprovalsList);
    userSearch.addEventListener('input', loadUsersList);
    userFilter.addEventListener('change', loadUsersList);

    // Logout
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = '../auth/login.html';
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupNavigation();
    setupEventListeners();
    loadDashboardData();
});
