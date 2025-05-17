class Dashboard {
    constructor() {
        this.currentUser = auth.getCurrentUser();
        this.resources = JSON.parse(localStorage.getItem('resources')) || [];
        this.appointments = JSON.parse(localStorage.getItem('appointments')) || [];
        this.init();
    }

    init() {
        this.loadUserProfile();
        this.loadDashboardStats();
        this.setupEventListeners();
        this.loadAppointments();
        this.loadResourceAllocation();
    }

    loadUserProfile() {
        const profileSection = document.querySelector('.profile-info');
        if (!profileSection) return;

        profileSection.innerHTML = `
            <div class="profile-header">
                <i class="fas fa-user-circle"></i>
                <h3>${this.currentUser.name}</h3>
                <p>${this.currentUser.email}</p>
                <span class="badge badge-${this.currentUser.role}">${this.currentUser.role}</span>
            </div>
            <div class="profile-details">
                <p><i class="fas fa-phone"></i> ${this.currentUser.phone || 'Not provided'}</p>
                ${this.currentUser.role === 'doctor' ? `
                    <p><i class="fas fa-stethoscope"></i> ${this.currentUser.specialization}</p>
                ` : ''}
            </div>
        `;
    }

    loadDashboardStats() {
        const statsContainer = document.querySelector('.dashboard-stats');
        if (!statsContainer) return;

        const stats = this.calculateStats();
        statsContainer.innerHTML = `
            <div class="stat-card">
                <i class="fas fa-calendar-check"></i>
                <h4>Appointments</h4>
                <p>${stats.appointments}</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-procedures"></i>
                <h4>Resources</h4>
                <p>${stats.resources}</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-user-md"></i>
                <h4>Doctors</h4>
                <p>${stats.doctors}</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-chart-line"></i>
                <h4>Utilization</h4>
                <p>${stats.utilization}%</p>
            </div>
        `;

        this.initializeCharts(stats);
    }

    calculateStats() {
        return {
            appointments: this.appointments.filter(a => 
                this.currentUser.role === 'admin' || 
                (this.currentUser.role === 'doctor' && a.doctorId === this.currentUser.id) ||
                (this.currentUser.role === 'patient' && a.patientId === this.currentUser.id)
            ).length,
            resources: this.resources.length,
            doctors: this.users.filter(u => u.role === 'doctor').length,
            utilization: Math.round((this.resources.filter(r => r.status === 'in-use').length / this.resources.length) * 100) || 0
        };
    }

    initializeCharts(stats) {
        const ctx = document.getElementById('resourceChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['In Use', 'Available', 'Maintenance'],
                datasets: [{
                    data: [
                        this.resources.filter(r => r.status === 'in-use').length,
                        this.resources.filter(r => r.status === 'available').length,
                        this.resources.filter(r => r.status === 'maintenance').length
                    ],
                    backgroundColor: ['#2563eb', '#10b981', '#f59e0b']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    loadAppointments() {
        const appointmentsContainer = document.querySelector('.appointments-list');
        if (!appointmentsContainer) return;

        const userAppointments = this.appointments.filter(appointment => {
            if (this.currentUser.role === 'admin') return true;
            if (this.currentUser.role === 'doctor') return appointment.doctorId === this.currentUser.id;
            return appointment.patientId === this.currentUser.id;
        });

        appointmentsContainer.innerHTML = userAppointments.length ? userAppointments.map(appointment => `
            <div class="appointment-card">
                <div class="appointment-header">
                    <h4>${appointment.title}</h4>
                    <span class="badge badge-${appointment.status}">${appointment.status}</span>
                </div>
                <div class="appointment-details">
                    <p><i class="fas fa-calendar"></i> ${utils.formatDate(appointment.date)}</p>
                    <p><i class="fas fa-clock"></i> ${appointment.time}</p>
                    <p><i class="fas fa-user-md"></i> Dr. ${appointment.doctorName}</p>
                </div>
                <div class="appointment-actions">
                    <button class="btn btn-small" onclick="dashboard.viewAppointment('${appointment.id}')">
                        View Details
                    </button>
                    ${appointment.status === 'pending' ? `
                        <button class="btn btn-small btn-danger" onclick="dashboard.cancelAppointment('${appointment.id}')">
                            Cancel
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('') : '<p class="no-data">No appointments found</p>';
    }

    loadResourceAllocation() {
        const resourcesContainer = document.querySelector('.resources-list');
        if (!resourcesContainer) return;

        const userResources = this.resources.filter(resource => {
            if (this.currentUser.role === 'admin') return true;
            if (this.currentUser.role === 'doctor') return resource.assignedTo === this.currentUser.id;
            return resource.patientId === this.currentUser.id;
        });

        resourcesContainer.innerHTML = userResources.length ? userResources.map(resource => `
            <div class="resource-card">
                <div class="resource-header">
                    <h4>${resource.name}</h4>
                    <span class="badge badge-${resource.status}">${resource.status}</span>
                </div>
                <div class="resource-details">
                    <p><i class="fas fa-info-circle"></i> ${resource.type}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${resource.location}</p>
                    ${resource.assignedTo ? `
                        <p><i class="fas fa-user-md"></i> Assigned to: Dr. ${resource.assignedToName}</p>
                    ` : ''}
                </div>
                <div class="resource-actions">
                    <button class="btn btn-small" onclick="dashboard.viewResource('${resource.id}')">
                        View Details
                    </button>
                    ${this.currentUser.role === 'admin' ? `
                        <button class="btn btn-small btn-primary" onclick="dashboard.editResource('${resource.id}')">
                            Edit
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('') : '<p class="no-data">No resources found</p>';
    }

    setupEventListeners() {
        // Profile update
        const profileForm = document.getElementById('profileForm');
        profileForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateProfile(e.target);
        });

        // New appointment
        const appointmentForm = document.getElementById('appointmentForm');
        appointmentForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createAppointment(e.target);
        });

        // Resource allocation
        const resourceForm = document.getElementById('resourceForm');
        resourceForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.allocateResource(e.target);
        });
    }

    updateProfile(form) {
        try {
            const userData = {
                name: form.name.value,
                phone: form.phone.value,
                specialization: form.specialization?.value
            };

            auth.updateProfile(userData);
            this.loadUserProfile();
            showToast('Profile updated successfully', 'success');
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    createAppointment(form) {
        try {
            const appointment = {
                id: utils.generateId(),
                title: form.title.value,
                date: form.date.value,
                time: form.time.value,
                doctorId: form.doctor.value,
                doctorName: form.doctor.options[form.doctor.selectedIndex].text,
                patientId: this.currentUser.id,
                patientName: this.currentUser.name,
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            this.appointments.push(appointment);
            localStorage.setItem('appointments', JSON.stringify(this.appointments));
            
            this.loadAppointments();
            this.loadDashboardStats();
            showToast('Appointment created successfully', 'success');
            form.reset();
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    allocateResource(form) {
        try {
            const resource = {
                id: utils.generateId(),
                name: form.name.value,
                type: form.type.value,
                location: form.location.value,
                status: 'available',
                assignedTo: form.assignedTo?.value,
                assignedToName: form.assignedTo?.options[form.assignedTo?.selectedIndex]?.text,
                createdAt: new Date().toISOString()
            };

            this.resources.push(resource);
            localStorage.setItem('resources', JSON.stringify(this.resources));
            
            this.loadResourceAllocation();
            this.loadDashboardStats();
            showToast('Resource allocated successfully', 'success');
            form.reset();
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    viewAppointment(id) {
        const appointment = this.appointments.find(a => a.id === id);
        if (!appointment) return;

        // Implementation for viewing appointment details
        // This could open a modal or navigate to a details page
    }

    cancelAppointment(id) {
        const appointment = this.appointments.find(a => a.id === id);
        if (!appointment) return;

        appointment.status = 'cancelled';
        localStorage.setItem('appointments', JSON.stringify(this.appointments));
        
        this.loadAppointments();
        this.loadDashboardStats();
        showToast('Appointment cancelled successfully', 'success');
    }

    viewResource(id) {
        const resource = this.resources.find(r => r.id === id);
        if (!resource) return;

        // Implementation for viewing resource details
        // This could open a modal or navigate to a details page
    }

    editResource(id) {
        const resource = this.resources.find(r => r.id === id);
        if (!resource) return;

        // Implementation for editing resource details
        // This could open a modal with a form pre-filled with resource details
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    if (!auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    window.dashboard = new Dashboard();
}); 