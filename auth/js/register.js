document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const registerSubmitText = document.getElementById('registerSubmitText');
    const registerSpinner = document.getElementById('registerSpinner');
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

    // Function to validate password strength
    function isStrongPassword(password) {
        return password.length >= 8;
    }

    // Function to handle form submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validate inputs
        if (!fullName || !email || !password || !confirmPassword) {
            showNotification('All fields are required.');
            return;
        }
        
        if (!isValidEmail(email)) {
            showNotification('Please enter a valid email address.');
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
        registerSubmitText.style.display = 'none';
        registerSpinner.style.display = 'inline-block';
        
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fullName,
                    email,
                    password
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showNotification('Registration successful! Verification email sent.', 'success');
                
                // Redirect to login page after successful registration
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showNotification(data.message || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showNotification('An error occurred. Please try again later.');
        } finally {
            // Reset button state
            registerSubmitText.style.display = 'inline';
            registerSpinner.style.display = 'none';
        }
    });
}); 