/**
 * SEARCH.JS - Sistema de Búsqueda Avanzada
 * ========================================
 * Búsqueda de publicaciones, comentarios, usuarios, materias con filtros
 */

// ===================================
// CONFIGURACIÓN
// ===================================
const SearchConfig = {
    minLength: 3,
    debounceDelay: 300, // Reducido de 500ms a 300ms para mejor respuesta
    maxResults: 50,
    tipos: {
        publicacion: 'Publicación',
        comentario: 'Comentario',
        usuario: 'Usuario',
        materia: 'Materia',
        etiqueta: 'Etiqueta'
    }
};

function buildSearchPageUrl(params = {}) {
    const base = typeof buildFrontendUrl === 'function'
        ? buildFrontendUrl('search')
        : 'search';
    const baseHasQuery = base.includes('?');
    const query = new URLSearchParams(params).toString();
    if (!query) {
        return base;
    }
    return `${base}${baseHasQuery ? '&' : '?'}${query}`;
}

// ===================================
// VARIABLES GLOBALES
// ===================================
let resultadosBusqueda = [];
let busquedaActual = '';
let filtrosActivos = {
    tipo: 'todos',
    categoria: 'todas',
    materia: null,
    fecha: null,
    autor: null
};
let debounceTimer = null;

// ===================================
// INICIALIZACIÓN
// ===================================

/**
 * Inicializa el sistema de búsqueda
 */
function inicializarBusqueda() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    // Marcar que search.js está manejando la búsqueda
    searchInput.dataset.searchInitialized = 'true';
    
    // Búsqueda en tiempo real con debounce - NO redirige, solo muestra sugerencias
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.trim();
        
        clearTimeout(debounceTimer);
        
        if (query.length < SearchConfig.minLength) {
            ocultarResultadosBusqueda();
            return;
        }
        
        debounceTimer = setTimeout(() => {
            // Solo buscar y mostrar sugerencias, NO redirigir
            realizarBusqueda(query);
        }, SearchConfig.debounceDelay);
    });
    
    // Búsqueda al presionar Enter - redirigir a página de búsqueda completa
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            ocultarResultadosBusqueda();
            const query = e.target.value.trim();
            if (query.length >= SearchConfig.minLength) {
                // Redirigir a página de búsqueda completa
                const destino = buildSearchPageUrl({ q: query });
                window.location.href = destino;
            }
        }
    });
    
    // Búsqueda al enviar formulario - redirigir a página de búsqueda completa
    const searchForm = searchInput.closest('form');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            ocultarResultadosBusqueda();
            const query = searchInput.value.trim();
            if (query.length >= SearchConfig.minLength) {
                // Redirigir a página de búsqueda completa
                const destino = buildSearchPageUrl({ q: query });
                window.location.href = destino;
            }
        });
    }
    
    // Cerrar resultados al hacer click fuera
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) {
            ocultarResultadosBusqueda();
        }
    });
}

// ===================================
// REALIZAR BÚSQUEDA
// ===================================

/**
 * Realiza la búsqueda
 */
async function realizarBusqueda(query, filtros = {}) {
    try {
        busquedaActual = query;
        filtrosActivos = { ...filtrosActivos, ...filtros };
        
        mostrarLoading();
        
        const params = {
            q: query,
            tipo: filtrosActivos.tipo !== 'todos' ? filtrosActivos.tipo : undefined
        };
        
        const response = await API.buscar(params);
        
        if (response.success && response.data) {
            resultadosBusqueda = Array.isArray(response.data) ? response.data : [];
            mostrarResultadosBusqueda();
        } else {
            resultadosBusqueda = [];
            mostrarResultadosBusqueda();
            if (response.message) {
                mostrarNotificacion('info', response.message);
            }
        }
        
    } catch (error) {
        console.error('Error en la búsqueda:', error);
        mostrarNotificacion('error', 'Error al realizar la búsqueda');
    } finally {
        ocultarLoading();
    }
}

/**
 * Aplica los filtros activos a los resultados
 */
