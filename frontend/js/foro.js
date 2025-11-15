/**
 * FORO.JS - Vista principal del foro
 * ===================================
 * Renderiza las carreras disponibles y publicaciones destacadas respetando
 * la carrera del usuario autenticado.
 */

(function () {
    const state = {
        usuario: null,
        carreraId: null,
        filtros: {
            categoria: 'todas',
            orden: 'reciente',
            materiaId: null,
        },
        posts: [],
        materias: [],
        pagina: 1,
        hasMore: false,
        cargandoPosts: false,
    };

    const categoriasConfig = {
        todas: { nombre: 'Todas', icon: 'fa-grid', color: 'secondary' },
        duda: { nombre: 'Dudas', icon: 'fa-question-circle', color: 'primary' },
        recurso: { nombre: 'Recursos', icon: 'fa-book-open', color: 'success' },
        aviso: { nombre: 'Avisos', icon: 'fa-bullhorn', color: 'warning' },
        discusion: { nombre: 'Discusión', icon: 'fa-comments', color: 'info' },
    };

    const selectors = {
        avatarNavbar: document.getElementById('avatarNavbar'),
        nombreNavbar: document.getElementById('nombreUsuario'),
        nuevoPostAvatar: document.getElementById('nuevoPostAvatar'),
        chipsCategorias: document.getElementById('chipsCategorias'),
        selectOrden: document.getElementById('selectOrden'),
        listaMateriasFiltro: document.getElementById('listaMateriasFiltro'),
        resetFiltrosBtn: document.getElementById('resetFiltrosBtn'),
        feedContainer: document.getElementById('feedContainer'),
        loadMoreBtn: document.getElementById('feedLoadMoreBtn'),
        resumenForo: document.getElementById('resumenForo'),
        tendenciasForo: document.getElementById('tendenciasForo'),
        materiasSidebar: document.getElementById('materiasSidebar'),
        eventosSidebar: document.getElementById('eventosSidebar'),
    };

    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        try {
            await cargarUsuarioActual();
            inicializarFiltros();

            await Promise.all([
                cargarMaterias(),
                cargarResumenForo(),
                cargarTendencias(),
                cargarEventosSidebar(),
            ]);

            renderMateriasFiltro();
            renderMateriasSidebar();
            await cargarPosts(true);
        } catch (error) {
            console.error('Error inicializando foro:', error);
            mostrarNotificacion('error', error.message || 'No se pudo cargar el foro. Intenta más tarde.');
        }

        configurarEventos();
    }

    function configurarEventos() {
        selectors.selectOrden?.addEventListener('change', async (event) => {
            state.filtros.orden = event.target.value;
            await cargarPosts(true);
        });

        selectors.resetFiltrosBtn?.addEventListener('click', async () => {
            state.filtros = { categoria: 'todas', orden: 'reciente', materiaId: null };
            if (selectors.selectOrden) selectors.selectOrden.value = 'reciente';
            renderChipsCategorias();
            renderMateriasFiltro();
            await cargarPosts(true);
        });

        selectors.loadMoreBtn?.addEventListener('click', async () => {
            await cargarPosts();
        });
    }

    async function cargarUsuarioActual() {
        const almacenado = localStorage.getItem('user_data');
        if (almacenado) {
            try {
                let parsed = JSON.parse(almacenado);
                if (typeof normalizarDatosUsuario === 'function') {
                    parsed = normalizarDatosUsuario(parsed);
                    localStorage.setItem('user_data', JSON.stringify(parsed));
                }
                state.usuario = parsed;
            } catch (error) {
                console.warn('No se pudo interpretar el usuario almacenado:', error);
                state.usuario = null;
            }
        }

        if (!state.usuario) {
            try {
                const response = await API.me();
                if (response?.success && response.data?.user) {
                    state.usuario = typeof normalizarDatosUsuario === 'function'
                        ? normalizarDatosUsuario(response.data.user)
                        : response.data.user;
                    localStorage.setItem('user_data', JSON.stringify(state.usuario));
                }
            } catch (error) {
                console.warn('No se pudo obtener el usuario autenticado:', error);
            }
        }

        if (state.usuario?.rol === 'estudiante') {
            state.carreraId = state.usuario.estudiante?.carrera?.id || state.usuario.estudiante?.carrera_id || null;
        }

        const avatarFuente = state.usuario?.avatar_url || state.usuario?.avatar;
        const avatarUrl = typeof normalizarAvatar === 'function'
            ? normalizarAvatar(avatarFuente, state.usuario?.nombre, state.usuario?.apellidos)
            : (avatarFuente || `https://ui-avatars.com/api/?name=${encodeURIComponent(state.usuario?.nombre || 'U')}&background=FF6600&color=fff`);
        if (selectors.avatarNavbar) selectors.avatarNavbar.src = avatarUrl;
        if (selectors.nuevoPostAvatar) selectors.nuevoPostAvatar.src = avatarUrl;
        if (selectors.nombreNavbar) selectors.nombreNavbar.textContent = state.usuario?.nombre || 'Usuario';
    }

    async function cargarMaterias() {
        try {
            const params = {};
            if (state.carreraId) params.carrera_id = state.carreraId;
            const response = await API.getMaterias(params);
            state.materias = Array.isArray(response?.data) ? response.data : [];
        } catch (error) {
            console.warn('No se pudieron cargar las materias del foro:', error);
            state.materias = [];
        }
    }

    function inicializarFiltros() {
        renderChipsCategorias();
    }

    function renderChipsCategorias() {
        if (!selectors.chipsCategorias) return;
        selectors.chipsCategorias.innerHTML = '';

        Object.entries(categoriasConfig).forEach(([key, info]) => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = `filter-chip ${state.filtros.categoria === key ? 'active' : ''}`;
            chip.setAttribute('data-categoria', key);
            chip.innerHTML = `<i class="fas ${info.icon} me-1"></i>${info.nombre}`;
            chip.addEventListener('click', async () => {
                if (state.filtros.categoria === key) return;
                state.filtros.categoria = key;
                renderChipsCategorias();
                await cargarPosts(true);
            });
            selectors.chipsCategorias.appendChild(chip);
        });
    }

    function renderMateriasFiltro() {
        if (!selectors.listaMateriasFiltro) return;

        if (!state.materias.length) {
            selectors.listaMateriasFiltro.innerHTML = `
                <div class="text-muted small">No hay materias disponibles por ahora.</div>
            `;
            return;
        }

        const lista = document.createElement('div');
        lista.className = 'list-group list-group-flush';

        const todasBtn = document.createElement('button');
        todasBtn.type = 'button';
        todasBtn.className = `list-group-item list-group-item-action py-2 ${state.filtros.materiaId ? '' : 'active'}`;
        todasBtn.textContent = 'Todas las materias';
        todasBtn.addEventListener('click', async () => {
            state.filtros.materiaId = null;
            renderMateriasFiltro();
            await cargarPosts(true);
        });
        lista.appendChild(todasBtn);

        state.materias.forEach(materia => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `list-group-item list-group-item-action py-2 ${state.filtros.materiaId === materia.id ? 'active' : ''}`;
            btn.textContent = materia.nombre;
            btn.addEventListener('click', async () => {
                state.filtros.materiaId = materia.id;
                renderMateriasFiltro();
                await cargarPosts(true);
            });
            lista.appendChild(btn);
        });

        selectors.listaMateriasFiltro.innerHTML = '';
        selectors.listaMateriasFiltro.appendChild(lista);
    }

    async function cargarPosts(reset = false) {
        if (state.cargandoPosts) return;
        state.cargandoPosts = true;

        if (reset) {
            state.pagina = 1;
            state.posts = [];
            state.hasMore = false;
            if (selectors.feedContainer) {
                selectors.feedContainer.innerHTML = `
                    <div class="text-center py-5 text-muted">
                        <i class="fas fa-spinner fa-spin fa-2x mb-3"></i>
                        <p>Cargando publicaciones del foro...</p>
                    </div>
                `;
            }
        }

        try {
            const params = {
                per_page: 10,
                page: state.pagina,
                orden: state.filtros.orden,
            };

            if (state.filtros.categoria && state.filtros.categoria !== 'todas') {
                params.categoria = state.filtros.categoria;
            }

            if (state.filtros.materiaId) {
                params.materia_id = state.filtros.materiaId;
            }

            if (state.carreraId) {
                params.carrera_id = state.carreraId;
            }

            const response = await API.getPosts(params);
            const coleccion = extraerColeccion(response?.data ?? response);
            const meta = response?.data ?? response;

            if (reset) {
                state.posts = coleccion;
            } else {
                state.posts = [...state.posts, ...coleccion];
            }

            if (meta?.current_page && meta?.last_page) {
                state.hasMore = meta.current_page < meta.last_page;
            } else {
                state.hasMore = coleccion.length === params.per_page;
            }

            state.pagina += 1;
            renderFeed();
        } catch (error) {
            console.error('Error al cargar publicaciones del foro:', error);
            if (selectors.feedContainer) {
                selectors.feedContainer.innerHTML = `
                    <div class="text-center py-5 text-danger">
                        <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                        <p>${error.message || 'No se pudieron cargar las publicaciones.'}</p>
                        <button class="btn btn-outline-primary btn-sm" id="reintentarFeedBtn">
                            <i class="fas fa-redo me-2"></i> Reintentar
                        </button>
                    </div>
                `;
                document.getElementById('reintentarFeedBtn')?.addEventListener('click', () => cargarPosts(true));
            }
        } finally {
            state.cargandoPosts = false;
        }
    }

    function renderFeed() {
        if (!selectors.feedContainer) return;

        if (!state.posts.length) {
            selectors.feedContainer.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="fas fa-inbox fa-2x mb-3"></i>
                    <p>No encontramos publicaciones con los filtros actuales.</p>
                </div>
            `;
            selectors.loadMoreBtn?.classList.add('d-none');
            return;
        }

        const fragment = document.createDocumentFragment();

        state.posts.forEach(post => {
            const card = document.createElement('div');
            card.className = 'feed-card card border-0 shadow-sm';

            const categoria = categoriasConfig[post.categoria] || categoriasConfig.duda;
            const autorNombre = post.autor?.nombre_completo || `${post.autor?.nombre || ''} ${post.autor?.apellidos || ''}`.trim() || 'Usuario';
            const avatarOrigen = post.autor?.avatar_url || post.autor?.avatar;
            const avatar = typeof normalizarAvatar === 'function'
                ? normalizarAvatar(avatarOrigen, post.autor?.nombre, post.autor?.apellidos)
                : (avatarOrigen || `https://ui-avatars.com/api/?name=${encodeURIComponent(autorNombre || 'U')}&background=FF6600&color=fff`);
            const fecha = formatearTiempo(post.created_at || post.fecha);
            const contenido = truncarTexto(post.contenido || '', 220);
            const linkPublicacion = typeof buildFrontendUrl === 'function' ? buildFrontendUrl(`post?id=${post.id}`) : `post?id=${post.id}`;
            const perfilUrl = typeof buildFrontendUrl === 'function' ? buildFrontendUrl(`perfil?usuario=${post.autor?.id}`) : `perfil?usuario=${post.autor?.id}`;
            const likes = post.num_likes ?? post.votos ?? 0;
            const esAutor = state.usuario?.id === post.autor?.id;
            const esModerador = ['admin', 'moderador'].includes((state.usuario?.rol || '').toLowerCase());
            const puedeEliminar = esAutor || esModerador;

            card.innerHTML = `
                <div class="card-body">
                    <div class="d-flex align-items-start mb-3">
                        <a href="${perfilUrl}" class="d-inline-flex">
                            <img src="${avatar}" class="rounded-circle me-3" width="50" height="50" alt="Avatar autor">
                        </a>
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="mb-1">
                                        <a href="${perfilUrl}" class="text-decoration-none text-dark fw-semibold">${autorNombre}</a>
                                    </h6>
                                    <div class="feed-meta">
                                        <i class="fas fa-book me-1"></i> ${post.materia?.nombre || 'Materia'}
                                        <span class="ms-2"><i class="fas fa-clock me-1"></i>${fecha}</span>
                                    </div>
                                </div>
                                <div class="dropdown ms-2">
                                    <button class="btn btn-link text-muted" data-bs-toggle="dropdown">
                                        <i class="fas fa-ellipsis-v"></i>
                                    </button>
                                    <ul class="dropdown-menu dropdown-menu-end">
                                        <li><a class="dropdown-item" href="${linkPublicacion}"><i class="fas fa-eye me-2"></i> Ver publicación</a></li>
                                        ${puedeEliminar ? `
                                            <li><a class="dropdown-item text-danger" href="#" onclick="eliminarPublicacionDesdeFeed(${post.id})"><i class="fas fa-trash me-2"></i> Eliminar</a></li>
                                        ` : ''}
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <span class="badge bg-${categoria.color} px-3 py-2"><i class="fas ${categoria.icon} me-1"></i>${categoria.nombre}</span>
                    </div>
                    <h5 class="fw-bold mb-2">${post.titulo}</h5>
                    <p class="text-muted mb-3">${contenido}</p>
                    <div class="d-flex flex-wrap gap-2 mb-3">
                        ${(post.etiquetas || []).map(tag => `<span class="badge bg-light text-dark border">#${tag}</span>`).join('')}
                    </div>
                    <div class="feed-actions d-flex justify-content-between align-items-center border-top pt-3">
                        <div class="text-muted small d-flex align-items-center gap-3">
                            <span><i class="fas fa-heart me-1"></i>${likes}</span>
                            <span><i class="fas fa-comment me-1"></i>${post.comentarios_count ?? post.comentarios ?? 0}</span>
                            <span><i class="fas fa-eye me-1"></i>${post.vistas ?? 0}</span>
                        </div>
                        <a class="btn btn-outline-primary btn-sm" href="${linkPublicacion}">
                            Ver publicación <i class="fas fa-arrow-right ms-2"></i>
                        </a>
                    </div>
                </div>
            `;

            fragment.appendChild(card);
        });

        selectors.feedContainer.innerHTML = '';
        selectors.feedContainer.appendChild(fragment);

        if (state.hasMore) {
            selectors.loadMoreBtn?.classList.remove('d-none');
        } else {
            selectors.loadMoreBtn?.classList.add('d-none');
        }
    }

    async function cargarResumenForo() {
        if (!selectors.resumenForo) return;
        try {
            const response = await API.getEstadisticas?.();
            const stats = response?.data || {};
            selectors.resumenForo.innerHTML = `
                <div class="row g-2">
                    ${crearTarjetaResumen('fa-users', 'text-primary', stats.estudiantes ?? 0, 'Estudiantes activos')}
                    ${crearTarjetaResumen('fa-comments', 'text-success', stats.publicaciones ?? 0, 'Publicaciones totales')}
                    ${crearTarjetaResumen('fa-book-open', 'text-warning', stats.recursos ?? 0, 'Recursos compartidos')}
                    ${crearTarjetaResumen('fa-graduation-cap', 'text-danger', stats.carreras ?? 0, 'Carreras disponibles')}
                </div>
            `;
        } catch (error) {
            console.warn('No se pudo cargar el resumen del foro:', error);
            selectors.resumenForo.innerHTML = `
                <div class="text-center py-3 text-muted small">
                    <i class="fas fa-exclamation-triangle me-2"></i> No se pudo obtener el resumen.
                </div>
            `;
        }
    }

    function crearTarjetaResumen(icono, colorClase, valor, etiqueta) {
        const numero = Number.isFinite(Number(valor)) ? Number(valor).toLocaleString('es-MX') : valor;
        return `
            <div class="col-6">
                <div class="border rounded-4 p-3 h-100 text-center">
                    <i class="fas ${icono} ${colorClase} mb-2"></i>
                    <h5 class="fw-bold mb-1">${numero}</h5>
                    <small class="text-muted">${etiqueta}</small>
                </div>
            </div>
        `;
    }

    async function cargarTendencias() {
        if (!selectors.tendenciasForo) return;
        try {
            const params = state.carreraId ? { carrera_id: state.carreraId } : {};
            const response = await API.getPublicacionesDestacadas(params);
            const tendencias = Array.isArray(response?.data) ? response.data.slice(0, 5) : [];

            if (!tendencias.length) {
                selectors.tendenciasForo.innerHTML = `
                    <div class="text-muted small text-center py-3">Aún no hay publicaciones destacadas.</div>
                `;
                return;
            }

            selectors.tendenciasForo.innerHTML = tendencias.map(pub => {
                const enlace = typeof buildFrontendUrl === 'function' ? buildFrontendUrl(`post?id=${pub.id}`) : `post?id=${pub.id}`;
                const titulo = pub.titulo || 'Publicación destacada';
                const likes = pub.num_likes ?? 0;
                return `
                    <a href="${enlace}" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                        <span class="text-truncate me-2" style="max-width: 200px;">${titulo}</span>
                        <span class="badge bg-light text-dark"><i class="fas fa-heart me-1 text-danger"></i>${likes}</span>
                    </a>
                `;
            }).join('');
        } catch (error) {
            console.warn('No se pudieron cargar las tendencias del foro:', error);
            selectors.tendenciasForo.innerHTML = `
                <div class="text-center py-3 text-muted small">
                    <i class="fas fa-exclamation-triangle me-2"></i> No se pudieron obtener las tendencias.
                </div>
            `;
        }
    }

    function renderMateriasSidebar() {
        if (!selectors.materiasSidebar) return;
        if (!state.materias.length) {
            selectors.materiasSidebar.innerHTML = `
                <div class="text-center py-3 text-muted small">
                    No se encontraron materias registradas.
                </div>
            `;
            return;
        }

        selectors.materiasSidebar.innerHTML = state.materias.slice(0, 6).map(materia => {
            const enlace = typeof buildFrontendUrl === 'function' ? buildFrontendUrl(`materia?id=${materia.id}`) : `views/materia.html?id=${materia.id}`;
            return `
                <a href="${enlace}" class="list-group-item list-group-item-action">
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="text-truncate" style="max-width: 210px;">${materia.nombre}</span>
                        <i class="fas fa-chevron-right text-muted"></i>
                    </div>
                </a>
            `;
        }).join('');
    }

    async function cargarEventosSidebar() {
        if (!selectors.eventosSidebar) return;
        try {
            const hoy = new Date().toISOString().slice(0, 10);
            const response = await API.getEventos({ fecha_inicio: hoy, per_page: 5 });
            const eventos = Array.isArray(response?.data) ? response.data : [];

            if (!eventos.length) {
                selectors.eventosSidebar.innerHTML = `
                    <div class="text-center py-3 text-muted small">
                        No hay eventos próximos.
                    </div>
                `;
                return;
            }

            selectors.eventosSidebar.innerHTML = eventos.map(evento => {
                const fecha = formatearFecha(evento.fecha_inicio || evento.fecha);
                const titulo = evento.titulo || 'Evento académico';
                return `
                    <div class="d-flex align-items-start gap-3 mb-3">
                        <div class="text-center">
                            <div class="badge bg-primary text-uppercase mb-1">${fecha.dia}</div>
                            <small class="text-muted">${fecha.mes}</small>
                        </div>
                        <div class="flex-grow-1">
                            <h6 class="mb-1">${titulo}</h6>
                            <small class="text-muted">${evento.materia?.nombre || 'General'}</small>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.warn('No se pudieron cargar los eventos del foro:', error);
            selectors.eventosSidebar.innerHTML = `
                <div class="text-center py-3 text-muted small">
                    <i class="fas fa-exclamation-triangle me-2"></i> No se pudieron obtener los eventos.
                </div>
            `;
        }
    }

    async function eliminarPublicacionDesdeFeed(postId) {
        try {
            const confirmado = await (window.mostrarConfirmacionToasty
                ? window.mostrarConfirmacionToasty({
                    mensaje: '¿Eliminar esta publicación del foro?',
                    tipo: 'warning',
                    textoConfirmar: 'Eliminar',
                    textoCancelar: 'Cancelar'
                })
                : Promise.resolve(confirm('¿Eliminar esta publicación?')));
            if (!confirmado) return;

            const response = await API.deletePost(postId);
            if (!response?.success) {
                throw new Error(response?.message || 'No se pudo eliminar la publicación');
            }
            mostrarNotificacion('success', response.message || 'Publicación eliminada correctamente');
            state.posts = state.posts.filter(post => post.id !== postId);
            renderFeed();
        } catch (error) {
            console.error('Error al eliminar publicación desde el feed:', error);
            mostrarNotificacion('error', error.message || 'No se pudo eliminar la publicación');
        }
    }

    function extraerColeccion(data) {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.data)) return data.data;
        if (data.data?.data) return data.data.data;
        return [];
    }

    function truncarTexto(texto = '', longitud = 180) {
        if (!texto) return '';
        const limpio = texto.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (limpio.length <= longitud) return limpio;
        return `${limpio.slice(0, longitud)}…`;
    }

    function formatearTiempo(fecha) {
        if (!fecha) return 'Hace un momento';
        const date = new Date(fecha);
        if (Number.isNaN(date.getTime())) return 'Hace un momento';
        const diff = Date.now() - date.getTime();
        const minutos = Math.floor(diff / 60000);
        if (minutos < 1) return 'Justo ahora';
        if (minutos < 60) return `Hace ${minutos} min`;
        const horas = Math.floor(minutos / 60);
        if (horas < 24) return `Hace ${horas} h`;
        const dias = Math.floor(horas / 24);
        if (dias < 7) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
        return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    }

    function formatearFecha(valor) {
        const date = new Date(valor);
        if (Number.isNaN(date.getTime())) {
            return { dia: '--', mes: '---' };
        }
        return {
            dia: date.getDate(),
            mes: date.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '').toUpperCase(),
        };
    }

    window.eliminarPublicacionDesdeFeed = eliminarPublicacionDesdeFeed;
})();

