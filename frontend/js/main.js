/**
 * MAIN.JS - Script principal de inicialización
 * ==============================================
 * Este archivo maneja la inicialización general de la aplicación
 */

// ===================================
// CONFIGURACIÓN GLOBAL
// ===================================
const APP_CONFIG = {
    nombre: 'Foro Académico UPA',
    version: '1.0.0',
    debug: true // Cambiar a false en producción
};

// ===================================
// INICIALIZACIÓN AL CARGAR EL DOM
// ===================================
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await cargarToastyAssets();
    } catch (error) {
        console.warn('Continuando sin Toasty.js debido a un error de carga.', error);
    }
    inicializarToasty();
    inicializarEnlacesAmigables();
    
    // Inicializar AOS (animaciones al scroll)
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            once: true,
            offset: 100,
            easing: 'ease-in-out'
        });
    }
    
    // Log de inicialización en modo debug
    if (APP_CONFIG.debug) {
        console.log(`%c${APP_CONFIG.nombre} v${APP_CONFIG.version}`, 
            'color: #003366; font-size: 16px; font-weight: bold;');
        console.log('%cModo DEBUG activado', 'color: #FF6600; font-weight: bold;');
        console.log('API Mock Data:', localStorage.getItem('upa_token') ? 'Sesión activa' : 'Sin sesión');
    }
    
    // Inicializar tooltips de Bootstrap (si existen)
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Inicializar popovers de Bootstrap (si existen)
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
    
    // Cargar datos del usuario si está autenticado
    cargarDatosUsuario();
    
    // Inicializar barra de búsqueda
    inicializarBusqueda();
    
    // Detectar cambios de tema (para futuras implementaciones)
    detectarPreferenciaTema();
});

// ===================================
// CARGA DE DATOS DEL USUARIO
// ===================================

/**
 * Carga y muestra los datos del usuario en el DOM
 */
function cargarDatosUsuario() {
    const userData = localStorage.getItem('user_data');
    
    if (!userData) return;
    
    try {
        const storedUserRaw = localStorage.getItem('user_data');
        if (storedUserRaw) {
            const parsedUser = JSON.parse(storedUserRaw);
            const normalizado = normalizarDatosUsuario(parsedUser);
            localStorage.setItem('user_data', JSON.stringify(normalizado));
        }
    } catch (error) {
        console.warn('No se pudo normalizar el usuario almacenado al iniciar la app.', error);
    }
    
    if (!userData) return;
    
    try {
        let user = JSON.parse(userData);
        user = normalizarDatosUsuario(user);
        localStorage.setItem('user_data', JSON.stringify(user));
        
        // Actualizar nombre en navbar
        const nombreUsuario = document.getElementById('nombreUsuario');
        if (nombreUsuario) {
            nombreUsuario.textContent = user.nombre;
        }
        
        // Actualizar nombre completo en dropdown
        const nombreCompleto = document.getElementById('nombreUsuarioCompleto');
        if (nombreCompleto) {
            nombreCompleto.textContent = `${user.nombre} ${user.apellidos || ''}`;
        }
        
        // Actualizar email
        const emailUsuario = document.getElementById('emailUsuario');
        if (emailUsuario) {
            emailUsuario.textContent = user.email;
        }
        
        // Actualizar nombre en dashboard
        const nombreDashboard = document.getElementById('nombreDashboard');
        if (nombreDashboard) {
            nombreDashboard.textContent = user.nombre;
        }
        
        // Actualizar avatares con iniciales (usando tamaños apropiados)
        const avatares = document.querySelectorAll('img[alt="Avatar"]');
        avatares.forEach(avatar => {
            // Obtener el tamaño del elemento o usar tamaño por defecto
            const width = avatar.width || parseInt(avatar.style.width) || 128;
            const tamanoApropiado = width > 0 ? width : 128;
            const avatarUrlNormalizado = normalizarAvatar(user.avatar_url || user.avatar, user.nombre, user.apellidos, tamanoApropiado);
            avatar.src = avatarUrlNormalizado;
        });
        
        const avatarNavbar = document.getElementById('navbarAvatar');
        if (avatarNavbar) {
            const tamanoNavbar = avatarNavbar.width || 35;
            avatarNavbar.src = normalizarAvatar(user.avatar_url || user.avatar, user.nombre, user.apellidos, tamanoNavbar);
        }
        
        const avatarDetalle = document.getElementById('navbarAvatarDetalle');
        if (avatarDetalle) {
            const tamanoDetalle = avatarDetalle.width || 60;
            avatarDetalle.src = normalizarAvatar(user.avatar_url || user.avatar, user.nombre, user.apellidos, tamanoDetalle);
        }
        
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
    }
}