function aplicarFiltros() {
    if (filtrosActivos.tipo !== 'todos') {
        resultadosBusqueda = resultadosBusqueda.filter(r => r.tipo === filtrosActivos.tipo);
    }
    
    if (filtrosActivos.categoria !== 'todas') {
        resultadosBusqueda = resultadosBusqueda.filter(r => r.categoria === filtrosActivos.categoria);
    }
    
    if (filtrosActivos.materia) {
        resultadosBusqueda = resultadosBusqueda.filter(r => r.materia_id === filtrosActivos.materia);
    }
    
    if (filtrosActivos.fecha) {
        const fecha = new Date(filtrosActivos.fecha);
        resultadosBusqueda = resultadosBusqueda.filter(r => {
            const fechaResultado = new Date(r.fecha);
            return fechaResultado >= fecha;
        });
    }
}

// ===================================
// MOSTRAR RESULTADOS
// ===================================

/**
 * Muestra los resultados de la búsqueda
 */
function mostrarResultadosBusqueda() {
    // Buscar contenedor de resultados en dropdown
    const dropdown = document.querySelector('.search-container .dropdown-menu');
    if (dropdown) {
        renderizarResultadosDropdown(dropdown);
        return;
    }
    
    // Buscar contenedor de resultados en página
    const contenedor = document.getElementById('resultadosBusqueda');
    if (contenedor) {
        renderizarResultadosPagina(contenedor);
        return;
    }
    
    // Si no hay contenedor, crear dropdown dinámico
    crearDropdownResultados();
}

/**
 * Renderiza los resultados en el dropdown
 */
function renderizarResultadosDropdown(dropdown) {
    dropdown.innerHTML = '';
    
    if (resultadosBusqueda.length === 0) {
        dropdown.innerHTML = `
            <li class="dropdown-item-text text-muted text-center py-3">
                <i class="fas fa-search fa-2x mb-2 d-block"></i>
                <small>No se encontraron resultados</small>
            </li>
        `;
        return;
    }
    
    // Agrupar por tipo
    const agrupados = agruparResultadosPorTipo();
    
    Object.keys(agrupados).forEach(tipo => {
        const resultados = agrupados[tipo];
        
        // Header del tipo
        const header = document.createElement('li');
        header.className = 'dropdown-header fw-bold';
        header.textContent = SearchConfig.tipos[tipo] || tipo.charAt(0).toUpperCase() + tipo.slice(1);
        dropdown.appendChild(header);
        
        // Resultados del tipo (máximo 3 por tipo en dropdown)
        resultados.slice(0, 3).forEach(resultado => {
            const item = crearElementoResultadoDropdown(resultado);
            dropdown.appendChild(item);
        });
        
        // Ver más si hay más resultados
        if (resultados.length > 3) {
            const verMas = document.createElement('li');
            verMas.innerHTML = `
                <a class="dropdown-item text-center text-primary" href="${buildSearchPageUrl({ q: busquedaActual, tipo: tipo })}">
                    <small><i class="fas fa-arrow-right me-1"></i>Ver ${resultados.length - 3} más de ${SearchConfig.tipos[tipo] || tipo}...</small>
                </a>
            `;
            dropdown.appendChild(verMas);
        }
    });
    
    // Link para ver todos los resultados
    const verTodos = document.createElement('li');
    verTodos.innerHTML = `
        <hr class="dropdown-divider">
        <a class="dropdown-item text-center fw-bold text-primary" href="${buildSearchPageUrl({ q: busquedaActual })}">
            <i class="fas fa-search me-2"></i>Ver todos los resultados (${resultadosBusqueda.length})
        </a>
    `;
    dropdown.appendChild(verTodos);
}

/**
 * Renderiza los resultados en la página completa
 */
