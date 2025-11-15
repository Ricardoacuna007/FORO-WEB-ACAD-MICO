/**
 * Sistema de Autenticación - Foro Académico UPA
 * Manejo de login, registro, sesiones y permisos
 */

const PUBLIC_ROUTES = new Set([
    '',
    '/',
    'index',
    'index.html',
    'registro',
    'registro.html',
    'recuperar-contrasena',
    'recuperar-contrasena.html',
    'search',
    'search.html'
]);

const ROUTE_PERMISSIONS = {
    dashboard: ['estudiante', 'profesor', 'admin', 'moderador'],
    calendario: ['estudiante', 'profesor', 'admin', 'moderador'],
    notificaciones: ['estudiante', 'profesor', 'admin', 'moderador'],
    perfil: ['estudiante', 'profesor', 'admin', 'moderador'],
    materia: ['estudiante', 'profesor', 'admin', 'moderador'],
    foro: ['estudiante', 'profesor', 'admin', 'moderador'],
    search: ['estudiante', 'profesor', 'admin', 'moderador'],
    'crear-post': ['profesor', 'admin', 'moderador'],
    moderacion: ['admin', 'moderador'],
    'views/moderacion': ['admin', 'moderador']
};

const ROLE_DEFAULT_ROUTES = {
    estudiante: 'foro',
    profesor: 'foro',
    admin: 'moderacion',
    moderador: 'moderacion'
};

class AuthSystem {
    constructor() {
        this.token = localStorage.getItem('upa_token');
        this.user = JSON.parse(localStorage.getItem('user_data') || '{}');
        this.sessionWatcher = null;
        this.init();
    }

    init() {
        console.log('🔐 Sistema de Autenticación Iniciado');
        this.checkSession();
        this.setupEventListeners();
        this.setupRouteGuards();
        this.registerVisibilityListeners();
        this.applyRouteVisibility();
    }

    // ==================== MANEJO DE SESIÓN ====================
    async checkSession() {
        const currentRoute = this.getCurrentRoute();
        const routeKey = this.getRouteKey(currentRoute);
        const isPublic = this.isPublicRoute(routeKey);

        if (!this.token) {
            this.applyRouteVisibility();
            if (!isPublic) {
                this.redirectToLogin({ message: 'Inicia sesión para continuar.' });
            }
            return;
        }

        try {
            await this.validateToken();
        } catch (error) {
            console.error('Fallo al validar sesión:', error);
            return;
        }

        const isPublicAfterValidation = this.isPublicRoute(routeKey);
        const isLandingRoute = !routeKey || routeKey === 'index' || routeKey === 'index.html';
        const hasAccess = this.hasAccessToRoute(routeKey);
        
        // Si la ruta es pública pero el usuario tiene acceso, permitir el acceso
        if (isPublicAfterValidation && !isLandingRoute && !hasAccess) {
            this.redirectToDefaultRoute();
            return;
        }

        if (!hasAccess) {
            this.handleForbiddenAccess(routeKey);
            return;
        }

        this.ensureSessionWatcher();
        this.applyRouteVisibility();
    }

