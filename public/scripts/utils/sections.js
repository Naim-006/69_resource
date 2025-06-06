// Section Management
const SECTIONS = Array.from({length: 20}, (_, i) => ({
    id: i + 1,
    name: `Section ${i + 1}`,
    cr: null,
    students: []
}));

// Initialize sections in localStorage if not exists
if (!localStorage.getItem('sections')) {
    localStorage.setItem('sections', JSON.stringify(SECTIONS));
}

// Section Management Functions
const SectionManager = {
    // Get all sections
    getAllSections() {
        return JSON.parse(localStorage.getItem('sections')) || SECTIONS;
    },

    // Get section by ID
    getSectionById(sectionId) {
        const sections = this.getAllSections();
        return sections.find(section => section.id === sectionId);
    },

    // Assign CR to section
    assignCR(sectionId, crId) {
        const sections = this.getAllSections();
        const sectionIndex = sections.findIndex(s => s.id === sectionId);
        if (sectionIndex !== -1) {
            sections[sectionIndex].cr = crId;
            localStorage.setItem('sections', JSON.stringify(sections));
            return true;
        }
        return false;
    },

    // Add student to section
    addStudentToSection(sectionId, studentId) {
        const sections = this.getAllSections();
        const sectionIndex = sections.findIndex(s => s.id === sectionId);
        if (sectionIndex !== -1) {
            if (!sections[sectionIndex].students.includes(studentId)) {
                sections[sectionIndex].students.push(studentId);
                localStorage.setItem('sections', JSON.stringify(sections));
                return true;
            }
        }
        return false;
    },

    // Remove student from section
    removeStudentFromSection(sectionId, studentId) {
        const sections = this.getAllSections();
        const sectionIndex = sections.findIndex(s => s.id === sectionId);
        if (sectionIndex !== -1) {
            sections[sectionIndex].students = sections[sectionIndex].students.filter(id => id !== studentId);
            localStorage.setItem('sections', JSON.stringify(sections));
            return true;
        }
        return false;
    },

    // Get section by CR ID
    getSectionByCRId(crId) {
        const sections = this.getAllSections();
        return sections.find(section => section.cr === crId);
    },

    // Get section by student ID
    getSectionByStudentId(studentId) {
        const sections = this.getAllSections();
        return sections.find(section => section.students.includes(studentId));
    }
};

// Registration Approval System
const RegistrationApproval = {
    // Initialize pending registrations in localStorage
    init() {
        if (!localStorage.getItem('pendingRegistrations')) {
            localStorage.setItem('pendingRegistrations', JSON.stringify([]));
        }
    },

    // Add pending registration
    addPendingRegistration(userData) {
        const pendingRegistrations = this.getPendingRegistrations();
        pendingRegistrations.push({
            ...userData,
            id: Date.now(),
            status: 'pending',
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('pendingRegistrations', JSON.stringify(pendingRegistrations));
    },

    // Get all pending registrations
    getPendingRegistrations() {
        return JSON.parse(localStorage.getItem('pendingRegistrations')) || [];
    },

    // Get pending registrations for a specific section
    getPendingRegistrationsBySection(sectionId) {
        const pendingRegistrations = this.getPendingRegistrations();
        return pendingRegistrations.filter(reg => reg.section === sectionId);
    },

    // Approve registration
    approveRegistration(registrationId) {
        const pendingRegistrations = this.getPendingRegistrations();
        const registrationIndex = pendingRegistrations.findIndex(reg => reg.id === registrationId);
        
        if (registrationIndex !== -1) {
            const registration = pendingRegistrations[registrationIndex];
            registration.status = 'approved';
            
            // Add user to users list
            const users = JSON.parse(localStorage.getItem('users')) || [];
            users.push({
                id: registration.id,
                fullName: registration.fullName,
                email: registration.email,
                role: registration.role,
                section: registration.section,
                studentId: registration.studentId
            });
            localStorage.setItem('users', JSON.stringify(users));

            // If CR, assign to section
            if (registration.role === 'CR') {
                SectionManager.assignCR(registration.section, registration.id);
            } else {
                // If student, add to section
                SectionManager.addStudentToSection(registration.section, registration.id);
            }

            // Remove from pending registrations
            pendingRegistrations.splice(registrationIndex, 1);
            localStorage.setItem('pendingRegistrations', JSON.stringify(pendingRegistrations));
            
            return true;
        }
        return false;
    },

    // Reject registration
    rejectRegistration(registrationId) {
        const pendingRegistrations = this.getPendingRegistrations();
        const registrationIndex = pendingRegistrations.findIndex(reg => reg.id === registrationId);
        
        if (registrationIndex !== -1) {
            pendingRegistrations.splice(registrationIndex, 1);
            localStorage.setItem('pendingRegistrations', JSON.stringify(pendingRegistrations));
            return true;
        }
        return false;
    }
};

// Initialize the registration approval system
RegistrationApproval.init();

// Export the managers
window.SectionManager = SectionManager;
window.RegistrationApproval = RegistrationApproval; 