// Auth Check Script for Admin Pages
(function() {
  // Check if user is logged in and is admin
  function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    
    if (!token || !user) {
      redirectToLogin();
      return false;
    }
    
    // Check if user is admin
    if (!user.isAdmin) {
      redirectToLogin();
      return false;
    }
    
    return true;
  }
  
  // Redirect to login page
  function redirectToLogin() {
    console.log('Unauthorized access. Redirecting to login...');
    window.location.href = '/auth/login.html';
  }
  
  // Run auth check
  if (!checkAuth()) {
    // Stop further script execution if auth check fails
    throw new Error('Authentication check failed');
  }
})(); 