function normalizarAvatar(fuente, nombre = 'Usuario', apellidos = '', tamano = 128) {
    const iniciales = `${nombre?.[0] || 'U'}${apellidos?.[0] || ''}`.toUpperCase();
    // Usar tamaño apropiado para reducir ancho de banda (redondeado a múltiplos de 10)
    const sizeParam = Math.max(64, Math.round(tamano / 10) * 10); // Mínimo 64, redondeado a múltiplos de 10
    const placeholder = `https://ui-avatars.com/api/?name=${encodeURIComponent(iniciales)}&background=003366&color=fff&size=${sizeParam}`;

    if (!fuente) {
        return placeholder;
    }

    try {
        const url = String(fuente).trim();
        if (!url || url === '#' || 
            /frontend\/uploads\/avatars/i.test(url) || 
            /uploads\/avatars/i.test(url) ||
            /frontend\/views\/storage\/avatars/i.test(url) ||
            /^\/?uploads\/avatars/i.test(url) ||
            /^\/?frontend\/uploads/i.test(url) ||
            (url.includes('uploads') && url.includes('avatars') && !url.startsWith('http'))) {
            return placeholder;
        }
        
        // Si es una URL absoluta válida, devolverla
        if (url.startsWith('http://') || url.startsWith('https://')) {
            // Si es ui-avatars.com, ajustar el tamaño si es necesario
            if (url.includes('ui-avatars.com') && tamano !== 128) {
                const urlObj = new URL(url);
                urlObj.searchParams.set('size', sizeParam.toString());
                return urlObj.toString();
            }
            return url;
        }
        
        return placeholder;
    } catch (error) {
        console.warn('No se pudo normalizar el avatar, se usará un placeholder.', error);
        return placeholder;
    }
}

function normalizarDatosUsuario(usuario = {}) {
    if (!usuario || typeof usuario !== 'object') return usuario;

    const usuarioNormalizado = { ...usuario };
    const nombre = usuarioNormalizado.nombre || 'Usuario';
    const apellidos = usuarioNormalizado.apellidos || '';

    const avatarSanitizado = normalizarAvatar(usuarioNormalizado.avatar_url || usuarioNormalizado.avatar, nombre, apellidos);

    usuarioNormalizado.avatar_url = avatarSanitizado;
    usuarioNormalizado.avatar = avatarSanitizado;

    if (usuarioNormalizado.estudiante?.carrera && typeof usuarioNormalizado.estudiante.carrera === 'string') {
        usuarioNormalizado.estudiante = {
            ...usuarioNormalizado.estudiante,
            carrera: { nombre: usuarioNormalizado.estudiante.carrera }
        };
    }

    return usuarioNormalizado;
}

window.normalizarAvatar = normalizarAvatar;
window.normalizarDatosUsuario = normalizarDatosUsuario;

// Funciones globales de loading
window.mostrarLoadingGlobal = function(mensaje = 'Cargando...') {
    const loader = document.getElementById('globalLoader');
    if (loader) {
        loader.style.display = 'flex';
        const texto = loader.querySelector('.loader-text');
        if (texto) texto.textContent = mensaje;
        return;
    }
    
    const body = document.body;
    const overlay = document.createElement('div');
    overlay.id = 'globalLoader';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = `
        <div class="text-center text-white">
            <div class="spinner-border mb-3" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <div class="loader-text">${mensaje}</div>
        </div>
    `;
    body.appendChild(overlay);
};

window.ocultarLoadingGlobal = function() {
    const loader = document.getElementById('globalLoader');
    if (loader) {
        loader.remove();
    }
};

/**
 * Aplica lazy loading a todas las imágenes que no lo tengan
 */
function aplicarLazyLoadingImagenes() {
    // Usar requestAnimationFrame para evitar forced reflows
    requestAnimationFrame(() => {
        const imagenes = document.querySelectorAll('img:not([loading])');
        imagenes.forEach(img => {
            // Usar naturalWidth/naturalHeight en lugar de width/height para evitar reflow
            // Si no están disponibles, usar tamaño por defecto
            const width = img.naturalWidth || img.width || 0;
            const height = img.naturalHeight || img.height || 0;
            
            // Solo aplicar lazy loading a imágenes grandes
            if (width > 100 || height > 100) {
                img.loading = 'lazy';
            }
        });
    });
}

// Aplicar lazy loading a imágenes existentes y nuevas
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', aplicarLazyLoadingImagenes);
} else {
    aplicarLazyLoadingImagenes();
}

