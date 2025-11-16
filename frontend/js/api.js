/**
 * API.JS - Comunicación con Backend Laravel
 * =========================================
 * Conexión real con el backend Laravel
 */

// ===================================
// CONFIGURACIÓN
// ===================================
// Detectar si estamos en desarrollo o producción
const API_BASE_URL = (() => {
    // Si estamos en localhost con puerto específico, usar ese puerto
    if (window.location.hostname === 'localhost' && window.location.port === '8000') {
        return 'http://localhost:8000/api';
    }
    // En producción, usar ruta relativa
    return '/api';
})();

// Detectar ruta base del frontend (soporte para espacios codificados)
const FRONTEND_BASE_PATH = (() => {
    const path = decodeURIComponent(window.location.pathname);
    const match = path.match(/^(.*\/frontend\/)/i);

    if (match && match[1]) {
        const base = match[1].endsWith('/') ? match[1] : `${match[1]}/`;
        try {
            localStorage.setItem('upa_frontend_base', base);
        } catch (_) {
            // Ignorar errores de almacenamiento
        }
        return base;
    }

    try {
        const stored = localStorage.getItem('upa_frontend_base');
        if (stored) {
            return stored.endsWith('/') ? stored : `${stored}/`;
        }
    } catch (_) {
        // Ignorar lectura fallida
    }

    return '/';
})();

const API_CACHE = new Map();

function getCacheKey(resource, params = {}) {
    if (!params || Object.keys(params).length === 0) {
        return resource;
    }
    const normalized = Object.keys(params)
        .sort()
        .reduce((acc, key) => {
            acc[key] = params[key];
            return acc;
        }, {});
    return `${resource}:${JSON.stringify(normalized)}`;
}

function clearCache(prefixes) {
    if (!prefixes) {
        API_CACHE.clear();
        return;
    }
    const list = Array.isArray(prefixes) ? prefixes : [prefixes];
    for (const key of API_CACHE.keys()) {
        if (list.some((prefix) => key.startsWith(prefix))) {
            API_CACHE.delete(key);
        }
    }
}

async function useCache(key, fetcher, ttl = 60000) {
    const now = Date.now();
    const entry = API_CACHE.get(key);

    if (entry) {
        if (entry.data && now < entry.expiry) {
            return entry.data;
        }
        if (entry.promise) {
            return entry.promise;
        }
    }

    const promise = (async () => {
        try {
            const data = await fetcher();
            API_CACHE.set(key, {
                data,
                expiry: now + ttl,
            });
            
            // Limpiar caché antiguo si excede 100 entradas
            if (API_CACHE.size > 100) {
                const entriesToDelete = [];
                for (const [k, v] of API_CACHE.entries()) {
                    if (v.expiry && now > v.expiry) {
                        entriesToDelete.push(k);
                    }
                }
                entriesToDelete.forEach(k => API_CACHE.delete(k));
                
                // Si aún hay muchas entradas, eliminar las más antiguas
                if (API_CACHE.size > 100) {
                    const sorted = Array.from(API_CACHE.entries())
                        .sort((a, b) => (a[1].expiry || 0) - (b[1].expiry || 0));
                    const toDelete = sorted.slice(0, 20).map(([k]) => k);
                    toDelete.forEach(k => API_CACHE.delete(k));
                }
            }
            
            return data;
        } catch (error) {
            API_CACHE.delete(key);
            throw error;
        }
    })();

    API_CACHE.set(key, {
        promise,
        expiry: now + ttl,
    });

    return promise;
}

