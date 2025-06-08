document.addEventListener('DOMContentLoaded', () => {
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const updatePasswordBtn = document.getElementById('updatePasswordBtn');
    const updatePasswordText = document.getElementById('updatePasswordText');
    const updatePasswordSpinner = document.getElementById('updatePasswordSpinner');
    const notificationContainer = document.getElementById('notification-container');
    const tokenInput = document.getElementById('token');

    // Function to show notification
    function showNotification(message, type = 'error') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        notificationContainer.appendChild(notification);
        
        // Remove notification after 4 seconds
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    // Function to get URL parameters
    function getUrlParams() {
        const params = {};
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        
        for (const [key, value] of urlParams.entries()) {
            params[key] = value;
        }
        
        return params;
    }

    // Get token from URL
    const urlParams = getUrlParams();
    if (urlParams.token) {
        tokenInput.value = urlParams.token;
    } else {
        showNotification('Invalid or missing reset token. Please request a new password reset.');
        updatePasswordBtn.disabled = true;
        return;
    }

    // Function to validate password strength
    function isStrongPassword(password) {
        return password.length >= 8;
    }

    // Function to handle form submission
    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const token = tokenInput.value;
        
        // Validate inputs
        if (!password || !confirmPassword) {
            showNotification('All fields are required.');
            return;
        }
        
        if (!isStrongPassword(password)) {
            showNotification('Password must be at least 8 characters long.');
            return;
        }
        
        if (password !== confirmPassword) {
            showNotification('Passwords do not match.');
            return;
        }
        
        // Show loading state
        updatePasswordText.style.display = 'none';
        updatePasswordSpinner.style.display = 'inline-block';
        updatePasswordBtn.disabled = true;
        
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token,
                    password
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showNotification('Password has been reset successfully!', 'success');
                
                // Redirect to login page after successful password reset
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showNotification(data.message || 'Failed to reset password. Please try again.');
            }
        } catch (error) {
            console.error('Reset password error:', error);
            showNotification('An error occurred. Please try again later.');
        } finally {
            // Reset button state
            updatePasswordText.style.display = 'inline';
            updatePasswordSpinner.style.display = 'none';
            updatePasswordBtn.disabled = false;
        }
    });
}); 