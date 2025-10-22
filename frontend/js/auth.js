/**
 * AUTH.JS - Manejo de autenticación y sesiones
 * ==============================================
 * Este archivo maneja toda la lógica de autenticación del frontend
 */

// ===================================
// MANEJO DE LOGIN
// ===================================

/**
 * Maneja el envío del formulario de login
 */
/*async function handleLogin(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const rememberMe = document.getElementById('rememberMe')?.checked || false;
    const loginBtn = document.getElementById('loginBtn');
    const errorAlert = document.getElementById('loginError');
    
    // Limpiar errores previos
    errorAlert?.classList.add('d-none');
    emailInput.classList.remove('is-invalid');
    passwordInput.classList.remove('is-invalid');
    
    // Validaciones básicas
    if (!emailInput.value || !passwordInput.value) {
        if (!emailInput.value) emailInput.classList.add('is-invalid');
        if (!passwordInput.value) passwordInput.classList.add('is-invalid');
        return;
    }
    
    // Deshabilitar botón y mostrar loading
    const btnTextOriginal = loginBtn.innerHTML;
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Iniciando sesión...';
    
    try {
        // Llamar a la API
        const response = await API.login(emailInput.value, passwordInput.value);
        
        // Guardar token y datos del usuario
        localStorage.setItem('upa_token', response.token);
        localStorage.setItem('user_data', JSON.stringify(response.user));
        
        // Si marcó "Recordarme", guardar en localStorage adicional
        if (rememberMe) {
            localStorage.setItem('remember_user', emailInput.value);
        }
        
        // Mostrar notificación de éxito
        mostrarNotificacion('success', `¡Bienvenido, ${response.user.nombre}!`);
        
        // Redirigir al dashboard después de 1 segundo
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        // Mostrar error
        if (errorAlert) {
            errorAlert.textContent = error.message;
            errorAlert.classList.remove('d-none');
        } else {
            mostrarNotificacion('error', error.message);
        }
        
        // Rehabilitar botón
        loginBtn.disabled = false;
        loginBtn.innerHTML = btnTextOriginal;
    }
}

// ===================================
// MANEJO DE REGISTRO
// ===================================

/**
 * Maneja el envío del formulario de registro
 */
async function handleRegistro(e) {
    e.preventDefault();
    
    const form = document.getElementById('registroForm');
    const registroBtn = document.getElementById('registroBtn');
    const errorAlert = document.getElementById('errorAlert');
    const successAlert = document.getElementById('successAlert');
    
    // Validar formulario con Bootstrap
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }
    
    // Obtener datos del formulario
    const userData = {
        nombre: document.getElementById('nombre').value,
        apellidos: document.getElementById('apellidos').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        rol: document.getElementById('rol').value
    };
    
    // Validar correo institucional
    if (!userData.email.endsWith('@upatlacomulco.edu.mx')) {
        mostrarError('Debes usar tu correo institucional (@upatlacomulco.edu.mx)');
        document.getElementById('email').classList.add('is-invalid');
        return;
    }
    
    // Validar que las contraseñas coincidan
    const confirmPassword = document.getElementById('confirmPassword').value;
    if (userData.password !== confirmPassword) {
        mostrarError('Las contraseñas no coinciden');
        document.getElementById('confirmPassword').classList.add('is-invalid');
        return;
    }
    
    // Agregar campos específicos según el rol
    if (userData.rol === 'estudiante') {
        userData.matricula = document.getElementById('matricula').value;
        userData.carrera = document.getElementById('carrera').value;
        userData.cuatrimestre = document.getElementById('cuatrimestre').value;
        userData.turno = document.getElementById('turno').value;
    } else if (userData.rol === 'profesor') {
        userData.numEmpleado = document.getElementById('numEmpleado').value;
        userData.especialidad = document.getElementById('especialidad').value;
    }
    
    // Deshabilitar botón y mostrar loading
    const btnTextOriginal = registroBtn.innerHTML;
    registroBtn.disabled = true;
    registroBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Creando cuenta...';
    
    // Ocultar alertas previas
    errorAlert.classList.add('d-none');
    successAlert.classList.add('d-none');
    
    try {
        // Llamar a la API
        const response = await API.register(userData);
        
        // Mostrar mensaje de éxito
        document.getElementById('successMessage').textContent = response.message;
        successAlert.classList.remove('d-none');
        
        // Scroll al inicio
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
        
    } catch (error) {
        mostrarError(error.message);
        
        // Rehabilitar botón
        registroBtn.disabled = false;
        registroBtn.innerHTML = btnTextOriginal;
    }
    
    function mostrarError(mensaje) {
        document.getElementById('errorMessage').textContent = mensaje;
        errorAlert.classList.remove('d-none');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ===================================
// TOGGLE PASSWORD VISIBILITY
// ===================================

/**
 * Alterna la visibilidad de la contraseña
 */
function setupPasswordToggles() {
    // Toggle para el modal de login
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            togglePasswordVisibility('loginPassword', this);
        });
    }
}

