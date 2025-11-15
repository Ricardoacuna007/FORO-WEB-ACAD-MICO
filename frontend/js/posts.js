/**
 * POSTS.JS - Sistema de Publicaciones
 * ===================================
 * Manejo completo de publicaciones: crear, editar, eliminar, votar, guardar, compartir
 */

// ===================================
// CONFIGURACIÓN
// ===================================
const PostsConfig = {
    categorias: {
        duda: { nombre: 'Duda', color: 'primary', icon: 'fa-question-circle' },
        recurso: { nombre: 'Recurso', color: 'success', icon: 'fa-folder-open' },
        aviso: { nombre: 'Aviso', color: 'warning', icon: 'fa-bullhorn' },
        discusion: { nombre: 'Discusión', color: 'info', icon: 'fa-comments' }
    },
    maxArchivos: 5,
    maxTamanoArchivo: 50 * 1024 * 1024, // 50 MB
    tiposArchivoPermitidos: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'zip', 'rar', 'pptx', 'xlsx']
};

// ===================================
// VARIABLES GLOBALES
// ===================================
let publicaciones = [];
let publicacionEditando = null;
let archivosSeleccionados = [];

function obtenerCarreraIdUsuario() {
    try {
        const stored = localStorage.getItem('user_data');
        if (!stored) return null;
        const usuario = JSON.parse(stored);
        if (usuario.rol === 'estudiante') {
            return usuario.estudiante?.carrera?.id || usuario.estudiante?.carrera_id || null;
        }
        return null;
    } catch (error) {
        console.warn('No se pudo obtener la carrera del usuario:', error);
        return null;
    }
}

// ===================================
// CARGAR PUBLICACIONES
// ===================================

/**
 * Carga las publicaciones de una materia
 */
async function cargarPublicaciones(materiaId, filtro = 'todas', orden = 'reciente') {
    try {
        mostrarLoading();
        
        const params = {
            materia_id: materiaId,
            categoria: filtro !== 'todas' ? filtro : undefined,
            orden: orden,
            per_page: 15
        };

        const carreraId = obtenerCarreraIdUsuario();
        if (carreraId && !params.materia_id) {
            params.carrera_id = carreraId;
        }
        
        const userDataRaw = localStorage.getItem('user_data');
        if (userDataRaw) {
            try {
                const userData = JSON.parse(userDataRaw);
                if (!params.carrera_id) {
                    if (userData?.estudiante?.carrera?.id) {
                        params.carrera_id = userData.estudiante.carrera.id;
                    } else if (userData?.carrera?.id) {
                        params.carrera_id = userData.carrera.id;
                    }
                }
            } catch (parseError) {
                console.warn('No se pudo interpretar la información del usuario almacenada.', parseError);
            }
        }

        // Eliminar parámetros undefined
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
        
        const response = await API.getPosts(params);
        
        if (response.success && response.data) {
            // Procesar datos de la API
            if (response.data.data) {
                // Si viene paginado
                publicaciones = response.data.data.map(procesarPublicacion);
            } else if (Array.isArray(response.data)) {
                // Si viene como array
                publicaciones = response.data.map(procesarPublicacion);
            } else {
                publicaciones = [];
            }
        } else {
            publicaciones = [];
        }
        
        renderizarPublicaciones();
        
    } catch (error) {
        console.error('Error al cargar publicaciones:', error);
        mostrarNotificacion('error', error.message || 'No se pudieron cargar las publicaciones');
        publicaciones = [];
        renderizarPublicaciones();
    } finally {
        ocultarLoading();
    }
}

/**
 * Procesa una publicación de la API para el formato esperado
 */