function buildFrontendUrl(route = '') {
    const cleanRoute = String(route || '').replace(/^\//, '');
    const base = (window.__FRONTEND_BASE_PATH && window.__FRONTEND_BASE_PATH !== '/')
        ? window.__FRONTEND_BASE_PATH
        : FRONTEND_BASE_PATH;
    return `${window.location.origin}${base}${cleanRoute}`;
}

// Exponer para reutilizar en otros scripts
window.__FRONTEND_BASE_PATH = FRONTEND_BASE_PATH;
window.buildFrontendUrl = buildFrontendUrl;

// ===================================
// FUNCIONES DE AUTENTICACIÓN
// ===================================

/**
 * Función genérica para peticiones HTTP
 */
/**
 * Sistema centralizado de manejo de errores
 */
const ErrorHandler = {
    errors: [],
    maxErrors: 50,
    
    log(error, context = {}) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            message: error.message || 'Error desconocido',
            stack: error.stack,
            context: {
                url: context.url || window.location.href,
                endpoint: context.endpoint,
                status: context.status,
                ...context
            }
        };
        
        this.errors.push(errorEntry);
        
        // Limitar el tamaño del array de errores
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }
        
        // Enviar a consola solo en modo debug
        const debug = Boolean(window.__API_DEBUG__ || window.APP_CONFIG?.debug);
        if (debug) {
            console.error('🔴 Error registrado:', errorEntry);
        }
    },
    
    getErrors() {
        return [...this.errors];
    },
    
    clearErrors() {
        this.errors = [];
    },
    
    getLastError() {
        return this.errors.length > 0 ? this.errors[this.errors.length - 1] : null;
    },
    
    formatForDiagnostics() {
        return this.errors.map(err => ({
            time: err.timestamp,
            message: err.message,
            context: err.context
        }));
    }
};

window.ErrorHandler = ErrorHandler;

/**
 * Función genérica para peticiones HTTP
 */
