document.addEventListener('DOMContentLoaded', () => {
    const verificationIcon = document.getElementById('verificationIcon');
    const verificationMessage = document.getElementById('verificationMessage');
    const verificationDetails = document.getElementById('verificationDetails');
    const loginBtn = document.getElementById('loginBtn');
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

    // Function to update verification UI
    function updateVerificationUI(status, message, details) {
        verificationIcon.className = `fas verification-icon ${status === 'success' ? 'fa-check-circle success' : 
                                                              status === 'error' ? 'fa-times-circle error' : 
                                                              'fa-spinner loading'}`;
        verificationMessage.textContent = message;
        verificationDetails.textContent = details;
        
        if (status === 'success' || status === 'error') {
            loginBtn.style.display = 'block';
        }
    }

    // Get token from URL
    const urlParams = getUrlParams();
    if (!urlParams.token) {
        updateVerificationUI('error', 'Verification Failed', 'Invalid or missing verification token. Please request a new verification email.');
        return;
    }

    // Verify email
    async function verifyEmail(token) {
        try {
            const response = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                updateVerificationUI('success', 'Email Verified Successfully!', 'Your email has been verified. You can now login to your account.');
                showNotification('Email verified successfully!', 'success');
            } else {
                updateVerificationUI('error', 'Verification Failed', data.message || 'Failed to verify email. The link may have expired or is invalid.');
            }
        } catch (error) {
            console.error('Email verification error:', error);
            updateVerificationUI('error', 'Verification Failed', 'An error occurred while verifying your email. Please try again later.');
        }
    }

    // Start verification process
    verifyEmail(urlParams.token);
}); 