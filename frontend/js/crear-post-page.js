// ===================================
// CREAR-POST-PAGE.JS - Formulario independiente para crear publicaciones
// ===================================
(function () {
    const state = {
        usuario: null,
        materias: [],
        categorias: [],
    };

    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        try {
            await cargarUsuario();
            prepararCategorias();
            await cargarMaterias();
            poblarSelectMaterias();
            poblarSelectCategorias();
            configurarEventos();
            actualizarResumenUsuario();
        } catch (error) {
            console.error('Error inicializando la vista de creación de publicaciones:', error);
            mostrarNotificacion('error', error.message || 'Ocurrió un problema al preparar el formulario');
        }
    }

    async function cargarUsuario() {
        if (window.authSystem?.user && window.authSystem?.token) {
            state.usuario = normalizarDatosUsuario?.(window.authSystem.user) || window.authSystem.user;
            return;
        }

        try {
            const response = await API.me();
            if (response.success && response.data?.user) {
                const normalizado = normalizarDatosUsuario?.(response.data.user) || response.data.user;
                state.usuario = normalizado;
                if (window.authSystem) {
                    window.authSystem.user = normalizado;
                }
                localStorage.setItem('user_data', JSON.stringify(normalizado));
            }
        } catch (error) {
            console.warn('No se pudo obtener el usuario desde la API. Se utilizará la información almacenada.', error);
            const almacenado = localStorage.getItem('user_data');
            state.usuario = almacenado ? (normalizarDatosUsuario?.(JSON.parse(almacenado)) || JSON.parse(almacenado)) : null;
        }
    }

    function prepararCategorias() {
        if (window.PostsConfig?.categorias) {
            state.categorias = Object.entries(window.PostsConfig.categorias).map(([id, info]) => ({
                id,
                nombre: info?.nombre || id,
            }));
            return;
        }

        state.categorias = [
            { id: 'duda', nombre: 'Duda' },
            { id: 'recurso', nombre: 'Recurso' },
            { id: 'aviso', nombre: 'Aviso' },
            { id: 'discusion', nombre: 'Discusión' }
        ];
    }

    async function cargarMaterias() {
        try {
            const params = {};
            const rol = (state.usuario?.rol || '').toLowerCase();

            if (rol === 'estudiante') {
                const carreraId = state.usuario?.estudiante?.carrera?.id || state.usuario?.estudiante?.carrera_id;
                if (carreraId) {
                    params.carrera_id = carreraId;
                }
            }

            const response = await API.getMaterias(params);
            if (response.success) {
                state.materias = Array.isArray(response.data) ? response.data : response.data?.data || [];
            } else {
                throw new Error(response.message || 'No se pudieron obtener las materias disponibles');
            }
        } catch (error) {
            console.error('Error al cargar materias:', error);
            state.materias = [];
            mostrarNotificacion('error', 'No se pudieron cargar las materias disponibles.');
        }
    }

    function poblarSelectMaterias() {
        const selectMateria = document.getElementById('materia');
        if (!selectMateria) return;

        if (!state.materias.length) {
            selectMateria.innerHTML = '<option value="">No hay materias disponibles</option>';
            selectMateria.disabled = true;
            return;
        }

        const opciones = ['<option value="">Selecciona una materia</option>'];
        state.materias.forEach(materia => {
            const carrera = materia.carrera ? ` • ${materia.carrera.nombre}` : '';
            opciones.push(`<option value="${materia.id}">${materia.nombre}${carrera}</option>`);
        });
        selectMateria.innerHTML = opciones.join('');
        selectMateria.disabled = false;
    }

    function poblarSelectCategorias() {
        const selectCategoria = document.getElementById('categoria');
        if (!selectCategoria) return;

        const opciones = ['<option value="">Selecciona una categoría</option>'];
        state.categorias.forEach(categoria => {
            opciones.push(`<option value="${categoria.id}">${categoria.nombre}</option>`);
        });
        selectCategoria.innerHTML = opciones.join('');
    }

    function configurarEventos() {
        const form = document.getElementById('crearPostForm');
        if (form) {
            form.addEventListener('submit', manejarSubmit);
        }

        const cancelarBtn = document.getElementById('cancelarCreacionBtn');
        if (cancelarBtn) {
            cancelarBtn.addEventListener('click', (event) => {
                event.preventDefault();
                const destino = typeof buildFrontendUrl === 'function'
                    ? buildFrontendUrl('foro')
                    : 'foro';
                window.location.href = destino;
            });
        }
    }

    async function manejarSubmit(event) {
        event.preventDefault();
        const form = event.currentTarget;

        const datos = {
            materia_id: form.materia.value ? Number(form.materia.value) : null,
            categoria: form.categoria.value?.trim(),
            titulo: form.titulo.value?.trim(),
            contenido: form.contenido.value?.trim(),
            etiquetas: form.etiquetas.value ? form.etiquetas.value.split(',').map(et => et.trim()).filter(Boolean) : []
        };

        const errores = validarFormulario(datos);
        if (errores.length) {
            errores.forEach(mensaje => mostrarNotificacion('warning', mensaje));
            return;
        }

        try {
            mostrarLoadingGlobal?.('Publicando tu mensaje...');
            const response = await API.createPost({
                titulo: datos.titulo,
                contenido: datos.contenido,
                categoria: datos.categoria,
                materia_id: datos.materia_id,
                etiquetas: datos.etiquetas
            });

            if (!response.success || !response.data) {
                throw new Error(response.message || 'No se pudo crear la publicación');
            }

            mostrarNotificacion('success', '¡Publicación creada exitosamente!');
            form.reset();

            const destino = response.data?.id
                ? (typeof buildFrontendUrl === 'function'
                    ? buildFrontendUrl(`post?id=${response.data.id}`)
                    : `post?id=${response.data.id}`)
                : (typeof buildFrontendUrl === 'function'
                    ? buildFrontendUrl('foro')
                    : 'foro');

            setTimeout(() => {
                window.location.href = destino;
            }, 1200);
        } catch (error) {
            console.error('Error al crear la publicación:', error);
            mostrarNotificacion('error', error.message || 'No se pudo crear la publicación');
        } finally {
            ocultarLoadingGlobal?.();
        }
    }

    function validarFormulario(datos) {
        const errores = [];
        if (!datos.materia_id || Number.isNaN(datos.materia_id)) {
            errores.push('Selecciona una materia válida.');
        }
        if (!datos.categoria) {
            errores.push('Selecciona una categoría.');
        }
        if (!datos.titulo || datos.titulo.length < 5) {
            errores.push('El título debe tener al menos 5 caracteres.');
        }
        if (!datos.contenido || datos.contenido.length < 10) {
            errores.push('El contenido debe tener al menos 10 caracteres.');
        }
        return errores;
    }

    function actualizarResumenUsuario() {
        const nombreElemento = document.getElementById('resumenUsuarioNombre');
        const avatarElemento = document.getElementById('resumenUsuarioAvatar');
        const carreraElemento = document.getElementById('resumenUsuarioCarrera');
        const rolElemento = document.getElementById('resumenUsuarioRol');

        if (!state.usuario) return;

        const nombre = [state.usuario.nombre, state.usuario.apellidos].filter(Boolean).join(' ') || state.usuario.email;
        if (nombreElemento) nombreElemento.textContent = nombre;

        if (rolElemento) {
            rolElemento.textContent = (state.usuario.rol || '').toUpperCase();
        }

        if (carreraElemento) {
            const carrera = state.usuario.estudiante?.carrera?.nombre
                || state.usuario.profesor?.especialidad
                || 'General';
            carreraElemento.textContent = carrera;
        }

        if (avatarElemento) {
            const avatarSrc = typeof normalizarAvatar === 'function'
                ? normalizarAvatar(state.usuario.avatar_url || state.usuario.avatar, state.usuario.nombre, state.usuario.apellidos)
                : (state.usuario.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=FF6600&color=fff`);
            avatarElemento.src = avatarSrc;
        }
    }
})();
