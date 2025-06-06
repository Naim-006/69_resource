const NotificationManager = {
    // Get all pending registrations
    getPendingRegistrations() {
        return JSON.parse(localStorage.getItem('pendingRegistrations')) || [];
    },

    // Add a new pending registration
    addPendingRegistration(registration) {
        const pendingRegistrations = this.getPendingRegistrations();
        pendingRegistrations.push({
            ...registration,
            id: Date.now().toString(),
            status: 'pending',
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('pendingRegistrations', JSON.stringify(pendingRegistrations));
    },

    // Approve a registration
    approveRegistration(registrationId) {
        const pendingRegistrations = this.getPendingRegistrations();
        const registration = pendingRegistrations.find(r => r.id === registrationId);
        
        if (registration) {
            // Add to users list
            const users = JSON.parse(localStorage.getItem('users')) || [];
            users.push({
                ...registration,
                status: 'approved',
                approvedAt: new Date().toISOString()
            });
            localStorage.setItem('users', JSON.stringify(users));

            // Remove from pending registrations
            const updatedPending = pendingRegistrations.filter(r => r.id !== registrationId);
            localStorage.setItem('pendingRegistrations', JSON.stringify(updatedPending));

            return true;
        }
        return false;
    },

    // Reject a registration
    rejectRegistration(registrationId) {
        const pendingRegistrations = this.getPendingRegistrations();
        const updatedPending = pendingRegistrations.filter(r => r.id !== registrationId);
        localStorage.setItem('pendingRegistrations', JSON.stringify(updatedPending));
    },

    // Get notification count for admin
    getAdminNotificationCount() {
        return this.getPendingRegistrations().length;
    }
}; 