function renderizarResultadosPagina(contenedor) {
    contenedor.innerHTML = '';
    
    if (resultadosBusqueda.length === 0) {
        contenedor.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="fas fa-search fa-3x mb-3"></i>
                <h5>No se encontraron resultados</h5>
                <p>Intenta con otros términos de búsqueda</p>
            </div>
        `;
        return;
    }
    
    // Agrupar por tipo
    const agrupados = agruparResultadosPorTipo();
    
    Object.keys(agrupados).forEach(tipo => {
        const resultados = agrupados[tipo];
        
        // Sección del tipo
        const section = document.createElement('div');
        section.className = 'mb-4';
        section.innerHTML = `
            <h5 class="fw-bold mb-3">
                <i class="fas fa-${obtenerIconoTipo(tipo)} me-2"></i>
                ${SearchConfig.tipos[tipo]} (${resultados.length})
            </h5>
        `;
        
        const resultadosDiv = document.createElement('div');
        resultados.forEach(resultado => {
            const elemento = crearElementoResultadoPagina(resultado);
            resultadosDiv.appendChild(elemento);
        });
        
        section.appendChild(resultadosDiv);
        contenedor.appendChild(section);
    });
}

/**
 * Crea un dropdown dinámico para los resultados
 */
function crearDropdownResultados() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    // Buscar o crear contenedor
    let contenedor = searchInput.closest('.search-container');
    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.className = 'search-container position-relative';
        const parent = searchInput.parentElement;
        if (parent) {
            parent.insertBefore(contenedor, searchInput);
            contenedor.appendChild(searchInput);
        }
    }
    
    // Asegurar que el contenedor tenga position relative
    if (window.getComputedStyle(contenedor).position === 'static') {
        contenedor.style.position = 'relative';
    }
    
    // Crear dropdown
    let dropdown = contenedor.querySelector('.dropdown-menu');
    if (!dropdown) {
        dropdown = document.createElement('ul');
        dropdown.className = 'dropdown-menu position-absolute w-100';
        dropdown.style.top = '100%';
        dropdown.style.left = '0';
        dropdown.style.zIndex = '1000';
        dropdown.style.maxHeight = '400px';
        dropdown.style.overflowY = 'auto';
        dropdown.style.marginTop = '0.125rem';
        dropdown.style.borderRadius = '0.375rem';
        dropdown.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)';
        contenedor.appendChild(dropdown);
    }
    
    dropdown.classList.add('show');
    renderizarResultadosDropdown(dropdown);
}

/**
 * Agrupa los resultados por tipo
 */
function agruparResultadosPorTipo() {
    const agrupados = {};
    
    resultadosBusqueda.forEach(resultado => {
        if (!agrupados[resultado.tipo]) {
            agrupados[resultado.tipo] = [];
        }
        agrupados[resultado.tipo].push(resultado);
    });
    
    return agrupados;
}

/**
 * Crea el elemento HTML de un resultado para el dropdown
 */
function crearElementoResultadoDropdown(resultado) {
    const li = document.createElement('li');
    let contenido = '';
    
    switch (resultado.tipo) {
        case 'publicacion':
            contenido = `
                <a class="dropdown-item" href="${typeof buildFrontendUrl === 'function' ? buildFrontendUrl(`post?id=${resultado.id}`) : `post?id=${resultado.id}`}">
                    <div class="d-flex align-items-start">
                        <i class="fas fa-file-alt text-primary me-2 mt-1"></i>
                        <div class="flex-grow-1">
                            <strong class="d-block">${resaltarTexto(resultado.titulo, busquedaActual)}</strong>
                            <small class="text-muted">${resultado.materia} • ${tiempoTranscurrido(resultado.fecha)}</small>
                        </div>
                    </div>
                </a>
            `;
            break;
            
        case 'comentario':
            contenido = `
                <a class="dropdown-item" href="${typeof buildFrontendUrl === 'function' ? buildFrontendUrl(`post?id=${resultado.publicacion_id}`) : `post?id=${resultado.publicacion_id}`}">
                    <div class="d-flex align-items-start">
                        <i class="fas fa-comment text-info me-2 mt-1"></i>
                        <div class="flex-grow-1">
                            <strong class="d-block">${resaltarTexto(resultado.publicacion, busquedaActual)}</strong>
                            <small class="text-muted">${resultado.autor} • ${tiempoTranscurrido(resultado.fecha)}</small>
                        </div>
                    </div>
                </a>
            `;
            break;
            
        case 'usuario':
            contenido = `
                <a class="dropdown-item" href="${typeof buildFrontendUrl === 'function' ? buildFrontendUrl(`perfil?usuario=${resultado.id}`) : `perfil?usuario=${resultado.id}`}">
                    <div class="d-flex align-items-center">
                        <img src="${obtenerAvatarResultado(resultado)}" class="rounded-circle me-3" width="36" height="36" alt="${resultado.nombre}">
                        <div>
                            <strong>${resaltarTexto(resultado.nombre, busquedaActual)}</strong>
                            <small class="text-muted d-block text-capitalize">${resultado.rol}</small>
                        </div>
                    </div>
                </a>
            `;
            break;
            
        default:
            contenido = `<li class="dropdown-item-text">${JSON.stringify(resultado)}</li>`;
    }
    
    li.innerHTML = contenido;
    return li;
}

/**
 * Crea el elemento HTML de un resultado para la página completa
 */
function crearElementoResultadoPagina(resultado) {
    const div = document.createElement('div');
    div.className = 'card border-0 shadow-sm mb-3';
    
    let contenido = '';
    
    switch (resultado.tipo) {
        case 'publicacion':
            contenido = `
                <div class="card-body">
                    <h5 class="fw-bold">
                        <a href="${typeof buildFrontendUrl === 'function' ? buildFrontendUrl(`post?id=${resultado.id}`) : `post?id=${resultado.id}`}" class="text-decoration-none">
                            ${resaltarTexto(resultado.titulo, busquedaActual)}
                        </a>
                    </h5>
                    <p class="text-muted">${truncarTexto(resultado.contenido, 200)}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">
                            <i class="fas fa-user me-1"></i> ${resultado.autor} • 
                            <i class="fas fa-book me-1"></i> ${resultado.materia} • 
                            ${tiempoTranscurrido(resultado.fecha)}
                        </small>
                        <span class="badge bg-${obtenerColorCategoria(resultado.categoria)}">${resultado.categoria}</span>
                    </div>
                </div>
            `;
            break;
            
        case 'comentario':
            contenido = `
                <div class="card-body">
                    <p>${resaltarTexto(truncarTexto(resultado.contenido, 200), busquedaActual)}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">
                            <i class="fas fa-user me-1"></i> ${resultado.autor} • 
                            En: ${resultado.publicacion} • 
                            ${tiempoTranscurrido(resultado.fecha)}
                        </small>
                        <a href="${typeof buildFrontendUrl === 'function' ? buildFrontendUrl(`post?id=${resultado.publicacion_id}`) : `post?id=${resultado.publicacion_id}`}" class="btn btn-sm btn-outline-primary">
                            Ver publicación
                        </a>
                    </div>
                </div>
            `;
            break;
            
        case 'usuario':
            contenido = `
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <img src="${obtenerAvatarResultado(resultado)}" class="rounded-circle me-3" width="60" height="60" alt="${resultado.nombre}">
                        <div class="flex-grow-1">
                            <h5 class="fw-bold mb-1">${resultado.nombre}</h5>
                            <p class="text-muted mb-2">${resultado.rol}</p>
                            <small class="text-muted">${resultado.publicaciones} publicaciones</small>
                        </div>
                        <a href="${typeof buildFrontendUrl === 'function' ? buildFrontendUrl(`perfil?usuario=${resultado.id}`) : `perfil?usuario=${resultado.id}`}" class="btn btn-primary">
                            Ver perfil
                        </a>
                    </div>
                </div>
            `;
            break;
    }
    
    div.innerHTML = contenido;
    return div;
}

// ===================================
// FILTROS
// ===================================

/**
 * Aplica un filtro a la búsqueda
 */
function aplicarFiltroBusqueda(filtro, valor) {
    filtrosActivos[filtro] = valor;
    realizarBusqueda(busquedaActual, filtrosActivos);
}

/**
 * Limpia todos los filtros
 */
function limpiarFiltrosBusqueda() {
    filtrosActivos = {
        tipo: 'todos',
        categoria: 'todas',
        materia: null,
        fecha: null,
        autor: null
    };
    realizarBusqueda(busquedaActual);
}

// ===================================
// UTILIDADES
// ===================================

/**
 * Resalta el texto de búsqueda en el resultado
 */
function resaltarTexto(texto, busqueda) {
    if (!busqueda) return texto;
    
    const regex = new RegExp(`(${busqueda})`, 'gi');
    return texto.replace(regex, '<mark>$1</mark>');
}

/**
 * Obtiene el icono según el tipo de resultado
 */
function obtenerIconoTipo(tipo) {
    const iconos = {
        publicacion: 'file-alt',
        comentario: 'comment',
        usuario: 'user',
        materia: 'book',
        etiqueta: 'tag'
    };
    return iconos[tipo] || 'search';
}

/**
 * Obtiene el color según la categoría
 */
function obtenerColorCategoria(categoria) {
    const colores = {
        duda: 'primary',
        recurso: 'success',
        aviso: 'warning',
        discusion: 'info'
    };
    return colores[categoria] || 'secondary';
}

/**
 * Oculta los resultados de búsqueda
 */
function ocultarResultadosBusqueda() {
    const dropdown = document.querySelector('.search-container .dropdown-menu');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
}

/**
 * Muestra todos los resultados de un tipo
 */
function mostrarTodosResultados(tipo) {
    window.location.href = buildSearchPageUrl({ q: busquedaActual, tipo });
}

// ===================================
// BÚSQUEDA AVANZADA
// ===================================

/**
 * Abre el modal de búsqueda avanzada
 */
function abrirBusquedaAvanzada() {
    const modal = new bootstrap.Modal(document.getElementById('busquedaAvanzadaModal'));
    modal.show();
}

/**
 * Realiza una búsqueda avanzada
 */
function realizarBusquedaAvanzada() {
    const form = document.getElementById('formBusquedaAvanzada');
    if (!form) return;
    
    const formData = new FormData(form);
    const filtros = {
        tipo: formData.get('tipo') || 'todos',
        categoria: formData.get('categoria') || 'todas',
        materia: formData.get('materia') || null,
        fecha: formData.get('fecha') || null,
        autor: formData.get('autor') || null
    };
    
    const query = document.getElementById('searchInput').value.trim();
    realizarBusqueda(query, filtros);
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('busquedaAvanzadaModal'));
    if (modal) {
        modal.hide();
    }
}

// ===================================
// INICIALIZACIÓN
// ===================================

// Inicializar inmediatamente si el DOM está listo, o esperar al DOMContentLoaded
// Esto asegura que search.js tiene prioridad sobre otros scripts
function initSearchSystem() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        // Marcar inmediatamente para evitar que otros scripts interfieran
        searchInput.dataset.searchInitialized = 'true';
        inicializarBusqueda();
    }
}

// Intentar inicializar inmediatamente si el DOM está listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearchSystem);
} else {
    // DOM ya está listo, inicializar inmediatamente
    initSearchSystem();
}

// También intentar inicializar después de un pequeño delay por si hay conflictos
setTimeout(initSearchSystem, 50);

// ===================================
// EXPORTAR FUNCIONES
// ===================================
window.inicializarBusqueda = inicializarBusqueda;
window.realizarBusqueda = realizarBusqueda;
window.aplicarFiltroBusqueda = aplicarFiltroBusqueda;
window.limpiarFiltrosBusqueda = limpiarFiltrosBusqueda;
window.abrirBusquedaAvanzada = abrirBusquedaAvanzada;
window.realizarBusquedaAvanzada = realizarBusquedaAvanzada;
window.mostrarTodosResultados = mostrarTodosResultados;

function obtenerAvatarResultado(resultado = {}) {
    if (typeof normalizarAvatar === 'function') {
        return normalizarAvatar(resultado.avatar || resultado.avatar_url, resultado.nombre || resultado.titulo, resultado.apellidos || '');
    }
    const iniciales = `${resultado.nombre?.[0] || 'U'}${resultado.apellidos?.[0] || ''}`.toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(iniciales)}&background=FF6600&color=fff&size=96`;
}

