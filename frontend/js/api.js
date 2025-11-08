/**
 * API.JS - Manejo de comunicación con el backend
 * ==============================================
 * Este archivo maneja todas las peticiones HTTP al backend.
 * Por ahora usa MOCK DATA (datos simulados) hasta que el backend esté listo.
 * 
 * Cuando el backend esté disponible, solo necesitas:
 * 1. Cambiar USE_MOCK_DATA a false
 * 2. Actualizar API_BASE_URL con la URL real del backend
 */

// ===================================
// CONFIGURACIÓN
// ===================================
const USE_MOCK_DATA = true; // Cambiar a false cuando el backend esté listo
const API_BASE_URL = 'http://localhost:8000/api'

// Tiempo de simulación de peticiones (milisegundos)
const MOCK_DELAY = 800;

// ===================================
// DATOS MOCK (SIMULADOS)
// ===================================
const MOCK_DATA = {
    usuarios: [
        {
            id: 1,
            nombre: 'Juan',
            apellidos: 'Pérez García',
            email: 'juan.perez@upatlacomulco.edu.mx',
            password: 'hash_de_Password123', // En producción estará hasheada
            rol: 'estudiante',
            matricula: '2021210001',
            carrera: 'ISC',
            cuatrimestre: 7,
            turno: 'matutino',
            avatar: null,
            created_at: '2025-01-15'
        },
        {
            id: 2,
            nombre: 'María',
            apellidos: 'García López',
            email: 'maria.garcia@upatlacomulco.edu.mx',
            password: 'hash_de_Password456',
            rol: 'estudiante',
            matricula: '2021210002',
            carrera: 'ISC',
            cuatrimestre: 7,
            turno: 'vespertino',
            avatar: null,
            created_at: '2025-01-16'
        },
        {
            id: 3,
            nombre: 'Roberto',
            apellidos: 'Sánchez Martínez',
            email: 'roberto.sanchez@upatlacomulco.edu.mx',
            password: 'hash_de_Profesor789',
            rol: 'profesor',
            num_empleado: 'EMP001',
            especialidad: 'Bases de Datos',
            avatar: null,
            created_at: '2024-08-01'
        }
    ]
};

// ===================================
// FUNCIONES AUXILIARES
// ===================================

/**
 * Simula un delay de red
 */
function mockDelay() {
    return new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
}

/**
 * Genera un token JWT simulado
 */
function generateMockToken(userId) {
    return `mock_token_${userId}_${Date.now()}`;
}

/**
 * Valida formato de email institucional
 */
function esEmailInstitucional(email) {
    return email.endsWith('@upatlacomulco.edu.mx');
}

/**
 * Valida fortaleza de contraseña
 */
function validarPassword(password) {
    const tieneMinimo8 = password.length >= 8;
    const tieneMayuscula = /[A-Z]/.test(password);
    const tieneNumero = /[0-9]/.test(password);
    
    return {
        valido: tieneMinimo8 && tieneMayuscula && tieneNumero,
        mensaje: !tieneMinimo8 ? 'La contraseña debe tener al menos 8 caracteres' :
                 !tieneMayuscula ? 'La contraseña debe contener al menos una mayúscula' :
                 !tieneNumero ? 'La contraseña debe contener al menos un número' :
                 'Contraseña válida'
    };
}

/**
 * Función genérica para peticiones HTTP
 */
async function fetchAPI(endpoint, options = {}) {
    // Si estamos usando MOCK DATA
    if (USE_MOCK_DATA) {
        return handleMockRequest(endpoint, options);
    }
    
    // Peticiones reales al backend
    const token = localStorage.getItem('upa_token');
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        },
        ...options
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error en la petición');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

/**
 * Maneja peticiones MOCK (simuladas)
 */
async function handleMockRequest(endpoint, options) {
    await mockDelay();
    
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : null;
    
    console.log(`[MOCK API] ${method} ${endpoint}`, body);
    
    // Simular diferentes endpoints
    switch (true) {
        case endpoint === '/auth/login':
            return mockLogin(body);
        
        case endpoint === '/auth/register':
            return mockRegister(body);
        
        case endpoint === '/auth/recuperar-password':
            return mockRecuperarPassword(body);
        
        case endpoint === '/auth/verificar-email':
            return mockVerificarEmail(body);
        
        default:
            throw new Error('Endpoint no implementado en MOCK');
    }
}

// ===================================
// FUNCIONES MOCK PARA AUTENTICACIÓN
// ===================================

/**
 * Simula login
 */
function mockLogin(credentials) {
    const { email, password } = credentials;
    
    // Validar email institucional
    if (!esEmailInstitucional(email)) {
        throw new Error('Debes usar tu correo institucional (@upatlacomulco.edu.mx)');
    }
    
    // Buscar usuario en datos mock
    const usuario = MOCK_DATA.usuarios.find(u => u.email === email);
    
    if (!usuario) {
        throw new Error('Usuario no encontrado. Verifica tu correo o regístrate.');
    }
    
    // En producción, aquí se verificaría el hash de la contraseña
    // Por ahora, aceptamos cualquier contraseña para testing
    if (password.length < 8) {
        throw new Error('Contraseña incorrecta');
    }
    
    // Generar token
    const token = generateMockToken(usuario.id);
    
    // Retornar datos del usuario sin la contraseña
    const { password: _, ...usuarioSinPassword } = usuario;
    
    return {
        success: true,
        message: 'Inicio de sesión exitoso',
        token: token,
        user: usuarioSinPassword
    };
}

