class AppointmentsManager {
    constructor() {
        this.currentUser = auth.getCurrentUser();
        this.appointments = JSON.parse(localStorage.getItem('appointments')) || [];
        this.doctors = JSON.parse(localStorage.getItem('users'))?.filter(user => user.role === 'doctor') || [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDoctors();
        this.loadAppointments();
        this.initializeDatePicker();
        this.checkUrlParams();
    }

    setupEventListeners() {
        // New appointment button
        const newAppointmentBtn = document.getElementById('newAppointmentBtn');
        const appointmentModal = document.getElementById('appointmentModal');
        const closeModal = document.querySelector('.close-modal');
        const cancelBtn = document.getElementById('cancelAppointmentBtn');

        newAppointmentBtn?.addEventListener('click', () => {
            appointmentModal.style.display = 'block';
        });

        closeModal?.addEventListener('click', () => {
            appointmentModal.style.display = 'none';
        });

        cancelBtn?.addEventListener('click', () => {
            appointmentModal.style.display = 'none';
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === appointmentModal) {
                appointmentModal.style.display = 'none';
            }
        });

        // Form submission
        const appointmentForm = document.getElementById('appointmentForm');
        appointmentForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createAppointment(e.target);
        });

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
        const searchInput = document.getElementById('searchAppointments');
        const statusFilter = document.getElementById('statusFilter');
        const dateFilter = document.getElementById('dateFilter');

        searchInput?.addEventListener('input', utils.debounce(() => this.filterAppointments(), 300));
        statusFilter?.addEventListener('change', () => this.filterAppointments());
        dateFilter?.addEventListener('change', () => this.filterAppointments());
    }

    loadDoctors() {
        const doctorSelect = document.getElementById('doctor');
        if (!doctorSelect) return;

        doctorSelect.innerHTML = '<option value="">Select a doctor</option>' +
            this.doctors.map(doctor => `
                <option value="${doctor.id}">Dr. ${doctor.name} - ${doctor.specialization}</option>
            `).join('');
    }

    loadAppointments() {
        const appointmentsList = document.querySelector('.appointments-list');
        if (!appointmentsList) return;

        const userAppointments = this.filterAppointments();
        
        appointmentsList.innerHTML = userAppointments.length ? userAppointments.map(appointment => `
            <div class="appointment-card" data-id="${appointment.id}">
                <div class="appointment-header">
                    <h4>${appointment.title}</h4>
                    <span class="badge badge-${appointment.status}">${appointment.status}</span>
                </div>
                <div class="appointment-details">
                    <p><i class="fas fa-calendar"></i> ${utils.formatDate(appointment.date)}</p>
                    <p><i class="fas fa-clock"></i> ${appointment.time}</p>
                    <p><i class="fas fa-user-md"></i> Dr. ${appointment.doctorName}</p>
                    ${appointment.notes ? `<p><i class="fas fa-sticky-note"></i> ${appointment.notes}</p>` : ''}
                </div>
                <div class="appointment-actions">
                    ${this.getActionButtons(appointment)}
                </div>
            </div>
        `).join('') : '<p class="no-data">No appointments found</p>';

        // Add event listeners to action buttons
        appointmentsList.querySelectorAll('.appointment-actions button').forEach(button => {
            button.addEventListener('click', (e) => {
                const appointmentId = e.target.closest('.appointment-card').dataset.id;
                const action = e.target.dataset.action;
                this.handleAppointmentAction(appointmentId, action);
            });
        });
    }

    getActionButtons(appointment) {
        const buttons = [];

        switch (appointment.status) {
            case 'pending':
                if (this.currentUser.role === 'doctor') {
                    buttons.push(`
                        <button class="btn btn-small btn-success" data-action="confirm">
                            <i class="fas fa-check"></i> Confirm
                        </button>
                    `);
                }
                buttons.push(`
                    <button class="btn btn-small btn-danger" data-action="cancel">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                `);
                break;
            case 'confirmed':
                if (this.currentUser.role === 'doctor') {
                    buttons.push(`
                        <button class="btn btn-small btn-success" data-action="complete">
                            <i class="fas fa-check-double"></i> Complete
                        </button>
                    `);
                }
                buttons.push(`
                    <button class="btn btn-small btn-danger" data-action="cancel">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                `);
                break;
        }

        return buttons.join('');
    }

    createAppointment(form) {
        try {
            const doctor = this.doctors.find(d => d.id === form.doctor.value);
            const appointment = {
                id: utils.generateId(),
                title: form.title.value,
                date: form.date.value,
                time: form.time.value,
                doctorId: doctor.id,
                doctorName: doctor.name,
                patientId: this.currentUser.id,
                patientName: this.currentUser.name,
                notes: form.notes.value,
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            this.appointments.push(appointment);
            localStorage.setItem('appointments', JSON.stringify(this.appointments));
            
            this.loadAppointments();
            document.getElementById('appointmentModal').style.display = 'none';
            form.reset();
            showToast('Appointment scheduled successfully', 'success');
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    handleAppointmentAction(appointmentId, action) {
        const appointment = this.appointments.find(a => a.id === appointmentId);
        if (!appointment) return;

        switch (action) {
            case 'confirm':
                appointment.status = 'confirmed';
                showToast('Appointment confirmed', 'success');
                break;
            case 'complete':
                appointment.status = 'completed';
                showToast('Appointment marked as completed', 'success');
                break;
            case 'cancel':
                appointment.status = 'cancelled';
                showToast('Appointment cancelled', 'success');
                break;
        }

        localStorage.setItem('appointments', JSON.stringify(this.appointments));
        this.loadAppointments();
    }

    filterAppointments() {
        const searchTerm = document.getElementById('searchAppointments')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';
        const dateFilter = document.getElementById('dateFilter')?.value || '';

        return this.appointments.filter(appointment => {
            // Filter by user role
            if (this.currentUser.role === 'doctor' && appointment.doctorId !== this.currentUser.id) return false;
            if (this.currentUser.role === 'patient' && appointment.patientId !== this.currentUser.id) return false;

            // Filter by search term
            const searchMatch = appointment.title.toLowerCase().includes(searchTerm) ||
                appointment.doctorName.toLowerCase().includes(searchTerm) ||
                appointment.patientName.toLowerCase().includes(searchTerm);
            if (!searchMatch) return false;

            // Filter by status
            if (statusFilter && appointment.status !== statusFilter) return false;

            // Filter by date
            if (dateFilter && appointment.date !== dateFilter) return false;

            return true;
        });
    }

    toggleView(view) {
        const listView = document.querySelector('.appointments-list');
        const calendarView = document.querySelector('.appointments-calendar');

        if (view === 'list') {
            listView.classList.add('active-view');
            calendarView.classList.remove('active-view');
        } else {
            calendarView.classList.add('active-view');
            listView.classList.remove('active-view');
            this.initializeCalendarView();
        }
    }

    initializeDatePicker() {
        const dateInput = document.getElementById('date');
        if (!dateInput) return;

        flatpickr(dateInput, {
            minDate: 'today',
            dateFormat: 'Y-m-d'
        });
    }

    initializeCalendarView() {
        // Calendar view implementation will be added later
        const calendarView = document.querySelector('.appointments-calendar');
        if (!calendarView) return;

        calendarView.innerHTML = '<p class="no-data">Calendar view coming soon!</p>';
    }

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('action') === 'new') {
            document.getElementById('appointmentModal').style.display = 'block';
        }
    }
}

// Initialize appointments manager
document.addEventListener('DOMContentLoaded', () => {
    if (!auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    window.appointmentsManager = new AppointmentsManager();
}); 