document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');
    const loginSubmitText = document.getElementById('loginSubmitText');
    const loginSpinner = document.getElementById('loginSpinner');
    const roleBtns = document.querySelectorAll('.role-btn');
    const sectionGroup = document.getElementById('sectionGroup');
    const studentIdGroup = document.getElementById('studentIdGroup');
    const selectedRoleInput = document.getElementById('selectedRole');

    // Initialize admin if needed
    AdminInit.init();

    // Role selection handling
    roleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            roleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const role = btn.dataset.role;
            selectedRoleInput.value = role;

            // Show/hide relevant fields
            sectionGroup.style.display = role === 'admin' ? 'none' : 'block';
            studentIdGroup.style.display = role === 'student' ? 'block' : 'none';

            // Update required attributes
            document.getElementById('section').required = role !== 'admin';
            document.getElementById('studentId').required = role === 'student';
        });
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show loading state
        loginSubmitBtn.disabled = true;
        loginSubmitText.textContent = 'Logging in...';
        loginSpinner.style.display = 'inline-block';

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const role = selectedRoleInput.value;
        const section = document.getElementById('section').value;
        const studentId = document.getElementById('studentId').value.trim();

        try {
            // Get users from localStorage
            const users = JSON.parse(localStorage.getItem('users')) || [];
            
            // Find user with matching credentials
            let user = users.find(u => 
                u.email === email && 
                u.password === password && 
                u.role === role
            );

            // Additional role-specific validations
            if (user) {
                if (role === 'student' && user.studentId !== studentId) {
                    throw new Error('Invalid student ID');
                }
                if (role !== 'admin' && user.section !== section) {
                    throw new Error('Invalid section');
                }
            } else {
                throw new Error('Invalid email or password');
            }

            // Store current user with all necessary data
            const currentUser = {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                section: user.section,
                studentId: user.studentId,
                createdAt: user.createdAt
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            // Redirect based on role
            switch (user.role) {
                case 'admin':
                    window.location.href = '../dashboard/admin.html';
                    break;
                case 'cr':
                    window.location.href = '../dashboard/cr.html';
                    break;
                case 'student':
                    window.location.href = '../dashboard/student.html';
                    break;
                default:
                    throw new Error('Invalid user role');
            }
        } catch (error) {
            alert(error.message);
        } finally {
            // Reset loading state
            loginSubmitBtn.disabled = false;
            loginSubmitText.textContent = 'Login';
            loginSpinner.style.display = 'none';
        }
    });
}); 