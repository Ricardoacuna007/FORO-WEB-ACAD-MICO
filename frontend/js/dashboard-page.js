/**
 * DASHBOARD-PAGE.JS
 * Lógica específica para la página de dashboard
 */

let usuarioDashboard = null;
let materiasCarreraDashboard = [];

document.addEventListener('DOMContentLoaded', async function () {
    try {
        usuarioDashboard = await cargarDatosUsuario();
        await cargarSidebarCarrera();
        await Promise.all([
            cargarEstadisticas(),
            cargarPublicacionesDestacadas(),
            cargarProximosEventos(),
            cargarMateriasParaFormulario()
        ]);
    } catch (error) {
        console.error('Error al inicializar el dashboard:', error);
    }

    const formPublicacion = document.getElementById('crearPostForm');
    if (formPublicacion) {
        formPublicacion.addEventListener('submit', async function (e) {
            e.preventDefault();
            await enviarNuevaPublicacionDesdeDashboard();
        });
    }

    const btnPublicar = document.getElementById('btnPublicar');
    if (btnPublicar) {
        btnPublicar.addEventListener('click', async function () {
            await enviarNuevaPublicacionDesdeDashboard();
        });
    }

    // El formulario de búsqueda será manejado por search.js si está cargado
    // Solo configurar listener si search.js no está presente
    const searchForm = document.querySelector('form[role="search"]');
    const searchInput = document.getElementById('searchInput');
    
    if (searchForm && searchInput && !searchInput.dataset.searchInitialized) {
        // Esperar un momento para que search.js se cargue
        setTimeout(() => {
            if (!searchInput.dataset.searchInitialized) {
                searchForm.addEventListener('submit', function (e) {
                    e.preventDefault();
                    const query = searchInput.value.trim();
                    if (query.length >= 3) {
                        const destinoBusqueda = typeof buildFrontendUrl === 'function'
                            ? buildFrontendUrl(`search?q=${encodeURIComponent(query)}`)
                            : `search?q=${encodeURIComponent(query)}`;
                        window.location.href = destinoBusqueda;
                    }
                });
            }
        }, 200);
    }

    const marcarTodasLink = document.getElementById('marcarNotificacionesLeidas');
    if (marcarTodasLink) {
        marcarTodasLink.addEventListener('click', async (event) => {
            event.preventDefault();
            await marcarNotificacionesNavbar();
        });
    }
});

async function cargarDatosUsuario() {
    try {
        const response = await API.me();
        if (response.success && response.data) {
            usuarioDashboard = response.data.user || response.data;
            localStorage.setItem('user_data', JSON.stringify(usuarioDashboard));
        }
    } catch (error) {
        console.warn('No se pudo refrescar la sesión desde la API:', error);
        const stored = localStorage.getItem('user_data');
        if (stored) {
            usuarioDashboard = JSON.parse(stored);
        }
    }

    if (!usuarioDashboard) {
        return null;
    }

    actualizarDatosUsuarioUI(usuarioDashboard);
    return usuarioDashboard;
}

function actualizarDatosUsuarioUI(usuario) {
    const nombre = usuario.nombre || 'Usuario';
    const apellidos = usuario.apellidos || '';
    const email = usuario.email || '';
    const avatarUrl = usuario.avatar_url || usuario.avatar || generarAvatarUrl(nombre, apellidos);

    const nombreDashboard = document.getElementById('nombreDashboard');
    if (nombreDashboard) nombreDashboard.textContent = nombre;

    const nombreNavbar = document.getElementById('nombreUsuario');
    if (nombreNavbar) nombreNavbar.textContent = nombre;

    const nombreCompleto = document.getElementById('nombreUsuarioCompleto');
    if (nombreCompleto) nombreCompleto.textContent = `${nombre} ${apellidos}`.trim();

    const emailUsuario = document.getElementById('emailUsuario');
    if (emailUsuario) emailUsuario.textContent = email;

    const avatarNavbar = document.getElementById('navbarAvatar');
    if (avatarNavbar) {
        const tamanoNavbar = avatarNavbar.width || 35;
        avatarNavbar.src = typeof normalizarAvatar === 'function'
            ? normalizarAvatar(avatarUrl, nombre, apellidos, tamanoNavbar)
            : avatarUrl;
    }

    const avatarDetalle = document.getElementById('navbarAvatarDetalle');
    if (avatarDetalle) {
        const tamanoDetalle = avatarDetalle.width || 60;
        avatarDetalle.src = typeof normalizarAvatar === 'function'
            ? normalizarAvatar(avatarUrl, nombre, apellidos, tamanoDetalle)
            : avatarUrl;
    }
}

