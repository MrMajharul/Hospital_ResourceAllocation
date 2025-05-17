class ResourceManager {
    constructor() {
        this.currentUser = auth.getCurrentUser();
        this.resources = JSON.parse(localStorage.getItem('resources')) || [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadResources();
        this.updateStats();
        this.checkUrlParams();
    }

    setupEventListeners() {
        // New resource button
        const newResourceBtn = document.getElementById('newResourceBtn');
        const resourceModal = document.getElementById('resourceModal');
        const closeModal = document.querySelector('.close-modal');
        const cancelBtn = document.getElementById('cancelResourceBtn');

        newResourceBtn?.addEventListener('click', () => {
            resourceModal.style.display = 'block';
        });

        closeModal?.addEventListener('click', () => {
            resourceModal.style.display = 'none';
        });

        cancelBtn?.addEventListener('click', () => {
            resourceModal.style.display = 'none';
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === resourceModal) {
                resourceModal.style.display = 'none';
            }
        });

        // Form submission
        const resourceForm = document.getElementById('resourceForm');
        resourceForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createResource(e.target);
        });

        // Filters
        const searchInput = document.getElementById('searchResources');
        const typeFilter = document.getElementById('typeFilter');
        const statusFilter = document.getElementById('statusFilter');
        const departmentFilter = document.getElementById('departmentFilter');

        searchInput?.addEventListener('input', utils.debounce(() => this.loadResources(), 300));
        typeFilter?.addEventListener('change', () => this.loadResources());
        statusFilter?.addEventListener('change', () => this.loadResources());
        departmentFilter?.addEventListener('change', () => this.loadResources());
    }

    loadResources() {
        const resourcesGrid = document.querySelector('.resources-grid');
        if (!resourcesGrid) return;

        const filteredResources = this.filterResources();
        
        resourcesGrid.innerHTML = filteredResources.length ? filteredResources.map(resource => `
            <div class="resource-card" data-id="${resource.id}">
                <div class="resource-header">
                    <div>
                        <h3>${resource.name}</h3>
                        <span class="resource-type">${this.formatResourceType(resource.type)}</span>
                    </div>
                    <span class="badge badge-${resource.status}">${this.formatStatus(resource.status)}</span>
                </div>
                <div class="resource-details">
                    <p><i class="fas fa-map-marker-alt"></i> ${resource.location}</p>
                    <p><i class="fas fa-hospital"></i> ${this.formatDepartment(resource.department)}</p>
                    <p><i class="fas fa-cubes"></i> Quantity: ${resource.quantity}</p>
                    ${resource.description ? `
                        <p><i class="fas fa-info-circle"></i> ${resource.description}</p>
                    ` : ''}
                    ${resource.assignedTo ? `
                        <p><i class="fas fa-user"></i> Assigned to: ${resource.assignedTo}</p>
                    ` : ''}
                </div>
                <div class="resource-actions">
                    ${this.getActionButtons(resource)}
                </div>
            </div>
        `).join('') : '<p class="no-data">No resources found</p>';

        // Add event listeners to action buttons
        resourcesGrid.querySelectorAll('.resource-actions button').forEach(button => {
            button.addEventListener('click', (e) => {
                const resourceId = e.target.closest('.resource-card').dataset.id;
                const action = e.target.dataset.action;
                this.handleResourceAction(resourceId, action);
            });
        });

        this.updateStats();
    }

    getActionButtons(resource) {
        const buttons = [];

        // Only admin and staff can manage resources
        if (this.currentUser.role === 'admin' || this.currentUser.role === 'doctor') {
            switch (resource.status) {
                case 'available':
                    buttons.push(`
                        <button class="btn btn-small btn-primary" data-action="reserve">
                            <i class="fas fa-bookmark"></i> Reserve
                        </button>
                    `);
                    break;
                case 'in-use':
                case 'reserved':
                    buttons.push(`
                        <button class="btn btn-small btn-success" data-action="release">
                            <i class="fas fa-check"></i> Release
                        </button>
                    `);
                    break;
            }

            if (this.currentUser.role === 'admin') {
                buttons.push(`
                    <button class="btn btn-small" data-action="edit">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-small btn-danger" data-action="delete">
                        <i class="fas fa-trash"></i>
                    </button>
                `);

                if (resource.status !== 'maintenance') {
                    buttons.push(`
                        <button class="btn btn-small btn-warning" data-action="maintenance">
                            <i class="fas fa-tools"></i>
                        </button>
                    `);
                }
            }
        }

        return buttons.join('');
    }

    createResource(form) {
        try {
            const resource = {
                id: utils.generateId(),
                name: form.name.value,
                type: form.type.value,
                department: form.department.value,
                location: form.location.value,
                quantity: parseInt(form.quantity.value),
                description: form.description.value,
                status: 'available',
                createdAt: new Date().toISOString(),
                createdBy: this.currentUser.id
            };

            this.resources.push(resource);
            localStorage.setItem('resources', JSON.stringify(this.resources));
            
            this.loadResources();
            document.getElementById('resourceModal').style.display = 'none';
            form.reset();
            showToast('Resource added successfully', 'success');
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    handleResourceAction(resourceId, action) {
        const resource = this.resources.find(r => r.id === resourceId);
        if (!resource) return;

        switch (action) {
            case 'reserve':
                resource.status = 'reserved';
                resource.assignedTo = this.currentUser.name;
                showToast('Resource reserved successfully', 'success');
                break;
            case 'release':
                resource.status = 'available';
                resource.assignedTo = null;
                showToast('Resource released successfully', 'success');
                break;
            case 'maintenance':
                resource.status = 'maintenance';
                showToast('Resource marked for maintenance', 'success');
                break;
            case 'delete':
                if (confirm('Are you sure you want to delete this resource?')) {
                    this.resources = this.resources.filter(r => r.id !== resourceId);
                    showToast('Resource deleted successfully', 'success');
                }
                break;
            case 'edit':
                this.editResource(resource);
                break;
        }

        localStorage.setItem('resources', JSON.stringify(this.resources));
        this.loadResources();
    }

    editResource(resource) {
        // Implementation for editing resource
        // This could open the modal with pre-filled form
        showToast('Edit functionality coming soon', 'info');
    }

    filterResources() {
        const searchTerm = document.getElementById('searchResources')?.value.toLowerCase() || '';
        const typeFilter = document.getElementById('typeFilter')?.value || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';
        const departmentFilter = document.getElementById('departmentFilter')?.value || '';

        return this.resources.filter(resource => {
            // Filter by search term
            const searchMatch = resource.name.toLowerCase().includes(searchTerm) ||
                resource.description?.toLowerCase().includes(searchTerm) ||
                resource.location.toLowerCase().includes(searchTerm);
            if (!searchMatch) return false;

            // Filter by type
            if (typeFilter && resource.type !== typeFilter) return false;

            // Filter by status
            if (statusFilter && resource.status !== statusFilter) return false;

            // Filter by department
            if (departmentFilter && resource.department !== departmentFilter) return false;

            return true;
        });
    }

    updateStats() {
        const stats = {
            available: this.resources.filter(r => r.status === 'available').length,
            inUse: this.resources.filter(r => r.status === 'in-use').length,
            maintenance: this.resources.filter(r => r.status === 'maintenance').length,
            reserved: this.resources.filter(r => r.status === 'reserved').length
        };

        document.getElementById('availableCount').textContent = stats.available;
        document.getElementById('inUseCount').textContent = stats.inUse;
        document.getElementById('maintenanceCount').textContent = stats.maintenance;
        document.getElementById('reservedCount').textContent = stats.reserved;
    }

    formatResourceType(type) {
        return type.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    formatStatus(status) {
        return status.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    formatDepartment(department) {
        return department.charAt(0).toUpperCase() + department.slice(1);
    }

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('action') === 'new') {
            document.getElementById('resourceModal').style.display = 'block';
        }
    }
}

// Initialize resource manager
document.addEventListener('DOMContentLoaded', () => {
    if (!auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    window.resourceManager = new ResourceManager();
}); 