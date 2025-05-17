class DepartmentManager {
    constructor() {
        this.currentUser = auth.getCurrentUser();
        this.departments = JSON.parse(localStorage.getItem('departments')) || this.getDefaultDepartments();
        this.doctors = JSON.parse(localStorage.getItem('users'))?.filter(user => user.role === 'doctor') || [];
        this.resources = JSON.parse(localStorage.getItem('resources')) || [];
        this.appointments = JSON.parse(localStorage.getItem('appointments')) || [];
        this.selectedDepartment = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDepartments();
        this.checkUrlParams();
    }

    setupEventListeners() {
        // Quick actions
        const viewResourcesBtn = document.getElementById('viewResourcesBtn');
        const findDoctorBtn = document.getElementById('findDoctorBtn');

        viewResourcesBtn?.addEventListener('click', () => {
            window.location.href = 'resources.html';
        });

        findDoctorBtn?.addEventListener('click', () => {
            window.location.href = 'doctor-list.html';
        });

        // Filters
        const searchInput = document.getElementById('searchDepartments');
        const occupancyFilter = document.getElementById('occupancyFilter');
        const statusFilter = document.getElementById('statusFilter');

        searchInput?.addEventListener('input', utils.debounce(() => this.loadDepartments(), 300));
        occupancyFilter?.addEventListener('change', () => this.loadDepartments());
        statusFilter?.addEventListener('change', () => this.loadDepartments());

        // Department modal
        const departmentModal = document.getElementById('departmentModal');
        const closeModal = document.querySelector('.close-modal');
        const closeDepartmentModal = document.getElementById('closeDepartmentModal');
        const viewScheduleBtn = document.getElementById('viewScheduleBtn');

        closeModal?.addEventListener('click', () => {
            departmentModal.style.display = 'none';
        });

        closeDepartmentModal?.addEventListener('click', () => {
            departmentModal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === departmentModal) {
                departmentModal.style.display = 'none';
            }
        });

        viewScheduleBtn?.addEventListener('click', () => {
            if (this.selectedDepartment) {
                window.location.href = `appointments.html?department=${this.selectedDepartment.id}`;
            }
        });
    }

    loadDepartments() {
        const departmentsGrid = document.querySelector('.departments-grid');
        if (!departmentsGrid) return;

        const filteredDepartments = this.filterDepartments();
        
        departmentsGrid.innerHTML = filteredDepartments.length ? filteredDepartments.map(department => `
            <div class="department-card" data-id="${department.id}">
                <div class="department-header">
                    <h3 class="department-name">
                        <i class="${this.getDepartmentIcon(department.name)}"></i>
                        ${department.name}
                    </h3>
                    <span class="department-status">${this.formatStatus(department.status)}</span>
                </div>
                <div class="department-body">
                    <div class="department-stats">
                        <div class="stat-item">
                            <div class="stat-value">${this.getDepartmentDoctors(department.id).length}</div>
                            <div class="stat-label">Doctors</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${this.getDepartmentResources(department.id).length}</div>
                            <div class="stat-label">Resources</div>
                        </div>
                    </div>
                    <div class="occupancy-info">
                        <div class="occupancy-label">
                            <span>Occupancy</span>
                            <span>${department.occupancy}%</span>
                        </div>
                        <div class="occupancy-bar">
                            <div class="occupancy-fill ${this.getOccupancyClass(department.occupancy)}"
                                 style="width: ${department.occupancy}%"></div>
                        </div>
                    </div>
                    <div class="department-info">
                        <p><i class="fas fa-user-md"></i> Head: Dr. ${department.head}</p>
                        <p><i class="fas fa-phone"></i> ${department.contact}</p>
                        <p><i class="fas fa-map-marker-alt"></i> ${department.location}</p>
                    </div>
                    <div class="department-actions">
                        <button class="btn btn-small" onclick="departmentManager.viewDepartmentDetails('${department.id}')">
                            <i class="fas fa-info-circle"></i> View Details
                        </button>
                        <button class="btn btn-small btn-primary" onclick="departmentManager.viewDepartmentSchedule('${department.id}')">
                            <i class="fas fa-calendar"></i> Schedule
                        </button>
                    </div>
                </div>
            </div>
        `).join('') : '<p class="no-data">No departments found</p>';
    }

    filterDepartments() {
        const searchTerm = document.getElementById('searchDepartments')?.value.toLowerCase() || '';
        const occupancyFilter = document.getElementById('occupancyFilter')?.value || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';

        return this.departments.filter(department => {
            // Filter by search term
            const searchMatch = department.name.toLowerCase().includes(searchTerm) ||
                department.head.toLowerCase().includes(searchTerm);
            if (!searchMatch) return false;

            // Filter by occupancy
            if (occupancyFilter) {
                const occupancy = department.occupancy;
                switch (occupancyFilter) {
                    case 'low':
                        if (occupancy >= 50) return false;
                        break;
                    case 'medium':
                        if (occupancy < 50 || occupancy > 80) return false;
                        break;
                    case 'high':
                        if (occupancy <= 80) return false;
                        break;
                }
            }

            // Filter by status
            if (statusFilter && department.status !== statusFilter) return false;

            return true;
        });
    }

    viewDepartmentDetails(departmentId) {
        const department = this.departments.find(d => d.id === departmentId);
        if (!department) return;

        this.selectedDepartment = department;

        const departmentModal = document.getElementById('departmentModal');
        const departmentInfo = departmentModal.querySelector('.department-info');
        const statCards = departmentModal.querySelector('.stat-cards');
        const staffList = departmentModal.querySelector('.staff-list');
        const resourcesList = departmentModal.querySelector('.resources-list');

        // Department info
        departmentInfo.innerHTML = `
            <h3 class="department-name">
                <i class="${this.getDepartmentIcon(department.name)}"></i>
                ${department.name}
            </h3>
            <div class="department-details">
                <p><i class="fas fa-user-md"></i> Head of Department: Dr. ${department.head}</p>
                <p><i class="fas fa-phone"></i> Contact: ${department.contact}</p>
                <p><i class="fas fa-map-marker-alt"></i> Location: ${department.location}</p>
                <p><i class="fas fa-info-circle"></i> Description: ${department.description}</p>
                <p><i class="fas fa-clock"></i> Working Hours: ${department.workingHours}</p>
            </div>
        `;

        // Statistics
        statCards.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${this.getDepartmentDoctors(department.id).length}</div>
                <div class="stat-label">Doctors</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${this.getDepartmentResources(department.id).length}</div>
                <div class="stat-label">Resources</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${department.occupancy}%</div>
                <div class="stat-label">Occupancy</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${this.getDepartmentAppointments(department.id).length}</div>
                <div class="stat-label">Daily Appointments</div>
            </div>
        `;

        // Staff list
        const departmentDoctors = this.getDepartmentDoctors(department.id);
        staffList.innerHTML = departmentDoctors.length ? departmentDoctors.map(doctor => `
            <div class="staff-card">
                <img src="${this.getDoctorImage(doctor)}" alt="Dr. ${doctor.name}" class="staff-avatar">
                <div class="staff-info">
                    <h4>Dr. ${doctor.name}</h4>
                    <p>${this.formatSpecialization(doctor.specialization)}</p>
                </div>
            </div>
        `).join('') : '<p class="no-data">No staff members found</p>';

        // Resources list
        const departmentResources = this.getDepartmentResources(department.id);
        resourcesList.innerHTML = departmentResources.length ? departmentResources.map(resource => `
            <div class="resource-card">
                <i class="${this.getResourceIcon(resource.type)}"></i>
                <div class="resource-info">
                    <h4>${resource.name}</h4>
                    <p>${this.formatStatus(resource.status)}</p>
                </div>
            </div>
        `).join('') : '<p class="no-data">No resources found</p>';

        departmentModal.style.display = 'block';
    }

    viewDepartmentSchedule(departmentId) {
        window.location.href = `appointments.html?department=${departmentId}`;
    }

    getDepartmentDoctors(departmentId) {
        return this.doctors.filter(doctor => doctor.department === departmentId);
    }

    getDepartmentResources(departmentId) {
        return this.resources.filter(resource => resource.department === departmentId);
    }

    getDepartmentAppointments(departmentId) {
        const today = new Date().toISOString().split('T')[0];
        return this.appointments.filter(appointment => 
            appointment.departmentId === departmentId &&
            appointment.date === today
        );
    }

    getDoctorImage(doctor) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=random`;
    }

    getDepartmentIcon(name) {
        const icons = {
            'Emergency': 'fas fa-ambulance',
            'Cardiology': 'fas fa-heartbeat',
            'Neurology': 'fas fa-brain',
            'Pediatrics': 'fas fa-baby',
            'Surgery': 'fas fa-procedures',
            'Orthopedics': 'fas fa-bone',
            'Psychiatry': 'fas fa-notes-medical',
            'ICU': 'fas fa-procedures'
        };
        return icons[name] || 'fas fa-hospital-alt';
    }

    getResourceIcon(type) {
        const icons = {
            'equipment': 'fas fa-tools',
            'room': 'fas fa-door-open',
            'supplies': 'fas fa-box-open',
            'bed': 'fas fa-bed'
        };
        return icons[type] || 'fas fa-cube';
    }

    getOccupancyClass(occupancy) {
        if (occupancy < 50) return 'occupancy-low';
        if (occupancy < 80) return 'occupancy-medium';
        return 'occupancy-high';
    }

    formatStatus(status) {
        return status.charAt(0).toUpperCase() + status.slice(1);
    }

    formatSpecialization(specialization) {
        return specialization.charAt(0).toUpperCase() + specialization.slice(1);
    }

    getDefaultDepartments() {
        return [
            {
                id: 'emergency',
                name: 'Emergency',
                head: 'John Smith',
                contact: '+1 (555) 123-4567',
                location: 'Ground Floor, Block A',
                description: '24/7 emergency medical services',
                workingHours: '24/7',
                status: 'active',
                occupancy: 75
            },
            {
                id: 'cardiology',
                name: 'Cardiology',
                head: 'Sarah Johnson',
                contact: '+1 (555) 234-5678',
                location: '3rd Floor, Block B',
                description: 'Specialized cardiac care and treatment',
                workingHours: '8:00 AM - 8:00 PM',
                status: 'active',
                occupancy: 60
            },
            // Add more departments as needed
        ];
    }

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const departmentId = urlParams.get('department');
        if (departmentId) {
            this.viewDepartmentDetails(departmentId);
        }
    }
}

// Initialize department manager
document.addEventListener('DOMContentLoaded', () => {
    if (!auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    window.departmentManager = new DepartmentManager();
}); 