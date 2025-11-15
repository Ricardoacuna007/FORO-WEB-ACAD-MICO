// ===================================
// PERFIL.JS - Gestión de la vista de perfil
// ===================================
(function () {
    const state = {
        perfil: null,
        estadisticas: {},
        actividad: [],
        publicaciones: [],
        guardados: [],
        perfilObjetivoId: null,
        esPerfilPropio: true,
    };

    const selectors = {
        profileAvatar: document.getElementById('profileAvatar'),
        avatarPreview: document.getElementById('avatarPreview'),
        profileName: document.getElementById('profileName'),
        navbarName: document.getElementById('navbarUserName'),
        navbarAvatar: document.getElementById('navbarAvatar'),
        profileRole: document.getElementById('profileRole'),
        profileFullName: document.getElementById('profileFullName'),
        profileEmail: document.getElementById('profileEmail'),
        profileCareer: document.getElementById('profileCareer'),
        profileCareerCode: document.getElementById('profileCareerCode'),
        profileCareerGroup: document.getElementById('profileCareerGroup'),
        profileCareerDetail: document.getElementById('profileCareerDetail'),
        profileCareerCodeDetail: document.getElementById('profileCareerCodeDetail'),
        profileSemesterGroup: document.getElementById('profileSemesterGroup'),
        profileSemester: document.getElementById('profileSemester'),
        profileRegisteredGroup: document.getElementById('profileRegisteredGroup'),
        profileRegisteredAt: document.getElementById('profileRegisteredAt'),
        profileMatricula: document.getElementById('profileMatricula'),
        profileNumeroEmpleado: document.getElementById('profileNumeroEmpleado'),
        profileNumeroEmpleadoGroup: document.getElementById('profileNumeroEmpleadoGroup'),
        profileNumeroEmpleadoDetail: document.getElementById('profileNumeroEmpleadoDetail'),
        editarCarreraGroup: document.getElementById('editarCarreraGroup'),
        editarCuatrimestreGroup: document.getElementById('editarCuatrimestreGroup'),
        editarMatriculaGroup: document.getElementById('editarMatriculaGroup'),
        statPublicaciones: document.getElementById('statPublicaciones'),
        statComentarios: document.getElementById('statComentarios'),
        statRespuestas: document.getElementById('statRespuestas'),
        statGuardados: document.getElementById('statGuardados'),
        publicacionesCount: document.getElementById('publicacionesCount'),
        guardadosCount: document.getElementById('guardadosCount'),
        actividadCount: document.getElementById('actividadCount'),
        publicacionesList: document.getElementById('listaPublicaciones'),
        guardadosList: document.getElementById('listaGuardados'),
        actividadTimeline: document.getElementById('actividadTimeline'),
        notifEmail: document.getElementById('notifEmail'),
        notifComentarios: document.getElementById('notifComentarios'),
        notifMenciones: document.getElementById('notifMenciones'),
        contadorTotal: document.querySelector('[data-notif-total]'),
        contadorNoLeidas: document.querySelector('[data-notif-no-leidas]'),
        contadorSemana: document.querySelector('[data-notif-semana]'),
        editarPerfilForm: document.getElementById('editarPerfilForm'),
        avatarForm: document.getElementById('avatarForm'),
        cambiarPasswordForm: document.getElementById('cambiarPasswordForm'),
        logoutButton: document.querySelector('[data-action="logout"]'),
        eliminarCuentaBtn: document.getElementById('eliminarCuentaBtn'),
        searchForm: document.getElementById('searchForm'),
        searchInput: document.getElementById('searchInput'),
        editarPerfilModal: document.getElementById('editarPerfilModal'),
        editarCarreraSelect: document.querySelector('#editarPerfilForm select[name="carrera_id"]'),
        editarCuatrimestreInput: document.querySelector('#editarPerfilForm input[name="cuatrimestre_actual"]'),
        editarMatriculaInput: document.querySelector('#editarPerfilForm input[name="matricula"]')
    };

    let carrerasDisponibles = [];

    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        try {
            const params = new URLSearchParams(window.location.search);
            const objetivoIdParam = params.get('usuario') ?? params.get('id');
            const parsedId = objetivoIdParam ? parseInt(objetivoIdParam, 10) : null;

            state.perfilObjetivoId = Number.isFinite(parsedId) ? parsedId : null;

            mostrarEstadoInicial();
            await cargarPerfil();
            await Promise.all([
                cargarPublicacionesUsuario(),
                cargarGuardadosUsuario(),
                cargarActividadReciente()
            ]);
            configurarEventos();
            ajustarVistaSegunPropiedad();
            activarTabInicial();
        } catch (error) {
            console.error('Error inicializando el perfil:', error);
            notificar('error', error.message || 'No se pudo cargar la información del perfil');
            mostrarErrorGeneral();
        }
    }

    function toggleVisibility(element, shouldShow) {
        if (!element) return;
        element.classList.toggle('d-none', !shouldShow);
        element.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
    }

    function mostrarEstadoInicial() {
        if (selectors.publicacionesList) {
            selectors.publicacionesList.innerHTML = generarLoader('Cargando publicaciones...');
        }
        if (selectors.guardadosList) {
            selectors.guardadosList.innerHTML = generarLoader('Cargando guardados...');
        }
        if (selectors.actividadTimeline) {
            selectors.actividadTimeline.innerHTML = generarLoader('Cargando actividad...');
        }
    }

    async function cargarPerfil() {
        let response;

        if (Number.isInteger(state.perfilObjetivoId)) {
            response = await API.getPerfilUsuario(state.perfilObjetivoId);
        } else {
            response = await API.getPerfil();
        }

        if (!response.success || !response.data) {
            throw new Error(response.message || 'No se encontró información del perfil');
        }

        const data = response.data;
        const perfil = data.perfil || data.usuario || data;
        const estadisticas = data.estadisticas || perfil.estadisticas || {};
        const configuracion = data.configuracion || {};
        const actividad = data.actividad || [];

        state.perfil = perfil;
        state.estadisticas = estadisticas;
        state.actividad = actividad;

        const usuarioActual = JSON.parse(localStorage.getItem('user_data') || '{}');
        state.esPerfilPropio = !Number.isInteger(state.perfilObjetivoId) ||
            Number(state.perfilObjetivoId) === Number(usuarioActual?.id || perfil.id);

        if (!usuarioActual?.id || state.esPerfilPropio) {
            // Guardar usuario en localStorage para reutilizar en otras vistas
            try {
                const userStored = normalizarDatosUsuario({
                    id: perfil.id,
                    nombre: perfil.nombre,
                    apellidos: perfil.apellidos,
                    email: perfil.email,
                    rol: perfil.rol,
                    carrera: perfil.carrera,
                    avatar: perfil.avatar_url || perfil.avatar,
                    avatar_url: perfil.avatar_url || perfil.avatar,
                    estudiante: perfil.estudiante,
                    profesor: perfil.profesor
                });
                localStorage.setItem('user_data', JSON.stringify(userStored));
            } catch (storageError) {
                console.warn('No se pudo almacenar el usuario en localStorage:', storageError);
            }
        }

        actualizarInformacionPerfil(perfil);
        actualizarEstadisticas(estadisticas);
        actualizarNotificaciones(configuracion);
        actualizarActividad(actividad);
    }

    async function cargarPublicacionesUsuario() {
        try {
            const params = { limite: 10 };
            if (!state.esPerfilPropio && state.perfil?.id) {
                params.usuario_id = state.perfil.id;
            }

            const response = await API.getPublicacionesUsuario(params);
            const publicaciones = extraerColeccion(response);
            state.publicaciones = (publicaciones || []).map(publicacion => {
                const autor = publicacion.autor || {};
                const autorNormalizado = {
                    ...autor,
                    avatar_url: normalizarAvatar(autor.avatar_url || autor.avatar, autor.nombre, autor.apellidos),
                    avatar: normalizarAvatar(autor.avatar_url || autor.avatar, autor.nombre, autor.apellidos)
                };
                return {
                    ...publicacion,
                    autor: autorNormalizado
                };
            });
            renderizarPublicaciones();
        } catch (error) {
            console.error('Error al cargar publicaciones del usuario:', error);
            if (selectors.publicacionesList) {
                selectors.publicacionesList.innerHTML = generarMensajeVacio('No se pudieron cargar las publicaciones.');
            }
        }
    }

    async function cargarGuardadosUsuario() {
        if (!state.esPerfilPropio) {
            state.guardados = [];
            renderizarGuardados();
            if (selectors.guardadosList) {
                selectors.guardadosList.innerHTML = generarMensajeVacio('Los guardados de otros usuarios son privados.');
            }
            return;
        }

        try {
            const response = await API.getPublicacionesGuardadas({ limite: 10 });
            const guardados = extraerColeccion(response);
            state.guardados = (guardados || []).map(publicacion => {
                const autor = publicacion.autor || {};
                const autorNormalizado = {
                    ...autor,
                    avatar_url: normalizarAvatar(autor.avatar_url || autor.avatar, autor.nombre, autor.apellidos),
                    avatar: normalizarAvatar(autor.avatar_url || autor.avatar, autor.nombre, autor.apellidos)
                };
                return {
                    ...publicacion,
                    autor: autorNormalizado
                };
            });
            renderizarGuardados();
        } catch (error) {
            console.error('Error al cargar guardados del usuario:', error);
            if (selectors.guardadosList) {
                selectors.guardadosList.innerHTML = generarMensajeVacio('No se pudieron cargar los guardados.');
            }
        }
    }

    async function cargarActividadReciente() {
        try {
            // Si la actividad ya viene incluida en el perfil, no se vuelve a pedir
            if (state.actividad && state.actividad.length > 0) {
                renderizarActividad();
                return;
            }

            let response;
            if (!state.esPerfilPropio && Number.isInteger(state.perfilObjetivoId)) {
                response = await API.getPerfilUsuario(state.perfilObjetivoId);
            } else {
                response = await API.getPerfil();
            }

            const actividad = (response.data && (response.data.actividad || [])) || [];
            state.actividad = actividad;
            renderizarActividad();
        } catch (error) {
            console.error('Error al cargar la actividad reciente:', error);
            if (selectors.actividadTimeline) {
                selectors.actividadTimeline.innerHTML = generarMensajeVacio('No se pudo cargar la actividad reciente.');
            }
        }
    }

    function actualizarInformacionPerfil(perfil) {
        const fullName = [perfil.nombre, perfil.apellidos].filter(Boolean).join(' ') || perfil.username || 'Usuario';
        const rol = (perfil.rol || perfil.rol_nombre || '').toString().toLowerCase();
        const esEstudiante = rol === 'estudiante';
        const esProfesor = rol === 'profesor';

        const carreraNombre = perfil.estudiante?.carrera?.nombre
            || perfil.carrera?.nombre
            || (esProfesor ? (perfil.profesor?.especialidad || perfil.especialidad) : null)
            || perfil.carrera
            || '-';

        const carreraCodigo = perfil.estudiante?.carrera?.codigo
            || perfil.carrera?.codigo
            || '';

        const cuatrimestre = perfil.estudiante?.cuatrimestre_actual
            || perfil.cuatrimestre
            || perfil.estudiante?.cuatrimestre
            || null;

        const numeroEmpleado = perfil.profesor?.num_empleado
            || perfil.num_empleado
            || '';

        const roleName = perfil.rol?.nombre || perfil.rol_nombre || perfil.rol || 'Usuario';
        const email = perfil.email || '-';
        const matricula = perfil.estudiante?.matricula || perfil.matricula || '';
        const registrado = formatearFechaLarga(perfil.created_at || perfil.fecha_registro);
        const avatarUrl = typeof normalizarAvatar === 'function'
            ? normalizarAvatar(perfil.avatar_url || perfil.avatar, perfil.nombre, perfil.apellidos)
            : (perfil.avatar_url || generarAvatar(fullName));

        actualizarTexto(selectors.profileName, fullName);
        actualizarTexto(selectors.navbarName, perfil.nombre || fullName);
        actualizarTexto(selectors.profileFullName, fullName);
        actualizarTexto(selectors.profileEmail, email);
        actualizarTexto(selectors.profileCareer, carreraNombre);
        actualizarTexto(selectors.profileCareerCode, carreraCodigo ? `(${carreraCodigo})` : '');
        actualizarTexto(selectors.profileCareerDetail, carreraNombre);
        actualizarTexto(selectors.profileCareerCodeDetail, carreraCodigo ? `(${carreraCodigo})` : '');
        actualizarTexto(selectors.profileSemester, cuatrimestre ? `${cuatrimestre}°` : '-');
        actualizarTexto(selectors.profileMatricula, matricula || '-');
        actualizarTexto(selectors.profileNumeroEmpleado, numeroEmpleado || '-');
        actualizarTexto(selectors.profileNumeroEmpleadoDetail, numeroEmpleado || '-');
        actualizarTexto(selectors.profileRegisteredAt, registrado || '-');
        actualizarTexto(selectors.profileRole, carreraCodigo ? `${capitalizar(roleName)} • ${carreraCodigo}` : capitalizar(roleName));

        toggleVisibility(selectors.profileCareer, carreraNombre && carreraNombre !== '-');
        toggleVisibility(selectors.profileCareerGroup, carreraNombre && carreraNombre !== '-');
        toggleVisibility(selectors.profileCareerCode, Boolean(carreraCodigo));
        toggleVisibility(selectors.profileCareerCodeDetail, Boolean(carreraCodigo));

        toggleVisibility(selectors.profileSemesterGroup, Boolean(cuatrimestre));
        toggleVisibility(selectors.profileNumeroEmpleadoGroup, Boolean(numeroEmpleado));
        toggleVisibility(selectors.profileNumeroEmpleado, Boolean(numeroEmpleado));
        toggleVisibility(selectors.profileMatricula, Boolean(matricula));
        toggleVisibility(selectors.profileRegisteredGroup, Boolean(registrado));

        actualizarAvatar(selectors.profileAvatar, avatarUrl);
        actualizarAvatar(selectors.avatarPreview, avatarUrl);
        actualizarAvatar(selectors.navbarAvatar, avatarUrl, 35);

        // Prellenar formulario de edición
        if (selectors.editarPerfilForm) {
            const form = selectors.editarPerfilForm;
            form.nombre.value = perfil.nombre || '';
            form.apellidos.value = perfil.apellidos || '';

            if (selectors.editarMatriculaInput) {
                selectors.editarMatriculaInput.value = esEstudiante ? (matricula || '') : '';
            }

            if (selectors.editarCuatrimestreInput) {
                selectors.editarCuatrimestreInput.value = esEstudiante && cuatrimestre ? cuatrimestre : '';
            }

            if (selectors.editarCarreraSelect && esEstudiante) {
                cargarCarrerasDisponibles().then(() => {
                    popularSelectCarreras();
                    const carreraId = perfil.estudiante?.carrera?.id || perfil.carrera?.id || '';
                    selectors.editarCarreraSelect.value = carreraId ? String(carreraId) : '';
                });
            } else if (selectors.editarCarreraSelect) {
                selectors.editarCarreraSelect.innerHTML = '<option value="">Selecciona una carrera</option>';
            }

            toggleVisibility(selectors.editarCarreraGroup, esEstudiante);
            toggleVisibility(selectors.editarCuatrimestreGroup, esEstudiante);
            toggleVisibility(selectors.editarMatriculaGroup, esEstudiante);
        }
    }

    async function cargarCarrerasDisponibles() {
        if (carrerasDisponibles.length) {
            return carrerasDisponibles;
        }

        try {
            const response = await API.getCarreras();
            if (response.success && Array.isArray(response.data)) {
                carrerasDisponibles = response.data;
            }
        } catch (error) {
            console.error('Error al cargar carreras:', error);
            carrerasDisponibles = [];
        }

        return carrerasDisponibles;
    }

    function popularSelectCarreras() {
        if (!selectors.editarCarreraSelect) return;

        const opciones = ['<option value="">Selecciona una carrera</option>'];
        carrerasDisponibles.forEach(carrera => {
            opciones.push(`<option value="${carrera.id}">${carrera.nombre}</option>`);
        });

        selectors.editarCarreraSelect.innerHTML = opciones.join('');
    }

    function actualizarEstadisticas(estadisticas = {}) {
        actualizarTexto(selectors.statPublicaciones, estadisticas.publicaciones || 0);
        actualizarTexto(selectors.statComentarios, estadisticas.comentarios || 0);
        actualizarTexto(selectors.statRespuestas, estadisticas.respuestas_utiles || estadisticas.respuestas || 0);
        actualizarTexto(selectors.statGuardados, estadisticas.guardados || 0);

        actualizarTexto(selectors.publicacionesCount, estadisticas.publicaciones || 0);
        actualizarTexto(selectors.guardadosCount, estadisticas.guardados || 0);
        actualizarTexto(selectors.actividadCount, `${(estadisticas.actividad_reciente || (state.actividad?.length ?? 0))} registros`);

        if (selectors.contadorTotal) {
            selectors.contadorTotal.textContent = estadisticas.notificaciones_totales || 0;
        }
        if (selectors.contadorNoLeidas) {
            selectors.contadorNoLeidas.textContent = estadisticas.notificaciones_no_leidas || 0;
        }
        if (selectors.contadorSemana) {
            selectors.contadorSemana.textContent = estadisticas.notificaciones_semana || 0;
        }
    }

    function actualizarNotificaciones(configuracion = {}) {
        if (!selectors.notifEmail || !selectors.notifComentarios || !selectors.notifMenciones) return;

        selectors.notifEmail.checked = configuracion.email ?? true;
        selectors.notifComentarios.checked = configuracion.comentarios ?? true;
        selectors.notifMenciones.checked = configuracion.menciones ?? true;
    }

    function actualizarActividad(actividad = []) {
        state.actividad = actividad;
        renderizarActividad();
    }

    function renderizarActividad() {
        if (!selectors.actividadTimeline) return;

        if (!state.actividad || state.actividad.length === 0) {
            selectors.actividadTimeline.innerHTML = generarMensajeVacio('Aún no hay actividad registrada.');
            actualizarTexto(selectors.actividadCount, '0 registros');
            return;
        }

        const fragment = document.createDocumentFragment();

        state.actividad.forEach(item => {
            const contenedor = document.createElement('div');
            contenedor.className = 'd-flex mb-4';

            const iconos = {
                publicacion: 'fa-edit bg-primary',
                comentario: 'fa-comment bg-success',
                respuesta: 'fa-reply bg-warning',
                like: 'fa-thumbs-up bg-warning',
                guardado: 'fa-bookmark bg-danger'
            };

            const tipo = item.tipo || 'publicacion';
            const icono = iconos[tipo] || 'fa-bell bg-info';
            const fecha = item.fecha || item.created_at || new Date();

            contenedor.innerHTML = `
                <div class="flex-shrink-0">
                    <div class="${icono.split(' ')[1]} text-white rounded-circle p-3">
                        <i class="fas ${icono.split(' ')[0]}"></i>
                    </div>
                </div>
                <div class="flex-grow-1 ms-3">
                    <small class="text-muted">${formatearTiempo(fecha)}</small>
                    <p class="mb-1">${item.descripcion || item.titulo || 'Actividad reciente'}</p>
                    ${item.materia ? `<small class="text-muted">${item.materia}</small>` : ''}
                </div>
            `;

            fragment.appendChild(contenedor);
        });

        selectors.actividadTimeline.innerHTML = '';
        selectors.actividadTimeline.appendChild(fragment);
        actualizarTexto(selectors.actividadCount, `${state.actividad.length} registros`);
    }

    function renderizarPublicaciones() {
        if (!selectors.publicacionesList) return;

        if (!state.publicaciones.length) {
            selectors.publicacionesList.innerHTML = generarMensajeVacio(state.esPerfilPropio
                ? 'Aún no has publicado nada. ¡Comparte tu primera publicación!'
                : 'Este usuario aún no tiene publicaciones visibles.');
            actualizarTexto(selectors.publicacionesCount, '0');
            return;
        }

        const fragment = document.createDocumentFragment();

        state.publicaciones.forEach(publicacion => {
            const item = document.createElement('div');
            item.className = 'card border-0 shadow-sm mb-3';

            const autor = publicacion.autor || {};
            const avatar = normalizarAvatar(autor.avatar_url || autor.avatar, autor.nombre, autor.apellidos);
            const linkPublicacion = typeof buildFrontendUrl === 'function'
                ? buildFrontendUrl(`post?id=${publicacion.id}`)
                : `post?id=${publicacion.id}`;

            item.innerHTML = `
                <div class="card-body">
                    <div class="d-flex align-items-start mb-3">
                        <img src="${avatar}" class="rounded-circle me-3" width="48" height="48" loading="lazy" alt="Avatar autor">
                        <div class="flex-grow-1">
                            <h6 class="mb-1">${autor.nombre || 'Usuario'}</h6>
                            <small class="text-muted">${formatearTiempo(publicacion.created_at || publicacion.fecha)} • ${publicacion.materia?.nombre || 'General'}</small>
                        </div>
                        <span class="badge bg-${obtenerColorCategoria(publicacion.categoria)} text-uppercase">${(publicacion.categoria || '').toUpperCase()}</span>
                    </div>
                    <h5 class="fw-bold mb-2">
                        <a href="${linkPublicacion}" class="text-decoration-none">${publicacion.titulo || 'Publicación'}</a>
                    </h5>
                    <p class="text-muted">${truncarTexto(publicacion.contenido || '', 220)}</p>
                    <div class="d-flex gap-3 text-muted small">
                        <span><i class="fas fa-heart me-1 text-danger"></i>${publicacion.num_likes ?? publicacion.votos ?? 0}</span>
                        <span><i class="fas fa-comment me-1"></i>${publicacion.num_comentarios ?? publicacion.comentarios ?? 0}</span>
                        <span><i class="fas fa-eye me-1"></i>${publicacion.vistas ?? 0}</span>
                    </div>
                </div>
            `;

            fragment.appendChild(item);
        });

        selectors.publicacionesList.innerHTML = '';
        selectors.publicacionesList.appendChild(fragment);
        actualizarTexto(selectors.publicacionesCount, String(state.publicaciones.length));
    }

    function renderizarGuardados() {
        if (!selectors.guardadosList) return;

        if (!state.guardados || state.guardados.length === 0) {
            selectors.guardadosList.innerHTML = generarMensajeVacio('No tienes publicaciones guardadas.');
            actualizarTexto(selectors.guardadosCount, '0');
            return;
        }

        const fragment = document.createDocumentFragment();

        state.guardados.forEach(guardado => {
            const elemento = document.createElement('div');
            elemento.className = 'list-group-item';

            const categoria = capitalizar(guardado.categoria || 'Recurso');
            const badgeColor = obtenerColorCategoria(guardado.categoria);
            const autor = guardado.autor?.nombre_completo || guardado.autor?.nombre || 'Autor desconocido';
            const materia = guardado.materia?.nombre || guardado.materia || 'General';

            elemento.innerHTML = `
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="mb-1">
                        <span class="badge bg-${badgeColor} me-2">${categoria}</span>
                        ${guardado.titulo || 'Publicación guardada'}
                    </h6>
                    <button class="btn btn-sm btn-link text-danger" data-guardado-id="${guardado.id}">
                        <i class="fas fa-bookmark-slash"></i>
                    </button>
                </div>
                <small class="text-muted">
                    <i class="fas fa-user me-1"></i> ${autor} •
                    <i class="fas fa-book me-1 ms-2"></i> ${materia}
                </small>
            `;

            fragment.appendChild(elemento);
        });

        selectors.guardadosList.innerHTML = '';
        selectors.guardadosList.appendChild(fragment);
        actualizarTexto(selectors.guardadosCount, state.guardados.length);
    }

    function configurarEventos() {
        if (state.esPerfilPropio && selectors.editarPerfilForm) {
            selectors.editarPerfilForm.addEventListener('submit', manejarActualizacionPerfil);
        }

        if (state.esPerfilPropio && selectors.cambiarPasswordForm) {
            selectors.cambiarPasswordForm.addEventListener('submit', manejarCambioPassword);
        }

        if (state.esPerfilPropio && selectors.avatarForm) {
            selectors.avatarForm.addEventListener('submit', manejarActualizacionAvatar);
        }

        if (state.esPerfilPropio && selectors.editarPerfilModal) {
            selectors.editarPerfilModal.addEventListener('show.bs.modal', async () => {
                if (state.perfil?.rol === 'estudiante') {
                    await cargarCarrerasDisponibles();
                    popularSelectCarreras();
                    const carreraId = state.perfil?.estudiante?.carrera?.id || state.perfil?.carrera?.id || '';
                    if (selectors.editarCarreraSelect) {
                        selectors.editarCarreraSelect.value = carreraId ? String(carreraId) : '';
                    }
                    if (selectors.editarMatriculaInput) {
                        selectors.editarMatriculaInput.value = state.perfil?.estudiante?.matricula || '';
                    }
                    if (selectors.editarCuatrimestreInput) {
                        const cuatri = state.perfil?.estudiante?.cuatrimestre_actual;
                        selectors.editarCuatrimestreInput.value = cuatri ? cuatri : '';
                    }
                }
            });
        }

        // El logout se maneja globalmente en auth.js
        // No agregar listener adicional para evitar duplicados

        if (state.esPerfilPropio && selectors.eliminarCuentaBtn) {
            selectors.eliminarCuentaBtn.addEventListener('click', () => {
                notificar('info', 'Para eliminar tu cuenta ponte en contacto con el administrador.');
            });
        }

        if (state.esPerfilPropio && selectors.notifEmail) {
            [selectors.notifEmail, selectors.notifComentarios, selectors.notifMenciones].forEach(input => {
                input?.addEventListener('change', manejarActualizacionNotificaciones);
            });
        }

        if (state.esPerfilPropio && selectors.guardadosList) {
            selectors.guardadosList.addEventListener('click', async (event) => {
                const boton = event.target.closest('[data-guardado-id]');
                if (!boton) return;

                event.preventDefault();
                const id = boton.getAttribute('data-guardado-id');

                try {
                    await API.eliminarGuardado?.(id);
                    state.guardados = state.guardados.filter(g => String(g.id) !== String(id));
                    renderizarGuardados();
                    notificar('success', 'Guardado eliminado correctamente');
                } catch (error) {
                    console.error('Error al eliminar guardado:', error);
                    notificar('error', 'No se pudo eliminar el guardado');
                }
            });
        }

        if (selectors.searchForm && selectors.searchInput) {
            selectors.searchForm.addEventListener('submit', (event) => {
                event.preventDefault();
                const query = selectors.searchInput.value.trim();
                if (query.length >= 3) {
                    window.location.href = `search?q=${encodeURIComponent(query)}`;
                } else {
                    notificar('info', 'Ingresa al menos 3 caracteres para buscar.');
                }
            });
        }

        document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (event) => {
                const target = event.target.getAttribute('data-bs-target') || event.target.getAttribute('href');
                if (!target) return;
                const tabId = target.replace('#', '');
                const url = new URL(window.location.href);
                url.searchParams.set('tab', tabId);
                const search = url.searchParams.toString();
                const newUrl = `${url.pathname}${search ? `?${search}` : ''}${url.hash}`;
                history.replaceState({}, '', newUrl);
            });
        });
    }

    function ajustarVistaSegunPropiedad() {
        const propios = document.querySelectorAll('[data-perfil-propio]');
        propios.forEach(element => toggleVisibility(element, state.esPerfilPropio));

        const externos = document.querySelectorAll('[data-perfil-externo]');
        externos.forEach(element => toggleVisibility(element, !state.esPerfilPropio));

        const navPublicaciones = document.getElementById('navLabelPublicaciones');
        if (navPublicaciones) {
            const propioText = navPublicaciones.getAttribute('data-text-propio') || 'Mis Publicaciones';
            const externoText = navPublicaciones.getAttribute('data-text-externo') || 'Publicaciones';
            const spanTexto = navPublicaciones.querySelector('span');
            if (spanTexto) {
                spanTexto.textContent = state.esPerfilPropio ? propioText : externoText;
            } else {
                navPublicaciones.textContent = state.esPerfilPropio ? propioText : externoText;
            }
        }

        if (!state.esPerfilPropio) {
            selectors.editarPerfilForm?.reset?.();
            selectors.cambiarPasswordForm?.reset?.();
            selectors.avatarForm?.reset?.();
        }
    }

    function activarTabInicial() {
        const params = new URLSearchParams(window.location.search);
        const hashTab = window.location.hash.replace('#', '');
        const rawTab = (params.get('tab') || hashTab || '').trim().toLowerCase();

        if (!rawTab) return;

        const tabMap = {
            informacion: 'info',
            info: 'info',
            estadisticas: 'actividad',
            actividad: 'actividad',
            publicaciones: 'publicaciones',
            publicacion: 'publicaciones',
            guardados: 'guardados',
            configuracion: 'configuracion',
            ajustes: 'configuracion'
        };

        const tabParam = tabMap[rawTab] || rawTab;

        const tabTrigger = document.querySelector(`[data-bs-target="#${tabParam}"]`) ||
            document.querySelector(`a[href="#${tabParam}"]`);

        if (tabTrigger && typeof bootstrap !== 'undefined') {
            const tab = new bootstrap.Tab(tabTrigger);
            tab.show();
            tabTrigger.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    async function manejarActualizacionPerfil(event) {
        event.preventDefault();
        const form = event.currentTarget;

        const rol = (state.perfil?.rol || state.perfil?.rol_nombre || '').toString().toLowerCase();
        const esEstudiante = rol === 'estudiante';

        const payload = {
            nombre: form.nombre.value.trim(),
            apellidos: form.apellidos.value.trim(),
        };

        if (!payload.nombre || !payload.apellidos) {
            notificar('error', 'Nombre y apellidos son obligatorios.');
            return;
        }

        if (!esEstudiante) {
            if (selectors.editarCarreraGroup) toggleVisibility(selectors.editarCarreraGroup, false);
            if (selectors.editarCuatrimestreGroup) toggleVisibility(selectors.editarCuatrimestreGroup, false);
            if (selectors.editarMatriculaGroup) toggleVisibility(selectors.editarMatriculaGroup, false);
        } else {
            const matricula = selectors.editarMatriculaInput?.value.trim();
            const carreraId = selectors.editarCarreraSelect?.value;
            const cuatrimestre = selectors.editarCuatrimestreInput?.value;

            if (matricula) payload.matricula = matricula;
            if (carreraId) payload.carrera_id = parseInt(carreraId, 10);
            if (cuatrimestre) payload.cuatrimestre_actual = parseInt(cuatrimestre, 10);
        }

        try {
            form.classList.add('was-validated');
            form.querySelector('button[type="submit"]').disabled = true;

            const response = await API.updatePerfil(payload);

            if (response.success && response.data) {
                notificar('success', response.message || 'Perfil actualizado correctamente');
                state.perfil = {
                    ...state.perfil,
                    ...response.data,
                    estudiante: response.data.estudiante ?? state.perfil?.estudiante,
                    profesor: response.data.profesor ?? state.perfil?.profesor,
                };

                if (state.esPerfilPropio) {
                    const almacenado = {
                        id: state.perfil.id,
                        nombre: state.perfil.nombre,
                        apellidos: state.perfil.apellidos,
                        email: state.perfil.email,
                        rol: state.perfil.rol,
                        carrera: state.perfil.estudiante?.carrera,
                        avatar: state.perfil.avatar,
                        avatar_url: state.perfil.avatar_url,
                        estudiante: state.perfil.estudiante,
                        profesor: state.perfil.profesor
                    };
                    localStorage.setItem('user_data', JSON.stringify(almacenado));
                }

                actualizarInformacionPerfil(state.perfil);
                const modal = bootstrap.Modal.getInstance(document.getElementById('editarPerfilModal'));
                modal?.hide();
            } else {
                throw new Error(response.message || 'No se pudo actualizar el perfil');
            }
        } catch (error) {
            console.error('Error al actualizar el perfil:', error);
            notificar('error', error.message || 'Ocurrió un error al actualizar el perfil');
        } finally {
            form.querySelector('button[type="submit"]').disabled = false;
        }
    }

    async function manejarCambioPassword(event) {
        event.preventDefault();
        const form = event.currentTarget;

        const actual = form.password_actual.value;
        const nueva = form.password.value;
        const confirmacion = form.password_confirmation.value;

        if (nueva !== confirmacion) {
            notificar('error', 'Las contraseñas no coinciden.');
            return;
        }

        try {
            form.querySelector('button[type="submit"]').disabled = true;
            const response = await API.cambiarPassword({
                password_actual: actual,
                password: nueva,
                password_confirmation: confirmacion
            });

            if (response.success) {
                notificar('success', response.message || 'Contraseña actualizada correctamente');
                form.reset();
                const modal = bootstrap.Modal.getInstance(document.getElementById('cambiarPasswordModal'));
                modal?.hide();
            } else {
                throw new Error(response.message || 'No se pudo actualizar la contraseña');
            }
        } catch (error) {
            console.error('Error al cambiar la contraseña:', error);
            notificar('error', error.message || 'Ocurrió un error al cambiar la contraseña');
        } finally {
            form.querySelector('button[type="submit"]').disabled = false;
        }
    }

    async function manejarActualizacionAvatar(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const archivo = form.avatar.files?.[0];

        if (!archivo) {
            notificar('info', 'Selecciona una imagen para actualizar tu avatar.');
            return;
        }

        if (archivo.size > 2 * 1024 * 1024) {
            notificar('error', 'El archivo supera el límite de 2MB.');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('avatar', archivo);

            const response = await API.updateAvatar(formData);
            if (!response?.success) {
                throw new Error(response?.message || 'No se pudo actualizar el avatar');
            }

            const avatarUrl = response.data?.avatar_url || response.data?.avatar
                ? normalizarAvatar(response.data.avatar_url || response.data.avatar, state.perfil?.nombre, state.perfil?.apellidos)
                : state.perfil?.avatar_url;

            if (avatarUrl) {
                actualizarAvatar(selectors.profileAvatar, avatarUrl);
                actualizarAvatar(selectors.avatarPreview, avatarUrl);
                actualizarAvatar(selectors.navbarAvatar, avatarUrl, 35);
            }

            if (state.perfil) {
                state.perfil.avatar = response.data?.avatar ?? state.perfil.avatar;
                state.perfil.avatar_url = avatarUrl ?? state.perfil.avatar_url;
                state.perfil.avatar = state.perfil.avatar_url;
            }

            if (state.esPerfilPropio) {
                state.perfil = { ...state.perfil, ...response.data };
                const almacenado = JSON.parse(localStorage.getItem('user_data') || '{}');
                almacenado.avatar_url = avatarUrl || almacenado.avatar_url;
                almacenado.avatar = almacenado.avatar_url;
                localStorage.setItem('user_data', JSON.stringify(almacenado));
            }

            notificar('success', response.message || 'Avatar actualizado correctamente');
            const modal = bootstrap.Modal.getInstance(document.getElementById('avatarModal'));
            modal?.hide();
        } catch (error) {
            console.error('Error al actualizar el avatar:', error);
            notificar('error', error.message || 'Ocurrió un error al actualizar el avatar');
        }
    }

    // El logout se maneja globalmente en auth.js

    async function manejarActualizacionNotificaciones() {
        if (!state.perfil) return;

        try {
            const payload = {
                configuracion: {
                    email: selectors.notifEmail?.checked ?? true,
                    comentarios: selectors.notifComentarios?.checked ?? true,
                    menciones: selectors.notifMenciones?.checked ?? true
                }
            };

            await API.updatePerfil(payload);
            notificar('success', 'Preferencias de notificaciones actualizadas');
        } catch (error) {
            console.error('Error al actualizar notificaciones:', error);
            notificar('error', 'No se pudieron actualizar las preferencias');
        }
    }

    // ===================================
    // UTILIDADES
    // ===================================

    function actualizarTexto(elemento, texto) {
        if (elemento) {
            elemento.textContent = texto ?? '-';
        }
    }

    function actualizarAvatar(elemento, url, size) {
        if (!elemento) return;

        const nombre = state.perfil?.nombre || 'Usuario';
        const apellidos = state.perfil?.apellidos || '';
        const baseUrl = typeof normalizarAvatar === 'function'
            ? normalizarAvatar(url, nombre, apellidos)
            : (url || generarAvatar(nombre));

        if (size) {
            elemento.width = size;
            elemento.height = size;
        }

        if (!baseUrl) {
            elemento.src = generarAvatar(nombre);
            return;
        }

        if (baseUrl.includes('ui-avatars.com')) {
            elemento.src = baseUrl;
            return;
        }

        const versionedUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}v=${Date.now()}`;
        elemento.src = versionedUrl;
    }

    function capitalizar(texto = '') {
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    }

    function generarAvatar(nombre = 'U') {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=FF6600&color=fff&size=150`;
    }

    function formatearFechaLarga(fecha) {
        if (!fecha) return null;
        const date = new Date(fecha);
        if (Number.isNaN(date.getTime())) return null;
        return date.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    }

    function formatearTiempo(fecha) {
        const date = new Date(fecha);
        if (window.tiempoTranscurrido) {
            return window.tiempoTranscurrido(date);
        }
        return formatearTiempoTranscurrido(date);
    }

    function obtenerColorCategoria(categoria = '') {
        const mapa = {
            duda: 'primary',
            recurso: 'success',
            aviso: 'warning',
            discusion: 'info',
            evento: 'secondary'
        };
        return mapa[categoria?.toLowerCase()] || 'secondary';
    }

    function generarLoader(texto) {
        return `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-spinner fa-spin fa-2x mb-3"></i>
                <p>${texto}</p>
            </div>
        `;
    }

    function generarMensajeVacio(mensaje) {
        return `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-inbox fa-2x mb-3"></i>
                <p>${mensaje}</p>
            </div>
        `;
    }

    function extraerColeccion(response) {
        if (!response) return [];
        if (Array.isArray(response.data)) return response.data;
        if (response.data?.data) return response.data.data;
        if (Array.isArray(response)) return response;
        return [];
    }

    function notificar(tipo, mensaje) {
        if (window.mostrarNotificacion) {
            window.mostrarNotificacion(tipo, mensaje);
        } else {
            console.log(`[${tipo}] ${mensaje}`);
        }
    }

    function mostrarErrorGeneral() {
        if (selectors.publicacionesList) selectors.publicacionesList.innerHTML = generarMensajeVacio('No se pudo cargar la información.');
        if (selectors.guardadosList) selectors.guardadosList.innerHTML = generarMensajeVacio('No se pudo cargar la información.');
        if (selectors.actividadTimeline) selectors.actividadTimeline.innerHTML = generarMensajeVacio('No se pudo cargar la información.');
    }

    function truncarTexto(texto, longitud) {
        if (texto.length <= longitud) {
            return texto;
        }
        return texto.substring(0, longitud) + '...';
    }
})();