function procesarPublicacion(publicacion) {
    const avatarFuente = publicacion.autor?.avatar_url || publicacion.autor?.avatar;
    const avatarNormalizado = typeof normalizarAvatar === 'function'
        ? normalizarAvatar(avatarFuente, publicacion.autor?.nombre, publicacion.autor?.apellidos)
        : (avatarFuente && !String(avatarFuente).toLowerCase().includes('frontend/')
            ? avatarFuente
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(publicacion.autor?.nombre || 'U')}&background=FF6600&color=fff`);
    return {
        id: publicacion.id,
        titulo: publicacion.titulo,
        contenido: publicacion.contenido,
        categoria: publicacion.categoria,
        autor: {
            id: publicacion.autor?.id || publicacion.autor_id,
            nombre: publicacion.autor?.nombre_completo || `${publicacion.autor?.nombre || ''} ${publicacion.autor?.apellidos || ''}`.trim(),
            avatar: avatarNormalizado,
            avatar_url: avatarNormalizado,
            rol: publicacion.autor?.rol || 'estudiante'
        },
        materia: {
            id: publicacion.materia?.id || publicacion.materia_id,
            nombre: publicacion.materia?.nombre || 'Materia',
            carrera: publicacion.materia?.carrera?.nombre
        },
        fecha: new Date(publicacion.created_at),
        likes: publicacion.num_likes ?? publicacion.votos ?? 0,
        likeado: Boolean(publicacion.likeado ?? (publicacion.usuarioVoto === 'up')), 
        comentarios: publicacion.comentarios_count || publicacion.comentarios?.length || 0,
        vistas: publicacion.vistas || 0,
        guardado: Boolean(publicacion.guardado),
        etiquetas: publicacion.etiquetas || [],
        archivos: publicacion.archivos || [],
        fijado: publicacion.fijado || false
    };
}

// ===================================
// RENDERIZADO
// ===================================

/**
 * Renderiza todas las publicaciones
 */
function renderizarPublicaciones() {
    const contenedor = document.getElementById('publicacionesContainer');
    if (!contenedor) return;
    
    contenedor.innerHTML = '';
    
    if (publicaciones.length === 0) {
        contenedor.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="fas fa-file-alt fa-3x mb-3"></i>
                <p>No hay publicaciones aún. ¡Sé el primero en publicar!</p>
            </div>
        `;
        return;
    }
    
    publicaciones.forEach(publicacion => {
        const elemento = crearElementoPublicacion(publicacion);
        contenedor.appendChild(elemento);
    });
}

/**
 * Crea el elemento HTML de una publicación
 */
