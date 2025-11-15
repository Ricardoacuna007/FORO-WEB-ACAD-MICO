/**
 * NOTIFICATIONS.JS - Sistema de Notificaciones
 * ============================================
 * Manejo completo de notificaciones: cargar, marcar como leídas, eliminar, filtrar
 */

// ===================================
// CONFIGURACIÓN
// ===================================
const NotificationsConfig = {
    tipos: {
        comentario: { icon: 'fa-comment', color: 'primary', clase: 'notif-comment' },
        like: { icon: 'fa-thumbs-up', color: 'success', clase: 'notif-like' },
        mencion: { icon: 'fa-at', color: 'purple', clase: 'notif-mention' },
        calendario: { icon: 'fa-calendar', color: 'warning', clase: 'notif-calendar' },
        aviso: { icon: 'fa-bullhorn', color: 'info', clase: 'notif-aviso' },
        sistema: { icon: 'fa-info-circle', color: 'secondary', clase: 'notif-sistema' }
    },
    pollingInterval: 60000, // 1 minuto
    maxNotificaciones: 50
};

// ===================================
// VARIABLES GLOBALES
// ===================================
let notificaciones = [];
let filtroActual = 'todas';
let pollingTimer = null;

// ===================================
// CARGAR NOTIFICACIONES
// ===================================

/**
 * Carga las notificaciones del usuario
 */
async function cargarNotificaciones(filtro = 'todas') {
    try {
        mostrarLoading();
        
        const params = {};
        if (filtro === 'noLeidas') {
            params.leida = false;
        }
        
        const response = await API.getNotificaciones(params);
        
        if (response.success && response.data) {
            if (response.data.data) {
                // Si viene paginado
                notificaciones = response.data.data.map(procesarNotificacion);
            } else if (Array.isArray(response.data)) {
                // Si viene como array
                notificaciones = response.data.map(procesarNotificacion);
            } else {
                notificaciones = [];
            }
        } else {
            notificaciones = [];
        }
        
        ordenarNotificaciones();
        renderizarNotificaciones();
        actualizarBadgeNotificaciones();
        actualizarContadores();
        
    } catch (error) {
        console.error('Error al cargar notificaciones:', error);
        mostrarNotificacionNotif('error', error.message || 'No se pudieron cargar las notificaciones');
        notificaciones = [];
        renderizarNotificaciones();
    } finally {
        ocultarLoading();
    }
}

/**
 * Procesa una notificación de la API para el formato esperado
 */
function procesarNotificacion(notificacion) {
    return {
        id: notificacion.id,
        tipo: notificacion.tipo || 'sistema',
        titulo: notificacion.titulo || '',
        mensaje: notificacion.mensaje || '',
        fecha: new Date(notificacion.created_at),
        leida: notificacion.leida || false,
        url: notificacion.enlace || null,
        datos: notificacion.data || {}
    };
}

/**
 * Ordena las notificaciones por fecha (más recientes primero)
 */
function ordenarNotificaciones() {
    notificaciones.sort((a, b) => {
        // Primero las no leídas
        if (a.leida !== b.leida) {
            return a.leida ? 1 : -1;
        }
        // Luego por fecha
        return b.fecha - a.fecha;
    });
}

// ===================================
// RENDERIZADO
// ===================================

/**
 * Renderiza las notificaciones en el dropdown
 */
function renderizarNotificacionesDropdown() {
    const dropdown = document.getElementById('notificacionesDropdown');
    if (!dropdown) return;
    
    const menu = dropdown.nextElementSibling;
    if (!menu || !menu.classList.contains('dropdown-menu')) return;
    
    // Limpiar contenido existente (excepto header y footer)
    const items = menu.querySelectorAll('li:not(.dropdown-header):not(:last-child)');
    items.forEach(item => item.remove());
    
    // Obtener notificaciones no leídas para el dropdown
    const noLeidas = notificaciones.filter(n => !n.leida).slice(0, 5);
    
    if (noLeidas.length === 0) {
        const li = document.createElement('li');
        li.innerHTML = `
            <a class="dropdown-item text-center text-muted py-3">
                <i class="fas fa-bell-slash fa-2x mb-2 d-block"></i>
                <small>No hay notificaciones nuevas</small>
            </a>
        `;
        menu.insertBefore(li, menu.lastElementChild);
        return;
    }
    
    // Insertar notificaciones antes del último elemento (footer)
    noLeidas.forEach(notificacion => {
        const li = crearElementoNotificacionDropdown(notificacion);
        menu.insertBefore(li, menu.lastElementChild);
    });
}

