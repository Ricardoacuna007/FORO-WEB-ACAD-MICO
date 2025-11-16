// ===================================
// MODERACION.JS - Panel de moderación
// ===================================
(function () {
    const state = {
        filtros: {
            prioridad: '',
            materia: '',
            tipo: ''
        },
        reportes: [],
        materias: [],
        tipos: [],
        actividad: [],
        alertas: [],
        usuariosBloqueados: [],
        carreras: [],
        stats: {},
        paginacionReportes: {
            pagina: 1,
            perPage: 10,
            cargando: false,
            hasMore: true,
            total: 0
        },
        reporteSeleccionado: null,
        usuarioSuspension: null,
        usuarioAdvertencia: null
    };

    const DOM = {};

    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        cacheSelectors();
        mostrarLoadersIniciales();
        configurarEventos();

        try {
            await Promise.all([
                cargarDashboardModeracion(),
                cargarReportes({ reset: true }),
                cargarActividad(),
                cargarAlertas(),
                cargarCarreras()
            ]);
            await cargarUsuariosBloqueados();
        } catch (error) {
            console.error('Error inicializando panel de moderación:', error);
            notificar('error', error.message || 'No se pudo cargar el panel de moderación');
        }
    }

    function cacheSelectors() {
        DOM.statReportesPendientes = document.getElementById('statReportesPendientes');
        DOM.statResueltosHoy = document.getElementById('statResueltosHoy');
        DOM.statContenidoEliminado = document.getElementById('statContenidoEliminado');
        DOM.statAdvertencias = document.getElementById('statAdvertencias');
        DOM.navbarReportesPendientes = document.getElementById('navbarReportesPendientes');
        DOM.navbarReportesText = document.getElementById('navbarReportesText');
        DOM.navbarNombre = document.getElementById('navbarNombre');
        DOM.navbarAvatar = document.getElementById('navbarAvatar');
        DOM.navbarRol = document.getElementById('navbarRol');

        DOM.filtroPrioridad = document.getElementById('filtroPrioridad');
        DOM.filtroMateria = document.getElementById('filtroMateria');
        DOM.filtroTipo = document.getElementById('filtroTipo');
        DOM.listaReportes = document.getElementById('listaReportes');
        DOM.totalReportes = document.getElementById('totalReportes');
        DOM.loadMoreReportesBtn = document.getElementById('loadMoreReportesBtn');

        DOM.actividadModeracion = document.getElementById('actividadModeracion');
        DOM.alertasModeracion = document.getElementById('alertasModeracion');
        DOM.estadisticasContenido = document.getElementById('estadisticasContenido');
        DOM.usuariosBloqueados = document.getElementById('usuariosBloqueados');
        DOM.refreshUsuariosBloqueadosBtn = document.getElementById('refreshUsuariosBloqueadosBtn');
        DOM.limpiarActividadBtn = document.getElementById('limpiarActividadBtn');

        DOM.detalleModal = new bootstrap.Modal(document.getElementById('detalleReporteModal'));
        DOM.accionModal = new bootstrap.Modal(document.getElementById('accionReporteModal'));
        DOM.buscarUsuarioModal = new bootstrap.Modal(document.getElementById('buscarUsuarioModal'));

        const crearAvisoModalEl = document.getElementById('crearAvisoModal');
        DOM.crearAvisoModal = crearAvisoModalEl ? new bootstrap.Modal(crearAvisoModalEl) : null;

        const suspensionModalEl = document.getElementById('suspensionModal');
        DOM.suspensionModal = suspensionModalEl ? new bootstrap.Modal(suspensionModalEl) : null;

        const advertenciaModalEl = document.getElementById('advertenciaModal');
        DOM.advertenciaModal = advertenciaModalEl ? new bootstrap.Modal(advertenciaModalEl) : null;

        DOM.detallePrioridad = document.getElementById('detallePrioridad');
        DOM.detalleTipo = document.getElementById('detalleTipo');
        DOM.detalleEstado = document.getElementById('detalleEstado');
        DOM.detalleTitulo = document.getElementById('detalleTitulo');
        DOM.detalleDescripcion = document.getElementById('detalleDescripcion');
        DOM.detalleContenido = document.getElementById('detalleContenido');
        DOM.detalleAutor = document.getElementById('detalleAutor');
        DOM.detalleMateria = document.getElementById('detalleMateria');
        DOM.detalleFecha = document.getElementById('detalleFecha');
        DOM.detalleReportantes = document.getElementById('detalleReportantes');
        DOM.detalleNotas = document.getElementById('detalleNotas');
        DOM.detalleAdvertirBtn = document.getElementById('detalleAdvertirBtn');
        DOM.detalleEliminarBtn = document.getElementById('detalleEliminarBtn');
        DOM.detalleAprobarBtn = document.getElementById('detalleAprobarBtn');

        DOM.accionReporteForm = document.getElementById('accionReporteForm');
        DOM.accionReporteId = document.getElementById('accionReporteId');
        DOM.accionTipo = document.getElementById('accionTipo');
        DOM.accionMotivoGroup = document.getElementById('accionMotivoGroup');
        DOM.accionMotivo = document.getElementById('accionMotivo');
        DOM.accionResumen = document.getElementById('accionResumen');
        DOM.accionSubmitBtn = document.getElementById('accionSubmitBtn');
        DOM.accionModalTitulo = document.getElementById('accionModalTitulo');

        DOM.buscarUsuarioForm = document.getElementById('buscarUsuarioForm');
        DOM.buscarUsuarioInput = document.getElementById('buscarUsuarioInput');
        DOM.buscarUsuarioResultados = document.getElementById('buscarUsuarioResultados');

        DOM.exportarLogBtn = document.getElementById('exportarLogBtn');
        DOM.buscarUsuarioBtn = document.getElementById('buscarUsuarioBtn');
        DOM.bloquearUsuarioBtn = document.getElementById('bloquearUsuarioBtn');
        DOM.crearAvisoBtn = document.getElementById('crearAvisoBtn');
        DOM.logoutButton = document.querySelector('[data-action="logout"]');

        DOM.crearAvisoForm = document.getElementById('crearAvisoForm');
        DOM.avisoDestino = document.getElementById('avisoDestino');
        DOM.avisoCarreraGroup = document.getElementById('avisoCarreraGroup');
        DOM.avisoCarrera = document.getElementById('avisoCarrera');
        DOM.avisoRolGroup = document.getElementById('avisoRolGroup');
        DOM.avisoRol = document.getElementById('avisoRol');
        DOM.avisoUsuarioGroup = document.getElementById('avisoUsuarioGroup');
        DOM.avisoUsuario = document.getElementById('avisoUsuario');
        DOM.avisoMensaje = document.getElementById('avisoMensaje');
        DOM.avisoTitulo = document.getElementById('avisoTitulo');
        DOM.avisoEnlace = document.getElementById('avisoEnlace');
        DOM.avisoSubmitBtn = document.getElementById('avisoSubmitBtn');

        DOM.suspensionForm = document.getElementById('suspensionForm');
        DOM.suspensionUsuarioLabel = document.getElementById('suspensionUsuarioLabel');
        DOM.suspensionMotivo = document.getElementById('suspensionMotivo');
        DOM.suspensionDuracion = document.getElementById('suspensionDuracion');
        DOM.suspensionUnidad = document.getElementById('suspensionUnidad');
        DOM.suspensionSubmitBtn = document.getElementById('suspensionSubmitBtn');
        DOM.advertirUsuarioForm = document.getElementById('advertirUsuarioForm');
        DOM.advertenciaUsuarioLabel = document.getElementById('advertenciaUsuarioLabel');
        DOM.advertenciaMensaje = document.getElementById('advertenciaMensaje');
        DOM.advertenciaSubmitBtn = document.getElementById('advertenciaSubmitBtn');
    }

    function mostrarLoadersIniciales() {
        if (DOM.listaReportes) {
            DOM.listaReportes.innerHTML = crearLoader('Cargando reportes...');
        }
        if (DOM.actividadModeracion) {
            DOM.actividadModeracion.innerHTML = crearLoader('Cargando actividad...');
        }
        if (DOM.alertasModeracion) {
            DOM.alertasModeracion.innerHTML = crearLoader('Analizando alertas...');
        }
        if (DOM.estadisticasContenido) {
            DOM.estadisticasContenido.innerHTML = crearLoader('Obteniendo estadísticas...');
        }
        renderReportesSkeleton();
        actualizarBotonLoadMore({ visible: false, loading: false });
    }

    async function cargarDashboardModeracion() {
        const response = await API.getModeracionDashboard?.();
        if (!response?.success) {
            throw new Error(response?.message || 'No se pudo obtener la información de moderación');
        }

        const data = response.data || {};
        state.stats = data.estadisticas || {};
        state.materias = data.materias || [];
        state.tipos = data.tipos || [];

        actualizarStats(state.stats);
        poblarSelects();
        actualizarNavbar(data.moderador || {});
        renderizarEstadisticasModal(data.stats_detalladas || {});
    }

    async function cargarReportes({ reset = false } = {}) {
        if (!DOM.listaReportes) return;
        const paginacion = state.paginacionReportes;

        if (paginacion.cargando) return;
        if (!paginacion.hasMore && !reset) return;

        if (reset) {
            state.reportes = [];
            Object.assign(state.paginacionReportes, {
                pagina: 1,
                hasMore: true,
                total: 0
            });
            renderReportesSkeleton();
            actualizarBotonLoadMore({ visible: false, loading: false });
        } else {
            renderReportesSkeleton(2, true);
            actualizarBotonLoadMore({ visible: true, loading: true });
        }

        paginacion.cargando = true;

        const params = {
            estado: 'pendiente', // Filtrar solo reportes pendientes por defecto
            prioridad: state.filtros.prioridad || undefined,
            materia_id: state.filtros.materia || undefined,
            tipo: state.filtros.tipo || undefined,
            page: paginacion.pagina,
            per_page: paginacion.perPage
        };

        try {
            const response = await API.getModeracionReportes?.(params);
            if (!response?.success) {
                throw new Error(response?.message || 'No se pudieron obtener los reportes');
            }

            const payload = response.data || {};
            const nuevosReportes = extraerColeccion(payload) || [];
            const meta = payload.meta || payload;
            const paginaActual = Number(meta.current_page ?? meta.currentPage ?? paginacion.pagina);
            const ultimaPagina = Number(meta.last_page ?? meta.lastPage ?? paginaActual);
            const total = Number(meta.total ?? paginacion.total ?? (reset ? nuevosReportes.length : state.reportes.length + nuevosReportes.length));

            state.reportes = reset ? nuevosReportes : [...state.reportes, ...nuevosReportes];
            state.paginacionReportes.total = total;
            state.paginacionReportes.hasMore = paginaActual < ultimaPagina;
            state.paginacionReportes.pagina = paginaActual + 1;
        } catch (error) {
            console.error('Error al cargar reportes:', error);
            if (reset) {
                DOM.listaReportes.innerHTML = crearVacio('No se pudieron cargar los reportes.');
            }
            state.paginacionReportes.hasMore = false;
            notificar('error', error.message || 'No se pudo obtener la lista de reportes');
        } finally {
            state.paginacionReportes.cargando = false;
            renderizarReportes();
            actualizarBotonLoadMore({
                visible: state.paginacionReportes.hasMore && state.reportes.length > 0,
                loading: false
            });
        }
    }

    async function cargarActividad() {
        try {
            const response = await API.getModeracionActividad?.();
            state.actividad = extraerColeccion(response?.data) || [];
        } catch (error) {
            console.warn('No se pudo cargar la actividad de moderación:', error);
            state.actividad = [];
        }
        renderizarActividad();
    }

    async function cargarAlertas() {
        try {
            const response = await API.getModeracionAlertas?.();
            state.alertas = extraerColeccion(response?.data) || [];
        } catch (error) {
            console.warn('No se pudo cargar las alertas de moderación:', error);
            state.alertas = [];
        }
        renderizarAlertas();
    }

    async function cargarUsuariosBloqueados() {
        if (!DOM.usuariosBloqueados) return;

        try {
            if (DOM.refreshUsuariosBloqueadosBtn) {
                DOM.refreshUsuariosBloqueadosBtn.disabled = true;
                DOM.refreshUsuariosBloqueadosBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            }
            DOM.usuariosBloqueados.innerHTML = crearLoader('Cargando usuarios bloqueados...');
            const response = await API.getModeracionUsuariosBloqueados?.();
            state.usuariosBloqueados = extraerColeccion(response?.data) || [];
        } catch (error) {
            console.warn('No se pudieron cargar los usuarios bloqueados:', error);
            state.usuariosBloqueados = [];
            notificar('error', error.message || 'No se pudo obtener el listado de usuarios bloqueados');
        } finally {
            if (DOM.refreshUsuariosBloqueadosBtn) {
                DOM.refreshUsuariosBloqueadosBtn.disabled = false;
                DOM.refreshUsuariosBloqueadosBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
            }
        }

        renderizarUsuariosBloqueados();
    }

    async function cargarCarreras() {
        try {
            const response = await API.getCarreras?.();
            state.carreras = Array.isArray(response?.data) ? response.data : [];
            actualizarOpcionesCarreras();
        } catch (error) {
            console.warn('No se pudieron cargar las carreras:', error);
            state.carreras = [];
            actualizarOpcionesCarreras();
        }
    }

    function actualizarStats(stats = {}) {
        setText(DOM.statReportesPendientes, stats.reportes_pendientes || 0);
        setText(DOM.statResueltosHoy, stats.resueltos_hoy || 0);
        setText(DOM.statContenidoEliminado, stats.contenido_eliminado || 0);
        setText(DOM.statAdvertencias, stats.advertencias_enviadas || 0);

        const navbarCount = stats.reportes_pendientes || 0;
        if (DOM.navbarReportesText) {
            DOM.navbarReportesText.textContent = `${navbarCount} ${navbarCount === 1 ? 'reporte' : 'reportes'} pendientes`;
        }
    }

    function actualizarNavbar(moderador = {}) {
        const nombre = [moderador.nombre, moderador.apellidos].filter(Boolean).join(' ') || moderador.username || 'Moderador';
        setText(DOM.navbarNombre, moderador.nombre || nombre);
        setText(DOM.navbarRol, moderador.rol?.nombre || 'Moderador');
        actualizarAvatar(DOM.navbarAvatar, moderador.avatar_url || moderador.avatar, moderador.nombre, moderador.apellidos);
    }

    function poblarSelects() {
        if (DOM.filtroMateria) {
            DOM.filtroMateria.innerHTML = '<option value="">Todas las materias</option>';
            state.materias.forEach(materia => {
                const option = document.createElement('option');
                option.value = materia.id;
                option.textContent = materia.nombre;
                DOM.filtroMateria.appendChild(option);
            });
        }

        if (DOM.filtroTipo) {
            DOM.filtroTipo.innerHTML = '<option value="">Todos los tipos</option>';
            state.tipos.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo.id || tipo.slug || tipo.codigo || tipo;
                option.textContent = tipo.nombre || capitalizar(tipo);
                DOM.filtroTipo.appendChild(option);
            });
        }
    }

    function actualizarOpcionesCarreras() {
        if (!DOM.avisoCarrera) return;
        DOM.avisoCarrera.innerHTML = '<option value="">Selecciona una carrera</option>';
        state.carreras.forEach(carrera => {
            const option = document.createElement('option');
            option.value = carrera.id;
            option.textContent = carrera.nombre;
            DOM.avisoCarrera.appendChild(option);
        });
    }

    function renderizarReportes() {
        if (!DOM.listaReportes) return;

        if (!state.reportes || state.reportes.length === 0) {
            if (!state.paginacionReportes.cargando) {
                DOM.listaReportes.innerHTML = crearVacio('No se encontraron reportes con los filtros seleccionados.');
                actualizarBotonLoadMore({ visible: false, loading: false });
            }
            setText(DOM.totalReportes, '0');
            return;
        }

        const fragment = document.createDocumentFragment();

        state.reportes.forEach(reporte => {
            const item = document.createElement('div');
            const prioridad = (reporte.prioridad || 'media').toLowerCase();
            const severidadClass = obtenerClaseSeveridad(prioridad);
            const categoria = capitalizar(reporte.categoria || reporte.tipo || 'Reporte');
            const badgeTipo = reporte.tipo_nombre || categoria;
            const reportantes = reporte.reportes_count || reporte.reportantes?.length || 1;
            const fecha = formatearTiempo(reporte.created_at || reporte.fecha);
            const materia = reporte.materia?.nombre || reporte.materia || 'General';
            const autor = reporte.autor?.nombre_completo || reporte.autor?.nombre || 'Usuario';

            item.className = `reporte-item p-3 border-bottom ${severidadClass}`;
            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <span class="badge ${obtenerBadgePrioridad(prioridad)} mb-2">${capitalizar(prioridad)} prioridad</span>
                        <span class="badge bg-secondary ms-1">${badgeTipo}</span>
                        <h6 class="mb-1 mt-2">${reporte.titulo || 'Contenido reportado'}</h6>
                        <small class="text-muted">
                            Reportado por <strong>${reportantes} ${reportantes === 1 ? 'usuario' : 'usuarios'}</strong> • ${fecha}
                        </small>
                    </div>
                    <button class="btn btn-sm btn-link text-muted" data-reporte-id="${reporte.id}" data-action="ver">
                        <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
                <div class="bg-light p-3 rounded mb-3">
                    <strong>Contenido reportado:</strong>
                    <p class="mb-0 mt-2 text-muted">${reporte.contenido_resumido || reporte.contenido || 'Sin detalle disponible.'}</p>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <small class="text-muted">
                            <i class="fas fa-user me-1"></i> Autor: ${autor} •
                            <i class="fas fa-book me-1 ms-2"></i> ${materia}
                        </small>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" data-reporte-id="${reporte.id}" data-action="ver">
                            <i class="fas fa-eye me-1"></i> Ver
                        </button>
                        <button class="btn btn-sm btn-outline-warning" data-reporte-id="${reporte.id}" data-action="advertir">
                            <i class="fas fa-exclamation-triangle me-1"></i> Advertir
                        </button>
                        <button class="btn btn-sm btn-outline-danger" data-reporte-id="${reporte.id}" data-action="eliminar">
                            <i class="fas fa-trash me-1"></i> Eliminar
                        </button>
                        <button class="btn btn-sm btn-outline-success" data-reporte-id="${reporte.id}" data-action="aprobar">
                            <i class="fas fa-check me-1"></i> Aprobar
                        </button>
                    </div>
                </div>
            `;

            fragment.appendChild(item);
        });

        DOM.listaReportes.innerHTML = '';
        DOM.listaReportes.appendChild(fragment);
        setText(DOM.totalReportes, state.paginacionReportes.total || state.reportes.length);
        actualizarBotonLoadMore({ visible: state.paginacionReportes.hasMore, loading: false });
    }

    function renderizarActividad() {
        if (!DOM.actividadModeracion) return;

        if (!state.actividad || state.actividad.length === 0) {
            DOM.actividadModeracion.innerHTML = crearVacio('No hay actividad reciente.');
            return;
        }

        const fragment = document.createDocumentFragment();

        state.actividad.forEach(item => {
            const container = document.createElement('div');
            container.className = 'd-flex mb-3';

            const icono = obtenerIconoActividad(item.tipo);

            container.innerHTML = `
                <div class="${icono.bg} text-white rounded-circle p-2 me-2" style="width: 38px; height: 38px;">
                    <i class="fas ${icono.icon} small"></i>
                </div>
                <div>
                    <small class="d-block">${item.descripcion || 'Actividad registrada'}</small>
                    <small class="text-muted">${formatearTiempo(item.fecha || item.created_at)}</small>
                </div>
            `;

            fragment.appendChild(container);
        });

        DOM.actividadModeracion.innerHTML = '';
        DOM.actividadModeracion.appendChild(fragment);
    }

    async function limpiarActividad() {
        const confirmado = await (window.mostrarConfirmacionToasty
            ? window.mostrarConfirmacionToasty({
                mensaje: '¿Limpiar la actividad reciente? Esta acción no se puede deshacer.',
                tipo: 'warning',
                textoConfirmar: 'Limpiar',
                textoCancelar: 'Cancelar'
            })
            : Promise.resolve(confirm('¿Limpiar la actividad reciente? Esta acción no se puede deshacer.')));

        if (!confirmado) return;

        try {
            state.actividad = [];
            renderizarActividad();
            notificar('success', 'Actividad limpiada correctamente');
        } catch (error) {
            console.error('Error al limpiar actividad:', error);
            notificar('error', 'No se pudo limpiar la actividad');
        }
    }

    function renderizarAlertas() {
        if (!DOM.alertasModeracion) return;

        if (!state.alertas || state.alertas.length === 0) {
            DOM.alertasModeracion.innerHTML = crearVacio('No hay alertas activas.');
            return;
        }

        const fragment = document.createDocumentFragment();
        const titulo = document.createElement('small');
        titulo.className = 'text-muted d-block mb-2';
        titulo.textContent = 'Usuarios con múltiples reportes:';
        fragment.appendChild(titulo);

        state.alertas.forEach(alerta => {
            const div = document.createElement('div');
            div.className = `alert ${alerta.nivel === 'alto' ? 'alert-danger' : 'alert-warning'} py-2 px-3 mb-2`;
            div.innerHTML = `
                <strong>${alerta.usuario?.nombre || alerta.usuario || 'Usuario'}</strong>
                <span class="d-block small text-muted">${alerta.motivo || 'Reporte repetido'} • ${alerta.reportes || 0} reportes</span>
            `;
            fragment.appendChild(div);
        });

        DOM.alertasModeracion.innerHTML = '';
        DOM.alertasModeracion.appendChild(fragment);
    }

    function renderizarUsuariosBloqueados() {
        if (!DOM.usuariosBloqueados) return;

        if (!state.usuariosBloqueados || state.usuariosBloqueados.length === 0) {
            DOM.usuariosBloqueados.innerHTML = crearVacio('No hay usuarios bloqueados actualmente.');
            return;
        }

        const fragment = document.createDocumentFragment();
        state.usuariosBloqueados.forEach(usuario => {
            const card = document.createElement('div');
            card.className = 'border rounded p-3 mb-2 bg-light';

            const nombre = [usuario.nombre, usuario.apellidos].filter(Boolean).join(' ') || usuario.email;
            const fecha = usuario.suspendido_hasta ? formatearFechaLarga(usuario.suspendido_hasta) : 'Indefinido';

            card.innerHTML = `
                <div class="d-flex justify-content-between align-items-start gap-2">
                    <div>
                        <h6 class="mb-1">${nombre || 'Usuario'}</h6>
                        <small class="text-muted d-block">${usuario.email || ''}</small>
                        <small class="text-muted d-block">Rol: ${capitalizar(usuario.rol || 'N/A')}</small>
                        <small class="text-muted d-block">Motivo: ${usuario.suspension_motivo || 'No especificado'}</small>
                        <small class="text-muted d-block">Activo hasta: ${fecha}</small>
                    </div>
                    <div class="d-flex flex-column align-items-end gap-2">
                        <span class="badge ${usuario.suspendido_hasta ? 'bg-warning text-dark' : 'bg-danger'}">
                            ${usuario.suspendido_hasta ? 'Suspensión temporal' : 'Suspensión indefinida'}
                        </span>
                        <button class="btn btn-sm btn-outline-success" data-action="reactivar-usuario" data-usuario-id="${usuario.id}">
                            <i class="fas fa-unlock me-1"></i> Reactivar
                        </button>
                    </div>
                </div>
            `;

            fragment.appendChild(card);
        });

        DOM.usuariosBloqueados.innerHTML = '';
        DOM.usuariosBloqueados.appendChild(fragment);
    }

    function renderizarEstadisticasModal(detalle = {}) {
        if (!DOM.estadisticasContenido) return;

        const stats = detalle.indicadores || [];
        const categorias = detalle.categorias || [];

        const indicadoresHTML = stats.length
            ? stats.map(stat => `
                <div class="col-md-6">
                    <div class="card bg-light h-100">
                        <div class="card-body text-center">
                            <h3 class="fw-bold text-${stat.color || 'primary'}">${stat.valor ?? '-'}</h3>
                            <small class="text-muted">${stat.nombre || 'Indicador'}</small>
                        </div>
                    </div>
                </div>`).join('')
            : '<div class="col-12">' + crearVacio('No hay estadísticas disponibles.') + '</div>';

        const categoriasHTML = categorias.length
            ? categorias.map(cat => `
                <div class="progress mb-2" style="height: 25px;">
                    <div class="progress-bar bg-${cat.color || 'secondary'}" style="width: ${cat.porcentaje || 0}%">
                        ${cat.nombre || 'Categoría'} (${cat.porcentaje || 0}%)
                    </div>
                </div>`).join('')
            : crearVacio('Sin datos por categoría');

        DOM.estadisticasContenido.innerHTML = `
            <div class="row g-3 mb-3">
                ${indicadoresHTML}
            </div>
            <div>
                <h6 class="fw-bold mb-3">Reportes por categoría</h6>
                ${categoriasHTML}
            </div>
        `;
    }

    function configurarEventos() {
        DOM.filtroPrioridad?.addEventListener('change', async (event) => {
            state.filtros.prioridad = event.target.value;
            await recargarReportes();
        });

        DOM.filtroMateria?.addEventListener('change', async (event) => {
            state.filtros.materia = event.target.value;
            await recargarReportes();
        });

        DOM.filtroTipo?.addEventListener('change', async (event) => {
            state.filtros.tipo = event.target.value;
            await recargarReportes();
        });

        DOM.listaReportes?.addEventListener('click', manejarAccionesReporte);
        DOM.detalleAdvertirBtn?.addEventListener('click', () => prepararAccion('advertir'));
        DOM.detalleEliminarBtn?.addEventListener('click', () => prepararAccion('eliminar'));
        DOM.detalleAprobarBtn?.addEventListener('click', () => prepararAccion('aprobar'));

        DOM.accionReporteForm?.addEventListener('submit', manejarEnvioAccion);

        DOM.buscarUsuarioBtn?.addEventListener('click', () => {
            DOM.buscarUsuarioResultados.innerHTML = crearVacio('Ingresa un término de búsqueda para encontrar usuarios.');
            DOM.buscarUsuarioInput.value = '';
            DOM.buscarUsuarioModal.show();
        });

        DOM.buscarUsuarioForm?.addEventListener('submit', manejarBuscarUsuario);
        DOM.buscarUsuarioResultados?.addEventListener('click', manejarAccionUsuario);  // delegación

        DOM.bloquearUsuarioBtn?.addEventListener('click', () => {
            notificar('info', 'Selecciona usuario desde "Buscar usuario" para bloquear.');
            DOM.buscarUsuarioBtn?.click();
        });

        DOM.crearAvisoBtn?.addEventListener('click', mostrarModalCrearAviso);

        DOM.crearAvisoForm?.addEventListener('submit', manejarCrearAviso);
        DOM.avisoDestino?.addEventListener('change', actualizarVisibilidadDestinoAviso);

        DOM.suspensionForm?.addEventListener('submit', manejarSuspensionUsuario);
        DOM.advertirUsuarioForm?.addEventListener('submit', manejarAdvertenciaUsuario);

        DOM.exportarLogBtn?.addEventListener('click', manejarExportarLog);

        // El logout se maneja globalmente en auth.js
        // No agregar listener adicional para evitar duplicados

        DOM.usuariosBloqueados?.addEventListener('click', async (event) => {
            const boton = event.target.closest('[data-action="reactivar-usuario"]');
            if (!boton) return;
            const usuarioId = boton.getAttribute('data-usuario-id');
            await manejarReactivacionUsuario(usuarioId);
        });

        DOM.refreshUsuariosBloqueadosBtn?.addEventListener('click', async () => {
            await cargarUsuariosBloqueados();
        });

        DOM.limpiarActividadBtn?.addEventListener('click', async () => {
            await limpiarActividad();
        });

        DOM.loadMoreReportesBtn?.addEventListener('click', async () => {
            await cargarReportes();
        });
    }

    async function recargarReportes() {
        await cargarReportes({ reset: true });
    }

    async function manejarAccionesReporte(event) {
        const actionButton = event.target.closest('[data-action][data-reporte-id]');
        if (!actionButton) return;

        const reporteId = actionButton.getAttribute('data-reporte-id');
        const action = actionButton.getAttribute('data-action');

        switch (action) {
            case 'ver':
                await mostrarDetalleReporte(reporteId);
                break;
            case 'advertir':
            case 'eliminar':
            case 'aprobar':
                state.reporteSeleccionado = buscarReporteLocal(reporteId);
                prepararAccion(action, reporteId);
                break;
            default:
                console.warn('Acción no reconocida:', action);
        }
    }

    async function mostrarDetalleReporte(id) {
        try {
            const reporte = await obtenerReporte(id);
            if (!reporte) throw new Error('No se encontró el reporte');

            state.reporteSeleccionado = reporte;
            rellenarDetalle(reporte);
            DOM.detalleModal.show();
        } catch (error) {
            console.error('Error al cargar detalles del reporte:', error);
            notificar('error', error.message || 'No se pudo cargar el detalle del reporte');
        }
    }

    function rellenarDetalle(reporte) {
        const prioridad = (reporte.prioridad || 'media').toLowerCase();
        const tipo = reporte.tipo_nombre || capitalizar(reporte.tipo || 'Reporte');
        const estado = capitalizar(reporte.estado || 'Pendiente');

        setText(DOM.detallePrioridad, `${capitalizar(prioridad)} prioridad`);
        DOM.detallePrioridad.className = `badge ${obtenerBadgePrioridad(prioridad)}`;

        setText(DOM.detalleTipo, tipo);
        setText(DOM.detalleEstado, estado);

        setText(DOM.detalleTitulo, reporte.titulo || 'Contenido reportado');
        setText(DOM.detalleDescripcion, reporte.descripcion || 'Sin descripción adicional.');
        setText(DOM.detalleContenido, reporte.contenido_original || reporte.contenido || 'Sin detalle del contenido.');

        setText(DOM.detalleAutor, reporte.autor?.nombre_completo || reporte.autor?.nombre || 'Usuario');
        setText(DOM.detalleMateria, reporte.materia?.nombre || reporte.materia || 'General');
        setText(DOM.detalleFecha, formatearFechaLarga(reporte.fecha || reporte.created_at));

        if (Array.isArray(reporte.reportantes) && reporte.reportantes.length) {
            DOM.detalleReportantes.innerHTML = reporte.reportantes
                .map(rep => `<span class="badge bg-light text-dark me-1 mb-1">${rep.nombre || rep.email || 'Usuario'}</span>`)
                .join('');
        } else {
            DOM.detalleReportantes.textContent = 'Sin detalles de reportantes.';
        }

        setText(DOM.detalleNotas, reporte.notas || '');
    }

    function prepararAccion(accion, reporteId = null) {
        const reporte = reporteId ? buscarReporteLocal(reporteId) : state.reporteSeleccionado;
        if (!reporte) {
            notificar('error', 'Selecciona un reporte válido.');
            return;
        }

        state.reporteSeleccionado = reporte;
        DOM.accionReporteId.value = reporte.id;
        DOM.accionTipo.value = accion;
        DOM.accionMotivo.value = '';

        let titulo = 'Confirmar acción';
        let resumen = '¿Deseas continuar con esta acción?';
        let mostrarMotivo = true;
        let textoBoton = 'Confirmar';

        switch (accion) {
            case 'advertir':
                titulo = 'Enviar advertencia al autor';
                resumen = `La advertencia se enviará a ${reporte.autor?.nombre || 'el autor'}.`;
                textoBoton = 'Enviar advertencia';
                break;
            case 'eliminar':
                titulo = 'Eliminar contenido reportado';
                resumen = 'El contenido será eliminado permanentemente.';
                textoBoton = 'Eliminar contenido';
                break;
            case 'aprobar':
                titulo = 'Descartar reporte';
                resumen = 'El reporte se marcará como resuelto sin tomar acción.';
                mostrarMotivo = false;
                textoBoton = 'Aprobar';
                break;
        }

        setText(DOM.accionModalTitulo, titulo);
        setText(DOM.accionResumen, resumen);
        DOM.accionMotivoGroup.style.display = mostrarMotivo ? 'block' : 'none';
        DOM.accionMotivo.required = mostrarMotivo;
        DOM.accionSubmitBtn.textContent = textoBoton;

        DOM.accionModal.show();
    }

    async function manejarEnvioAccion(event) {
        event.preventDefault();
        const id = DOM.accionReporteId.value;
        const tipo = DOM.accionTipo.value;
        const comentario = DOM.accionMotivo.value.trim();

        try {
            DOM.accionSubmitBtn.disabled = true;
            DOM.accionSubmitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';

            let response;
            switch (tipo) {
                case 'advertir':
                    response = await API.advertirUsuarioReporte?.(id, { mensaje: comentario });
                    break;
                case 'eliminar':
                    response = await API.eliminarContenidoReporte?.(id, { motivo: comentario });
                    break;
                case 'aprobar':
                    response = await API.aprobarReporte?.(id);
                    break;
                default:
                    throw new Error('Acción no soportada');
            }

            if (!response?.success) {
                throw new Error(response?.message || 'La acción no pudo completarse');
            }

            notificar('success', response.message || 'Acción ejecutada correctamente');
            DOM.accionModal.hide();
            await recargarReportes();
        } catch (error) {
            console.error('Error al ejecutar acción de moderación:', error);
            notificar('error', error.message || 'No se pudo completar la acción');
        } finally {
            DOM.accionSubmitBtn.disabled = false;
            DOM.accionSubmitBtn.textContent = 'Confirmar';
        }
    }

    async function manejarBuscarUsuario(event) {
        event.preventDefault();
        const query = DOM.buscarUsuarioInput.value.trim();
        if (query.length < 3) {
            notificar('info', 'Ingresa al menos 3 caracteres para buscar.');
            return;
        }

        try {
            DOM.buscarUsuarioResultados.innerHTML = crearLoader('Buscando usuarios...');
            const response = await API.buscarUsuarioModeracion?.({ q: query });

            if (!response?.success) {
                throw new Error(response?.message || 'No se pudo completar la búsqueda');
            }

            const usuarios = extraerColeccion(response.data);
            if (!usuarios.length) {
                DOM.buscarUsuarioResultados.innerHTML = crearVacio('No se encontraron usuarios.');
                return;
            }

            const fragment = document.createDocumentFragment();
            usuarios.forEach(usuario => {
                const item = document.createElement('div');
                item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
                const nombre = usuario.nombre_completo || [usuario.nombre, usuario.apellidos].filter(Boolean).join(' ') || usuario.email;
                const nombreAttr = (nombre || '').replace(/"/g, '&quot;');
                item.innerHTML = `
                    <div>
                        <strong>${nombre}</strong>
                        <div class="small text-muted">${usuario.email || ''}</div>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" data-usuario-id="${usuario.id}" data-usuario-nombre="${nombreAttr}" data-action="ver-usuario">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning" data-usuario-id="${usuario.id}" data-usuario-nombre="${nombreAttr}" data-action="advertir-usuario">
                            <i class="fas fa-exclamation-triangle"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" data-usuario-id="${usuario.id}" data-usuario-nombre="${nombreAttr}" data-action="bloquear-usuario">
                            <i class="fas fa-ban"></i>
                        </button>
                    </div>
                `;
                fragment.appendChild(item);
            });

            DOM.buscarUsuarioResultados.innerHTML = '';
            DOM.buscarUsuarioResultados.appendChild(fragment);
        } catch (error) {
            console.error('Error al buscar usuarios:', error);
            DOM.buscarUsuarioResultados.innerHTML = crearVacio(error.message || 'No se pudo realizar la búsqueda.');
        }
    }

    async function manejarAccionUsuario(event) {
        const btn = event.target.closest('[data-usuario-id][data-action]');
        if (!btn) return;

        const usuarioId = btn.getAttribute('data-usuario-id');
        const action = btn.getAttribute('data-action');

        try {
            switch (action) {
                case 'ver-usuario': {
                    const destino = typeof buildFrontendUrl === 'function'
                        ? buildFrontendUrl(`perfil?usuario=${encodeURIComponent(usuarioId)}`)
                        : `perfil?usuario=${encodeURIComponent(usuarioId)}`;
                    window.location.href = destino;
                    break;
                }
                case 'advertir-usuario': {
                    const nombre = btn.getAttribute('data-usuario-nombre') || `ID ${usuarioId}`;
                    prepararModalAdvertencia({ id: usuarioId, nombre });
                    DOM.advertenciaModal?.show();
                    break;
                }
                case 'bloquear-usuario': {
                    const nombre = btn.getAttribute('data-usuario-nombre') || `ID ${usuarioId}`;
                    prepararModalSuspension({ id: usuarioId, nombre });
                    DOM.suspensionModal?.show();
                    break;
                }
            }
        } catch (error) {
            console.error('Error al ejecutar acción sobre el usuario:', error);
            notificar('error', error.message || 'No se pudo completar la acción');
        }
    }

    function mostrarModalCrearAviso() {
        if (!DOM.crearAvisoForm || !DOM.crearAvisoModal) return;
        DOM.crearAvisoForm.reset();
        actualizarVisibilidadDestinoAviso();
        DOM.crearAvisoModal.show();
    }

    function actualizarVisibilidadDestinoAviso() {
        const destino = DOM.avisoDestino?.value || 'todos';
        if (!DOM.avisoCarreraGroup || !DOM.avisoRolGroup || !DOM.avisoUsuarioGroup) return;

        DOM.avisoCarreraGroup.classList.toggle('d-none', destino !== 'carrera');
        DOM.avisoRolGroup.classList.toggle('d-none', destino !== 'rol');
        DOM.avisoUsuarioGroup.classList.toggle('d-none', destino !== 'usuario');
    }

    function prepararModalAdvertencia(usuario) {
        state.usuarioAdvertencia = usuario;
        if (DOM.advertirUsuarioForm) {
            DOM.advertirUsuarioForm.reset();
        }
        if (DOM.advertenciaUsuarioLabel) {
            DOM.advertenciaUsuarioLabel.textContent = usuario?.nombre || `ID ${usuario?.id}`;
        }
    }

    async function manejarAdvertenciaUsuario(event) {
        event.preventDefault();
        if (!state.usuarioAdvertencia) {
            notificar('error', 'Selecciona un usuario válido antes de enviar la advertencia.');
            return;
        }

        const mensaje = DOM.advertenciaMensaje?.value.trim();
        if (!mensaje) {
            notificar('warning', 'Escribe un mensaje para la advertencia.');
            return;
        }

        try {
            DOM.advertenciaSubmitBtn.disabled = true;
            DOM.advertenciaSubmitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando...';

            const response = await API.advertirUsuario?.({
                usuario_id: state.usuarioAdvertencia.id,
                mensaje
            });

            if (!response?.success) {
                throw new Error(response?.message || 'No se pudo enviar la advertencia.');
            }

            notificar('success', response.message || 'Advertencia enviada correctamente.');
            DOM.advertenciaModal?.hide();
        } catch (error) {
            console.error('Error al enviar advertencia:', error);
            notificar('error', error.message || 'No se pudo enviar la advertencia.');
        } finally {
            DOM.advertenciaSubmitBtn.disabled = false;
            DOM.advertenciaSubmitBtn.innerHTML = '<i class="fas fa-paper-plane me-2"></i> Enviar advertencia';
            state.usuarioAdvertencia = null;
        }
    }

    async function manejarCrearAviso(event) {
        event.preventDefault();
        if (!DOM.crearAvisoForm) return;

        const payload = {
            titulo: DOM.avisoTitulo?.value.trim(),
            mensaje: DOM.avisoMensaje?.value.trim(),
            enlace: DOM.avisoEnlace?.value.trim() || null,
            destino: DOM.avisoDestino?.value || 'todos',
        };

        if (!payload.titulo || !payload.mensaje) {
            notificar('warning', 'Debes completar el título y el mensaje del aviso.');
            return;
        }

        if (payload.destino === 'carrera') {
            payload.carrera_id = DOM.avisoCarrera?.value || null;
            if (!payload.carrera_id) {
                notificar('warning', 'Selecciona una carrera para el aviso.');
                return;
            }
        }

        if (payload.destino === 'rol') {
            payload.rol = DOM.avisoRol?.value || null;
            if (!payload.rol) {
                notificar('warning', 'Selecciona el rol destino del aviso.');
                return;
            }
        }

        if (payload.destino === 'usuario') {
            payload.usuario_id = DOM.avisoUsuario?.value?.trim() || null;
            if (!payload.usuario_id) {
                notificar('warning', 'Ingresa el identificador del usuario destino.');
                return;
            }
        }

        try {
            DOM.avisoSubmitBtn.disabled = true;
            DOM.avisoSubmitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando...';

            const response = await API.crearModeracionAviso?.(payload);
            if (!response?.success) {
                throw new Error(response?.message || 'No se pudo crear el aviso.');
            }

            notificar('success', response.message || 'Aviso creado correctamente.');
            DOM.crearAvisoModal.hide();
        } catch (error) {
            console.error('Error al crear aviso:', error);
            notificar('error', error.message || 'No se pudo crear el aviso.');
        } finally {
            DOM.avisoSubmitBtn.disabled = false;
            DOM.avisoSubmitBtn.innerHTML = '<i class="fas fa-paper-plane me-2"></i> Enviar aviso';
        }
    }

    function prepararModalSuspension(usuario) {
        state.usuarioSuspension = usuario;
        if (DOM.suspensionForm) {
            DOM.suspensionForm.reset();
        }
        if (DOM.suspensionUsuarioLabel) {
            DOM.suspensionUsuarioLabel.textContent = usuario?.nombre || `ID ${usuario?.id}`;
        }
    }

    async function manejarSuspensionUsuario(event) {
        event.preventDefault();
        if (!state.usuarioSuspension) {
            notificar('error', 'Selecciona un usuario válido para suspender.');
            return;
        }

        const payload = {
            usuario_id: state.usuarioSuspension.id,
            motivo: DOM.suspensionMotivo?.value.trim() || null,
            duracion: DOM.suspensionDuracion?.value ? parseInt(DOM.suspensionDuracion.value, 10) : null,
            unidad: DOM.suspensionUnidad?.value || null,
        };

        if (!payload.motivo) {
            notificar('warning', 'Debes indicar un motivo para la suspensión.');
            return;
        }

        try {
            DOM.suspensionSubmitBtn.disabled = true;
            DOM.suspensionSubmitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Aplicando...';

            const response = await API.bloquearUsuario?.(payload);
            if (!response?.success) {
                throw new Error(response?.message || 'No se pudo suspender al usuario.');
            }

            notificar('success', response.message || 'Usuario suspendido correctamente.');
            DOM.suspensionModal?.hide();
            await cargarUsuariosBloqueados();
        } catch (error) {
            console.error('Error al suspender usuario:', error);
            notificar('error', error.message || 'No se pudo suspender al usuario.');
        } finally {
            DOM.suspensionSubmitBtn.disabled = false;
            DOM.suspensionSubmitBtn.innerHTML = '<i class="fas fa-ban me-2"></i> Suspender usuario';
            state.usuarioSuspension = null;
        }
    }

    async function manejarReactivacionUsuario(usuarioId) {
        if (!usuarioId) return;

        const confirmado = await (window.mostrarConfirmacionToasty
            ? window.mostrarConfirmacionToasty({
                mensaje: '¿Reactivar este usuario?',
                tipo: 'info',
                textoConfirmar: 'Reactivar',
                textoCancelar: 'Cancelar'
            })
            : Promise.resolve(confirm('¿Reactivar este usuario?')));

        if (!confirmado) return;

        try {
            const response = await API.reactivarUsuario?.({ usuario_id: usuarioId });
            if (!response?.success) {
                throw new Error(response?.message || 'No se pudo reactivar al usuario.');
            }

            notificar('success', response.message || 'Usuario reactivado correctamente.');
            await cargarUsuariosBloqueados();
        } catch (error) {
            console.error('Error al reactivar usuario:', error);
            notificar('error', error.message || 'No se pudo reactivar al usuario.');
        }
    }

    async function manejarExportarLog() {
        try {
            DOM.exportarLogBtn.disabled = true;
            DOM.exportarLogBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Generando...';

            const response = await API.exportarModeracionLog?.();
            if (!response?.success || !response.data?.archivo) {
                throw new Error(response?.message || 'No se pudo generar el log');
            }

            const { archivo, nombre } = response.data;
            const blob = base64ToBlob(archivo, 'application/json');
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = nombre || `moderacion-log-${Date.now()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            notificar('success', 'Log exportado correctamente');
        } catch (error) {
            console.error('Error al exportar log de moderación:', error);
            notificar('error', error.message || 'No se pudo exportar el log');
        } finally {
            DOM.exportarLogBtn.disabled = false;
            DOM.exportarLogBtn.innerHTML = '<i class="fas fa-download me-2"></i> Exportar Log';
        }
    }

    // El logout se maneja globalmente en auth.js

    function buscarReporteLocal(id) {
        return state.reportes.find(rep => String(rep.id) === String(id)) || state.reporteSeleccionado;
    }

    async function obtenerReporte(id) {
        const local = buscarReporteLocal(id);
        if (local && local.contenido_original) {
            return local;
        }

        const response = await API.getModeracionReporte?.(id);
        if (!response?.success) {
            throw new Error(response?.message || 'No se pudo cargar el reporte');
        }

        const reporte = response.data;
        state.reportes = state.reportes.map(rep => rep.id === reporte.id ? { ...rep, ...reporte } : rep);
        return reporte;
    }

    // ===================================
    // Utilidades
    // ===================================

    function setText(element, value) {
        if (element) element.textContent = value;
    }

    function crearLoader(texto) {
        return `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-spinner fa-spin fa-2x mb-3"></i>
                <p>${texto}</p>
            </div>
        `;
    }

    function crearVacio(mensaje) {
        return `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-inbox fa-2x mb-3"></i>
                <p class="mb-0">${mensaje}</p>
            </div>
        `;
    }

    function renderReportesSkeleton(cantidad = 4, append = false) {
        if (!DOM.listaReportes) return;
        const items = Array.from({ length: cantidad }).map(() => `
            <div class="reporte-item p-3 border-bottom">
                <div class="placeholder-glow mb-3">
                    <span class="badge bg-secondary placeholder col-3 me-2">&nbsp;</span>
                    <span class="badge bg-secondary placeholder col-2">&nbsp;</span>
                </div>
                <div class="placeholder-glow mb-2">
                    <span class="placeholder col-8"></span>
                </div>
                <div class="placeholder-glow mb-3">
                    <span class="placeholder col-12"></span>
                    <span class="placeholder col-10"></span>
                </div>
                <div class="placeholder-glow d-flex justify-content-between">
                    <span class="placeholder col-6"></span>
                    <span class="placeholder col-2"></span>
                </div>
            </div>
        `).join('');

        if (append) {
            DOM.listaReportes.insertAdjacentHTML('beforeend', items);
        } else {
            DOM.listaReportes.innerHTML = items;
        }
    }

    function actualizarBotonLoadMore({ visible, loading }) {
        if (!DOM.loadMoreReportesBtn) return;
        if (typeof visible === 'boolean') {
            DOM.loadMoreReportesBtn.classList.toggle('d-none', !visible);
        }
        if (typeof loading === 'boolean') {
            DOM.loadMoreReportesBtn.disabled = loading;
            const textSpan = DOM.loadMoreReportesBtn.querySelector('.btn-text');
            const loadingSpan = DOM.loadMoreReportesBtn.querySelector('.btn-loading');
            if (textSpan) textSpan.classList.toggle('d-none', loading);
            if (loadingSpan) loadingSpan.classList.toggle('d-none', !loading);
        }
    }

    function obtenerClaseSeveridad(prioridad) {
        switch (prioridad) {
            case 'alta': return 'severity-high';
            case 'media': return 'severity-medium';
            case 'baja':
            default: return 'severity-low';
        }
    }

    function obtenerBadgePrioridad(prioridad) {
        switch (prioridad) {
            case 'alta': return 'badge bg-danger';
            case 'media': return 'badge bg-warning text-dark';
            case 'baja':
            default: return 'badge bg-info';
        }
    }

    function obtenerIconoActividad(tipo = '') {
        const mapa = {
            aprobado: { icon: 'fa-check', bg: 'bg-success' },
            eliminado: { icon: 'fa-trash', bg: 'bg-danger' },
            advertencia: { icon: 'fa-exclamation-triangle', bg: 'bg-warning' },
            bloqueo: { icon: 'fa-ban', bg: 'bg-dark' },
            reporte: { icon: 'fa-flag', bg: 'bg-primary' }
        };
        return mapa[tipo] || { icon: 'fa-shield-alt', bg: 'bg-secondary' };
    }

    function capitalizar(texto = '') {
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    }

    function formatearTiempo(fecha) {
        const date = new Date(fecha);
        if (window.tiempoTranscurrido) {
            return window.tiempoTranscurrido(date);
        }
        return formatearTiempoTranscurrido(date);
    }

    function formatearTiempoTranscurrido(fecha) {
        if (!(fecha instanceof Date)) fecha = new Date(fecha);
        const ahora = new Date();
        const diff = ahora - fecha;
        const minutos = Math.floor(diff / 60000);
        const horas = Math.floor(minutos / 60);
        const dias = Math.floor(horas / 24);
        if (dias > 0) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
        if (horas > 0) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
        if (minutos > 0) return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
        return 'Justo ahora';
    }

    function formatearFechaLarga(fecha) {
        if (!fecha) return '-';
        const date = new Date(fecha);
        if (Number.isNaN(date.getTime())) return '-';
        return date.toLocaleString('es-MX', {
            day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }

    function extraerColeccion(data) {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.data)) return data.data;
        if (data.data?.data) return data.data.data;
        return [];
    }

    function generarAvatar(nombre = 'U', color = 'FF6600') {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=${color.replace('#', '')}&color=fff&size=150`;
    }

    function actualizarAvatar(elemento, url, nombre = 'Usuario', apellidos = '') {
        if (!elemento) return;
        const finalUrl = typeof normalizarAvatar === 'function'
            ? normalizarAvatar(url, nombre, apellidos)
            : (url || generarAvatar(nombre));
        elemento.src = finalUrl;
    }

    function base64ToBlob(b64Data, contentType = '', sliceSize = 512) {
        const byteCharacters = atob(b64Data);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i += 1) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        return new Blob(byteArrays, { type: contentType });
    }

    function notificar(tipo, mensaje) {
        if (window.mostrarNotificacion) {
            window.mostrarNotificacion(tipo, mensaje);
        } else {
            console.log(`[${tipo}] ${mensaje}`);
        }
    }
})();
