document.addEventListener('DOMContentLoaded', () => {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const resetPasswordBtn = document.getElementById('resetPasswordBtn');
    const resetPasswordText = document.getElementById('resetPasswordText');
    const resetPasswordSpinner = document.getElementById('resetPasswordSpinner');
    const notificationContainer = document.getElementById('notification-container');

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

    // Function to validate email format
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Function to handle form submission
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        
        // Validate email
        if (!email) {
            showNotification('Email is required.');
            return;
        }
        
        if (!isValidEmail(email)) {
            showNotification('Please enter a valid email address.');
            return;
        }
        
        // Show loading state
        resetPasswordText.style.display = 'none';
        resetPasswordSpinner.style.display = 'inline-block';
        resetPasswordBtn.disabled = true;
        
        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showNotification('Password reset email sent. Please check your inbox.', 'success');
                
                // Clear the form
                forgotPasswordForm.reset();
            } else {
                showNotification(data.message || 'Failed to send reset email. Please try again.');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            showNotification('An error occurred. Please try again later.');
        } finally {
            // Reset button state
            resetPasswordText.style.display = 'inline';
            resetPasswordSpinner.style.display = 'none';
            resetPasswordBtn.disabled = false;
        }
    });
}); 