/**
 * Renderiza las notificaciones en la página completa
 */
function renderizarNotificaciones() {
    const contenedor = document.getElementById('notificacionesContainer');
    if (!contenedor) {
        // Si no hay contenedor, actualizar solo el dropdown
        renderizarNotificacionesDropdown();
        return;
    }
    
    contenedor.innerHTML = '';
    
    // Filtrar notificaciones según el filtro actual
    let notificacionesFiltradas = notificaciones;
    
    switch (filtroActual) {
        case 'noLeidas':
            notificacionesFiltradas = notificaciones.filter(n => !n.leida);
            break;
        case 'comentarios':
            notificacionesFiltradas = notificaciones.filter(n => n.tipo === 'comentario');
            break;
        case 'menciones':
            notificacionesFiltradas = notificaciones.filter(n => n.tipo === 'mencion');
            break;
        case 'calendario':
            notificacionesFiltradas = notificaciones.filter(n => n.tipo === 'calendario');
            break;
        case 'leidas':
            notificacionesFiltradas = notificaciones.filter(n => n.leida);
            break;
    }
    
    if (notificacionesFiltradas.length === 0) {
        contenedor.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="fas fa-bell-slash fa-3x mb-3"></i>
                <p>No hay notificaciones</p>
            </div>
        `;
        return;
    }
    
    notificacionesFiltradas.forEach(notificacion => {
        const elemento = crearElementoNotificacion(notificacion);
        contenedor.appendChild(elemento);
    });
    
    // Actualizar contadores de filtros
    actualizarContadoresFiltros();
}

/**
 * Crea el elemento HTML de una notificación para el dropdown
 */
function crearElementoNotificacionDropdown(notificacion) {
    const li = document.createElement('li');
    const config = NotificationsConfig.tipos[notificacion.tipo] || NotificationsConfig.tipos.sistema;
    
    li.innerHTML = `
        <a class="dropdown-item py-3 ${notificacion.leida ? '' : 'bg-light'}" 
           href="${notificacion.url || '#'}" 
           onclick="marcarNotificacionLeida(${notificacion.id})">
            <div class="d-flex">
                <i class="fas ${config.icon} text-${config.color} me-3 mt-1"></i>
                <div class="flex-grow-1">
                    <strong>${notificacion.titulo}</strong>
                    <p class="mb-0 small text-muted">${notificacion.mensaje}</p>
                    <small class="text-muted">${formatearTiempoTranscurrido(notificacion.fecha)}</small>
                </div>
            </div>
        </a>
    `;
    
    return li;
}

/**
 * Crea el elemento HTML de una notificación para la página completa
 */
function crearElementoNotificacion(notificacion) {
    const div = document.createElement('div');
    const config = NotificationsConfig.tipos[notificacion.tipo] || NotificationsConfig.tipos.sistema;
    
    div.className = `notif-item p-3 mb-2 border rounded ${notificacion.leida ? '' : 'unread'}`;
    div.dataset.notificacionId = notificacion.id;
    
    div.innerHTML = `
        <div class="d-flex align-items-start">
            <div class="notif-icon ${config.clase} me-3 flex-shrink-0">
                <i class="fas ${config.icon}"></i>
            </div>
            <div class="flex-grow-1">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <h6 class="mb-1">${notificacion.titulo}</h6>
                        <p class="mb-1 text-muted">${notificacion.mensaje}</p>
                        <small class="text-muted">${formatearTiempoTranscurrido(notificacion.fecha)}</small>
                    </div>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-link text-muted" data-bs-toggle="dropdown">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            ${!notificacion.leida ? `
                                <li><a class="dropdown-item" href="#" onclick="marcarNotificacionLeida(${notificacion.id})">
                                    <i class="fas fa-check me-2"></i> Marcar como leída
                                </a></li>
                            ` : ''}
                            <li><a class="dropdown-item text-danger" href="#" onclick="eliminarNotificacion(${notificacion.id})">
                                <i class="fas fa-trash me-2"></i> Eliminar
                            </a></li>
                        </ul>
                    </div>
                </div>
                ${notificacion.url ? `
                    <a href="${notificacion.url}" class="btn btn-sm btn-outline-primary" 
                       onclick="marcarNotificacionLeida(${notificacion.id})">
                        Ver más
                    </a>
                ` : ''}
            </div>
        </div>
    `;
    
    // Agregar evento de click para marcar como leída
    div.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown') && !e.target.closest('a')) {
            if (notificacion.url) {
                marcarNotificacionLeida(notificacion.id);
                window.location.href = notificacion.url;
            }
        }
    });
    
    return div;
}

