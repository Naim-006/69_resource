// Initialize sections data
const sections = Array.from({ length: 20 }, (_, i) => String.fromCharCode(65 + i));

// DOM Elements
const registerForm = document.getElementById('registerForm');
const emailInput = document.getElementById('email');
const studentIdInput = document.getElementById('studentId');
const roleSelect = document.getElementById('role');
const sectionGroup = document.getElementById('sectionGroup');
const sectionSelect = document.getElementById('section');
const submitButton = registerForm.querySelector('button[type="submit"]');

// Load sections into select
function loadSections() {
    sectionSelect.innerHTML = '<option value="">Choose your section</option>';
    sections.forEach(section => {
        const option = document.createElement('option');
        option.value = section;
        option.textContent = `Section ${section}`;
        sectionSelect.appendChild(option);
    });
}

// Auto-fill student ID from email
function setupStudentIdAutoFill() {
    emailInput.addEventListener('input', () => {
        const email = emailInput.value.trim();
        if (isValidDIUEmail(email)) {
            const studentId = extractStudentIdFromEmail(email);
            if (studentId) {
                studentIdInput.value = studentId;
            }
        }
    });
}

// Show/hide section select based on role
function setupRoleChangeHandler() {
    roleSelect.addEventListener('change', () => {
        const role = roleSelect.value;
        // Always show section selection for all roles
        sectionGroup.style.display = 'block';
        sectionSelect.required = true;
    });
}

// Show loading state
function setLoading(isLoading) {
    submitButton.disabled = isLoading;
    submitButton.classList.toggle('loading', isLoading);
    submitButton.querySelector('.btn-text').style.display = isLoading ? 'none' : 'inline';
    submitButton.querySelector('.btn-spinner').style.display = isLoading ? 'inline-block' : 'none';
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i>${message}`;
    registerForm.insertBefore(errorDiv, submitButton.parentElement);
    setTimeout(() => errorDiv.remove(), 5000);
}

// Handle form submission
async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    try {
        // Clear previous errors
        clearValidationErrors();

        // Validate form
        const errors = validateRegistrationForm(registerForm);
        if (errors.length > 0) {
            showValidationErrors(errors);
            return;
        }

        // Get form data
        const formData = {
            email: emailInput.value.trim(),
            studentId: studentIdInput.value.trim(),
            fullName: document.getElementById('fullName').value.trim(),
            role: roleSelect.value,
            section: sectionSelect.value,
            password: document.getElementById('password').value,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        // Check if user already exists
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.some(user => user.email === formData.email)) {
            showError('An account with this email already exists');
            return;
        }

        // For CR/Co-CR roles, check if section already has these roles
        if (formData.role !== 'student') {
            const sectionUsers = users.filter(user => 
                user.section === formData.section && 
                (user.role === 'cr' || user.role === 'co_cr')
            );

            if (sectionUsers.some(user => user.role === formData.role)) {
                showError(`This section already has a ${formData.role === 'cr' ? 'CR' : 'Co-CR'}`);
                return;
            }
        }

        // Create approval request
        const approvalRequests = JSON.parse(localStorage.getItem('approvalRequests') || '[]');
        const requestData = {
            id: Date.now().toString(),
            ...formData,
            requestType: formData.role === 'student' ? 'student_approval' : 'role_approval',
            status: 'pending',
            requestedAt: new Date().toISOString()
        };

        // For students, find the CR of their section
        if (formData.role === 'student') {
            const sectionCR = users.find(user => 
                user.section === formData.section && 
                user.role === 'cr' && 
                user.status === 'active'
            );

            if (!sectionCR) {
                showError('No active CR found for this section. Please contact the admin.');
                return;
            }

            requestData.assignedTo = sectionCR.email;
        }

        approvalRequests.push(requestData);
        localStorage.setItem('approvalRequests', JSON.stringify(approvalRequests));

        // Save user
        users.push(formData);
        localStorage.setItem('users', JSON.stringify(users));

        // Show success message and redirect
        alert('Registration successful! Please wait for approval from your CR/Co-CR or admin.');
        window.location.href = 'login.html';

    } catch (error) {
        console.error('Registration error:', error);
        showError('An error occurred during registration. Please try again.');
    } finally {
        setLoading(false);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSections();
    setupStudentIdAutoFill();
    setupRoleChangeHandler();
    registerForm.addEventListener('submit', handleSubmit);
}); 