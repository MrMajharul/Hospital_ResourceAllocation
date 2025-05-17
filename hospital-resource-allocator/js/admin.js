// Admin Panel Data Management
const mockData = {
    patients: [
        { id: 'P001', name: 'John Doe', age: 45, severity: 8, doctor: 'Dr. Smith', status: 'Critical' },
        { id: 'P002', name: 'Jane Smith', age: 32, severity: 5, doctor: 'Dr. Johnson', status: 'Stable' },
        { id: 'P003', name: 'Bob Wilson', age: 58, severity: 7, doctor: 'Dr. Brown', status: 'Critical' },
    ],
    doctors: [
        { id: 'D001', name: 'Dr. Smith', department: 'Cardiology', status: 'Active' },
        { id: 'D002', name: 'Dr. Johnson', department: 'Emergency', status: 'Active' },
        { id: 'D003', name: 'Dr. Brown', department: 'Neurology', status: 'On Leave' },
    ],
    departments: [
        { name: 'ICU', capacity: 20, occupied: 18 },
        { name: 'Emergency', capacity: 30, occupied: 22 },
        { name: 'Cardiology', capacity: 25, occupied: 15 },
        { name: 'Neurology', capacity: 15, occupied: 7 },
    ]
};

// Patient Management
class PatientManager {
    constructor() {
        this.patients = JSON.parse(localStorage.getItem('patients')) || mockData.patients;
        this.initializeSearchAndFilter();
    }

    initializeSearchAndFilter() {
        const searchInput = document.querySelector('.search-bar input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterPatients(e.target.value));
        }
    }

    filterPatients(query) {
        const filteredPatients = this.patients.filter(patient => 
            patient.name.toLowerCase().includes(query.toLowerCase()) ||
            patient.id.toLowerCase().includes(query.toLowerCase()) ||
            patient.status.toLowerCase().includes(query.toLowerCase())
        );
        this.renderPatientTable(filteredPatients);
    }