async function fetchAPI(endpoint, options = {}) {
    const token = localStorage.getItem('upa_token');
    
    // Construir headers base
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };
    
    // Agregar token si existe
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Fusionar headers de options (options tiene prioridad)
    if (options.headers) {
        Object.assign(headers, options.headers);
    }
    
    const config = {
        method: options.method || 'GET',
        headers: headers,
        credentials: 'same-origin',
        ...options
    };
    
    // Eliminar headers de options para evitar duplicados
    delete config.headers.headers;
    
    const debug = Boolean(window.__API_DEBUG__ || window.APP_CONFIG?.debug);

    try {
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        
        // Obtener el texto crudo primero para debug
        const text = await response.text();
        if (debug) {
            console.log('🔄 API Call:', endpoint, config);
            console.log('📥 Respuesta cruda (primeros 400 chars):', text.substring(0, 400));
        }
        
        // Intentar parsear como JSON
        let data;
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            const errorMsg = `El servidor no devolvió JSON válido. Status: ${response.status}.`;
            ErrorHandler.log(parseError, {
                endpoint,
                status: response.status,
                url: `${API_BASE_URL}${endpoint}`,
                responseText: text.substring(0, 500)
            });
            if (debug) {
                console.error('❌ Error parseando JSON:', parseError);
                console.error('📄 Texto completo recibido:', text);
            }
            throw new Error(errorMsg);
        }
        
        if (!response.ok) {
            const errorMessage = data.message || `Error ${response.status}`;
            const detalle = data.error ? ` ${data.error}` : '';
            const error = new Error(`${errorMessage}${detalle ? `: ${detalle}` : ''}`.trim());
            error.status = response.status;
            error.payload = data;
            ErrorHandler.log(error, {
                endpoint,
                status: response.status,
                url: `${API_BASE_URL}${endpoint}`,
                payload: data
            });
            throw error;
        }
        
        if (debug) {
            console.log(`✅ API Success: ${endpoint}`, data);
        }
        return data;
        
    } catch (error) {
        // Detectar errores de conexión
        const isConnectionError = 
            error.message.includes('Failed to fetch') ||
            error.message.includes('ERR_CONNECTION_REFUSED') ||
            error.message.includes('NetworkError') ||
            error.name === 'TypeError';
        
        if (isConnectionError) {
            const connectionError = new Error(
                'No se puede conectar al servidor. Por favor, verifica que la API esté disponible en ' + API_BASE_URL
            );
            connectionError.isConnectionError = true;
            connectionError.originalError = error;
            
            ErrorHandler.log(connectionError, {
                endpoint,
                url: `${API_BASE_URL}${endpoint}`,
                connectionRefused: true
            });
            
            if (debug) {
                console.error(`🔴 Error de conexión: ${endpoint}`, error);
                console.warn('💡 Solución: Ejecuta "cd backend && php artisan serve" en la terminal');
            }
            
            throw connectionError;
        }
        
        // Log del error en el sistema centralizado
        ErrorHandler.log(error, {
            endpoint,
            url: `${API_BASE_URL}${endpoint}`
        });
        
        if (debug) {
            console.error(`❌ API Error: ${endpoint}`, error);
        }
        
        // Si es error de autenticación, redirigir al login
        if (error.message.includes('401') || error.message.includes('Authentication')) {
            localStorage.removeItem('upa_token');
            localStorage.removeItem('user_data');

            const destino = buildFrontendUrl('index').replace(/\/+$/, '');
            const actual = window.location.href.replace(/\/+$/, '');

            if (actual !== destino) {
                window.location.href = destino;
            }
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
    login: async (email, password, rememberMe = false) => {
        // Validar email institucional
        if (!esEmailInstitucional(email)) {
            throw new Error('Debes usar tu correo institucional (@upatlacomulco.edu.mx)');
        }
        
        return await fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password, remember_me: rememberMe })
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
        const result = await fetchAPI('/auth/logout', {
            method: 'POST'
        });
        clearCache();
        return result;
    },
    
    /**
     * Obtener usuario actual
     */
    me: async () => {
        const cacheKey = getCacheKey('auth_me');
        return useCache(cacheKey, () => fetchAPI('/auth/me'));
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

    restablecerPassword: async (payload) => {
        const { email, token, password, password_confirmation } = payload;

        if (!esEmailInstitucional(email)) {
            throw new Error('Debes usar tu correo institucional (@upatlacomulco.edu.mx)');
        }

        const validacionPassword = validarPassword(password);
        if (!validacionPassword.valido) {
            throw new Error(validacionPassword.mensaje);
        }

        if (password !== password_confirmation) {
            throw new Error('Las contraseñas no coinciden.');
        }

        return await fetchAPI('/auth/recuperar/confirmar', {
            method: 'POST',
            body: JSON.stringify({ email, token, password, password_confirmation })
        });
    },
    
    /**
     * PUBLICACIONES
     */
    getPosts: async (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return await fetchAPI(`/publicaciones${queryParams ? '?' + queryParams : ''}`);
    },
    
    getPost: async (id) => {
        return await fetchAPI(`/publicaciones/${id}`);
    },
    
    createPost: async (postData) => {
        return await fetchAPI('/publicaciones', {
            method: 'POST',
            body: JSON.stringify(postData)
        });
    },
    
    updatePost: async (id, postData) => {
        return await fetchAPI(`/publicaciones/${id}`, {
            method: 'PUT',
            body: JSON.stringify(postData)
        });
    },
    
    deletePost: async (id) => {
        return await fetchAPI(`/publicaciones/${id}`, {
            method: 'DELETE'
        });
    },
    
    votarPost: async (id, tipo) => {
        return await fetchAPI(`/publicaciones/${id}/votar`, {
            method: 'POST',
            body: JSON.stringify({ tipo })
        });
    },
    
    guardarPost: async (id) => {
        return await fetchAPI(`/publicaciones/${id}/guardar`, {
            method: 'POST'
        });
    },
    
    eliminarGuardado: async (id) => {
        return await fetchAPI(`/publicaciones/${id}/guardar`, {
            method: 'DELETE'
        });
    },
    
    getPublicacionesRelacionadas: async (id) => {
        return await fetchAPI(`/publicaciones/${id}/relacionadas`);
    },
    
    getPublicacionesDestacadas: async (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        const cacheKey = getCacheKey('publicaciones_destacadas', params);
        return useCache(cacheKey, () => fetchAPI(`/publicaciones/destacadas${queryParams ? '?' + queryParams : ''}`), 60 * 1000);
    },
    
    /**
     * COMENTARIOS
     */
    getComments: async (postId) => {
        return await fetchAPI(`/publicaciones/${postId}/comentarios`);
    },
    
    createComment: async (commentData) => {
        return await fetchAPI('/comentarios', {
            method: 'POST',
            body: JSON.stringify(commentData)
        });
    },
    
    updateComment: async (id, commentData) => {
        return await fetchAPI(`/comentarios/${id}`, {
            method: 'PUT',
            body: JSON.stringify(commentData)
        });
    },
    
    deleteComment: async (id) => {
        return await fetchAPI(`/comentarios/${id}`, {
            method: 'DELETE'
        });
    },
    
    votarComentario: async (id, tipo) => {
        return await fetchAPI(`/comentarios/${id}/votar`, {
            method: 'POST',
            body: JSON.stringify({ tipo })
        });
    },
    
    aceptarComentario: async (id) => {
        return await fetchAPI(`/comentarios/${id}/aceptar`, {
            method: 'POST'
        });
    },
    
    /**
     * NAVEGACIÓN
     */
    getCarreras: async () => {
        const token = localStorage.getItem('upa_token');
        const cacheKey = getCacheKey('carreras', { auth: Boolean(token) });

        return useCache(cacheKey, async () => {
            if (!token) {
                const response = await fetch(`${API_BASE_URL}/public/carreras`, {
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                const text = await response.text();
                let data;
                try {
                    data = JSON.parse(text);
                } catch (error) {
                    throw new Error('No se pudieron cargar las carreras públicas.');
                }

                if (!response.ok) {
                    throw new Error(data.message || `Error ${response.status}`);
                }

                return data;
            }

            return await fetchAPI('/carreras');
        }, 5 * 60 * 1000);
    },
    
    getCarrera: async (id) => {
        const cacheKey = getCacheKey('carrera', { id });
        return useCache(cacheKey, () => fetchAPI(`/carreras/${id}`), 3 * 60 * 1000);
    },
    
    getCuatrimestres: async (carreraId) => {
        const cacheKey = getCacheKey('cuatrimestres', { carreraId });
        return useCache(cacheKey, () => fetchAPI(`/carreras/${carreraId}/cuatrimestres`), 3 * 60 * 1000);
    },
    
    getMaterias: async (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        const cacheKey = getCacheKey('materias', params);
        return useCache(cacheKey, () => fetchAPI(`/materias${queryParams ? '?' + queryParams : ''}`), 2 * 60 * 1000);
    },
    
    getMateria: async (id) => {
        return await fetchAPI(`/materias/${id}`);
    },
    
    getEstadisticas: async () => {
        return await fetchAPI('/estadisticas');
    },
    
    buscar: async (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return await fetchAPI(`/buscar${queryParams ? '?' + queryParams : ''}`);
    },
    
    /**
     * PERFIL
     */
    getPerfil: async () => {
        const cacheKey = getCacheKey('perfil_actual');
        return useCache(cacheKey, () => fetchAPI('/perfil'), 60 * 1000);
    },
    
    getPerfilUsuario: async (id) => {
        const cacheKey = getCacheKey('perfil_usuario', { id });
        return useCache(cacheKey, () => fetchAPI(`/perfil/${id}`), 2 * 60 * 1000);
    },
    
    updatePerfil: async (perfilData) => {
        const result = await fetchAPI('/perfil', {
            method: 'PUT',
            body: JSON.stringify(perfilData)
        });
        clearCache(['perfil_actual', 'perfil_usuario']);
        return result;
    },
    
    cambiarPassword: async (passwordData) => {
        return await fetchAPI('/perfil/cambiar-password', {
            method: 'POST',
            body: JSON.stringify(passwordData)
        });
    },
    
    updateAvatar: async (formData) => {
        const result = await fetchAPI('/perfil/avatar', {
            method: 'POST',
            body: formData,
            headers: {
                // No Content-Type header para FormData, el navegador lo establece automáticamente
                'Authorization': `Bearer ${localStorage.getItem('upa_token')}`
            }
        });
        clearCache(['perfil_actual', 'perfil_usuario']);
        return result;
    },
    
    getPublicacionesUsuario: async (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return await fetchAPI(`/perfil/publicaciones${queryParams ? '?' + queryParams : ''}`);
    },
    
    getPublicacionesGuardadas: async (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return await fetchAPI(`/perfil/guardados${queryParams ? '?' + queryParams : ''}`);
    },

    /**
     * MODERACIÓN
     */
    getModeracionDashboard: async () => {
        return await fetchAPI('/moderacion/dashboard');
    },

    getModeracionReportes: async (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return await fetchAPI(`/moderacion/reportes${queryParams ? '?' + queryParams : ''}`);
    },

    getModeracionReporte: async (id) => {
        return await fetchAPI(`/moderacion/reportes/${id}`);
    },

    aprobarReporte: async (id) => {
        return await fetchAPI(`/moderacion/reportes/${id}/aprobar`, {
            method: 'POST'
        });
    },

    advertirUsuarioReporte: async (id, payload) => {
        return await fetchAPI(`/moderacion/reportes/${id}/advertir`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    eliminarContenidoReporte: async (id, payload) => {
        return await fetchAPI(`/moderacion/reportes/${id}/eliminar`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    getModeracionActividad: async () => {
        return await fetchAPI('/moderacion/actividad');
    },

    getModeracionAlertas: async () => {
        return await fetchAPI('/moderacion/alertas');
    },

    buscarUsuarioModeracion: async (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return await fetchAPI(`/moderacion/usuarios${queryParams ? '?' + queryParams : ''}`);
    },

    bloquearUsuario: async (payload) => {
        return await fetchAPI('/moderacion/usuarios/bloquear', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    advertirUsuario: async (payload) => {
        return await fetchAPI('/moderacion/usuarios/advertir', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    getModeracionUsuariosBloqueados: async () => {
        return await fetchAPI('/moderacion/usuarios/bloqueados');
    },

    reactivarUsuario: async (payload) => {
        return await fetchAPI('/moderacion/usuarios/reactivar', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    crearModeracionAviso: async (payload) => {
        return await fetchAPI('/moderacion/avisos', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    exportarModeracionLog: async () => {
        return await fetchAPI('/moderacion/log/exportar', {
            method: 'POST'
        });
    },

    /**
     * NOTIFICACIONES
     */
    getNotificaciones: async (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return await fetchAPI(`/notificaciones${queryParams ? '?' + queryParams : ''}`);
    },
    
    getNotificacionesNoLeidas: async () => {
        return await fetchAPI('/notificaciones/no-leidas');
    },
    
    marcarNotificacionLeida: async (id) => {
        const result = await fetchAPI(`/notificaciones/${id}/marcar-leida`, {
            method: 'POST'
        });
        clearCache('notificaciones');
        return result;
    },
    
    marcarTodasNotificacionesLeidas: async () => {
        const result = await fetchAPI('/notificaciones/marcar-todas-leidas', {
            method: 'POST'
        });
        clearCache('notificaciones');
        return result;
    },
    
    deleteNotificacion: async (id) => {
        const result = await fetchAPI(`/notificaciones/${id}`, {
            method: 'DELETE'
        });
        clearCache('notificaciones');
        return result;
    },
    
    deleteNotificacionesLeidas: async () => {
        const result = await fetchAPI('/notificaciones/leidas', {
            method: 'DELETE'
        });
        clearCache('notificaciones');
        return result;
    },

    /**
     * CALENDARIO
     */
    getEventos: async (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        const cacheKey = getCacheKey('eventos', params);
        return useCache(cacheKey, () => fetchAPI(`/eventos${queryParams ? '?' + queryParams : ''}`), 60 * 1000);
    },
    
    createEvento: async (eventoData) => {
        return await fetchAPI('/eventos', {
            method: 'POST',
            body: JSON.stringify(eventoData)
        });
    },
    
    updateEvento: async (id, eventoData) => {
        return await fetchAPI(`/eventos/${id}`, {
            method: 'PUT',
            body: JSON.stringify(eventoData)
        });
    },
    
    deleteEvento: async (id) => {
        return await fetchAPI(`/eventos/${id}`, {
            method: 'DELETE'
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