class Auth {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    }

    register(userData) {
        // Validate required fields
        const requiredFields = ['email', 'password', 'name', 'role'];
        for (const field of requiredFields) {
            if (!userData[field]) {
                throw new Error(`${field} is required`);
            }
        }

        // Validate email format
        if (!utils.validateEmail(userData.email)) {
            throw new Error('Invalid email format');
        }

        // Check if user already exists
        if (this.users.some(user => user.email === userData.email)) {
            throw new Error('User already exists');
        }

        // Create new user
        const newUser = {
            id: utils.generateId(),
            ...userData,
            createdAt: new Date().toISOString()
        };

        // Add to users array
        this.users.push(newUser);
        localStorage.setItem('users', JSON.stringify(this.users));

        return newUser;
    }

    login(email, password) {
        // Find user
        const user = this.users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Set current user
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));

        return user;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    updateProfile(userData) {
        if (!this.currentUser) {
            throw new Error('No user is logged in');
        }

        // Update user data
        const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex === -1) {
            throw new Error('User not found');
        }

        // Update only allowed fields
        const allowedFields = ['name', 'phone', 'address', 'specialization'];
        const updatedUser = { ...this.users[userIndex] };

        for (const field of allowedFields) {
            if (userData[field] !== undefined) {
                updatedUser[field] = userData[field];
            }
        }

        // Save changes
        this.users[userIndex] = updatedUser;
        this.currentUser = updatedUser;

        localStorage.setItem('users', JSON.stringify(this.users));
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));

        return updatedUser;
    }

    changePassword(oldPassword, newPassword) {
        if (!this.currentUser) {
            throw new Error('No user is logged in');
        }

        // Verify old password
        if (this.currentUser.password !== oldPassword) {
            throw new Error('Invalid current password');
        }

        // Update password
        const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
        this.users[userIndex].password = newPassword;
        this.currentUser.password = newPassword;

        localStorage.setItem('users', JSON.stringify(this.users));
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    }

    // Role-based authorization
    hasRole(role) {
        return this.currentUser?.role === role;
    }

    requireRole(role) {
        if (!this.isAuthenticated()) {
            throw new Error('Authentication required');
        }

        if (!this.hasRole(role)) {
            throw new Error('Unauthorized access');
        }

        return true;
    }
}

// Initialize auth system
const auth = new Auth();

// Export auth instance
window.auth = auth;

// Handle login form submission
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    loginForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        try {
            const email = e.target.email.value;
            const password = e.target.password.value;
            
            auth.login(email, password);
            showToast('Login successful', 'success');
            
            // Redirect based on role
            const user = auth.getCurrentUser();
            if (user.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        } catch (error) {
            showToast(error.message, 'error');
        }
    });

    registerForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        try {
            const userData = {
                name: e.target.name.value,
                email: e.target.email.value,
                password: e.target.password.value,
                role: e.target.role.value,
                phone: e.target.phone?.value,
                specialization: e.target.specialization?.value
            };
            
            auth.register(userData);
            showToast('Registration successful', 'success');
            window.location.href = 'login.html';
        } catch (error) {
            showToast(error.message, 'error');
        }
    });

    // Check authentication status and redirect if needed
    const publicPages = ['login.html', 'register.html', 'index.html'];
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    if (!publicPages.includes(currentPage) && !auth.isAuthenticated()) {
        window.location.href = 'login.html';
    }
}); 