/**
 * Función auxiliar para toggle de password
 */
function togglePasswordVisibility(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// ===================================
// VERIFICACIÓN DE SESIÓN
// ===================================

/**
 * Verifica si hay una sesión activa
 */
function checkSession() {
    const token = localStorage.getItem('upa_token');
    const currentPage = window.location.pathname;
    const fileName = currentPage.substring(currentPage.lastIndexOf('/') + 1);
    
    // Páginas públicas (no requieren autenticación)
    const paginasPublicas = ['index.html', 'registro.html', 'recuperar-contrasena.html', ''];
    
    // Páginas protegidas (requieren autenticación)
    const paginasProtegidas = ['dashboard.html', 'materia.html', 'post.html', 'perfil.html', 'calendario.html', 'notificaciones.html'];
    
    // Si está en página pública y tiene sesión, redirigir a dashboard
    if (token && paginasPublicas.includes(fileName)) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Si está en página protegida sin sesión, redirigir a login
    if (!token && paginasProtegidas.includes(fileName)) {
        localStorage.removeItem('user_data');
        window.location.href = 'index.html';
        return;
    }
}

/**
 * Cierra la sesión del usuario
 */
function cerrarSesion() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        localStorage.removeItem('upa_token');
        localStorage.removeItem('user_data');
        mostrarNotificacion('info', 'Sesión cerrada exitosamente');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

/**
 * Obtiene los datos del usuario actual
 */
function getUsuarioActual() {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
}

/**
 * Verifica si el usuario tiene un rol específico
 */
function tieneRol(rol) {
    const usuario = getUsuarioActual();
    return usuario && usuario.rol === rol;
}

// ===================================
// INICIALIZACIÓN
// ===================================

/**
 * Inicializa los event listeners cuando el DOM esté listo
 */
document.addEventListener('DOMContentLoaded', function() {
    // Verificar sesión en todas las páginas
    checkSession();
    
    // Setup para toggles de password
    setupPasswordToggles();
    
    // Event listener para formulario de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Event listener para formulario de registro
    const registroForm = document.getElementById('registroForm');
    if (registroForm) {
        registroForm.addEventListener('submit', handleRegistro);
    }
    
    // Pre-llenar email si está guardado en "Recordarme"
    const rememberedUser = localStorage.getItem('remember_user');
    const loginEmail = document.getElementById('loginEmail');
    if (rememberedUser && loginEmail) {
        loginEmail.value = rememberedUser;
        const rememberCheckbox = document.getElementById('rememberMe');
        if (rememberCheckbox) {
            rememberCheckbox.checked = true;
        }
    }
});

// Exportar funciones útiles
window.cerrarSesion = cerrarSesion;
window.getUsuarioActual = getUsuarioActual;
window.tieneRol = tieneRol;*/