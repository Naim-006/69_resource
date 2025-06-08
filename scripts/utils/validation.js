// Email validation and student ID extraction utilities

// Regular expression for DIU email format (xxx-xx-xxxx@diu.edu.bd)
const DIU_EMAIL_REGEX = /^(\d{3}-\d{2}-\d{4})@diu\.edu\.bd$/;

/**
 * Validates if an email is in the correct DIU format
 * @param {string} email - The email to validate
 * @returns {boolean} - True if email is valid, false otherwise
 */
export function isValidDIUEmail(email) {
    return DIU_EMAIL_REGEX.test(email);
}

/**
 * Extracts student ID from a valid DIU email
 * @param {string} email - The DIU email address
 * @returns {string|null} - The student ID or null if email is invalid
 */
export function extractStudentIdFromEmail(email) {
    const match = email.match(DIU_EMAIL_REGEX);
    return match ? match[1] : null;
}

/**
 * Validates if a student ID matches the format from email
 * @param {string} studentId - The student ID to validate
 * @param {string} email - The email to compare against
 * @returns {boolean} - True if student ID matches email, false otherwise
 */
export function validateStudentIdWithEmail(studentId, email) {
    const emailStudentId = extractStudentIdFromEmail(email);
    return emailStudentId === studentId;
}

/**
 * Checks if an email is already registered
 * @param {string} email - The email to check
 * @returns {Promise<boolean>} - True if email is already registered, false otherwise
 */
export async function isEmailRegistered(email) {
    try {
        // TODO: Replace with actual API call to check email in database
        const response = await fetch(`/api/check-email?email=${encodeURIComponent(email)}`);
        const data = await response.json();
        return data.isRegistered;
    } catch (error) {
        console.error('Error checking email:', error);
        return false;
    }
}

/**
 * Validates a form with email and student ID fields
 * @param {HTMLFormElement} form - The form to validate
 * @returns {Promise<{isValid: boolean, errors: string[]}>} - Validation result
 */
export async function validateRegistrationForm(form) {
    const errors = [];
    const email = form.querySelector('[name="email"]').value;
    const studentId = form.querySelector('[name="studentId"]')?.value;

    // Validate email format
    if (!isValidDIUEmail(email)) {
        errors.push('Email must be in the format: xxx-xx-xxxx@diu.edu.bd');
    }

    // Check if email is already registered
    if (await isEmailRegistered(email)) {
        errors.push('This email is already registered');
    }

    // If student ID is provided, validate it matches email
    if (studentId && !validateStudentIdWithEmail(studentId, email)) {
        errors.push('Student ID must match the ID in your email address');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Auto-fills student ID from email input
 * @param {HTMLInputElement} emailInput - The email input element
 * @param {HTMLInputElement} studentIdInput - The student ID input element
 */
export function setupStudentIdAutoFill(emailInput, studentIdInput) {
    emailInput.addEventListener('input', () => {
        const studentId = extractStudentIdFromEmail(emailInput.value);
        if (studentId) {
            studentIdInput.value = studentId;
            studentIdInput.readOnly = true;
        } else {
            studentIdInput.value = '';
            studentIdInput.readOnly = false;
        }
    });
}

/**
 * Validates a login form
 * @param {HTMLFormElement} form - The form to validate
 * @returns {Promise<{isValid: boolean, errors: string[]}>} - Validation result
 */
export async function validateLoginForm(form) {
    const errors = [];
    const email = form.querySelector('[name="email"]').value;

    // Validate email format
    if (!isValidDIUEmail(email)) {
        errors.push('Please use your DIU email address');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// Validation utility functions

// Validate email format
export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate password strength
export function validatePassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return re.test(password);
}

// Validate URL format
export function validateURL(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Validate required fields
export function validateRequired(value) {
    return value !== null && value !== undefined && value.trim() !== '';
}

// Validate date format
export function validateDate(date) {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
}

// Validate number range
export function validateNumberRange(value, min, max) {
    const num = Number(value);
    return !isNaN(num) && num >= min && num <= max;
}

// Validate form data
export function validateForm(formData, rules) {
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
export function showValidationErrors(errors, formElement) {
    // Clear previous errors
    formElement.querySelectorAll('.error-message').forEach(el => el.remove());
    formElement.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    
    // Show new errors
    for (const [field, message] of Object.entries(errors)) {
        const input = formElement.querySelector(`[name="${field}"]`);
        if (input) {
            input.classList.add('error');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = message;
            input.parentNode.appendChild(errorDiv);
        }
    }
}

// Clear validation errors
export function clearValidationErrors(formElement) {
    formElement.querySelectorAll('.error-message').forEach(el => el.remove());
    formElement.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
} 