document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const roleSelect = document.getElementById('role');
    const sectionGroup = document.getElementById('sectionGroup');
    const studentIdGroup = document.getElementById('studentIdGroup');
    const studentIdInput = document.getElementById('studentId');
    const sectionSelect = document.getElementById('section');

    // Initialize sections dropdown
    function initializeSections() {
        const sections = [
            { id: '1', name: 'Section 1' },
            { id: '2', name: 'Section 2' },
            { id: '3', name: 'Section 3' }
        ];
        
        sectionSelect.innerHTML = '<option value="">Select Section</option>';
        sections.forEach(section => {
            const option = document.createElement('option');
            option.value = section.id;
            option.textContent = section.name;
            sectionSelect.appendChild(option);
        });
    }

    // Initialize sections on load
    initializeSections();

    // Show/hide fields based on role
    roleSelect.addEventListener('change', () => {
        const role = roleSelect.value;
        sectionGroup.style.display = role === 'admin' ? 'none' : 'block';
        studentIdGroup.style.display = role === 'student' ? 'block' : 'none';
        
        if (role === 'student') {
            studentIdInput.required = true;
            sectionSelect.required = true;
        } else if (role === 'cr') {
            studentIdInput.required = false;
            sectionSelect.required = true;
        } else {
            studentIdInput.required = false;
            sectionSelect.required = false;
        }
    });

    // Handle form submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get form data
        const formData = new FormData(registerForm);
        const registrationData = {
            id: Date.now().toString(),
            fullName: formData.get('fullName').trim(),
            email: formData.get('email').trim(),
            password: formData.get('password'),
            role: formData.get('role'),
            section: formData.get('section'),
            studentId: formData.get('studentId')?.trim(),
            createdAt: new Date().toISOString()
        };

        // Validate required fields
        if (!registrationData.fullName || !registrationData.email || !registrationData.password) {
            showError('Please fill in all required fields');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(registrationData.email)) {
            showError('Please enter a valid email address');
            return;
        }

        // Validate password strength
        if (registrationData.password.length < 8) {
            showError('Password must be at least 8 characters long');
            return;
        }

        // Validate section for CR and student roles
        if ((registrationData.role === 'cr' || registrationData.role === 'student') && !registrationData.section) {
            showError('Please select a section');
            return;
        }

        // Check if email already exists
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const pendingRegistrations = JSON.parse(localStorage.getItem('pendingRegistrations') || '[]');
        
        if (users.some(user => user.email === registrationData.email) || 
            pendingRegistrations.some(reg => reg.email === registrationData.email)) {
            showError('Email already registered');
            return;
        }

        // Check if section already has a CR
        if (registrationData.role === 'cr') {
            const sectionCRs = users.filter(user => 
                user.role === 'cr' && user.section === registrationData.section
            );
            if (sectionCRs.length > 0) {
                showError('This section already has a Class Representative');
                return;
            }

            // Also check pending registrations for CR
            const pendingCRs = pendingRegistrations.filter(reg => 
                reg.role === 'cr' && reg.section === registrationData.section
            );
            if (pendingCRs.length > 0) {
                showError('This section already has a pending Class Representative registration');
                return;
            }
        }

        try {
            // Add to pending registrations
            pendingRegistrations.push(registrationData);
            localStorage.setItem('pendingRegistrations', JSON.stringify(pendingRegistrations));

            // Show success message
            showSuccess('Registration submitted successfully. Please wait for admin approval.');
            
            // Reset form
            registerForm.reset();
            
            // Redirect to login page after 2 seconds
            setTimeout(() => {
                window.location.href = '/auth/login.html';
            }, 2000);
        } catch (error) {
            console.error('Registration error:', error);
            showError('An error occurred during registration. Please try again.');
        }
    });
});

// Function to show success message
function showSuccess(message) {
    const successAlert = document.createElement('div');
    successAlert.className = 'alert alert-success';
    successAlert.innerHTML = `
        <i class="fas fa-check-circle"></i>
        ${message}
    `;
    document.body.appendChild(successAlert);
    setTimeout(() => {
        successAlert.classList.add('hide');
        setTimeout(() => successAlert.remove(), 300);
    }, 3000);
}

// Function to show error message
function showError(message) {
    const errorAlert = document.createElement('div');
    errorAlert.className = 'alert alert-danger';
    errorAlert.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        ${message}
    `;
    document.body.appendChild(errorAlert);
    setTimeout(() => {
        errorAlert.classList.add('hide');
        setTimeout(() => errorAlert.remove(), 300);
    }, 3000);
} 