function crearElementoPublicacion(publicacion) {
    const div = document.createElement('div');
    div.className = 'card border-0 shadow-sm mb-3';
    div.dataset.publicacionId = publicacion.id;
    
    const categoria = PostsConfig.categorias[publicacion.categoria] || PostsConfig.categorias.duda;
    const usuarioGuardado = JSON.parse(localStorage.getItem('user_data') || '{}');
    const usuarioSesion = (typeof window !== 'undefined' && window.authSystem && window.authSystem.user) ? window.authSystem.user : {};
    const usuarioId = usuarioGuardado.id ?? usuarioSesion?.id;
    const rolUsuario = (usuarioGuardado.rol || usuarioSesion?.rol || '').toLowerCase();
    const esAutor = usuarioId === publicacion.autor.id;
    const esModerador = ['admin', 'moderador'].includes(rolUsuario);
    const puedeEditar = esAutor;
    const puedeEliminar = esAutor || esModerador;
    const avatarFuente = publicacion.autor.avatar_url || publicacion.autor.avatar;
    const avatarAutor = typeof normalizarAvatar === 'function'
        ? normalizarAvatar(avatarFuente, publicacion.autor.nombre, '')
        : (avatarFuente && !String(avatarFuente).toLowerCase().includes('frontend/')
            ? avatarFuente
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(publicacion.autor.nombre || 'Usuario')}&background=FF6600&color=fff`);
    const perfilUrl = typeof buildFrontendUrl === 'function'
        ? buildFrontendUrl(`perfil?usuario=${publicacion.autor.id}`)
        : `perfil?usuario=${publicacion.autor.id}`;
    
    div.innerHTML = `
        <div class="card-body p-4">
            <div class="d-flex align-items-start mb-3">
                <a href="${perfilUrl}" class="d-inline-flex">
                    <img src="${avatarAutor}" 
                                class="rounded-circle me-3" 
                                width="50" 
                                height="50"
                                loading="lazy"
                                alt="${publicacion.autor.nombre}">
                </a>
                <div class="flex-grow-1">
                    <h6 class="mb-1">
                        <a href="${perfilUrl}" class="text-decoration-none text-dark fw-semibold">
                            ${publicacion.autor.nombre}
                        </a>
                    </h6>
                    <small class="text-muted">
                        ${publicacion.autor.rol === 'profesor' ? 'Profesor' : publicacion.autor.rol === 'admin' ? 'Administrador' : 'Estudiante'} • 
                        ${tiempoTranscurrido(publicacion.fecha)} • 
                        <i class="fas fa-eye ms-2"></i> ${publicacion.vistas} vistas
                    </small>
                </div>
                <div class="dropdown">
                    <button class="btn btn-link text-muted" data-bs-toggle="dropdown">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        ${puedeEditar ? `
                            <li><a class="dropdown-item" href="#" onclick="editarPublicacion(${publicacion.id})">
                                <i class="fas fa-edit me-2"></i> Editar
                            </a></li>
                        ` : ''}
                        ${puedeEliminar ? `
                            <li><a class="dropdown-item text-danger" href="#" onclick="eliminarPublicacion(${publicacion.id})">
                                <i class="fas fa-trash me-2"></i> Eliminar
                            </a></li>
                        ` : ''}
                        <li><a class="dropdown-item" href="#" onclick="compartirPublicacion(${publicacion.id})">
                            <i class="fas fa-share me-2"></i> Compartir
                        </a></li>
                        <li><a class="dropdown-item" href="#" onclick="reportarPublicacion(${publicacion.id})">
                            <i class="fas fa-flag me-2"></i> Reportar
                        </a></li>
                    </ul>
                </div>
            </div>
            
            <span class="badge bg-${categoria.color} mb-2">
                <i class="fas ${categoria.icon} me-1"></i> ${categoria.nombre}
            </span>
            
            <h4 class="fw-bold mb-2">
                <a href="${typeof buildFrontendUrl === 'function' ? buildFrontendUrl(`post?id=${publicacion.id}`) : `post?id=${publicacion.id}`}" class="text-decoration-none text-dark">
                    ${publicacion.titulo}
                </a>
            </h4>
            
            <p class="text-muted mb-3">${truncarTexto(publicacion.contenido, 200)}</p>
            
            ${publicacion.etiquetas && publicacion.etiquetas.length > 0 ? `
                <div class="mb-3">
                    ${publicacion.etiquetas.map(tag => `
                        <span class="badge bg-light text-dark border me-2">#${tag}</span>
                    `).join('')}
                </div>
            ` : ''}
            
            ${publicacion.archivos && publicacion.archivos.length > 0 ? `
                <div class="mb-3">
                    <small class="text-muted">
                        <i class="fas fa-paperclip me-1"></i> Archivos adjuntos:
                    </small>
                    ${publicacion.archivos.map(archivo => `
                        <a href="#" class="badge bg-secondary me-2" onclick="descargarArchivoPublicacion(${archivo.id})">
                            <i class="fas fa-file me-1"></i> ${archivo.nombre}
                        </a>
                    `).join('')}
                </div>
            ` : ''}
            
            <div class="d-flex justify-content-between align-items-center border-top pt-3">
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-outline-primary vote-btn ${publicacion.likeado ? 'active' : ''}" 
                            onclick="votarPublicacion(${publicacion.id})">
                        <i class="fas fa-thumbs-up me-1"></i> ${publicacion.likes}
                    </button>
                    <button class="btn btn-sm btn-outline-secondary ${publicacion.guardado ? 'active' : ''}" 
                            onclick="guardarPublicacion(${publicacion.id})">
                        <i class="fas fa-bookmark me-1"></i> Guardar
                    </button>
                    <button class="btn btn-sm btn-outline-info" 
                            onclick="compartirPublicacion(${publicacion.id})">
                        <i class="fas fa-share me-1"></i> Compartir
                    </button>
                </div>
                <a href="${typeof buildFrontendUrl === 'function' ? buildFrontendUrl(`post?id=${publicacion.id}`) : `post?id=${publicacion.id}`}" class="text-muted text-decoration-none">
                    <i class="fas fa-comment me-1"></i> ${publicacion.comentarios} respuestas
                </a>
            </div>
        </div>
    `;
    
    return div;
}

// ===================================
// CREAR PUBLICACIÓN
// ===================================

/**
 * Crea una nueva publicación
 */
async function crearPublicacion(datosPublicacion) {
    try {
        // Validar datos
        if (!validarPublicacion(datosPublicacion)) {
            return false;
        }
        
        mostrarLoading();
        
        // Preparar datos para la API
        const postData = {
            titulo: datosPublicacion.titulo.trim(),
            contenido: datosPublicacion.contenido.trim(),
            categoria: datosPublicacion.categoria,
            materia_id: datosPublicacion.materia_id,
            etiquetas: datosPublicacion.etiquetas || []
        };
        
        const response = await API.createPost(postData);
        
        if (response.success && response.data) {
            const nuevaPublicacion = procesarPublicacion(response.data);
            publicaciones.unshift(nuevaPublicacion);
            renderizarPublicaciones();
            
            // Cerrar modal y limpiar formulario
            const modal = bootstrap.Modal.getInstance(document.getElementById('crearPostModal'));
            if (modal) {
                modal.hide();
            }
            limpiarFormularioPublicacion();
            
            mostrarNotificacion('success', response.message || 'Publicación creada exitosamente');
            return true;
        } else {
            throw new Error(response.message || 'Error al crear la publicación');
        }
        
    } catch (error) {
        console.error('Error al crear publicación:', error);
        mostrarNotificacion('error', error.message || 'No se pudo crear la publicación');
        return false;
    } finally {
        ocultarLoading();
    }
}

// ===================================
// EDITAR PUBLICACIÓN
// ===================================

/**
 * Inicia la edición de una publicación
 */
function editarPublicacion(publicacionId) {
    const publicacion = publicaciones.find(p => p.id === publicacionId);
    if (!publicacion) return;
    
    publicacionEditando = publicacionId;
    
    // Abrir modal de edición
    const modal = new bootstrap.Modal(document.getElementById('editarPostModal'));
    
    // Llenar formulario con datos existentes
    document.getElementById('editPostTitulo').value = publicacion.titulo;
    document.getElementById('editPostContenido').value = publicacion.contenido;
    document.getElementById('editPostCategoria').value = publicacion.categoria;
    document.getElementById('editPostEtiquetas').value = publicacion.etiquetas.join(', ');
    
    modal.show();
}

/**
 * Guarda los cambios de una publicación editada
 */
async function guardarEdicionPublicacion() {
    const publicacionId = publicacionEditando;
    if (!publicacionId) return;
    
    const datos = {
        titulo: document.getElementById('editPostTitulo').value.trim(),
        contenido: document.getElementById('editPostContenido').value.trim(),
        categoria: document.getElementById('editPostCategoria').value,
        etiquetas: document.getElementById('editPostEtiquetas').value.split(',').map(t => t.trim()).filter(t => t)
    };
    
    if (!validarPublicacion(datos)) {
        return;
    }
    
    try {
        mostrarLoading();
        
        const response = await API.updatePost(publicacionId, datos);
        
        if (response.success && response.data) {
            const publicacionActualizada = procesarPublicacion(response.data);
            const index = publicaciones.findIndex(p => p.id === publicacionId);
            if (index !== -1) {
                publicaciones[index] = publicacionActualizada;
            }
            
            renderizarPublicaciones();
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('editarPostModal'));
            if (modal) {
                modal.hide();
            }
            
            publicacionEditando = null;
            mostrarNotificacion('success', response.message || 'Publicación actualizada');
        } else {
            throw new Error(response.message || 'Error al actualizar la publicación');
        }
        
    } catch (error) {
        console.error('Error al actualizar publicación:', error);
        mostrarNotificacion('error', error.message || 'No se pudo actualizar la publicación');
    } finally {
        ocultarLoading();
    }
}

// ===================================
// ELIMINAR PUBLICACIÓN
// ===================================

/**
 * Elimina una publicación
 */
async function eliminarPublicacion(publicacionId) {
    const confirmado = await (window.mostrarConfirmacionToasty
        ? window.mostrarConfirmacionToasty({
            mensaje: '¿Eliminar esta publicación?',
            tipo: 'warning',
            textoConfirmar: 'Eliminar',
            textoCancelar: 'Cancelar'
        })
        : Promise.resolve(confirm('¿Estás seguro de que deseas eliminar esta publicación?')));

    if (!confirmado) {
        return;
    }
    
    try {
        mostrarLoading();
        
        const response = await API.deletePost(publicacionId);
        
        if (response.success) {
            publicaciones = publicaciones.filter(p => p.id !== publicacionId);
            renderizarPublicaciones();
            mostrarNotificacion('success', response.message || 'Publicación eliminada');
        } else {
            throw new Error(response.message || 'Error al eliminar la publicación');
        }
        
    } catch (error) {
        console.error('Error al eliminar publicación:', error);
        mostrarNotificacion('error', error.message || 'No se pudo eliminar la publicación');
    } finally {
        ocultarLoading();
    }
}

// ===================================
// VOTAR PUBLICACIÓN
// ===================================

/**
 * Vota una publicación (like)
 */
async function votarPublicacion(publicacionId) {
    try {
        const publicacion = publicaciones.find(p => p.id === publicacionId);
        if (!publicacion) return;
        
        const accion = publicacion.likeado ? 'down' : 'up';
        const response = await API.votarPost(publicacionId, accion);
        
        if (response.success && response.data) {
            publicacion.likes = response.data.num_likes ?? publicacion.likes;
            publicacion.likeado = response.data.likeado ?? (accion === 'up');
            renderizarPublicaciones();
        } else {
            throw new Error(response.message || 'Error al votar');
        }
        
    } catch (error) {
        console.error('Error al votar publicación:', error);
        mostrarNotificacion('error', error.message || 'No se pudo registrar el voto');
    }
}

// ===================================
// GUARDAR PUBLICACIÓN
// ===================================

/**
 * Guarda o desguarda una publicación
 */
async function guardarPublicacion(publicacionId) {
    try {
        const publicacion = publicaciones.find(p => p.id === publicacionId);
        if (!publicacion) return;
        
        const response = await API.guardarPost(publicacionId);
        
        if (response.success && response.data) {
            publicacion.guardado = response.data.guardado !== undefined ? response.data.guardado : !publicacion.guardado;
            renderizarPublicaciones();
            // No mostrar notificación - el feedback visual es suficiente
        } else {
            throw new Error(response.message || 'Error al guardar la publicación');
        }
        
    } catch (error) {
        console.error('Error al guardar publicación:', error);
        mostrarNotificacion('error', error.message || 'No se pudo guardar la publicación');
    }
}

// ===================================
// COMPARTIR PUBLICACIÓN
// ===================================

/**
 * Comparte una publicación
 */
function compartirPublicacion(id) {
    const url = typeof buildFrontendUrl === 'function'
        ? buildFrontendUrl(`post?id=${id}`)
        : (() => {
            const base = window.__FRONTEND_BASE_PATH || '/';
            const normalizado = base.endsWith('/') ? base : `${base}/`;
            return `${window.location.origin}${normalizado}post?id=${id}`;
        })();
    copiarAlPortapapeles(url);
    mostrarNotificacion('success', 'Enlace copiado al portapapeles');
}

/**
 * Copia el enlace de la publicación al portapapeles
 */
function copiarEnlace(url) {
    copiarAlPortapapeles(url);
    mostrarNotificacion('success', 'Enlace copiado al portapapeles');
}

// ===================================
// REPORTAR PUBLICACIÓN
// ===================================

/**
 * Reporta una publicación
 */
function reportarPublicacion(publicacionId) {
    const razon = prompt('¿Por qué deseas reportar esta publicación?');
    if (!razon || razon.trim().length === 0) return;
    
    // TODO: Enviar reporte al backend
    // API.reportarPublicacion(publicacionId, razon);
    
    mostrarNotificacion('success', 'Publicación reportada. Gracias por tu colaboración.');
}

// ===================================
// MANEJO DE ARCHIVOS
// ===================================

/**
 * Maneja la selección de archivos
 */
function manejarSeleccionArchivos(input) {
    const archivos = Array.from(input.files);
    archivosSeleccionados = [];
    
    archivos.forEach(archivo => {
        // Validar tamaño
        if (archivo.size > PostsConfig.maxTamanoArchivo) {
            mostrarNotificacion('error', `El archivo ${archivo.name} excede el tamaño máximo de ${formatearTamanoArchivo(PostsConfig.maxTamanoArchivo)}`);
            return;
        }
        
        // Validar tipo
        const extension = archivo.name.split('.').pop().toLowerCase();
        if (!PostsConfig.tiposArchivoPermitidos.includes(extension)) {
            mostrarNotificacion('error', `El tipo de archivo ${extension} no está permitido`);
            return;
        }
        
        archivosSeleccionados.push(archivo);
    });
    
    // Actualizar UI
    actualizarListaArchivos();
}

/**
 * Actualiza la lista de archivos seleccionados
 */
function actualizarListaArchivos() {
    const contenedor = document.getElementById('archivosSeleccionados');
    if (!contenedor) return;
    
    contenedor.innerHTML = '';
    
    archivosSeleccionados.forEach((archivo, index) => {
        const div = document.createElement('div');
        div.className = 'd-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded';
        div.innerHTML = `
            <div>
                <i class="fas fa-file me-2"></i>
                <span>${archivo.name}</span>
                <small class="text-muted ms-2">${formatearTamanoArchivo(archivo.size)}</small>
            </div>
            <button class="btn btn-sm btn-danger" onclick="eliminarArchivoSeleccionado(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        contenedor.appendChild(div);
    });
}