// ===================================
// MARCAR COMO LEÍDA
// ===================================

/**
 * Marca una notificación como leída
 */
async function marcarNotificacionLeida(notificacionId) {
    try {
        const notificacion = notificaciones.find(n => n.id === notificacionId);
        if (!notificacion) return;
        
        if (!notificacion.leida) {
            const response = await API.marcarNotificacionLeida(notificacionId);
            
            if (response.success) {
                notificacion.leida = true;
                ordenarNotificaciones();
                renderizarNotificaciones();
                actualizarBadgeNotificaciones();
                actualizarContadores();
            }
        }
        
    } catch (error) {
        console.error('Error al marcar notificación como leída:', error);
        // No mostrar error si es solo para actualizar UI
    }
}

/**
 * Marca todas las notificaciones como leídas
 */
async function marcarTodasLeidas() {
    try {
        const noLeidas = notificaciones.filter(n => !n.leida);
        if (noLeidas.length === 0) {
            mostrarNotificacionNotif('info', 'No hay notificaciones sin leer');
            return;
        }
        
        mostrarLoading();
        
        const response = await API.marcarTodasNotificacionesLeidas();
        
        if (response.success) {
            notificaciones.forEach(n => n.leida = true);
            ordenarNotificaciones();
            renderizarNotificaciones();
            actualizarBadgeNotificaciones();
            actualizarContadores();
            
            mostrarNotificacionNotif('success', response.message || 'Todas las notificaciones marcadas como leídas');
        } else {
            throw new Error(response.message || 'Error al marcar las notificaciones');
        }
        
    } catch (error) {
        console.error('Error al marcar todas las notificaciones como leídas:', error);
        mostrarNotificacionNotif('error', error.message || 'No se pudieron marcar las notificaciones como leídas');
    } finally {
        ocultarLoading();
    }
}

// ===================================
// ELIMINAR NOTIFICACIONES
// ===================================

/**
 * Elimina una notificación
 */
async function eliminarNotificacion(notificacionId) {
    try {
        const response = await API.deleteNotificacion(notificacionId);
        
        if (response.success) {
            notificaciones = notificaciones.filter(n => n.id !== notificacionId);
            renderizarNotificaciones();
            actualizarBadgeNotificaciones();
            actualizarContadores();
            
            mostrarNotificacionNotif('success', response.message || 'Notificación eliminada');
        } else {
            throw new Error(response.message || 'Error al eliminar la notificación');
        }
        
    } catch (error) {
        console.error('Error al eliminar notificación:', error);
        mostrarNotificacionNotif('error', error.message || 'No se pudo eliminar la notificación');
    }
}

/**
 * Elimina todas las notificaciones leídas
 */