    renderPatientTable(patients = this.patients) {
        const tbody = document.getElementById('patientTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        patients.forEach(patient => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${patient.id}</td>
                <td>${patient.name}</td>
                <td>${patient.age}</td>
                <td>${patient.severity}</td>
                <td>${patient.doctor}</td>
                <td>${patient.status}</td>
                <td class="action-buttons">
                    <button class="btn btn-secondary" onclick="patientManager.viewPatient('${patient.id}')">View</button>
                    <button class="btn btn-danger" onclick="patientManager.deletePatient('${patient.id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    viewPatient(id) {
        const patient = this.patients.find(p => p.id === id);
        if (!patient) return;

        // Show patient details in a modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Patient Details</h2>
                <div class="patient-details">
                    <p><strong>ID:</strong> ${patient.id}</p>
                    <p><strong>Name:</strong> ${patient.name}</p>
                    <p><strong>Age:</strong> ${patient.age}</p>
                    <p><strong>Severity:</strong> ${patient.severity}</p>
                    <p><strong>Doctor:</strong> ${patient.doctor}</p>
                    <p><strong>Status:</strong> ${patient.status}</p>
                </div>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="window.open('prescriptions/${patient.id}.pdf')">View Prescription</button>
                    <button class="btn btn-secondary" onclick="window.open('reports/${patient.id}.pdf')">Download Report</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.querySelector('.close').onclick = () => {
            document.body.removeChild(modal);
        };
    }

    deletePatient(id) {
        if (confirm('Are you sure you want to delete this patient?')) {
            this.patients = this.patients.filter(p => p.id !== id);
            localStorage.setItem('patients', JSON.stringify(this.patients));
            this.renderPatientTable();
            showToast('Patient deleted successfully');
        }
    }

    exportToCSV() {
        const headers = ['ID', 'Name', 'Age', 'Severity', 'Doctor', 'Status'];
        const csvContent = [
            headers.join(','),
            ...this.patients.map(patient => [
                patient.id,
                patient.name,
                patient.age,
                patient.severity,
                patient.doctor,
                patient.status
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'patients.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    }
}

// Doctor Management
class DoctorManager {
    constructor() {
        this.doctors = JSON.parse(localStorage.getItem('doctors')) || mockData.doctors;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const addDoctorBtn = document.querySelector('.btn-add-doctor');
        if (addDoctorBtn) {
            addDoctorBtn.addEventListener('click', () => this.showAddDoctorModal());
        }
    }

    showAddDoctorModal() {
        const modal = document.getElementById('addDoctorModal');
        if (modal) {
            modal.style.display = 'flex';
            const form = modal.querySelector('#addDoctorForm');
            form.onsubmit = (e) => {
                e.preventDefault();
                this.addDoctor({
                    id: 'D' + (this.doctors.length + 1).toString().padStart(3, '0'),
                    name: form.querySelector('input[type="text"]').value,
                    department: form.querySelector('select').value,
                    status: 'Active'
                });
                modal.style.display = 'none';
                form.reset();
            };
        }
    }

    addDoctor(doctor) {
        this.doctors.push(doctor);
        localStorage.setItem('doctors', JSON.stringify(this.doctors));
        this.renderDoctorList();
        showToast('Doctor added successfully');
    }

    updateDoctorStatus(id, status) {
        const doctor = this.doctors.find(d => d.id === id);
        if (doctor) {
            doctor.status = status;
            localStorage.setItem('doctors', JSON.stringify(this.doctors));
            this.renderDoctorList();
            showToast(`Doctor status updated to ${status}`);
        }
    }

    renderDoctorList() {
        const container = document.getElementById('doctorList');
        if (!container) return;

        container.innerHTML = '';
        this.doctors.forEach(doctor => {
            const card = document.createElement('div');
            card.className = 'doctor-card';
            card.innerHTML = `
                <h3>${doctor.name}</h3>
                <p><strong>Department:</strong> ${doctor.department}</p>
                <p><strong>Status:</strong> ${doctor.status}</p>
                <div class="action-buttons">
                    <button class="btn btn-secondary" onclick="doctorManager.updateDoctorStatus('${doctor.id}', '${doctor.status === 'Active' ? 'On Leave' : 'Active'}')">${doctor.status === 'Active' ? 'Set On Leave' : 'Set Active'}</button>
                    <button class="btn btn-danger" onclick="doctorManager.deleteDoctor('${doctor.id}')">Remove</button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    deleteDoctor(id) {
        if (confirm('Are you sure you want to remove this doctor?')) {
            this.doctors = this.doctors.filter(d => d.id !== id);
            localStorage.setItem('doctors', JSON.stringify(this.doctors));
            this.renderDoctorList();
            showToast('Doctor removed successfully');
        }
    }
}

// Resource Management
class ResourceManager {
    constructor() {
        this.departments = JSON.parse(localStorage.getItem('departments')) || mockData.departments;
        this.initializeResourceMonitoring();
    }

    initializeResourceMonitoring() {
        this.updateResourceStats();
        this.checkResourceAlerts();
        // Update every 5 minutes
        setInterval(() => {
            this.updateResourceStats();
            this.checkResourceAlerts();
        }, 5 * 60 * 1000);
    }

    updateResourceStats() {
        const statsContainer = document.querySelector('.stats-grid');
        if (!statsContainer) return;

        const totalBeds = this.departments.reduce((sum, dept) => sum + dept.capacity, 0);
        const occupiedBeds = this.departments.reduce((sum, dept) => sum + dept.occupied, 0);
        
        document.querySelector('.stat-value:nth-child(2)').textContent = 
            `${totalBeds - occupiedBeds}/${totalBeds}`;
    }

    checkResourceAlerts() {
        const alertsContainer = document.querySelector('.alerts-container');
        if (!alertsContainer) return;

        alertsContainer.innerHTML = '';
        this.departments.forEach(dept => {
            const occupancyRate = (dept.occupied / dept.capacity) * 100;
            if (occupancyRate >= 90) {
                const alert = document.createElement('div');
                alert.className = 'alert alert-warning';
                alert.innerHTML = `
                    <i class="fas fa-exclamation-triangle"></i>
                    Warning: ${dept.name} is at ${Math.round(occupancyRate)}% capacity
                `;
                alertsContainer.appendChild(alert);
            }
        });
    }
}

// Feedback Management
class FeedbackManager {
    constructor() {
        this.feedback = JSON.parse(localStorage.getItem('feedback')) || [];
        this.initializeFeedbackPanel();
    }

    initializeFeedbackPanel() {
        const container = document.getElementById('feedbackContainer');
        if (!container) return;

        this.feedback.forEach(item => {
            const card = document.createElement('div');
            card.className = 'feedback-card';
            card.innerHTML = `
                <div class="feedback-header">
                    <h3>${item.type === 'patient' ? 'Patient Feedback' : 'Doctor Rating'}</h3>
                    <span class="rating">${'★'.repeat(item.rating)}${'☆'.repeat(5-item.rating)}</span>
                </div>
                <p>${item.comment}</p>
                <small>From: ${item.from}</small>
            `;
            container.appendChild(card);
        });
    }
}

// Utility Functions
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Initialize Managers
document.addEventListener('DOMContentLoaded', () => {
    window.patientManager = new PatientManager();
    window.doctorManager = new DoctorManager();
    window.resourceManager = new ResourceManager();
    window.feedbackManager = new FeedbackManager();
});

// Export functionality
document.querySelector('.btn-export')?.addEventListener('click', () => {
    patientManager.exportToCSV();
}); 