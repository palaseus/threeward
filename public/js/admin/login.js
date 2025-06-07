// Admin login functionality
const admin = {
    init() {
        this.setupLoginForm();
    },

    setupLoginForm() {
        const form = document.getElementById('login-form');
        const errorMessage = document.getElementById('error-message');

        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = form.querySelector('#username').value;
            const password = form.querySelector('#password').value;

            try {
                const response = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                if (!response.ok) {
                    throw new Error('Invalid credentials');
                }

                const data = await response.json();
                localStorage.setItem('adminToken', data.token);
                window.location.href = '/admin/dashboard';
            } catch (error) {
                console.error('Login error:', error);
                errorMessage.classList.remove('hidden');
                setTimeout(() => {
                    errorMessage.classList.add('hidden');
                }, 3000);
            }
        });
    }
};

// Initialize admin functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => admin.init()); 