// Observer para aplicar lazy loading a imágenes agregadas dinámicamente
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (!img.hasAttribute('loading')) {
                    img.loading = 'lazy';
                }
                observer.unobserve(img);
            }
        });
    });

    // Observar nuevas imágenes agregadas al DOM (throttled para evitar reflows)
    let observerTimeout;
    const observer = new MutationObserver(() => {
        // Throttle para evitar múltiples reflows
        clearTimeout(observerTimeout);
        observerTimeout = setTimeout(() => {
            requestAnimationFrame(() => {
                document.querySelectorAll('img:not([loading])').forEach(img => {
                    // Usar naturalWidth/naturalHeight o dimensiones por defecto
                    const width = img.naturalWidth || img.width || 0;
                    const height = img.naturalHeight || img.height || 0;
                    
                    if (width > 50 || height > 50) {
                        imageObserver.observe(img);
                    }
                });
            });
        }, 100); // Throttle de 100ms
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

/**
 * Throttle function para limitar la frecuencia de ejecución
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Debounce function para retrasar la ejecución
 */
function debounce(func, wait, immediate) {
    let timeout;
    return function(...args) {
        const context = this;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

window.throttle = throttle;
window.debounce = debounce;

/**
 * Limpia localStorage de datos obsoletos o innecesarios
 */
function limpiarLocalStorage() {
    try {
        const keysToKeep = ['upa_token', 'upa_frontend_base'];
        const allKeys = Object.keys(localStorage);
        
        // Eliminar claves obsoletas
        const keysToRemove = allKeys.filter(key => {
            // Mantener claves importantes
            if (keysToKeep.includes(key)) return false;
            
            // Mantener user_data si hay token válido
            if (key === 'user_data' && localStorage.getItem('upa_token')) return false;
            
            // Mantener preferencias del usuario
            if (key.startsWith('upa_pref_')) return false;
            
            // Eliminar claves de caché antiguas o datos temporales
            if (key.startsWith('cache_') || key.startsWith('temp_')) return true;
            
            // Mantener otras claves importantes
            return false;
        });
        
        keysToRemove.forEach(key => {
            try {
                localStorage.removeItem(key);
                if (window.APP_CONFIG?.debug) {
                    console.log(`🗑️ Eliminada clave localStorage: ${key}`);
                }
            } catch (e) {
                console.warn(`No se pudo eliminar ${key}:`, e);
            }
        });
        
        // Validar y limpiar user_data si no hay token
        if (!localStorage.getItem('upa_token') && localStorage.getItem('user_data')) {
            localStorage.removeItem('user_data');
            if (window.APP_CONFIG?.debug) {
                console.log('🗑️ Eliminado user_data sin token');
            }
        }
        
        return {
            eliminadas: keysToRemove.length,
            mantenidas: allKeys.length - keysToRemove.length
        };
    } catch (error) {
        console.error('Error al limpiar localStorage:', error);
        return { eliminadas: 0, mantenidas: 0, error: error.message };
    }
}

/**
 * Sanitiza los datos de localStorage
 */
function sanitizarLocalStorage() {
    try {
        // Limpiar datos obsoletos periódicamente
        const lastCleanup = localStorage.getItem('last_cleanup');
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        
        if (!lastCleanup || (now - parseInt(lastCleanup)) > oneDay) {
            const result = limpiarLocalStorage();
            localStorage.setItem('last_cleanup', now.toString());
            
            if (window.APP_CONFIG?.debug) {
                console.log('🧹 Limpieza de localStorage:', result);
            }
        }
    } catch (error) {
        console.warn('Error en sanitización de localStorage:', error);
    }
}

window.limpiarLocalStorage = limpiarLocalStorage;
window.sanitizarLocalStorage = sanitizarLocalStorage;

// Ejecutar sanitización al cargar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sanitizarLocalStorage);
} else {
    sanitizarLocalStorage();
}

/**
 * Carga un script de forma diferida (lazy loading)
 */
function cargarScriptLazy(src, id = null, defer = true) {
    return new Promise((resolve, reject) => {
        // Si ya existe, no cargar de nuevo
        if (id && document.getElementById(id)) {
            resolve();
            return;
        }
        
        const existingScript = Array.from(document.querySelectorAll('script'))
            .find(script => script.src === src || script.src.includes(src));
        
        if (existingScript) {
            if (existingScript.dataset.loaded === 'true') {
                resolve();
                return;
            }
            // Si está cargando, esperar
            existingScript.addEventListener('load', resolve);
            existingScript.addEventListener('error', reject);
            return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        if (id) script.id = id;
        if (defer) script.defer = true;
        script.async = true;
        
        script.onload = () => {
            script.dataset.loaded = 'true';
            resolve();
        };
        script.onerror = () => {
            reject(new Error(`Error al cargar script: ${src}`));
        };
        
        document.head.appendChild(script);
    });
}

/**
 * Carga un CSS de forma diferida
 */
function cargarCSSLazy(href, id = null) {
    return new Promise((resolve, reject) => {
        // Si ya existe, no cargar de nuevo
        if (id && document.getElementById(id)) {
            resolve();
            return;
        }
        
        const existingLink = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
            .find(link => link.href === href || link.href.includes(href));
        
        if (existingLink) {
            resolve();
            return;
        }
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        if (id) link.id = id;
        link.media = 'print';
        link.onload = () => {
            link.media = 'all';
            resolve();
        };
        link.onerror = () => {
            reject(new Error(`Error al cargar CSS: ${href}`));
        };
        
        document.head.appendChild(link);
    });
}

window.cargarScriptLazy = cargarScriptLazy;
window.cargarCSSLazy = cargarCSSLazy;

/**
 * Normaliza los enlaces internos usando buildFrontendUrl
 */
function inicializarEnlacesAmigables() {
    if (typeof buildFrontendUrl !== 'function') {
        console.warn('[main.js] buildFrontendUrl no está disponible, no se normalizarán los enlaces.');
        return;
    }

    const links = document.querySelectorAll('a[data-route]');
    links.forEach(link => {
        const route = (link.getAttribute('data-route') || '').trim();
        if (!route) return;

        // Ignorar rutas absolutas externas
        if (/^(https?:)?\/\//i.test(route)) {
            link.setAttribute('href', route);
            return;
        }

        const [pathAndQuery, hash = ''] = route.split('#', 2);
        const [path, query = ''] = pathAndQuery.split('?', 2);

        let url = buildFrontendUrl(path || '');
        if (query) {
            url += (url.includes('?') ? '&' : '?') + query;
        }
        if (hash) {
            url += `#${hash}`;
        }

        link.setAttribute('href', url);
    });
}

async function cargarToastyAssets() {
    const obtenerRutaLocal = (archivo) => {
        if (typeof buildFrontendUrl === 'function') {
            return buildFrontendUrl(`vendor/toasty/${archivo}`);
        }
        const base = window.__FRONTEND_BASE_PATH || '/FORO%20WEB%20ACAD%C3%89MICO/frontend/';
        const normalizado = base.endsWith('/') ? base : `${base}/`;
        return `${normalizado}vendor/toasty/${archivo}`;
    };

    const CDN_CSS = 'https://cdn.jsdelivr.net/npm/toasty-js@1.4.1/dist/toasty.min.css';
    const CDN_JS = 'https://cdn.jsdelivr.net/npm/toasty-js@1.4.1/dist/toasty.min.js';

    const loadStyle = (href, dataValue = 'css-local') => new Promise((resolve, reject) => {
        if (document.querySelector(`link[data-toasty="${dataValue}"]`)) {
            resolve();
            return;
        }
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.toasty = dataValue;
        link.addEventListener('load', () => resolve(), { once: true });
        link.addEventListener('error', () => {
            link.remove();
            reject(new Error(`No se pudo cargar ${href}`));
        }, { once: true });
        document.head.appendChild(link);
    });

    const loadScript = (src, dataValue = 'js-local') => new Promise((resolve, reject) => {
        if (document.querySelector(`script[data-toasty="${dataValue}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.dataset.toasty = dataValue;
        script.addEventListener('load', () => {
            script.dataset.loaded = 'true';
            resolve();
        }, { once: true });
        script.addEventListener('error', () => {
            script.remove();
            reject(new Error(`No se pudo cargar ${src}`));
        }, { once: true });
        document.head.appendChild(script);
    });

    try {
        await loadStyle(obtenerRutaLocal('toasty.css'));
    } catch (error) {
        console.warn('Fallo al cargar Toasty.css local, se intentará el CDN.', error);
        await loadStyle(CDN_CSS, 'css-cdn').catch(() => {});
    }

    try {
        await loadScript(obtenerRutaLocal('toasty.js'));
    } catch (error) {
        console.warn('Fallo al cargar Toasty.js local, se intentará el CDN.', error);
        await loadScript(CDN_JS, 'js-cdn').catch(() => {});
    }
}

function inicializarToasty() {
    if (typeof Toasty !== 'function') {
        console.warn('Toasty.js no está disponible, se usarán notificaciones nativas.');
        window.mostrarNotificacion = (tipo, mensaje, opciones) => mostrarToastNativo({ tipo, mensaje, ...opciones });
        window.mostrarNotificacionToasty = window.mostrarNotificacion;
        window.mostrarConfirmacionToasty = (opciones = {}) => mostrarConfirmacionModalFallback(opciones);
        return;
    }

    if (window.toastyInstance) return;

    const toasty = new Toasty({
        classname: 'toasty',
        transition: 'slideLeftRightFade',
        progressBar: true,
        enableSounds: false,
        autoClose: true,
        insertBefore: true
    });

    window.toastyInstance = toasty;

    window.mostrarNotificacionToasty = function(tipo = 'info', mensaje = '', opciones = {}) {
        if (!mensaje) return;

        const clases = {
            success: 'success',
            error: 'error',
            warning: 'warning',
            info: 'info'
        };

        const duration = opciones.duration ?? 3500;
        const position = opciones.position ?? 'right';
        const gravity = opciones.gravity ?? 'top';

        toasty.options({
            text: mensaje,
            duration,
            close: true,
            gravity,
            position,
            className: clases[tipo] || 'info',
            allowHtml: false,
            callback: opciones.onClose || null
        });

        toasty.show();
    };

    window.mostrarNotificacion = window.mostrarNotificacionToasty;

    window.mostrarConfirmacionToasty = function({
        mensaje,
        tipo = 'warning',
        textoConfirmar = 'Confirmar',
        textoCancelar = 'Cancelar',
        autoCerrar = 0
    } = {}) {
        return new Promise((resolve) => {
            if (!mensaje) {
                resolve(false);
                return;
            }

            const clases = {
                success: 'success',
                error: 'error',
                warning: 'warning',
                info: 'info'
            };

            const toastId = `toasty-confirm-${Date.now()}`;
            const html = `
                <div id="${toastId}" class="toasty-confirm">
                    <p class="mb-2">${mensaje}</p>
                    <div class="d-flex gap-2 justify-content-end">
                        <button type="button" class="btn btn-sm btn-secondary toasty-confirm-cancel">${textoCancelar}</button>
                        <button type="button" class="btn btn-sm btn-upa-primary toasty-confirm-ok">${textoConfirmar}</button>
                    </div>
                </div>
            `;

            const duration = autoCerrar && autoCerrar > 0 ? autoCerrar : false;

            let resuelto = false;
            let toastRef = null;

            const finalizar = (resultado) => {
                if (resuelto) return;
                resuelto = true;
                if (toastRef && toastRef instanceof HTMLElement) {
                    toastRef.dispatchEvent(new CustomEvent('toasty:dismiss'));
                    if (toastRef.parentNode) {
                        toastRef.parentNode.removeChild(toastRef);
                    }
                }
                resolve(resultado);
            };

            toasty.options({
                text: html,
                duration,
                close: true,
                gravity: 'top',
                position: 'center',
                className: `prompt ${clases[tipo] || 'warning'}`,
                allowHtml: true,
                callback: () => finalizar(false)
            });

            const toastElement = toasty.show();

            const obtenerToast = () => {
                if (toastElement instanceof HTMLElement) return toastElement;
                return document.querySelector('.toasty:last-child');
            };

            setTimeout(() => {
                toastRef = obtenerToast();
                if (!toastRef) {
                    finalizar(false);
                    return;
                }

                const confirmarBtn = toastRef.querySelector('.toasty-confirm-ok');
                const cancelarBtn = toastRef.querySelector('.toasty-confirm-cancel');

                confirmarBtn?.addEventListener('click', () => finalizar(true), { once: true });
                cancelarBtn?.addEventListener('click', () => finalizar(false), { once: true });
            }, 30);
        });
    };
}

function mostrarToastNativo({ tipo = 'info', mensaje = '' }) {
    if (!mensaje) return;

    let contenedor = document.getElementById('nativeToastContainer');
    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.id = 'nativeToastContainer';
        contenedor.className = 'native-toast-container';
        document.body.appendChild(contenedor);
    }

    const toast = document.createElement('div');
    toast.className = `native-toast native-toast-${tipo}`;
    toast.textContent = mensaje;
    contenedor.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function mostrarConfirmacionModalFallback({
    mensaje = '',
    titulo = 'Confirmar acción',
    tipo = 'warning',
    textoConfirmar = 'Confirmar',
    textoCancelar = 'Cancelar'
} = {}) {
    return new Promise((resolve) => {
        if (!mensaje) {
            resolve(false);
            return;
        }

        const modalId = `confirm-modal-${Date.now()}`;
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = modalId;
        modal.tabIndex = -1;
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header border-0">
                        <h5 class="modal-title fw-bold"><i class="fas fa-exclamation-triangle text-${tipo} me-2"></i>${titulo}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p class="mb-0">${mensaje}</p>
                    </div>
                    <div class="modal-footer border-0">
                        <button type="button" class="btn btn-secondary" data-action="cancelar">${textoCancelar}</button>
                        <button type="button" class="btn btn-${tipo === 'danger' ? 'danger' : tipo === 'success' ? 'success' : tipo === 'warning' ? 'warning' : 'primary'}" data-action="confirmar">${textoConfirmar}</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const bsModal = new bootstrap.Modal(modal);
        let resuelto = false;

        const finalizar = (valor) => {
            if (resuelto) return;
            resuelto = true;
            resolve(valor);
            bsModal.hide();
        };

        modal.addEventListener('hidden.bs.modal', () => {
            if (!resuelto) {
                resolve(false);
            }
            modal.remove();
        }, { once: true });

        modal.querySelector('[data-action="confirmar"]').addEventListener('click', () => finalizar(true));
        modal.querySelector('[data-action="cancelar"]').addEventListener('click', () => finalizar(false));

        bsModal.show();
    });
}

// ===================================
// SISTEMA DE BÚSQUEDA
// ===================================

/**
 * Inicializa la funcionalidad de búsqueda
 */
function inicializarBusqueda() {
    const searchInput = document.getElementById('searchInput');
    
    if (!searchInput) return;
    
    // Búsqueda en tiempo real (con debounce)
    let timeoutId;
    searchInput.addEventListener('input', function(e) {
        clearTimeout(timeoutId);
        
        const query = e.target.value.trim();
        
        if (query.length < 3) {
            ocultarResultadosBusqueda();
            return;
        }
        
        timeoutId = setTimeout(() => {
            realizarBusqueda(query);
        }, 500); // Esperar 500ms después de que el usuario deje de escribir
    });
    
    // Búsqueda al enviar formulario
    const searchForm = searchInput.closest('form');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query.length >= 3) {
                realizarBusqueda(query);
            }
        });
    }
}

/**
 * Realiza la búsqueda y muestra resultados
 */
async function realizarBusqueda(query) {
    if (!query || query.trim().length < 3) {
        return;
    }
    
    if (APP_CONFIG.debug) {
        console.log('Buscando:', query);
    }
    
    // Redirigir a la página de búsqueda con el query
    const destino = typeof buildFrontendUrl === 'function'
        ? buildFrontendUrl(`search?q=${encodeURIComponent(query.trim())}`)
        : `search?q=${encodeURIComponent(query.trim())}`;
    window.location.href = destino;
}

/**
 * Oculta los resultados de búsqueda
 */
function ocultarResultadosBusqueda() {
    // TODO: Implementar cuando tengamos dropdown de resultados
}

// ===================================
// TEMA CLARO/OSCURO (FUTURO)
// ===================================

/**
 * Detecta la preferencia de tema del usuario
 */
function detectarPreferenciaTema() {
    // Verificar si el usuario tiene preferencia guardada
    const temaGuardado = localStorage.getItem('tema_preferido');
    
    if (temaGuardado) {
        aplicarTema(temaGuardado);
    } else {
        // Detectar preferencia del sistema
        const prefiereTemaOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
        aplicarTema(prefiereTemaOscuro ? 'oscuro' : 'claro');
    }
}

/**
 * Aplica el tema seleccionado
 */
function aplicarTema(tema) {
    // TODO: Implementar en futuras versiones
    document.documentElement.setAttribute('data-theme', tema);
    localStorage.setItem('tema_preferido', tema);
}

// ===================================
// MANEJO DE ERRORES GLOBAL
// ===================================

// ===================================
// MANEJO DE ERRORES GLOBAL
// ===================================

/**
 * Maneja errores no capturados
 */
window.addEventListener('error', function(e) {
    if (APP_CONFIG.debug) {
        console.error('Error global capturado:', e.error);
    }
});

/**
 * Maneja promesas rechazadas no capturadas
 */
window.addEventListener('unhandledrejection', function(e) {
    if (APP_CONFIG.debug) {
        console.error('Promise rechazada no manejada:', e.reason);
    }
});

// ===================================
// UTILIDADES GENERALES
// ===================================

/**
 * Formatea una fecha en formato legible
 * @param {string} fecha - Fecha en formato ISO
 * @returns {string} Fecha formateada
 */
function formatearFecha(fecha) {
    const opciones = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(fecha).toLocaleDateString('es-MX', opciones);
}

/**
 * Calcula el tiempo transcurrido desde una fecha
 * @param {string} fecha - Fecha en formato ISO
 * @returns {string} Tiempo transcurrido (ej: "Hace 2 horas")
 */
function tiempoTranscurrido(fecha) {
    const ahora = new Date();
    const fechaObj = new Date(fecha);
    const diferencia = ahora - fechaObj;
    
    const segundos = Math.floor(diferencia / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    const meses = Math.floor(dias / 30);
    const anos = Math.floor(dias / 365);
    
    if (segundos < 60) return 'Justo ahora';
    if (minutos < 60) return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    if (dias < 30) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
    if (meses < 12) return `Hace ${meses} mes${meses > 1 ? 'es' : ''}`;
    return `Hace ${anos} año${anos > 1 ? 's' : ''}`;
}

/**
 * Trunca un texto a una longitud específica
 * @param {string} texto - Texto a truncar
 * @param {number} longitud - Longitud máxima
 * @returns {string} Texto truncado
 */
function truncarTexto(texto, longitud = 100) {
    if (texto.length <= longitud) return texto;
    return texto.substring(0, longitud) + '...';
}

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean} True si es válido
 */
function esEmailValido(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Formatea un número con separadores de miles
 * @param {number} numero - Número a formatear
 * @returns {string} Número formateado
 */
function formatearNumero(numero) {
    return new Intl.NumberFormat('es-MX').format(numero);
}

/**
 * Genera un color aleatorio en formato hexadecimal
 * @returns {string} Color en formato #RRGGBB
 */
function colorAleatorio() {
    return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}

/**
 * Obtiene las iniciales de un nombre
 * @param {string} nombre - Nombre completo
 * @returns {string} Iniciales (máximo 2 caracteres)
 */
function obtenerIniciales(nombre) {
    const palabras = nombre.trim().split(' ');
    if (palabras.length === 1) {
        return palabras[0].substring(0, 2).toUpperCase();
    }
    return (palabras[0][0] + palabras[palabras.length - 1][0]).toUpperCase();
}

/**
 * Copia texto al portapapeles
 * @param {string} texto - Texto a copiar
 */
async function copiarAlPortapapeles(texto) {
    try {
        await navigator.clipboard.writeText(texto);
        mostrarNotificacion('success', 'Copiado al portapapeles');
    } catch (error) {
        console.error('Error al copiar:', error);
        mostrarNotificacion('error', 'No se pudo copiar al portapapeles');
    }
}

/**
 * Descarga un archivo
 * @param {string} url - URL del archivo
 * @param {string} nombreArchivo - Nombre con el que se guardará
 */
function descargarArchivo(url, nombreArchivo) {
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Formatea el tamaño de un archivo
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} Tamaño formateado (ej: "2.5 MB")
 */
function formatearTamanoArchivo(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Detecta el tipo de archivo por extensión
 * @param {string} nombreArchivo - Nombre del archivo
 * @returns {string} Tipo de archivo
 */
function detectarTipoArchivo(nombreArchivo) {
    const extension = nombreArchivo.split('.').pop().toLowerCase();
    
    const tipos = {
        // Documentos
        'pdf': 'PDF',
        'doc': 'Word',
        'docx': 'Word',
        'txt': 'Texto',
        'rtf': 'RTF',
        
        // Hojas de cálculo
        'xls': 'Excel',
        'xlsx': 'Excel',
        'csv': 'CSV',
        
        // Presentaciones
        'ppt': 'PowerPoint',
        'pptx': 'PowerPoint',
        
        // Imágenes
        'jpg': 'Imagen',
        'jpeg': 'Imagen',
        'png': 'Imagen',
        'gif': 'Imagen',
        'svg': 'Imagen',
        'webp': 'Imagen',
        
        // Código
        'html': 'HTML',
        'css': 'CSS',
        'js': 'JavaScript',
        'json': 'JSON',
        'xml': 'XML',
        'php': 'PHP',
        'py': 'Python',
        'java': 'Java',
        'cpp': 'C++',
        'c': 'C',
        
        // Comprimidos
        'zip': 'ZIP',
        'rar': 'RAR',
        '7z': '7Z',
        'tar': 'TAR',
        'gz': 'GZIP'
    };
    
    return tipos[extension] || 'Archivo';
}

// ===================================
// VALIDACIÓN DE FORMULARIOS
// ===================================

/**
 * Valida un formulario con Bootstrap validation
 * @param {HTMLFormElement} form - Formulario a validar
 * @returns {boolean} True si es válido
 */
function validarFormulario(form) {
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        
        // Hacer scroll al primer campo inválido
        const primerCampoInvalido = form.querySelector(':invalid');
        if (primerCampoInvalido) {
            primerCampoInvalido.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            primerCampoInvalido.focus();
        }
        
        return false;
    }
    
    return true;
}

/**
 * Limpia la validación de un formulario
 * @param {HTMLFormElement} form - Formulario a limpiar
 */
function limpiarValidacion(form) {
    form.classList.remove('was-validated');
    
    // Remover clases is-invalid de todos los campos
    form.querySelectorAll('.is-invalid').forEach(campo => {
        campo.classList.remove('is-invalid');
    });
}

// ===================================
// LOADING SPINNER
// ===================================

/**
 * Muestra un spinner de carga global
 */
function mostrarLoading() {
    // Verificar si ya existe
    if (document.getElementById('globalLoadingSpinner')) return;
    
    const spinner = document.createElement('div');
    spinner.id = 'globalLoadingSpinner';
    spinner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
    `;
    
    spinner.innerHTML = `
        <div class="spinner-border text-light" role="status" style="width: 3rem; height: 3rem;">
            <span class="visually-hidden">Cargando...</span>
        </div>
    `;
    
    document.body.appendChild(spinner);
}

/**
 * Oculta el spinner de carga global
 */
function ocultarLoading() {
    const spinner = document.getElementById('globalLoadingSpinner');
    if (spinner) {
        spinner.remove();
    }
}

// ===================================
// CONFIRMACIÓN DE ACCIONES
// ===================================

/**
 * Muestra un modal de confirmación
 * @param {string} titulo - Título del modal
 * @param {string} mensaje - Mensaje a mostrar
 * @param {Function} callback - Función a ejecutar si confirma
 */
async function confirmarAccion(titulo, mensaje, callback) {
    const confirmado = await (window.mostrarConfirmacionToasty
        ? window.mostrarConfirmacionToasty({
            mensaje: `${titulo}<br>${mensaje}`,
            tipo: 'warning',
            textoConfirmar: 'Sí, continuar',
            textoCancelar: 'Cancelar'
        })
        : Promise.resolve(confirm(`${titulo}\n\n${mensaje}`)));

    if (confirmado) {
        callback();
    }
}

// ===================================
// MANEJO DE SCROLL
// ===================================

/**
 * Hace scroll suave hacia un elemento
 * @param {string} elementId - ID del elemento
 */
function scrollTo(elementId) {
    const elemento = document.getElementById(elementId);
    if (elemento) {
        elemento.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
}

/**
 * Botón para volver arriba (scroll to top)
 */
function inicializarScrollToTop() {
    // Crear botón
    const btnScrollTop = document.createElement('button');
    btnScrollTop.id = 'scrollToTopBtn';
    btnScrollTop.className = 'btn btn-upa-primary rounded-circle shadow-lg';
    btnScrollTop.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        display: none;
        z-index: 1000;
        border: none;
    `;
    btnScrollTop.innerHTML = '<i class="fas fa-arrow-up"></i>';
    
    // Mostrar/ocultar según scroll
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            btnScrollTop.style.display = 'block';
        } else {
            btnScrollTop.style.display = 'none';
        }
    });
    
    // Click para scroll hacia arriba
    btnScrollTop.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    document.body.appendChild(btnScrollTop);
}

// Inicializar scroll to top si estamos en una página con mucho contenido
if (document.body.scrollHeight > window.innerHeight * 2) {
    inicializarScrollToTop();
}

// ===================================
// EXPORTAR FUNCIONES ÚTILES
// ===================================
window.formatearFecha = formatearFecha;
window.tiempoTranscurrido = tiempoTranscurrido;
window.truncarTexto = truncarTexto;
window.esEmailValido = esEmailValido;
window.formatearNumero = formatearNumero;
window.colorAleatorio = colorAleatorio;
window.obtenerIniciales = obtenerIniciales;
window.copiarAlPortapapeles = copiarAlPortapapeles;
window.descargarArchivo = descargarArchivo;
window.formatearTamanoArchivo = formatearTamanoArchivo;
window.detectarTipoArchivo = detectarTipoArchivo;
window.validarFormulario = validarFormulario;
window.limpiarValidacion = limpiarValidacion;
window.mostrarLoading = mostrarLoading;
window.ocultarLoading = ocultarLoading;
window.confirmarAccion = confirmarAccion;
window.scrollTo = scrollTo;

// Log de funciones exportadas en modo debug
if (APP_CONFIG.debug) {
    console.log('%cFunciones útiles disponibles:', 'color: #28A745; font-weight: bold;');
    console.log('- formatearFecha(fecha)');
    console.log('- tiempoTranscurrido(fecha)');
    console.log('- truncarTexto(texto, longitud)');
    console.log('- formatearTamanoArchivo(bytes)');
    console.log('- copiarAlPortapapeles(texto)');
    console.log('- mostrarNotificacion(type, message)');
    console.log('Y más... revisar main.js para detalles');
}

document.addEventListener('hidden.bs.modal', () => {
    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }
});