function generarAvatarUrl(nombre, apellidos) {
    const texto = `${nombre || ''} ${apellidos || ''}`.trim() || 'Usuario';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(texto)}&background=FF6600&color=fff&size=64`;
}

function obtenerCarreraIdDesdeUsuario(usuario = usuarioDashboard) {
    if (!usuario) return null;
    if (usuario.rol === 'estudiante') {
        return usuario.estudiante?.carrera?.id || usuario.estudiante?.carrera_id || null;
    }
    return null;
}

async function cargarSidebarCarrera() {
    const container = document.getElementById('sidebarCarreraSection');
    if (!container) return;

    if (!usuarioDashboard) {
        container.innerHTML = `
            <h6 class="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted text-uppercase">
                <span>Mi Carrera</span>
            </h6>
            <div class="px-3 small text-muted">
                No pudimos cargar la información de tu carrera.
            </div>
        `;
        return;
    }

    try {
        await cargarMateriasUsuario();
        container.innerHTML = construirSidebarHtml(usuarioDashboard, materiasCarreraDashboard);
    } catch (error) {
        console.error('Error al construir el sidebar:', error);
        container.innerHTML = `
            <h6 class="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted text-uppercase">
                <span>Mi Carrera</span>
            </h6>
            <div class="px-3 small text-danger">
                Ocurrió un error al cargar tus materias.
            </div>
        `;
    }
}

async function cargarMateriasUsuario() {
    if (!usuarioDashboard) return [];

    const carreraId = obtenerCarreraIdDesdeUsuario(usuarioDashboard);
    const params = carreraId ? { carrera_id: carreraId } : {};

    try {
        const response = await API.getMaterias(params);
        materiasCarreraDashboard = Array.isArray(response?.data) ? response.data : [];
    } catch (error) {
        console.error('Error al cargar materias del usuario:', error);
        materiasCarreraDashboard = [];
    }

    return materiasCarreraDashboard;
}

function construirSidebarHtml(usuario, materias) {
    if (usuario.rol === 'estudiante') {
        const carrera = usuario.estudiante?.carrera;
        const cuatrimestreActual = usuario.estudiante?.cuatrimestre_actual;

        if (!Array.isArray(materias) || materias.length === 0) {
            return `
                <h6 class="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted text-uppercase">
                    <span>Mi Carrera</span>
                </h6>
                <div class="px-3 small text-muted">
                    Aún no tienes materias asignadas en tu carrera.
                </div>
            `;
        }

        const grupos = agruparMateriasPorCuatrimestre(materias);
        const carreraNombre = carrera?.nombre || 'Carrera no asignada';

        let html = `
            <h6 class="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted text-uppercase">
                <span>Mi Carrera</span>
            </h6>
            <div class="px-3 mb-3">
                <p class="fw-semibold mb-1">${carreraNombre}</p>
                ${cuatrimestreActual ? `<p class="text-muted small mb-0">Cuatrimestre actual: ${cuatrimestreActual}°</p>` : ''}
            </div>
        `;

        grupos.forEach(grupo => {
            const heading = grupo.numero
                ? `${grupo.numero}° Cuatrimestre`
                : 'Materias adicionales';
            const destacar = grupo.numero && cuatrimestreActual === grupo.numero;
            html += `
                <div class="px-3 mt-3">
                    <p class="text-muted text-uppercase small fw-semibold mb-1 ${destacar ? 'text-primary' : ''}">
                        <i class="fas fa-folder me-2"></i>${heading}
                    </p>
                    <ul class="nav flex-column">
                        ${grupo.materias.map(crearLinkMateria).join('')}
                    </ul>
                </div>
            `;
        });

        return html;
    }

    if (Array.isArray(materias) && materias.length > 0) {
        return `
            <h6 class="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted text-uppercase">
                <span>Materias disponibles</span>
            </h6>
            <div class="px-3 mt-2">
                <ul class="nav flex-column">
                    ${materias.slice(0, 15).map(crearLinkMateria).join('')}
                    ${materias.length > 15 ? '<li class="nav-item small text-muted mt-2">Mostrando primeras 15 materias</li>' : ''}
                </ul>
            </div>
        `;
    }

    return `
        <h6 class="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted text-uppercase">
            <span>Materias</span>
        </h6>
        <div class="px-3 small text-muted">
            No hay materias disponibles para mostrar.
        </div>
    `;
}

function agruparMateriasPorCuatrimestre(materias) {
    const mapa = new Map();
    materias.forEach(materia => {
        const numero = materia.cuatrimestre?.numero ?? null;
        const key = numero ?? 'otros';
        if (!mapa.has(key)) {
            mapa.set(key, []);
        }
        mapa.get(key).push(materia);
    });

    return Array.from(mapa.entries()).map(([numero, materiasGrupo]) => ({
        numero: numero === 'otros' ? null : Number(numero),
        materias: materiasGrupo.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))
    })).sort((a, b) => {
        if (a.numero === null) return 1;
        if (b.numero === null) return -1;
        return a.numero - b.numero;
    });
}

function crearLinkMateria(materia) {
    const url = typeof buildFrontendUrl === 'function'
        ? buildFrontendUrl(`materia?id=${materia.id}`)
        : `materia?id=${materia.id}`;
    return `
        <li class="nav-item">
            <a class="nav-link small" href="${url}">
                <i class="fas fa-book me-2"></i> ${materia.nombre || 'Materia'}
            </a>
        </li>
    `;
}

// Cargar estadísticas
async function cargarEstadisticas() {
    try {
        const response = await API.getPerfil();
        if (response.success && response.data) {
            const estadisticas = response.data.estadisticas || {};
            
            // Actualizar usando los data-stat attributes
            const statPublicaciones = document.querySelector('[data-stat="publicaciones"]');
            const statComentarios = document.querySelector('[data-stat="comentarios"]');
            const statRespuestasUtiles = document.querySelector('[data-stat="respuestas_utiles"]');
            const statEventos = document.querySelector('[data-stat="eventos"]');
            
            if (statPublicaciones) statPublicaciones.textContent = estadisticas.publicaciones || 0;
            if (statComentarios) statComentarios.textContent = estadisticas.comentarios || 0;
            if (statRespuestasUtiles) statRespuestasUtiles.textContent = estadisticas.respuestas_utiles || 0;
            if (statEventos) statEventos.textContent = estadisticas.eventos || 0;
        }
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        // Mostrar 0 en caso de error
        const stats = document.querySelectorAll('[data-stat]');
        stats.forEach(stat => {
            if (stat.textContent.trim() === '') {
                stat.textContent = '0';
            }
        });
    }
}

// Cargar publicaciones destacadas
async function cargarPublicacionesDestacadas() {
    try {
        const carreraId = obtenerCarreraIdDesdeUsuario();
        const response = await API.getPublicacionesDestacadas(carreraId ? { carrera_id: carreraId } : {});
        const contenedor = document.getElementById('publicacionesDestacadas');
        
        if (response.success && Array.isArray(response.data) && contenedor) {
            if (response.data.length === 0) {
                contenedor.innerHTML = `
                    <div class="text-center py-4 text-muted">
                        <i class="fas fa-inbox fa-2x mb-2"></i>
                        <p>No hay publicaciones destacadas aún</p>
                    </div>
                `;
                return;
            }
            
            contenedor.innerHTML = '';
            response.data.slice(0, 5).forEach(publicacion => {
                const categoria = publicacion.categoria || 'discusion';
                const categoriaColors = {
                    duda: 'primary',
                    recurso: 'success',
                    aviso: 'warning',
                    discusion: 'info'
                };
                const color = categoriaColors[categoria] || 'secondary';
                
                const fecha = new Date(publicacion.created_at);
                const tiempoTranscurrido = tiempoTranscurridoDesde(fecha);
                
                const autorNombre = publicacion.autor?.nombre_completo || 
                                  `${publicacion.autor?.nombre || ''} ${publicacion.autor?.apellidos || ''}`.trim() || 
                                  'Usuario';
                
                const item = document.createElement('a');
                const enlacePost = typeof buildFrontendUrl === 'function'
                    ? buildFrontendUrl(`post?id=${publicacion.id}`)
                    : `post?id=${publicacion.id}`;
                item.href = enlacePost;
                item.className = 'list-group-item list-group-item-action';
                item.innerHTML = `
                    <div class="d-flex w-100 justify-content-between">
                        <h3 class="h6 mb-1">
                            <span class="badge bg-${color} me-2">${categoria.charAt(0).toUpperCase() + categoria.slice(1)}</span>
                            ${publicacion.titulo}
                        </h3>
                        <small class="text-muted">${tiempoTranscurrido}</small>
                    </div>
                    <p class="mb-1 text-muted">${truncarContenidoDashboard(publicacion.contenido, 100)}</p>
                    <small class="text-muted">
                        <i class="fas fa-user me-1"></i> ${autorNombre} • 
                        <i class="fas fa-book me-1"></i> ${publicacion.materia?.nombre || 'Materia'} • 
                        <i class="fas fa-comment me-1"></i> ${publicacion.comentarios_count || 0} respuestas
                    </small>
                `;
                contenedor.appendChild(item);
            });
        } else if (contenedor) {
            contenedor.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                    <p>${response.message || 'No se pudieron cargar las publicaciones destacadas'}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error al cargar publicaciones destacadas:', error);
        const contenedor = document.getElementById('publicacionesDestacadas');
        if (contenedor) {
            contenedor.innerHTML = `
                <div class="text-center py-4 text-danger">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                    <p>Error al cargar publicaciones</p>
                </div>
            `;
        }
    }
}

// Cargar eventos próximos
async function cargarProximosEventos() {
    try {
        const fechaHoy = new Date().toISOString().split('T')[0];
        const response = await API.getEventos({
            fecha_inicio: fechaHoy
        });
        
        const contenedor = document.getElementById('proximosEventosDashboard');
        if (response.success && response.data && contenedor) {
            const cards = document.querySelectorAll('.row.g-3 .card-body h3');
            if (cards.length >= 4) {
                const eventosProximos = response.data.filter(e => {
                    const fechaEvento = new Date(e.fecha_inicio);
                    return fechaEvento >= new Date();
                });
                cards[3].textContent = eventosProximos.length || 0;
            }
            
            if (response.data.length === 0) {
                contenedor.innerHTML = `
                    <div class="text-center py-4 text-muted">
                        <i class="fas fa-calendar-times fa-2x mb-2"></i>
                        <p>No hay eventos próximos</p>
                    </div>
                `;
                return;
            }
            
            const eventosFuturos = response.data
                .filter(e => {
                    const fechaEvento = new Date(e.fecha_inicio);
                    return fechaEvento >= new Date();
                })
                .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio))
                .slice(0, 3);
            
            if (eventosFuturos.length === 0) {
                contenedor.innerHTML = `
                    <div class="text-center py-4 text-muted">
                        <i class="fas fa-calendar-times fa-2x mb-2"></i>
                        <p>No hay eventos próximos</p>
                    </div>
                `;
                return;
            }
            
            contenedor.innerHTML = '';
            eventosFuturos.forEach(evento => {
                const fecha = new Date(evento.fecha_inicio);
                const dia = fecha.getDate();
                const mes = fecha.toLocaleDateString('es-MX', { month: 'short' }).toUpperCase();
                
                const tipo = evento.tipo || 'evento';
                let colorClass = 'bg-primary';
                if (tipo === 'examen') colorClass = 'bg-danger';
                else if (tipo === 'tarea') colorClass = 'bg-warning';
                else if (tipo === 'evento') colorClass = 'bg-success';
                else if (tipo === 'aviso') colorClass = 'bg-info';
                
                const tieneHora = evento.fecha_inicio.includes(' ') || evento.fecha_inicio.includes('T');
                let horaTexto = 'Todo el día';
                if (tieneHora) {
                    try {
                        horaTexto = fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
                    } catch (e) {
                        horaTexto = 'Todo el día';
                    }
                }
                
                const item = document.createElement('div');
                item.className = 'timeline-item mb-3';
                item.innerHTML = `
                    <div class="d-flex">
                        <div class="flex-shrink-0">
                            <div class="${colorClass} text-white rounded p-2 text-center" style="width: 50px;">
                                <div class="fw-bold">${dia}</div>
                                <small>${mes}</small>
                            </div>
                        </div>
                        <div class="flex-grow-1 ms-3">
                            <h6 class="mb-1">${evento.titulo}</h6>
                            <p class="text-muted mb-0">
                                <i class="fas fa-clock me-1"></i> ${horaTexto}
                            </p>
                        </div>
                    </div>
                `;
                contenedor.appendChild(item);
            });
        } else if (contenedor) {
            contenedor.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                    <p>Error al cargar eventos</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error al cargar eventos:', error);
        const contenedor = document.getElementById('proximosEventosDashboard');
        if (contenedor) {
            contenedor.innerHTML = `
                <div class="text-center py-4 text-danger">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                    <p>Error al cargar eventos</p>
                </div>
            `;
        }
    }
}

// Cargar materias para el formulario
async function cargarMateriasParaFormulario() {
    const selectMateria = document.getElementById('postMateria');
    if (!selectMateria) return;

    try {
        if (!usuarioDashboard) {
            usuarioDashboard = await cargarDatosUsuario();
        }

        if (materiasCarreraDashboard.length === 0) {
            await cargarMateriasUsuario();
        }

        const materiasDisponibles = filtrarMateriasParaFormulario();
        selectMateria.innerHTML = '<option value="">Selecciona una materia</option>';

        if (!materiasDisponibles.length) {
            const option = document.createElement('option');
            option.value = '';
            option.disabled = true;
            option.textContent = 'No hay materias disponibles';
            selectMateria.appendChild(option);
            return;
        }

        materiasDisponibles.forEach(materia => {
            const option = document.createElement('option');
            option.value = materia.id;
            const cuatri = materia.cuatrimestre?.numero ? ` • ${materia.cuatrimestre.numero}°` : '';
            option.textContent = `${materia.nombre}${cuatri}`;
            selectMateria.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar materias:', error);
        selectMateria.innerHTML = '<option value="">No se pudieron cargar las materias</option>';
    }
}

function filtrarMateriasParaFormulario() {
    if (!usuarioDashboard || !Array.isArray(materiasCarreraDashboard)) {
        return [];
    }

    if (usuarioDashboard.rol === 'estudiante') {
        const cuatrimestreActual = usuarioDashboard.estudiante?.cuatrimestre_actual;
        if (cuatrimestreActual) {
            const filtradas = materiasCarreraDashboard.filter(materia =>
                materia.cuatrimestre?.numero === cuatrimestreActual
            );
            if (filtradas.length) {
                return filtradas;
            }
        }
    }

    return materiasCarreraDashboard;
}

// Enviar nueva publicación desde dashboard
async function enviarNuevaPublicacionDesdeDashboard() {
    const form = document.getElementById('crearPostForm');
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }
    
    const datosPublicacion = {
        titulo: document.getElementById('postTitulo').value.trim(),
        contenido: document.getElementById('postContenido').value.trim(),
        categoria: document.getElementById('postCategoria').value,
        materia_id: parseInt(document.getElementById('postMateria').value),
        etiquetas: document.getElementById('postEtiquetas').value.split(',').map(t => t.trim()).filter(t => t)
    };
    
    if (await crearPublicacion(datosPublicacion)) {
        const modal = bootstrap.Modal.getInstance(document.getElementById('crearPostModal'));
        if (modal) {
            modal.hide();
        }
        
        form.reset();
        form.classList.remove('was-validated');
        
        await cargarPublicacionesDestacadas();
        await cargarEstadisticas();
    }
}

// Funciones auxiliares
function tiempoTranscurridoDesde(fecha) {
    if (typeof tiempoTranscurrido === 'function') {
        return tiempoTranscurrido(fecha);
    }
    const ahora = new Date();
    const diff = ahora - fecha;
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    
    if (dias > 0) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
    if (horas > 0) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    if (minutos > 0) return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    return 'Ahora';
}

function truncarContenidoDashboard(texto, longitud) {
    const globalFn = typeof window.truncarTexto === 'function' && window.truncarTexto !== truncarContenidoDashboard
        ? window.truncarTexto
        : null;
    if (globalFn) {
        return globalFn(texto, longitud);
    }
    if (!texto) return '';
    if (texto.length <= longitud) return texto;
    return texto.substring(0, longitud) + '...';
}

async function marcarNotificacionesNavbar() {
    try {
        const response = await API.marcarTodasNotificacionesLeidas();
        if (!response?.success) {
            throw new Error(response?.message || 'No se pudieron marcar las notificaciones');
        }
        limpiarDropdownNotificaciones();
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion('success', 'Todas las notificaciones han sido marcadas como leídas');
        }
    } catch (error) {
        console.error('Error al marcar notificaciones como leídas:', error);
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion('error', error.message || 'No se pudieron marcar las notificaciones');
        }
    }
}

function limpiarDropdownNotificaciones() {
    const dropdownMenu = document.querySelector('#notificacionesDropdown + ul');
    if (dropdownMenu) {
        dropdownMenu.innerHTML = `
            <li class="dropdown-header d-flex justify-content-between align-items-center">
                <span class="fw-bold">Notificaciones</span>
                <span class="text-muted small">Sin pendientes</span>
            </li>
            <li><hr class="dropdown-divider"></li>
            <li class="text-center py-3 text-muted small">
                <i class="fas fa-check-circle me-2"></i> Todas tus notificaciones están leídas.
            </li>
            <li><hr class="dropdown-divider"></li>
            <li class="text-center py-2">
                <a href="#" data-route="notificaciones" class="text-decoration-none small">Ver historial completo</a>
            </li>
        `;
    }

    const badge = document.getElementById('notificacionesBadge');
    if (badge) {
        badge.style.display = 'none';
    }
}

