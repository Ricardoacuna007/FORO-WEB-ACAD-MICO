/**
 * Sistema de Autenticación - Foro Académico UPA
 * Manejo de login, registro, sesiones y permisos
 */

class AuthSystem {
    constructor() {
        this.token = localStorage.getItem('upa_token');
        this.user = JSON.parse(localStorage.getItem('user_data') || '{}');
        this.init();
    }

    init() {
        console.log('🔐 Sistema de Autenticación Iniciado');
        this.checkSession();
        this.setupEventListeners();
    }

    // ==================== MANEJO DE SESIÓN ====================
    async checkSession() {
        const currentPage = window.location.pathname.split('/').pop();
        const publicPages = ['index.html', 'registro.html', 'recuperar-contrasena.html', ''];
        
        // Si no hay token y está en página protegida, redirigir al login
        if (!this.token && !publicPages.includes(currentPage)) {
            this.redirectToLogin();
            return;
        }

        // Si hay token y está en página pública, redirigir al dashboard
        if (this.token && publicPages.includes(currentPage)) {
            this.redirectToDashboard();
            return;
        }

        // Si hay token, verificar que sea válido
        if (this.token) {
            await this.validateToken();
        }
    }

    async validateToken() {
        try {
            const response = await API.me();
            this.user = response.data.user;
            localStorage.setItem('user_data', JSON.stringify(this.user));
            this.updateUI();
        } catch (error) {
            console.error('Token inválido:', error);
            this.logout();
        }
    }

    // ==================== LOGIN ====================
    async login(email, password, rememberMe = false) {
        try {
            this.showLoading('Iniciando sesión...');
            
            const response = await API.login(email, password);
            
            if (response.success) {
                this.token = response.data.token;
                this.user = response.data.user;
                
                // Guardar en localStorage
                localStorage.setItem('upa_token', this.token);
                localStorage.setItem('user_data', JSON.stringify(this.user));
                
                if (rememberMe) {
                    localStorage.setItem('remember_me', 'true');
                }
                
                mostrarNotificacion('success', `¡Bienvenido ${this.user.nombre}!`);
                
                // Redirigir al dashboard después de 1.5 segundos
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
                
            } else {
                throw new Error(response.message || 'Error en el login');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            mostrarNotificacion('error', error.message || 'Credenciales incorrectas');
        } finally {
            this.hideLoading();
        }
    }

    // ==================== REGISTRO ====================
    async register(userData) {
        try {
            this.showLoading('Creando cuenta...');
            
            const response = await API.register(userData);
            
            if (response.success) {
                mostrarNotificacion('success', '¡Cuenta creada exitosamente! Por favor inicia sesión.');
                
                // Redirigir al login después de 2 segundos
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                throw new Error(response.message || 'Error en el registro');
            }
            
        } catch (error) {
            console.error('Register error:', error);
            mostrarNotificacion('error', error.message || 'Error al crear la cuenta');
        } finally {
            this.hideLoading();
        }
    }

    // ==================== LOGOUT ====================
    async logout() {
        try {
            await API.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Limpiar localStorage
            localStorage.removeItem('upa_token');
            localStorage.removeItem('user_data');
            localStorage.removeItem('remember_me');
            
            this.token = null;
            this.user = {};
            
            // Redirigir al login
            this.redirectToLogin();
        }
    }

    // ==================== UTILIDADES ====================
    redirectToLogin() {
        if (!window.location.pathname.includes('index.html')) {
            window.location.href = 'index.html';
        }
    }

    redirectToDashboard() {
        if (!window.location.pathname.includes('dashboard.html')) {
            window.location.href = 'dashboard.html';
        }
    }

    updateUI() {
        // Actualizar elementos de la UI con información del usuario
        const userElements = document.querySelectorAll('[data-user]');
        userElements.forEach(element => {
            const prop = element.getAttribute('data-user');
            if (this.user[prop]) {
                element.textContent = this.user[prop];
            }
        });

        // Actualizar avatar
        const avatarElements = document.querySelectorAll('[data-user-avatar]');
        avatarElements.forEach(element => {
            if (this.user.avatar) {
                element.src = this.user.avatar;
            }
        });
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLoginForm();
            });
        }

        // Toggle password visibility
        const togglePassword = document.getElementById('togglePassword');
        if (togglePassword) {
            togglePassword.addEventListener('click', () => {
                this.togglePasswordVisibility();
            });
        }

        // Logout buttons
        document.querySelectorAll('[data-action="logout"]').forEach(button => {
            button.addEventListener('click', () => this.logout());
        });
    }

    handleLoginForm() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        this.login(email, password, rememberMe);
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('loginPassword');
        const toggleIcon = document.getElementById('togglePassword').querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.className = 'fas fa-eye-slash';
        } else {
            passwordInput.type = 'password';
            toggleIcon.className = 'fas fa-eye';
        }
    }

    showLoading(message = 'Cargando...') {
        // Implementar loading spinner
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i> ${message}`;
        }
    }

    hideLoading() {
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = `<i class="fas fa-sign-in-alt me-2"></i> Iniciar Sesión`;
        }
    }

    // ==================== GETTERS ====================
    isAuthenticated() {
        return !!this.token;
    }

    getUser() {
        return this.user;
    }

    getToken() {
        return this.token;
    }

    hasRole(role) {
        return this.user.rol === role;
    }

    isEstudiante() {
        return this.user.rol === 'estudiante';
    }

    isProfesor() {
        return this.user.rol === 'profesor';
    }

    isAdmin() {
        return this.user.rol === 'admin';
    }
}

// Inicializar sistema de autenticación
const auth = new AuthSystem();

// Exportar para uso global
window.auth = auth;