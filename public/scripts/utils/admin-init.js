// Admin Initialization
const AdminInit = {
    // Check if any admin exists
    checkAdminExists() {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        return users.some(user => user.role === 'admin');
    },

    // Create first admin account
    createFirstAdmin() {
        const defaultAdmin = {
            id: Date.now().toString(),
            fullName: 'System Admin',
            email: 'admin@studyresource.com',
            password: 'Admin@123', // In a real application, this should be hashed
            role: 'admin',
            section: '1' // Default section for admin
        };

        const users = JSON.parse(localStorage.getItem('users')) || [];
        users.push(defaultAdmin);
        localStorage.setItem('users', JSON.stringify(users));

        console.log('First admin account created successfully');
        return defaultAdmin;
    },

    // Initialize admin account
    init() {
        if (!this.checkAdminExists()) {
            console.log('No admin account found. Creating first admin...');
            this.createFirstAdmin();
        } else {
            console.log('Admin account already exists');
        }
    }
};

// Initialize admin account when the script loads
AdminInit.init();

// Export the AdminInit object
window.AdminInit = AdminInit; 