async function eliminarLeidas() {
    const confirmado = await (window.mostrarConfirmacionToasty
        ? window.mostrarConfirmacionToasty({
            mensaje: '¿Eliminar todas las notificaciones leídas?',
            tipo: 'warning',
            textoConfirmar: 'Eliminar',
            textoCancelar: 'Cancelar'
        })
        : Promise.resolve(confirm('¿Estás seguro de que deseas eliminar todas las notificaciones leídas?')));

    if (!confirmado) {
        return;
    }
    
    try {
        mostrarLoading();
        
        const leidas = notificaciones.filter(n => n.leida);
        
        // Eliminar cada notificación leída
        for (const notif of leidas) {
            try {
                await API.deleteNotificacion(notif.id);
            } catch (error) {
                console.error(`Error al eliminar notificación ${notif.id}:`, error);
            }
        }
        
        // Recargar notificaciones
        await cargarNotificaciones(filtroActual);
        
        mostrarNotificacionNotif('success', 'Notificaciones leídas eliminadas');
        
    } catch (error) {
        console.error('Error al eliminar notificaciones leídas:', error);
        mostrarNotificacionNotif('error', error.message || 'No se pudieron eliminar las notificaciones');
    } finally {
        ocultarLoading();
    }
}

// ===================================
// FILTROS
// ===================================

/**
 * Cambia el filtro de notificaciones
 */
function cambiarFiltroNotificaciones(filtro) {
    filtroActual = filtro;
    
    // Recargar notificaciones con el filtro
    if (filtro === 'noLeidas') {
        cargarNotificaciones('noLeidas');
    } else {
        cargarNotificaciones('todas');
    }
    
    // Actualizar botones de filtro
    document.querySelectorAll('[name="filtro"]').forEach(radio => {
        if (radio.id === filtro) {
            radio.checked = true;
        }
    });
}

// ===================================
// ACTUALIZAR BADGE
// ===================================

/**
 * Actualiza el badge de notificaciones no leídas
 */
function actualizarBadgeNotificaciones() {
    const noLeidas = notificaciones.filter(n => !n.leida).length;
    
    // Actualizar badge en el dropdown
    const badges = document.querySelectorAll('#notificacionesDropdown .badge');
    badges.forEach(badge => {
        if (noLeidas > 0) {
            badge.textContent = noLeidas > 99 ? '99+' : noLeidas;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    });
    
    // Actualizar título de la página si existe
    const tituloPagina = document.querySelector('title');
    if (tituloPagina && noLeidas > 0) {
        const tituloBase = tituloPagina.textContent.replace(/^\(\d+\)\s*/, '');
        tituloPagina.textContent = `(${noLeidas}) ${tituloBase}`;
    }
}

/**
 * Actualiza los contadores de los filtros
 */
function actualizarContadoresFiltros() {
    const total = notificaciones.length;
    const noLeidas = notificaciones.filter(n => !n.leida).length;
    const comentarios = notificaciones.filter(n => n.tipo === 'comentario').length;
    const menciones = notificaciones.filter(n => n.tipo === 'mencion').length;
    const calendario = notificaciones.filter(n => n.tipo === 'calendario').length;
    const leidas = notificaciones.filter(n => n.leida).length;
    
    // Actualizar labels de los filtros
    const contadores = {
        todas: total,
        noLeidas: noLeidas,
        comentarios: comentarios,
        menciones: menciones,
        calendario: calendario,
        leidas: leidas
    };
    
    Object.keys(contadores).forEach(filtro => {
        const label = document.querySelector(`label[for="${filtro}"]`);
        if (label) {
            const texto = label.textContent.replace(/\s*\(\d+\)\s*$/, '');
            label.textContent = `${texto} (${contadores[filtro]})`;
        }
    });
}

/**
 * Actualiza los contadores en el sidebar
 */
function actualizarContadores() {
    const total = notificaciones.length;
    const noLeidas = notificaciones.filter(n => !n.leida).length;
    
    // Actualizar contadores en el sidebar
    const contadorTotal = document.querySelector('[data-notif-total]');
    if (contadorTotal) {
        contadorTotal.textContent = total;
    }
    
    const contadorNoLeidas = document.querySelector('[data-notif-no-leidas]');
    if (contadorNoLeidas) {
        contadorNoLeidas.textContent = noLeidas;
    }
    
    // Actualizar contadores de filtros
    actualizarContadoresFiltros();
}

// ===================================
// POLLING (ACTUALIZACIÓN AUTOMÁTICA)
// ===================================

/**
 * Inicia el polling de notificaciones
 */
function iniciarPollingNotificaciones() {
    if (pollingTimer) {
        clearInterval(pollingTimer);
    }
    
    pollingTimer = setInterval(() => {
        cargarNotificaciones();
    }, NotificationsConfig.pollingInterval);
}

/**
 * Detiene el polling de notificaciones
 */
function detenerPollingNotificaciones() {
    if (pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
    }
}

// ===================================
// INICIALIZACIÓN
// ===================================

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        cargarNotificaciones();
        iniciarPollingNotificaciones();
        
        // Actualizar dropdown cada vez que se abre
        const dropdown = document.getElementById('notificacionesDropdown');
        if (dropdown) {
            dropdown.addEventListener('shown.bs.dropdown', function() {
                renderizarNotificacionesDropdown();
            });
        }
    });
} else {
    cargarNotificaciones();
    iniciarPollingNotificaciones();
    
    const dropdown = document.getElementById('notificacionesDropdown');
    if (dropdown) {
        dropdown.addEventListener('shown.bs.dropdown', function() {
            renderizarNotificacionesDropdown();
        });
    }
}

