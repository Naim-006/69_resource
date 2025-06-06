// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const rememberMeCheckbox = document.getElementById('rememberMe');
const submitButton = loginForm.querySelector('button[type="submit"]');

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
    loginForm.insertBefore(errorDiv, submitButton.parentElement);
    setTimeout(() => errorDiv.remove(), 5000);
}

// Handle remember me
function handleRememberMe() {
    if (rememberMeCheckbox.checked) {
        localStorage.setItem('rememberedEmail', emailInput.value.trim());
    } else {
        localStorage.removeItem('rememberedEmail');
    }
}

// Load remembered email
function loadRememberedEmail() {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        emailInput.value = rememberedEmail;
        rememberMeCheckbox.checked = true;
    }
}

// Handle form submission
async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    try {
        // Clear previous errors
        clearValidationErrors();

        // Validate form
        const errors = validateLoginForm(loginForm);
        if (errors.length > 0) {
            showValidationErrors(errors);
            return;
        }

        // Get form data
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Get users from storage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email);

        // Check if user exists
        if (!user) {
            showError('No account found with this email');
            return;
        }

        // Check if user is approved
        if (user.status === 'pending') {
            showError('Your account is pending approval. Please wait for admin/CR approval.');
            return;
        }

        // Check if user is rejected
        if (user.status === 'rejected') {
            showError('Your registration has been rejected. Please contact admin for more information.');
            return;
        }

        // Check password
        if (user.password !== password) {
            showError('Invalid password');
            return;
        }

        // Handle remember me
        handleRememberMe();

        // Save current user
        localStorage.setItem('currentUser', JSON.stringify({
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            section: user.section
        }));

        // Redirect based on role
        switch (user.role) {
            case 'admin':
                window.location.href = '../dashboard/admin.html';
                break;
            case 'cr':
            case 'co_cr':
                window.location.href = '../dashboard/cr.html';
                break;
            case 'student':
                window.location.href = '../dashboard/student.html';
                break;
            default:
                showError('Invalid user role');
        }

    } catch (error) {
        console.error('Login error:', error);
        showError('An error occurred during login. Please try again.');
    } finally {
        setLoading(false);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadRememberedEmail();
    loginForm.addEventListener('submit', handleSubmit);
}); 