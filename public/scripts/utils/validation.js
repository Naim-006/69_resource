// Email validation and student ID extraction utilities

// Regular expression for DIU email format (xxx-xx-xxxx@diu.edu.bd)
const DIU_EMAIL_REGEX = /^(\d{3}-\d{2}-\d{4})@diu\.edu\.bd$/;

/**
 * Validates if an email is in the correct DIU format
 * @param {string} email - The email to validate
 * @returns {boolean} - True if email is valid, false otherwise
 */
function isValidDIUEmail(email) {
    const diuEmailRegex = /^[a-zA-Z0-9._%+-]+@diu\.edu\.bd$/;
    return diuEmailRegex.test(email);
}

/**
 * Extracts student ID from a valid DIU email
 * @param {string} email - The DIU email address
 * @returns {string|null} - The student ID or null if email is invalid
 */
function extractStudentIdFromEmail(email) {
    if (!isValidDIUEmail(email)) return null;
    const match = email.match(/^([a-zA-Z0-9._%+-]+)@diu\.edu\.bd$/);
    return match ? match[1] : null;
}

/**
 * Validates if a student ID matches the format from email
 * @param {string} studentId - The student ID to validate
 * @param {string} email - The email to compare against
 * @returns {boolean} - True if student ID matches email, false otherwise
 */
function validateStudentIdWithEmail(studentId, email) {
    const extractedId = extractStudentIdFromEmail(email);
    return extractedId === studentId;
}

/**
 * Checks if an email is already registered
 * @param {string} email - The email to check
 * @returns {Promise<boolean>} - True if email is already registered, false otherwise
 */
async function isEmailRegistered(email) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    return users.some(user => user.email === email);
}

/**
 * Validates a form with email and student ID fields
 * @param {HTMLFormElement} form - The form to validate
 * @returns {Promise<{isValid: boolean, errors: string[]}>} - Validation result
 */
async function validateRegistrationForm(form) {
    const errors = [];
    const email = form.email.value.trim();
    const studentId = form.studentId.value.trim();
    const fullName = form.fullName.value.trim();
    const role = form.role.value;
    const section = form.section?.value;
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    // Email validation
    if (!email) {
        errors.push('Email is required');
    } else if (!isValidDIUEmail(email)) {
        errors.push('Please enter a valid DIU email address');
    }

    // Student ID validation
    if (!studentId) {
        errors.push('Student ID is required');
    }

    // Full name validation
    if (!fullName) {
        errors.push('Full name is required');
    }

    // Role validation
    if (!role) {
        errors.push('Please select a role');
    }

    // Section validation for CR/Co-CR
    if (role !== 'student' && !section) {
        errors.push('Please select a section');
    }

    // Password validation
    if (!password) {
        errors.push('Password is required');
    } else if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    // Confirm password validation
    if (!confirmPassword) {
        errors.push('Please confirm your password');
    } else if (password !== confirmPassword) {
        errors.push('Passwords do not match');
    }

    return errors;
}

/**
 * Auto-fills student ID from email input
 * @param {HTMLInputElement} emailInput - The email input element
 * @param {HTMLInputElement} studentIdInput - The student ID input element
 */
function setupStudentIdAutoFill(emailInput, studentIdInput) {
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

/**
 * Validates a login form
 * @param {HTMLFormElement} form - The form to validate
 * @returns {Promise<{isValid: boolean, errors: string[]}>} - Validation result
 */
async function validateLoginForm(form) {
    const errors = [];
    const email = form.email.value.trim();
    const password = form.password.value;

    // Email validation
    if (!email) {
        errors.push('Email is required');
    } else if (!isValidDIUEmail(email)) {
        errors.push('Please enter a valid DIU email address');
    }

    // Password validation
    if (!password) {
        errors.push('Password is required');
    }

    return errors;
}

// Validation utility functions

// Validate email format
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate password strength
function validatePassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return re.test(password);
}

// Validate URL format
function validateURL(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Validate required fields
function validateRequired(value) {
    return value !== null && value !== undefined && value.trim() !== '';
}

// Validate date format
function validateDate(date) {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
}

// Validate number range
function validateNumberRange(value, min, max) {
    const num = Number(value);
    return !isNaN(num) && num >= min && num <= max;
}

// Validate form data
function validateForm(formData, rules) {
    const errors = {};
    
    for (const [field, rule] of Object.entries(rules)) {
        const value = formData[field];
        
        if (rule.required && !validateRequired(value)) {
            errors[field] = 'This field is required';
            continue;
        }
        
        if (value && rule.email && !validateEmail(value)) {
            errors[field] = 'Invalid email format';
        }
        
        if (value && rule.password && !validatePassword(value)) {
            errors[field] = 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number';
        }
        
        if (value && rule.url && !validateURL(value)) {
            errors[field] = 'Invalid URL format';
        }
        
        if (value && rule.date && !validateDate(value)) {
            errors[field] = 'Invalid date format';
        }
        
        if (value && rule.range && !validateNumberRange(value, rule.range.min, rule.range.max)) {
            errors[field] = `Value must be between ${rule.range.min} and ${rule.range.max}`;
        }
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

// Show validation errors in UI
function showValidationErrors(errors) {
    clearValidationErrors();
    errors.forEach(error => {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i>${error}`;
        document.querySelector('.auth-form').insertBefore(errorDiv, document.querySelector('.form-actions'));
    });
}

// Clear validation errors
function clearValidationErrors() {
    const errors = document.querySelectorAll('.error-message');
    errors.forEach(error => error.remove());
}

// Toggle password visibility
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Make functions available globally
window.isValidDIUEmail = isValidDIUEmail;
window.extractStudentIdFromEmail = extractStudentIdFromEmail;
window.validateStudentIdWithEmail = validateStudentIdWithEmail;
window.isEmailRegistered = isEmailRegistered;
window.validateRegistrationForm = validateRegistrationForm;
window.setupStudentIdAutoFill = setupStudentIdAutoFill;
window.validateLoginForm = validateLoginForm;
window.showValidationErrors = showValidationErrors;
window.clearValidationErrors = clearValidationErrors;
window.validateEmail = validateEmail;
window.validatePassword = validatePassword;
window.validateURL = validateURL;
window.validateRequired = validateRequired;
window.validateDate = validateDate;
window.validateNumberRange = validateNumberRange;
window.validateForm = validateForm;
window.togglePasswordVisibility = togglePasswordVisibility; 