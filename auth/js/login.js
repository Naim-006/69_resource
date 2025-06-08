document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');
    const loginSubmitText = document.getElementById('loginSubmitText');
    const loginSpinner = document.getElementById('loginSpinner');
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

    // Function to handle form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show loading state
        loginSubmitText.style.display = 'none';
        loginSpinner.style.display = 'inline-block';
        loginSubmitBtn.disabled = true;
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Debug log
        console.log('Attempting login with:', { email });
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            // Debug log
            console.log('Login response:', response.status, data);
            
            if (response.ok) {
                // Save token to localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Show success notification
                showNotification('Login successful! Redirecting...', 'success');
                
                // Redirect based on user role
                setTimeout(() => {
                    if (data.user.isAdmin) {
                        console.log('Redirecting to admin dashboard...');
                        window.location.href = '/sections/admin/dashboard.html';
                    } else {
                        console.log('Redirecting to user dashboard...');
                        window.location.href = '/sections/user/dashboard.html';
                    }
                }, 1500);
            } else {
                showNotification(data.message || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            showNotification('An error occurred. Please try again later.');
        } finally {
            // Reset button state
            loginSubmitText.style.display = 'inline';
            loginSpinner.style.display = 'none';
            loginSubmitBtn.disabled = false;
        }
    });
}); 