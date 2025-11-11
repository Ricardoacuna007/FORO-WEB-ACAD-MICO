/**
 * API.JS - Comunicación con Backend Laravel
 * =========================================
 * Conexión real con el backend Laravel
 */

// ===================================
// CONFIGURACIÓN
// ===================================
const API_BASE_URL = 'http://localhost:8000/api';

// ===================================
// FUNCIONES DE AUTENTICACIÓN
// ===================================

/**
 * Función genérica para peticiones HTTP
 */
async function fetchAPI(endpoint, options = {}) {
    const token = localStorage.getItem('upa_token');
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        },
        ...options
    };
    
    try {
        console.log(`🔄 API Call: ${endpoint}`, config);
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || `Error ${response.status}`);
        }
        
        console.log(`✅ API Success: ${endpoint}`, data);
        return data;
        
    } catch (error) {
        console.error(`❌ API Error: ${endpoint}`, error);
        
        // Si es error de autenticación, redirigir al login
        if (error.message.includes('401') || error.message.includes('Authentication')) {
            localStorage.removeItem('upa_token');
            localStorage.removeItem('user_data');
            window.location.href = 'index.html';
        }
        
        throw error;
    }
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

// ===================================
// API PÚBLICA
// ===================================
const API = {
    /**
     * AUTENTICACIÓN
     */
    
    /**
     * Iniciar sesión
     */
    login: async (email, password) => {
        // Validar email institucional
        if (!esEmailInstitucional(email)) {
            throw new Error('Debes usar tu correo institucional (@upatlacomulco.edu.mx)');
        }
        
        return await fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },
    
    /**
     * Registrar nuevo usuario
     */
    register: async (userData) => {
        // Validar email institucional
        if (!esEmailInstitucional(userData.email)) {
            throw new Error('Debes usar tu correo institucional (@upatlacomulco.edu.mx)');
        }
        
        // Validar contraseña
        const validacionPassword = validarPassword(userData.password);
        if (!validacionPassword.valido) {
            throw new Error(validacionPassword.mensaje);
        }
        
        return await fetchAPI('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },
    
    /**
     * Cerrar sesión
     */
    logout: async () => {
        return await fetchAPI('/auth/logout', {
            method: 'POST'
        });
    },
    
    /**
     * Obtener usuario actual
     */
    me: async () => {
        return await fetchAPI('/auth/me');
    },
    
    /**
     * Recuperar contraseña (si está implementado en el futuro)
     */
    recuperarPassword: async (email) => {
        if (!esEmailInstitucional(email)) {
            throw new Error('Debes usar tu correo institucional (@upatlacomulco.edu.mx)');
        }
        
        // Nota: Esta ruta puede no existir aún en tu backend
        return await fetchAPI('/auth/recuperar', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    },
    
    /**
     * PUBLICACIONES (Para implementar después)
     */
    getPosts: async (materiaId) => {
        return await fetchAPI(`/publicaciones?materia_id=${materiaId}`);
    },
    
    createPost: async (postData) => {
        return await fetchAPI('/publicaciones', {
            method: 'POST',
            body: JSON.stringify(postData)
        });
    },
    
    /**
     * COMENTARIOS (Para implementar después)
     */
    getComments: async (postId) => {
        return await fetchAPI(`/publicaciones/${postId}/comentarios`);
    },
    
    createComment: async (commentData) => {
        return await fetchAPI('/comentarios', {
            method: 'POST',
            body: JSON.stringify(commentData)
        });
    }
};

// ===================================
// INICIALIZACIÓN
// ===================================

/**
 * Inicializar API
 */
function initAPI() {
    console.log('🚀 API Foro Académico UPA - Modo PRODUCCIÓN');
    console.log('📡 Base URL:', API_BASE_URL);
    console.log('🔐 Mock Data: DESACTIVADO');
    
    // Verificar si hay token al cargar
    const token = localStorage.getItem('upa_token');
    if (token) {
        console.log('🔑 Token encontrado:', token.substring(0, 20) + '...');
    } else {
        console.log('🔒 No hay sesión activa');
    }
}

// ===================================
// UTILIDADES DE NOTIFICACIÓN
// ===================================

/**
 * Muestra una notificación toast
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

// Inicializar API cuando se carga el script
initAPI();

// Exportar para uso global
window.API = API;
window.mostrarNotificacion = mostrarNotificacion;