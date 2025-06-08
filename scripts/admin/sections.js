// Admin Sections Script

// Initialize the sections page
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in and is admin
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = '../../../auth/login.html';
        return;
    }

    // Update admin name in header
    document.getElementById('adminName').textContent = currentUser.fullName || 'Admin';

    // Initialize mobile menu toggle
    initializeMobileMenu();

    // Load sections data
    loadSections();
    
    // Setup event listeners
    setupEventListeners();
});

// Initialize mobile menu toggle
function initializeMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('expanded');
        });
    }
}

// Setup event listeners
function setupEventListeners() {
    // Add section button
    document.getElementById('addSectionBtn')?.addEventListener('click', () => showModal('sectionModal'));
    
    // Section form submit
    document.getElementById('sectionForm')?.addEventListener('submit', handleSectionSubmit);
    
    // Close buttons for modals
    document.querySelectorAll('.close-btn, .close-modal').forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal.id);
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });
    
    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
}

// Load sections
function loadSections() {
    const sectionsList = document.getElementById('sectionsList');
    const sections = JSON.parse(localStorage.getItem('sections') || '[]');
    
    if (sections.length === 0) {
        sectionsList.innerHTML = '<p class="empty-state">No sections available. Click "Add Section" to create one.</p>';
        return;
    }
    
    // Render sections
    sectionsList.innerHTML = sections.map(section => {
        // Get stats for this section
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const studentCount = users.filter(u => u.role === 'student' && u.section === section.number).length;
        const crCount = users.filter(u => u.role === 'cr' && u.section === section.number).length;
        
        return `
            <div class="section-card" data-section-id="${section.id}">
                <div class="section-card-header">
                    Section ${section.number}
                </div>
                <div class="section-card-body">
                    <div class="section-card-stats">
                        <div class="stat-item">
                            <div class="stat-value">${studentCount}</div>
                            <div class="stat-label">Students</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${crCount}</div>
                            <div class="stat-label">CRs</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${section.capacity}</div>
                            <div class="stat-label">Capacity</div>
                        </div>
                    </div>
                    <p>${section.description}</p>
                </div>
                <div class="section-card-footer">
                    <button class="btn btn-secondary btn-sm edit-section" data-section-id="${section.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-sm delete-section" data-section-id="${section.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-section').forEach(button => {
        button.addEventListener('click', () => {
            const sectionId = button.getAttribute('data-section-id');
            editSection(sectionId);
        });
    });
    
    document.querySelectorAll('.delete-section').forEach(button => {
        button.addEventListener('click', () => {
            const sectionId = button.getAttribute('data-section-id');
            deleteSection(sectionId);
        });
    });
}

// Handle section form submit
async function handleSectionSubmit(e) {
    e.preventDefault();
    
    const sectionNumber = document.getElementById('sectionNumber').value;
    const sectionCapacity = document.getElementById('sectionCapacity').value;
    const sectionDescription = document.getElementById('sectionDescription').value;
    
    // Validate inputs
    if (!sectionNumber || !sectionCapacity || !sectionDescription) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    // Check if editing or adding
    const sectionId = document.getElementById('sectionForm').getAttribute('data-section-id');
    const isEditing = !!sectionId;
    
    try {
        const sections = JSON.parse(localStorage.getItem('sections') || '[]');
        
        if (isEditing) {
            // Find and update the section
            const sectionIndex = sections.findIndex(s => s.id === sectionId);
            if (sectionIndex !== -1) {
                sections[sectionIndex] = {
                    ...sections[sectionIndex],
                    number: sectionNumber,
                    capacity: sectionCapacity,
                    description: sectionDescription,
                    updatedAt: new Date().toISOString()
                };
            }
        } else {
            // Check if section number already exists
            if (sections.some(s => s.number === sectionNumber)) {
                showNotification(`Section ${sectionNumber} already exists`, 'error');
                return;
            }
            
            // Add new section
            sections.push({
                id: Date.now().toString(),
                number: sectionNumber,
                capacity: sectionCapacity,
                description: sectionDescription,
                createdAt: new Date().toISOString()
            });
        }
        
        // Save to localStorage
        localStorage.setItem('sections', JSON.stringify(sections));
        
        // Close modal and reload sections
        closeModal('sectionModal');
        loadSections();
        
        // Show success message
        showNotification(isEditing ? 'Section updated successfully' : 'Section added successfully');
        
        // Reset form
        document.getElementById('sectionForm').reset();
        document.getElementById('sectionForm').removeAttribute('data-section-id');
    } catch (error) {
        console.error('Error saving section:', error);
        showNotification('Failed to save section', 'error');
    }
}

// Edit section
function editSection(sectionId) {
    const sections = JSON.parse(localStorage.getItem('sections') || '[]');
    const section = sections.find(s => s.id === sectionId);
    
    if (!section) {
        showNotification('Section not found', 'error');
        return;
    }
    
    // Fill form with section data
    document.getElementById('sectionNumber').value = section.number;
    document.getElementById('sectionCapacity').value = section.capacity;
    document.getElementById('sectionDescription').value = section.description;
    
    // Set form to editing mode
    document.getElementById('sectionForm').setAttribute('data-section-id', sectionId);
    
    // Update modal title
    const modalTitle = document.querySelector('#sectionModal h2');
    modalTitle.innerHTML = '<i class="fas fa-layer-group"></i> Edit Section';
    
    // Update submit button
    const submitButton = document.querySelector('#sectionForm button[type="submit"]');
    submitButton.textContent = 'Update Section';
    
    // Show modal
    showModal('sectionModal');
}

// Delete section
function deleteSection(sectionId) {
    if (!confirm('Are you sure you want to delete this section? This action cannot be undone.')) {
        return;
    }
    
    try {
        const sections = JSON.parse(localStorage.getItem('sections') || '[]');
        const updatedSections = sections.filter(s => s.id !== sectionId);
        
        // Save updated sections
        localStorage.setItem('sections', JSON.stringify(updatedSections));
        
        // Reload sections
        loadSections();
        
        showNotification('Section deleted successfully');
    } catch (error) {
        console.error('Error deleting section:', error);
        showNotification('Failed to delete section', 'error');
    }
}

// Show modal
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        
        // If it's the section modal, reset it
        if (modalId === 'sectionModal') {
            document.getElementById('sectionForm').reset();
            document.getElementById('sectionForm').removeAttribute('data-section-id');
            
            // Reset modal title
            const modalTitle = document.querySelector('#sectionModal h2');
            modalTitle.innerHTML = '<i class="fas fa-layer-group"></i> Add Section';
            
            // Reset submit button
            const submitButton = document.querySelector('#sectionForm button[type="submit"]');
            submitButton.textContent = 'Add Section';
        }
    }
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('currentUser');
    window.location.href = '../../../auth/login.html';
}

// Show notification
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after animation
    setTimeout(() => {
        notification.remove();
    }, 4000);
} 