/**
 * Elimina un archivo de la selección
 */
function eliminarArchivoSeleccionado(index) {
    archivosSeleccionados.splice(index, 1);
    actualizarListaArchivos();
}

/**
 * Descarga un archivo de una publicación
 */
function descargarArchivoPublicacion(archivoId) {
    // TODO: Implementar descarga desde el backend
    // API.descargarArchivo(archivoId);
    mostrarNotificacion('info', 'Descarga de archivo (pendiente de implementar)');
}

// ===================================
// VALIDACIÓN
// ===================================

/**
 * Valida los datos de una publicación
 */
function validarPublicacion(datos) {
    if (!datos.titulo || datos.titulo.trim().length < 5) {
        mostrarNotificacion('error', 'El título debe tener al menos 5 caracteres');
        return false;
    }
    
    if (!datos.contenido || datos.contenido.trim().length < 10) {
        mostrarNotificacion('error', 'El contenido debe tener al menos 10 caracteres');
        return false;
    }
    
    if (!datos.categoria) {
        mostrarNotificacion('error', 'Debes seleccionar una categoría');
        return false;
    }
    
    if (archivosSeleccionados.length > PostsConfig.maxArchivos) {
        mostrarNotificacion('error', `No se pueden subir más de ${PostsConfig.maxArchivos} archivos`);
        return false;
    }
    
    return true;
}