/**
 * Simula registro de nuevo usuario
 */
function mockRegister(userData) {
    const { nombre, apellidos, email, password, rol } = userData;
    
    // Validaciones
    if (!esEmailInstitucional(email)) {
        throw new Error('Debes usar tu correo institucional (@upatlacomulco.edu.mx)');
    }
    
    // Verificar si el usuario ya existe
    const usuarioExistente = MOCK_DATA.usuarios.find(u => u.email === email);
    if (usuarioExistente) {
        throw new Error('Este correo ya está registrado. Intenta iniciar sesión.');
    }
    
    // Validar contraseña
    const validacionPassword = validarPassword(password);
    if (!validacionPassword.valido) {
        throw new Error(validacionPassword.mensaje);
    }
    
    // Crear nuevo usuario
    const nuevoUsuario = {
        id: MOCK_DATA.usuarios.length + 1,
        nombre,
        apellidos,
        email,
        password: `hash_de_${password}`, // Simular hash
        rol,
        ...(rol === 'estudiante' && {
            matricula: userData.matricula,
            carrera: userData.carrera,
            cuatrimestre: userData.cuatrimestre,
            turno: userData.turno
        }),
        ...(rol === 'profesor' && {
            num_empleado: userData.numEmpleado,
            especialidad: userData.especialidad
        }),
        avatar: null,
        created_at: new Date().toISOString().split('T')[0]
    };
    
    // Agregar a los datos mock (solo en memoria, se perderá al recargar)
    MOCK_DATA.usuarios.push(nuevoUsuario);
    
    console.log('[MOCK] Usuario registrado:', nuevoUsuario);
    
    return {
        success: true,
        message: 'Registro exitoso. Por favor verifica tu correo electrónico.',
        user_id: nuevoUsuario.id
    };
}

/**
 * Simula recuperación de contraseña
 */
function mockRecuperarPassword(data) {
    const { email } = data;
    
    if (!esEmailInstitucional(email)) {
        throw new Error('Debes usar tu correo institucional');
    }
    
    const usuario = MOCK_DATA.usuarios.find(u => u.email === email);
    
    if (!usuario) {
        // Por seguridad, no revelar si el email existe o no
        // Siempre retornar éxito
    }
    
    console.log(`[MOCK] Correo de recuperación enviado a: ${email}`);
    
    return {
        success: true,
        message: 'Si el correo está registrado, recibirás instrucciones para recuperar tu contraseña.'
    };
}

/**
 * Simula verificación de email
 */
function mockVerificarEmail(data) {
    const { token } = data;
    
    // Simular verificación exitosa
    return {
        success: true,
        message: 'Correo verificado exitosamente. Ya puedes iniciar sesión.'
    };
}

// ===================================
// API PÚBLICA
// ===================================
const API = {
    /**
     * AUTENTICACIÓN
     */
    
    /**
     * Iniciar sesión
     * @param {string} email - Correo institucional
     * @param {string} password - Contraseña
     * @returns {Promise<Object>} Token y datos del usuario
     */
    login: async (email, password) => {
        return await fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },
    
    /**
     * Registrar nuevo usuario
     * @param {Object} userData - Datos del usuario
     * @returns {Promise<Object>} Confirmación de registro
     */
    register: async (userData) => {
        return await fetchAPI('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },
    
    /**
     * Recuperar contraseña
     * @param {string} email - Correo institucional
     * @returns {Promise<Object>} Confirmación de envío
     */
    recuperarPassword: async (email) => {
        return await fetchAPI('/auth/recuperar-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    },
    
    /**
     * Verificar email con token
     * @param {string} token - Token de verificación
     * @returns {Promise<Object>} Confirmación de verificación
     */
    verificarEmail: async (token) => {
        return await fetchAPI('/auth/verificar-email', {
            method: 'POST',
            body: JSON.stringify({ token })
        });
    },
    
    /**
     * PUBLICACIONES (Para implementar en Sprint 2)
     */
    
    getPosts: async (materiaId) => {
        // TODO: Implementar cuando el backend esté listo
        console.log('[API] getPosts() - Pendiente de implementación');
        return [];
    },
    
    createPost: async (postData) => {
        // TODO: Implementar cuando el backend esté listo
        console.log('[API] createPost() - Pendiente de implementación');
        return { success: true };
    },
    
    /**
     * COMENTARIOS (Para implementar en Sprint 3)
     */
    
    getComments: async (postId) => {
        // TODO: Implementar cuando el backend esté listo
        console.log('[API] getComments() - Pendiente de implementación');
        return [];
    },
    
    createComment: async (commentData) => {
        // TODO: Implementar cuando el backend esté listo
        console.log('[API] createComment() - Pendiente de implementación');
        return { success: true };
    }
};

// ===================================
// UTILIDADES DE NOTIFICACIÓN
// ===================================

/**
 * Muestra una notificación toast
 * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
 * @param {string} message - Mensaje a mostrar
 */
function mostrarNotificacion(type, message) {
    // Crear elemento de alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
    alertDiv.setAttribute('role', 'alert');
    
    // Icono según el tipo
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    alertDiv.innerHTML = `
        <i class="fas ${icons[type]} me-2"></i>
        <strong>${message}</strong>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 300);
    }, 5000);
}

// Exportar funciones útiles
window.API = API;
window.mostrarNotificacion = mostrarNotificacion;