// Detener polling cuando la página se oculta
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        detenerPollingNotificaciones();
    } else {
        iniciarPollingNotificaciones();
        cargarNotificaciones();
    }
});

// ===================================
// FUNCIONES AUXILIARES
// ===================================

/**
 * Formatea el tiempo transcurrido desde una fecha
 */
function formatearTiempoTranscurrido(fecha) {
    if (typeof tiempoTranscurrido === 'function') {
        return tiempoTranscurrido(fecha);
    }
    
    const ahora = new Date();
    const diff = ahora - fecha;
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    const semanas = Math.floor(dias / 7);
    const meses = Math.floor(dias / 30);
    
    if (meses > 0) return `Hace ${meses} mes${meses > 1 ? 'es' : ''}`;
    if (semanas > 0) return `Hace ${semanas} semana${semanas > 1 ? 's' : ''}`;
    if (dias > 0) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
    if (horas > 0) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    if (minutos > 0) return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    return 'Ahora';
}

/**
 * Muestra un indicador de carga
 */
function mostrarLoading() {
    // Implementación básica si no existe
    if (typeof mostrarLoadingGlobal === 'function') {
        mostrarLoadingGlobal();
    }
}

/**
 * Oculta el indicador de carga
 */
function ocultarLoading() {
    // Implementación básica si no existe
    if (typeof ocultarLoadingGlobal === 'function') {
        ocultarLoadingGlobal();
    }
}

/**
 * Muestra una notificación (usa la función de api.js si está disponible)
 */
function mostrarNotificacionNotif(tipo, mensaje) {
    // Usar la función de api.js si está disponible
    if (typeof mostrarNotificacion === 'function' && window.mostrarNotificacion) {
        try {
            window.mostrarNotificacion(tipo, mensaje);
            return;
        } catch (e) {
            // Si falla, continuar con el fallback
        }
    }
    // Fallback: usar console o alert
    console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
    if (tipo === 'error') {
        alert(mensaje);
    }
}

// ===================================
// EXPORTAR FUNCIONES
// ===================================
window.cargarNotificaciones = cargarNotificaciones;
window.marcarNotificacionLeida = marcarNotificacionLeida;
window.marcarTodasLeidas = marcarTodasLeidas;
window.eliminarNotificacion = eliminarNotificacion;
window.eliminarLeidas = eliminarLeidas;
window.cambiarFiltroNotificaciones = cambiarFiltroNotificaciones;
window.actualizarBadgeNotificaciones = actualizarBadgeNotificaciones;