/**
 * Limpia el formulario de publicación
 */
function limpiarFormularioPublicacion() {
    const form = document.querySelector('#crearPostModal form');
    if (form) {
        form.reset();
    }
    archivosSeleccionados = [];
    actualizarListaArchivos();
}

// ===================================
// FILTROS
// ===================================

/**
 * Filtra las publicaciones por categoría
 */
function filtrarPublicaciones(categoria) {
    // Esta función puede ser extendida para filtrar en el backend
    renderizarPublicaciones();
}

// ===================================
// EXPORTAR FUNCIONES
// ===================================
window.cargarPublicaciones = cargarPublicaciones;
window.crearPublicacion = crearPublicacion;
window.editarPublicacion = editarPublicacion;
window.guardarEdicionPublicacion = guardarEdicionPublicacion;
window.eliminarPublicacion = eliminarPublicacion;
window.votarPublicacion = votarPublicacion;
window.guardarPublicacion = guardarPublicacion;
window.compartirPublicacion = compartirPublicacion;
window.reportarPublicacion = reportarPublicacion;
window.manejarSeleccionArchivos = manejarSeleccionArchivos;
window.eliminarArchivoSeleccionado = eliminarArchivoSeleccionado;
window.descargarArchivoPublicacion = descargarArchivoPublicacion;
window.filtrarPublicaciones = filtrarPublicaciones;
window.PostsConfig = PostsConfig;

