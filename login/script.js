class TaskFlowAuth {
    constructor() {
        this.form = document.getElementById('registrationForm');
        this.nameInput = document.getElementById('userName');
        this.dobInput = document.getElementById('dateOfBirth');
        this.submitBtn = document.getElementById('submitBtn');
        this.loading = document.getElementById('loading');
        this.successMessage = document.getElementById('successMessage');
        
        this.init();
    }

    init() {
        // Check if user is already registered
        this.checkExistingUser();
        
        // Set up event listeners
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.nameInput.addEventListener('input', () => this.clearError('nameError'));
        this.dobInput.addEventListener('change', () => this.clearError('dobError'));
        
        // Set max date to today
        this.dobInput.max = new Date().toISOString().split('T')[0];
    }

    checkExistingUser() {
        try {
            const userData = localStorage.getItem('taskflow_user');
            if (userData) {
                const user = JSON.parse(userData);
                if (user.name && user.dateOfBirth && this.isValidAge(user.dateOfBirth)) {
                    this.redirectToApp();
                }
            }
        } catch (error) {
            console.error('Error checking existing user:', error);
            // Clear corrupted data
            localStorage.removeItem('taskflow_user');
        }
    }

    handleSubmit(e) {
        e.preventDefault();
        
        if (this.validateForm()) {
            this.showLoading();
            
            // Simulate processing time for better UX
            setTimeout(() => {
                this.saveUserData();
                this.showSuccess();
                
                setTimeout(() => {
                    this.redirectToApp();
                }, 1500);
            }, 1000);
        }
    }

    validateForm() {
        let isValid = true;
        
        // Clear previous errors
        this.clearAllErrors();
        
        // Validate name
        const name = this.nameInput.value.trim();
        if (!name) {
            this.showError('nameError', 'Please enter your full name');
            this.nameInput.classList.add('input-error');
            isValid = false;
        } else if (name.length < 2) {
            this.showError('nameError', 'Name must be at least 2 characters long');
            this.nameInput.classList.add('input-error');
            isValid = false;
        } else if (!/^[a-zA-Z\s]+$/.test(name)) {
            this.showError('nameError', 'Name should only contain letters and spaces');
            this.nameInput.classList.add('input-error');
            isValid = false;
        }
        
        // Validate date of birth
        const dob = this.dobInput.value;
        if (!dob) {
            this.showError('dobError', 'Please select your date of birth');
            this.dobInput.classList.add('input-error');
            isValid = false;
        } else if (!this.isValidAge(dob)) {
            this.showError('dobError', 'You must be over 10 years old to use TaskFlow');
            this.dobInput.classList.add('input-error');
            isValid = false;
        } else if (new Date(dob) > new Date()) {
            this.showError('dobError', 'Date of birth cannot be in the future');
            this.dobInput.classList.add('input-error');
            isValid = false;
        }
        
        return isValid;
    }

    isValidAge(dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age > 10;
    }

    saveUserData() {
        const userData = {
            name: this.nameInput.value.trim(),
            dateOfBirth: this.dobInput.value,
            registrationDate: new Date().toISOString(),
            id: Date.now().toString()
        };
        
        try {
            localStorage.setItem('taskflow_user', JSON.stringify(userData));
        } catch (error) {
            console.error('Error saving user data:', error);
            alert('There was an error saving your data. Please try again.');
        }
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    clearError(elementId) {
        const errorElement = document.getElementById(elementId);
        errorElement.style.display = 'none';
        
        // Remove error styling from corresponding input
        if (elementId === 'nameError') {
            this.nameInput.classList.remove('input-error');
        } else if (elementId === 'dobError') {
            this.dobInput.classList.remove('input-error');
        }
    }

    clearAllErrors() {
        this.clearError('nameError');
        this.clearError('dobError');
    }

    showLoading() {
        this.submitBtn.style.display = 'none';
        this.loading.style.display = 'block';
    }

    showSuccess() {
        this.loading.style.display = 'none';
        this.successMessage.style.display = 'block';
    }

    redirectToApp() {
        window.location.href = '../dashboard/app.html';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TaskFlowAuth();
});// script.js - Add your JavaScript here 