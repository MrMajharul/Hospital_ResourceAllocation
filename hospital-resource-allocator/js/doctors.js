class DoctorManager {
    constructor() {
        this.currentUser = auth.getCurrentUser();
        this.doctors = JSON.parse(localStorage.getItem('users'))?.filter(user => user.role === 'doctor') || [];
        this.appointments = JSON.parse(localStorage.getItem('appointments')) || [];
        this.selectedDoctor = null;
        this.selectedTimeSlot = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDoctors();
        this.checkUrlParams();
    }

    setupEventListeners() {
        // View toggle
        const viewToggleBtns = document.querySelectorAll('.view-toggle button');
        viewToggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                viewToggleBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.toggleView(btn.dataset.view);
            });
        });

        // Filters
        const searchInput = document.getElementById('searchDoctors');
        const specializationFilter = document.getElementById('specializationFilter');
        const availabilityFilter = document.getElementById('availabilityFilter');

        searchInput?.addEventListener('input', utils.debounce(() => this.loadDoctors(), 300));
        specializationFilter?.addEventListener('change', () => this.loadDoctors());
        availabilityFilter?.addEventListener('change', () => this.loadDoctors());

        // Quick actions
        const scheduleAppointmentBtn = document.getElementById('scheduleAppointmentBtn');
        const viewDepartmentsBtn = document.getElementById('viewDepartmentsBtn');

        scheduleAppointmentBtn?.addEventListener('click', () => {
            window.location.href = 'appointments.html?action=new';
        });

        viewDepartmentsBtn?.addEventListener('click', () => {
            window.location.href = 'departments.html';
        });

        // Doctor modal
        const doctorModal = document.getElementById('doctorModal');
        const closeModal = document.querySelector('.close-modal');
        const closeDoctorModal = document.getElementById('closeDoctorModal');
        const bookAppointmentBtn = document.getElementById('bookAppointmentBtn');

        closeModal?.addEventListener('click', () => {
            doctorModal.style.display = 'none';
        });

        closeDoctorModal?.addEventListener('click', () => {
            doctorModal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === doctorModal) {
                doctorModal.style.display = 'none';
            }
        });

        bookAppointmentBtn?.addEventListener('click', () => {
            if (this.selectedDoctor && this.selectedTimeSlot) {
                window.location.href = `appointments.html?action=new&doctor=${this.selectedDoctor.id}&date=${this.selectedTimeSlot}`;
            } else {
                showToast('Please select a time slot', 'error');
            }
        });
    }

    loadDoctors() {
        const doctorsGrid = document.querySelector('.doctors-grid');
        const doctorsList = document.querySelector('.doctors-list');
        if (!doctorsGrid || !doctorsList) return;

        const filteredDoctors = this.filterDoctors();
        
        // Grid view
        doctorsGrid.innerHTML = filteredDoctors.length ? filteredDoctors.map(doctor => `
            <div class="doctor-card" data-id="${doctor.id}">
                <div class="doctor-header">
                    <img src="${this.getDoctorImage(doctor)}" alt="Dr. ${doctor.name}" class="doctor-image">
                    <span class="doctor-status status-${this.getDoctorStatus(doctor)}">${this.formatStatus(this.getDoctorStatus(doctor))}</span>
                </div>
                <div class="doctor-info">
                    <h3 class="doctor-name">Dr. ${doctor.name}</h3>
                    <p class="doctor-specialization">${this.formatSpecialization(doctor.specialization)}</p>
                    <div class="doctor-details">
                        <p><i class="fas fa-stethoscope"></i> ${doctor.experience || '5+'} years experience</p>
                        <p><i class="fas fa-star"></i> ${doctor.rating || '4.5'} Rating</p>
                        <p><i class="fas fa-user-friends"></i> ${this.getPatientCount(doctor)} Patients</p>
                    </div>
                    <div class="doctor-actions">
                        <button class="btn btn-small" onclick="doctorManager.viewDoctorProfile('${doctor.id}')">
                            <i class="fas fa-user-md"></i> View Profile
                        </button>
                        <button class="btn btn-small btn-primary" onclick="doctorManager.scheduleAppointment('${doctor.id}')">
                            <i class="fas fa-calendar-plus"></i> Schedule
                        </button>
                    </div>
                </div>
            </div>
        `).join('') : '<p class="no-data">No doctors found</p>';

        // List view
        doctorsList.innerHTML = filteredDoctors.length ? filteredDoctors.map(doctor => `
            <div class="doctor-card" data-id="${doctor.id}">
                <div class="doctor-header">
                    <img src="${this.getDoctorImage(doctor)}" alt="Dr. ${doctor.name}" class="doctor-image">
                    <span class="doctor-status status-${this.getDoctorStatus(doctor)}">${this.formatStatus(this.getDoctorStatus(doctor))}</span>
                </div>
                <div class="doctor-info">
                    <div class="doctor-main-info">
                        <h3 class="doctor-name">Dr. ${doctor.name}</h3>
                        <p class="doctor-specialization">${this.formatSpecialization(doctor.specialization)}</p>
                    </div>
                    <div class="doctor-details">
                        <p><i class="fas fa-stethoscope"></i> ${doctor.experience || '5+'} years experience</p>
                        <p><i class="fas fa-star"></i> ${doctor.rating || '4.5'} Rating</p>
                        <p><i class="fas fa-user-friends"></i> ${this.getPatientCount(doctor)} Patients</p>
                        <p><i class="fas fa-clock"></i> Next available: ${this.getNextAvailableSlot(doctor)}</p>
                    </div>
                    <div class="doctor-actions">
                        <button class="btn btn-small" onclick="doctorManager.viewDoctorProfile('${doctor.id}')">
                            <i class="fas fa-user-md"></i> View Profile
                        </button>
                        <button class="btn btn-small btn-primary" onclick="doctorManager.scheduleAppointment('${doctor.id}')">
                            <i class="fas fa-calendar-plus"></i> Schedule
                        </button>
                    </div>
                </div>
            </div>
        `).join('') : '<p class="no-data">No doctors found</p>';
    }

    filterDoctors() {
        const searchTerm = document.getElementById('searchDoctors')?.value.toLowerCase() || '';
        const specializationFilter = document.getElementById('specializationFilter')?.value || '';
        const availabilityFilter = document.getElementById('availabilityFilter')?.value || '';

        return this.doctors.filter(doctor => {
            // Filter by search term
            const searchMatch = doctor.name.toLowerCase().includes(searchTerm) ||
                doctor.specialization.toLowerCase().includes(searchTerm);
            if (!searchMatch) return false;

            // Filter by specialization
            if (specializationFilter && doctor.specialization !== specializationFilter) return false;

            // Filter by availability
            if (availabilityFilter) {
                const status = this.getDoctorStatus(doctor);
                if (availabilityFilter !== status) return false;
            }

            return true;
        });
    }

    viewDoctorProfile(doctorId) {
        const doctor = this.doctors.find(d => d.id === doctorId);
        if (!doctor) return;

        this.selectedDoctor = doctor;
        this.selectedTimeSlot = null;

        const doctorModal = document.getElementById('doctorModal');
        const doctorProfile = doctorModal.querySelector('.doctor-profile');
        const timeSlots = doctorModal.querySelector('.time-slots');

        doctorProfile.innerHTML = `
            <img src="${this.getDoctorImage(doctor)}" alt="Dr. ${doctor.name}" class="profile-image">
            <div class="profile-info">
                <h3>Dr. ${doctor.name}</h3>
                <p class="doctor-specialization">${this.formatSpecialization(doctor.specialization)}</p>
                <div class="doctor-details">
                    <p><i class="fas fa-stethoscope"></i> ${doctor.experience || '5+'} years experience</p>
                    <p><i class="fas fa-star"></i> ${doctor.rating || '4.5'} Rating</p>
                    <p><i class="fas fa-user-friends"></i> ${this.getPatientCount(doctor)} Patients</p>
                    <p><i class="fas fa-graduation-cap"></i> ${doctor.education || 'MD - General Medicine'}</p>
                    <p><i class="fas fa-language"></i> ${doctor.languages || 'English, Spanish'}</p>
                    <p><i class="fas fa-info-circle"></i> ${doctor.description || 'Experienced healthcare professional specializing in ' + doctor.specialization}</p>
                </div>
            </div>
        `;

        timeSlots.innerHTML = this.getAvailableTimeSlots(doctor).map(slot => `
            <div class="time-slot ${slot.available ? '' : 'slot-unavailable'}" 
                 data-time="${slot.time}" 
                 onclick="doctorManager.selectTimeSlot('${slot.time}', ${slot.available})">
                ${slot.time}
            </div>
        `).join('');

        doctorModal.style.display = 'block';
    }

    scheduleAppointment(doctorId) {
        window.location.href = `appointments.html?action=new&doctor=${doctorId}`;
    }

    selectTimeSlot(time, available) {
        if (!available) return;

        this.selectedTimeSlot = time;
        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.classList.remove('selected');
            if (slot.dataset.time === time) {
                slot.classList.add('selected');
            }
        });
    }

    getDoctorImage(doctor) {
        // In a real application, this would return the doctor's actual image
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=random`;
    }

    getDoctorStatus(doctor) {
        const todayAppointments = this.appointments.filter(a => 
            a.doctorId === doctor.id && 
            a.date === new Date().toISOString().split('T')[0]
        );

        if (!todayAppointments.length) return 'available';
        if (todayAppointments.some(a => a.status === 'confirmed')) return 'scheduled';
        return 'available';
    }

    getPatientCount(doctor) {
        return this.appointments.filter(a => 
            a.doctorId === doctor.id && 
            ['completed', 'confirmed'].includes(a.status)
        ).length;
    }

    getNextAvailableSlot(doctor) {
        const slots = this.getAvailableTimeSlots(doctor);
        const availableSlot = slots.find(slot => slot.available);
        return availableSlot ? `Today at ${availableSlot.time}` : 'Check schedule';
    }

    getAvailableTimeSlots(doctor) {
        const slots = [];
        const currentHour = new Date().getHours();
        
        // Generate time slots from 9 AM to 5 PM
        for (let hour = 9; hour <= 17; hour++) {
            const time = `${hour % 12 || 12}:00 ${hour < 12 ? 'AM' : 'PM'}`;
            const available = hour > currentHour && !this.isTimeSlotBooked(doctor.id, time);
            slots.push({ time, available });
        }

        return slots;
    }

    isTimeSlotBooked(doctorId, time) {
        return this.appointments.some(a => 
            a.doctorId === doctorId && 
            a.time === time &&
            a.date === new Date().toISOString().split('T')[0] &&
            ['pending', 'confirmed'].includes(a.status)
        );
    }

    toggleView(view) {
        const gridView = document.querySelector('.doctors-grid');
        const listView = document.querySelector('.doctors-list');

        if (view === 'grid') {
            gridView.classList.add('active-view');
            listView.classList.remove('active-view');
        } else {
            listView.classList.add('active-view');
            gridView.classList.remove('active-view');
        }
    }

    formatSpecialization(specialization) {
        return specialization.charAt(0).toUpperCase() + specialization.slice(1);
    }

    formatStatus(status) {
        switch (status) {
            case 'available':
                return 'Available';
            case 'scheduled':
                return 'In Clinic';
            case 'unavailable':
                return 'Unavailable';
            default:
                return status.charAt(0).toUpperCase() + status.slice(1);
        }
    }

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const doctorId = urlParams.get('doctor');
        if (doctorId) {
            this.viewDoctorProfile(doctorId);
        }
    }
}

// Initialize doctor manager
document.addEventListener('DOMContentLoaded', () => {
    if (!auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    window.doctorManager = new DoctorManager();
}); 