    async validateToken() {
        try {
            const response = await API.me();
            this.user = response.data.user || response.data;
            this.user = typeof normalizarDatosUsuario === 'function' ? normalizarDatosUsuario(this.user) : this.user;

            localStorage.setItem('user_data', JSON.stringify(this.user));
            this.updateUI();
        } catch (error) {
            console.error('Token inválido:', error);
            this.logout();
            throw error;
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
                this.user = typeof normalizarDatosUsuario === 'function' ? normalizarDatosUsuario(this.user) : this.user;
                
                // Guardar en localStorage
                localStorage.setItem('upa_token', this.token);
                localStorage.setItem('user_data', JSON.stringify(this.user));
                
                if (rememberMe) {
                    localStorage.setItem('remember_me', 'true');
                }
                
                mostrarNotificacion('success', `¡Bienvenido ${this.user.nombre}!`);
                
                // Redirigir según el rol inmediatamente
                this.redirectToDefaultRoute();
                
            } else {
                throw new Error(response.message || 'Error en el login');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            
            // Mensaje más claro para errores de conexión
            let mensajeError = error.message || 'Credenciales incorrectas';
            if (error.isConnectionError || error.message?.includes('conectar al servidor')) {
                mensajeError = 'No se puede conectar al servidor. Verifica que el servidor Laravel esté corriendo (php artisan serve)';
            }
            
            mostrarNotificacion('error', mensajeError);
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
                    window.location.href = this.buildUrl('index');
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
            if (this.sessionWatcher) {
                clearInterval(this.sessionWatcher);
                this.sessionWatcher = null;
            }
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
    redirectToLogin({ message } = {}) {
        if (message && typeof mostrarNotificacion === 'function') {
            mostrarNotificacion('info', message);
        }
        const destino = this.buildUrl('index');
        const actual = window.location.href;

        if (actual.replace(/\/+$/, '') !== destino.replace(/\/+$/, '')) {
            window.location.href = destino;
        }
    }

    redirectToDashboard() {
        this.redirectToDefaultRoute();
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

        this.updateRoleVisibility();
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

        // Logout buttons (delegado para elementos dinámicos)
        document.addEventListener('click', async (event) => {
            const logoutTrigger = event.target.closest('[data-action="logout"]');
            if (logoutTrigger) {
                event.preventDefault();
                
                const confirmado = await (window.mostrarConfirmacionToasty
                    ? window.mostrarConfirmacionToasty({
                        mensaje: '¿Estás seguro de que deseas cerrar sesión?',
                        tipo: 'warning',
                        textoConfirmar: 'Cerrar sesión',
                        textoCancelar: 'Cancelar'
                    })
                    : Promise.resolve(confirm('¿Estás seguro de que deseas cerrar sesión?')));
                
                if (confirmado) {
                    await this.logout();
                }
            }
        });
    }

    registerVisibilityListeners() {
        window.addEventListener('focus', () => this.checkSession());
        window.addEventListener('pageshow', () => this.checkSession());
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkSession();
            }
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

    getCurrentRoute() {
        const path = decodeURIComponent(window.location.pathname);
        const base = FRONTEND_BASE_PATH;
        let route = path.startsWith(base) ? path.slice(base.length) : path;
        route = route.replace(/^\/+/, '');
        return route;
    }

    isPublicRoute(route) {
        if (!route) return true;
        const cleanRoute = route.replace(/\/+$/, '');
        return PUBLIC_ROUTES.has(cleanRoute) || PUBLIC_ROUTES.has(`${cleanRoute}.html`);
    }

    buildUrl(route = '') {
        if (typeof window.buildFrontendUrl === 'function') {
            return window.buildFrontendUrl(route);
        }
        const cleanRoute = String(route || '').replace(/^\//, '');
        const base = FRONTEND_BASE_PATH.endsWith('/') ? FRONTEND_BASE_PATH : `${FRONTEND_BASE_PATH}/`;
        return `${window.location.origin}${base}${cleanRoute}`;
    }

    getRouteKey(route = '') {
        if (!route) return '';
        const clean = route.split('?')[0].replace(/\/+$/, '').toLowerCase();
        if (!clean) return '';
        return clean.endsWith('.html') ? clean.slice(0, -5) : clean;
    }

    hasAccessToRoute(routeKey = '') {
        if (!routeKey) return true;
        const allowedRoles = ROUTE_PERMISSIONS[routeKey];
        if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
            return true;
        }
        const rol = this.user?.rol;
        return !!rol && allowedRoles.includes(rol);
    }

    handleForbiddenAccess(routeKey, { redirect = true } = {}) {
        console.warn(`Acceso denegado a la ruta ${routeKey} para el rol ${this.user?.rol}`);
        mostrarNotificacionToasty('warning', 'No tienes permisos para acceder a esta sección.');
        if (redirect) {
            this.redirectToDefaultRoute();
        }
    }

    redirectToDefaultRoute() {
        const rol = this.user?.rol || 'estudiante';
        const defaultRoute = ROLE_DEFAULT_ROUTES[rol] || 'dashboard';
        window.location.href = this.buildUrl(defaultRoute);
    }

    ensureSessionWatcher() {
        if (this.sessionWatcher) return;
        this.sessionWatcher = setInterval(() => {
            if (this.token) {
                this.validateToken().catch(() => {});
            }
        }, 5 * 60 * 1000); // cada 5 minutos
    }

    setupRouteGuards() {
        document.addEventListener('click', (event) => {
            const link = event.target.closest('a[data-route]');
            if (!link) return;

            const targetRoute = (link.getAttribute('data-route') || '').trim();
            if (!targetRoute) return;

            event.preventDefault();

            const routeKey = this.getRouteKeyFromRoute(targetRoute);

            if (!this.token) {
                if (this.isPublicRoute(routeKey)) {
                    window.location.href = this.buildUrl(targetRoute);
                } else {
                    this.redirectToLogin({ message: 'Inicia sesión para continuar.' });
                }
                return;
            }

            if (!this.hasAccessToRoute(routeKey)) {
                this.handleForbiddenAccess(routeKey, { redirect: false });
                return;
            }

            window.location.href = this.buildUrl(targetRoute);
        });
    }

    getRouteKeyFromRoute(route = '') {
        if (!route) return '';
        const cleanRoute = route.replace(/^\//, '');
        return this.getRouteKey(cleanRoute);
    }

    applyRouteVisibility() {
        const links = document.querySelectorAll('a[data-route]');
        links.forEach(link => {
            const route = (link.getAttribute('data-route') || '').trim();
            if (!route) return;

            const routeKey = this.getRouteKeyFromRoute(route);
            if (!routeKey) return;

            const allowedRoles = ROUTE_PERMISSIONS[routeKey];
            if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
                this.toggleRouteElement(link, true);
                return;
            }

            const currentRole = this.user?.rol;
            const permitted = currentRole && allowedRoles.includes(currentRole);
            const requiresAuth = !this.isPublicRoute(routeKey);

            if (!this.token && requiresAuth) {
                this.toggleRouteElement(link, false);
            } else {
                this.toggleRouteElement(link, Boolean(permitted));
            }
        });
    }

    toggleRouteElement(link, shouldShow) {
        const wrapper = link.closest('[data-route-wrapper]') || link.closest('li') || link;
        if (wrapper) {
            wrapper.classList.toggle('d-none', !shouldShow);
            wrapper.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
        }

        if (shouldShow) {
            link.classList.remove('disabled-route');
            link.removeAttribute('aria-disabled');
            if (link.getAttribute('tabindex') === '-1') {
                link.removeAttribute('tabindex');
            }
        } else {
            link.classList.add('disabled-route');
            link.setAttribute('aria-disabled', 'true');
            link.setAttribute('tabindex', '-1');
        }
    }

    updateRoleVisibility() {
        const rol = this.user?.rol;
        const visibleFor = document.querySelectorAll('[data-visible-for]');
        visibleFor.forEach(element => {
            const allowed = element.getAttribute('data-visible-for')
                .split(',')
                .map(r => r.trim())
                .filter(Boolean);
            const shouldShow = !allowed.length || (rol && allowed.includes(rol));
            element.classList.toggle('d-none', !shouldShow);
            element.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
        });

        const hiddenFor = document.querySelectorAll('[data-hidden-for]');
        hiddenFor.forEach(element => {
            const disallowed = element.getAttribute('data-hidden-for')
                .split(',')
                .map(r => r.trim())
                .filter(Boolean);
            const shouldHide = rol && disallowed.includes(rol);
            element.classList.toggle('d-none', shouldHide);
            element.setAttribute('aria-hidden', shouldHide ? 'true' : 'false');
        });

        this.applyRouteVisibility();
    }
}

// Inicializar sistema de autenticación
const auth = new AuthSystem();

// Exportar para uso global
window.auth = auth;