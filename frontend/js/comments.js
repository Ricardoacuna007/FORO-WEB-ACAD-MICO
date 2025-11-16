/**
 * COMMENTS.JS - Sistema de Comentarios
 * ====================================
 * Manejo completo de comentarios: crear, editar, eliminar, votar, responder
 */

// ===================================
// CONFIGURACIÓN
// ===================================
const CommentsConfig = {
    maxLength: 5000,
    minLength: 10,
    autoSaveInterval: 30000 // 30 segundos
};

// ===================================
// VARIABLES GLOBALES
// ===================================
let comentarios = [];
let comentarioEditando = null;
let autoSaveTimer = null;

// ===================================
// CARGAR COMENTARIOS
// ===================================

/**
 * Carga los comentarios de una publicación
 */
async function cargarComentarios(postId) {
    try {
        mostrarLoading();
        
        const response = await API.getComments(postId);
        
        if (response.success && response.data) {
            comentarios = response.data.map(procesarComentario);
        } else {
            comentarios = [];
        }
        
        renderizarComentarios();
        
    } catch (error) {
        console.error('Error al cargar comentarios:', error);
        mostrarNotificacion('error', error.message || 'No se pudieron cargar los comentarios');
        comentarios = [];
        renderizarComentarios();
    } finally {
        ocultarLoading();
    }
}

/**
 * Procesa un comentario de la API para el formato esperado
 */
function procesarComentario(comentario) {
    const avatarFuente = comentario.autor?.avatar_url || comentario.autor?.avatar;
    const avatarNormalizado = typeof normalizarAvatar === 'function'
        ? normalizarAvatar(avatarFuente, comentario.autor?.nombre, comentario.autor?.apellidos)
        : (avatarFuente && !String(avatarFuente).toLowerCase().includes('frontend/')
            ? avatarFuente
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(comentario.autor?.nombre || 'U')}&background=FF6600&color=fff`);
    return {
        id: comentario.id,
        autor: {
            id: comentario.autor?.id || comentario.autor_id,
            nombre: comentario.autor?.nombre_completo || `${comentario.autor?.nombre || ''} ${comentario.autor?.apellidos || ''}`.trim(),
            avatar: avatarNormalizado,
            avatar_url: avatarNormalizado,
            rol: comentario.autor?.rol || 'estudiante'
        },
        contenido: comentario.contenido,
        fecha: new Date(comentario.created_at),
        likes: comentario.num_likes ?? comentario.votos ?? 0,
        likeado: Boolean(comentario.likeado ?? (comentario.usuarioVoto === 'up')),
        respuestas: comentario.respuestas ? comentario.respuestas.map(procesarComentario) : [],
        editado: comentario.updated_at && comentario.updated_at !== comentario.created_at,
        respuestaAceptada: comentario.respuesta_aceptada || comentario.es_respuesta_util || false
    };
}

// ===================================
// RENDERIZADO
// ===================================

/**
 * Renderiza todos los comentarios
 */
function renderizarComentarios() {
    const contenedor = document.getElementById('comentariosContainer');
    if (!contenedor) return;
    
    contenedor.innerHTML = '';
    
    if (comentarios.length === 0) {
        contenedor.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="fas fa-comments fa-3x mb-3"></i>
                <p>No hay comentarios aún. ¡Sé el primero en comentar!</p>
            </div>
        `;
        return;
    }
    
    comentarios.forEach(comentario => {
        const elemento = crearElementoComentario(comentario);
        contenedor.appendChild(elemento);
    });
    
    // Actualizar contador
    actualizarContadorComentarios();
}

/**
 * Crea el elemento HTML de un comentario
 */
function crearElementoComentario(comentario, esRespuesta = false) {
    const div = document.createElement('div');
    div.className = `comment-item p-3 mb-3 ${esRespuesta ? 'comment-reply mt-3' : ''}`;
    div.dataset.comentarioId = comentario.id;
    
    const usuarioGuardado = JSON.parse(localStorage.getItem('user_data') || '{}');
    const usuarioSesion = (typeof window !== 'undefined' && window.authSystem && window.authSystem.user) ? window.authSystem.user : {};
    const usuarioId = usuarioGuardado.id ?? usuarioSesion?.id;
    const rolUsuario = (usuarioGuardado.rol || usuarioSesion?.rol || '').toLowerCase();
    const esAutor = usuarioId === comentario.autor.id;
    const esModerador = ['admin', 'moderador'].includes(rolUsuario);
    const puedeEditar = esAutor;
    const puedeEliminar = esAutor || esModerador;
    const avatarFuente = comentario.autor.avatar_url || comentario.autor.avatar;
    const avatarUrl = typeof normalizarAvatar === 'function'
        ? normalizarAvatar(avatarFuente, comentario.autor.nombre)
        : (avatarFuente && !String(avatarFuente).toLowerCase().includes('frontend/')
            ? avatarFuente
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(comentario.autor.nombre || 'Usuario')}&background=FF6600&color=fff`);
    const perfilUrl = typeof buildFrontendUrl === 'function'
        ? buildFrontendUrl(`perfil?usuario=${comentario.autor.id}`)
        : `perfil?usuario=${comentario.autor.id}`;
    
    div.innerHTML = `
        <div class="d-flex align-items-start">
            <a href="${perfilUrl}" class="d-inline-flex">
                    <img src="${avatarUrl}" 
                            class="rounded-circle me-3" 
                            width="${esRespuesta ? '40' : '45'}" 
                            height="${esRespuesta ? '40' : '45'}"
                            loading="lazy"
                            alt="${comentario.autor.nombre}">
            </a>
            <div class="flex-grow-1">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <a href="${perfilUrl}" class="text-decoration-none text-dark fw-semibold">${comentario.autor.nombre}</a>
                        <span class="badge bg-${comentario.autor.rol === 'profesor' ? 'primary' : comentario.autor.rol === 'admin' ? 'dark' : 'success'} ms-2 text-capitalize">
                            ${comentario.autor.rol === 'profesor' ? 'Profesor' : comentario.autor.rol === 'admin' ? 'Administrador' : 'Estudiante'}
                        </span>
                        ${comentario.editado ? '<small class="text-muted">(editado)</small>' : ''}
                        ${comentario.respuestaAceptada ? '<span class="badge bg-success ms-2"><i class="fas fa-check me-1"></i> Respuesta útil</span>' : ''}
                        <small class="text-muted d-block">${tiempoTranscurrido(comentario.fecha)}</small>
                    </div>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-link text-muted" data-bs-toggle="dropdown">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            ${!esRespuesta ? `
                                <li><a class="dropdown-item" href="#" onclick="responderComentario(${comentario.id})"><i class="fas fa-reply me-2"></i> Responder</a></li>
                            ` : ''}
                            ${puedeEditar ? `
                                <li><a class="dropdown-item" href="#" onclick="editarComentario(${comentario.id})"><i class="fas fa-edit me-2"></i> Editar</a></li>
                            ` : ''}
                            ${puedeEliminar ? `
                                <li><a class="dropdown-item text-danger" href="#" onclick="eliminarComentario(${comentario.id})"><i class="fas fa-trash me-2"></i> Eliminar</a></li>
                            ` : ''}
                            <li><a class="dropdown-item" href="#" onclick="reportarComentario(${comentario.id})"><i class="fas fa-flag me-2"></i> Reportar</a></li>
                        </ul>
                    </div>
                </div>
                <div class="comment-content mb-2">${formatearContenido(comentario.contenido)}</div>
                <div class="d-flex gap-2 mt-3">
                    <button class="btn btn-sm btn-outline-primary vote-btn ${comentario.likeado ? 'active' : ''}" 
                            onclick="votarComentario(${comentario.id})">
                        <i class="fas fa-thumbs-up me-1"></i> ${comentario.likes}
                    </button>
                    ${!esRespuesta ? `
                        <button class="btn btn-sm btn-outline-secondary" onclick="responderComentario(${comentario.id})">
                            <i class="fas fa-reply me-1"></i> Responder
                        </button>
                    ` : ''}
                </div>
                ${comentario.respuestas && comentario.respuestas.length > 0 ? `
                    <div class="mt-3">
                        ${comentario.respuestas.map(respuesta => crearElementoComentario(respuesta, true).outerHTML).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    return div;
}

/**
 * Formatea el contenido del comentario (markdown básico, enlaces, etc.)
 */
function formatearContenido(contenido) {
    // Escape HTML
    contenido = contenido.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Enlaces
    contenido = contenido.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
    
    // Código inline
    contenido = contenido.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Saltos de línea
    contenido = contenido.replace(/\n/g, '<br>');
    
    return contenido;
}

/**
 * Actualiza el contador de comentarios
 */
function actualizarContadorComentarios() {
    const total = comentarios.reduce((acc, c) => acc + 1 + (c.respuestas?.length || 0), 0);
    const contadores = document.querySelectorAll('[data-comentarios-count]');
    contadores.forEach(contador => {
        contador.textContent = total;
    });
}

// ===================================
// CREAR COMENTARIO
// ===================================

/**
 * Crea un nuevo comentario
 */
async function crearComentario(postId, contenido, comentarioPadreId = null) {
    try {
        // Validar contenido
        if (!validarComentario(contenido)) {
            return false;
        }
        
        mostrarLoading();
        
        const commentData = {
            publicacion_id: postId,
            contenido: contenido.trim(),
            comentario_padre_id: comentarioPadreId || undefined
        };
        
        // Eliminar campos undefined
        Object.keys(commentData).forEach(key => commentData[key] === undefined && delete commentData[key]);
        
        const response = await API.createComment(commentData);
        
        if (response.success && response.data) {
            const nuevoComentario = procesarComentario(response.data);
            
            if (comentarioPadreId) {
                // Agregar como respuesta
                const comentarioPadre = buscarComentario(comentarioPadreId);
                if (comentarioPadre) {
                    if (!comentarioPadre.respuestas) {
                        comentarioPadre.respuestas = [];
                    }
                    comentarioPadre.respuestas.push(nuevoComentario);
                }
            } else {
                // Agregar como comentario principal
                comentarios.push(nuevoComentario);
            }
            
            renderizarComentarios();
            
            // Limpiar formulario
            const formulario = document.querySelector('#formComentario textarea');
            if (formulario) {
                formulario.value = '';
            }
            
            // Ocultar formulario de respuesta si existe
            const formRespuesta = document.querySelector(`[data-comentario-id="${comentarioPadreId}"] .form-respuesta`);
            if (formRespuesta) {
                formRespuesta.style.display = 'none';
            }
            
            // No mostrar notificación - el feedback visual es suficiente
            return true;
        } else {
            throw new Error(response.message || 'Error al crear el comentario');
        }
        
    } catch (error) {
        console.error('Error al crear comentario:', error);
        mostrarNotificacion('error', error.message || 'No se pudo publicar el comentario');
        return false;
    } finally {
        ocultarLoading();
    }
}

// ===================================
// EDITAR COMENTARIO
// ===================================

/**
 * Inicia la edición de un comentario
 */
function editarComentario(comentarioId) {
    const comentario = buscarComentario(comentarioId);
    if (!comentario) return;
    
    comentarioEditando = comentarioId;
    
    // Reemplazar contenido con textarea
    const elemento = document.querySelector(`[data-comentario-id="${comentarioId}"] .comment-content`);
    if (elemento) {
        elemento.innerHTML = `
            <textarea class="form-control mb-2" rows="3">${comentario.contenido}</textarea>
            <div class="d-flex gap-2">
                <button class="btn btn-sm btn-primary" onclick="guardarEdicionComentario(${comentarioId})">
                    <i class="fas fa-save me-1"></i> Guardar
                </button>
                <button class="btn btn-sm btn-secondary" onclick="cancelarEdicionComentario(${comentarioId})">
                    <i class="fas fa-times me-1"></i> Cancelar
                </button>
            </div>
        `;
    }
}

/**
 * Guarda la edición de un comentario
 */
async function guardarEdicionComentario(comentarioId) {
    const elemento = document.querySelector(`[data-comentario-id="${comentarioId}"] textarea`);
    if (!elemento) return;
    
    const nuevoContenido = elemento.value.trim();
    
    if (!validarComentario(nuevoContenido)) {
        return;
    }
    
    try {
        mostrarLoading();
        
        const response = await API.updateComment(comentarioId, {
            contenido: nuevoContenido
        });
        
        if (response.success && response.data) {
            const comentarioActualizado = procesarComentario(response.data);
            const comentario = buscarComentario(comentarioId);
            if (comentario) {
                comentario.contenido = comentarioActualizado.contenido;
                comentario.editado = true;
            }
            
            comentarioEditando = null;
            renderizarComentarios();
            mostrarNotificacion('success', response.message || 'Comentario actualizado');
        } else {
            throw new Error(response.message || 'Error al actualizar el comentario');
        }
        
    } catch (error) {
        console.error('Error al actualizar comentario:', error);
        mostrarNotificacion('error', error.message || 'No se pudo actualizar el comentario');
    } finally {
        ocultarLoading();
    }
}

/**
 * Cancela la edición de un comentario
 */
function cancelarEdicionComentario(comentarioId) {
    comentarioEditando = null;
    renderizarComentarios();
}

// ===================================
// ELIMINAR COMENTARIO
// ===================================

/**
 * Elimina un comentario
 */
async function eliminarComentario(comentarioId) {
    const confirmado = await (window.mostrarConfirmacionToasty
        ? window.mostrarConfirmacionToasty({
            mensaje: '¿Eliminar este comentario?',
            tipo: 'warning',
            textoConfirmar: 'Eliminar',
            textoCancelar: 'Cancelar'
        })
        : Promise.resolve(confirm('¿Estás seguro de que deseas eliminar este comentario?')));

    if (!confirmado) {
        return;
    }
    
    try {
        mostrarLoading();
        
        const response = await API.deleteComment(comentarioId);
        
        if (response.success) {
            // Eliminar de la lista
            comentarios = comentarios.filter(c => {
                if (c.id === comentarioId) {
                    return false;
                }
                // Eliminar de respuestas
                if (c.respuestas) {
                    c.respuestas = c.respuestas.filter(r => r.id !== comentarioId);
                }
                return true;
            });
            
            renderizarComentarios();
            mostrarNotificacion('success', response.message || 'Comentario eliminado');
        } else {
            throw new Error(response.message || 'Error al eliminar el comentario');
        }
        
    } catch (error) {
        console.error('Error al eliminar comentario:', error);
        mostrarNotificacion('error', error.message || 'No se pudo eliminar el comentario');
    } finally {
        ocultarLoading();
    }
}

// ===================================
// VOTAR COMENTARIO
// ===================================

/**
 * Vota un comentario (like/dislike)
 */
async function votarComentario(comentarioId, tipo = null) {
    try {
        const comentario = buscarComentario(comentarioId);
        if (!comentario) return;
        
        const accion = tipo || (comentario.likeado ? 'down' : 'up');
        const response = await API.votarComentario(comentarioId, accion);
        
        if (response.success && response.data) {
            comentario.likes = response.data.num_likes ?? comentario.likes;
            comentario.likeado = response.data.likeado ?? (accion === 'up');
            renderizarComentarios();
        } else {
            throw new Error(response.message || 'Error al votar');
        }
        
    } catch (error) {
        console.error('Error al votar comentario:', error);
        mostrarNotificacion('error', error.message || 'No se pudo registrar el voto');
    }
}

/**
 * Acepta una respuesta como solución
 */
async function aceptarRespuesta(comentarioId) {
    try {
        const response = await API.aceptarComentario(comentarioId);
        
        if (response.success) {
            // Recargar comentarios para reflejar el cambio
            const postId = new URLSearchParams(window.location.search).get('id');
            if (postId) {
                await cargarComentarios(postId);
            }
            mostrarNotificacion('success', response.message || 'Respuesta aceptada');
        } else {
            throw new Error(response.message || 'Error al aceptar la respuesta');
        }
        
    } catch (error) {
        console.error('Error al aceptar respuesta:', error);
        mostrarNotificacion('error', error.message || 'No se pudo aceptar la respuesta');
    }
}

// ===================================
// RESPONDER COMENTARIO
// ===================================

/**
 * Responde a un comentario
 */
function responderComentario(comentarioId) {
    const comentario = buscarComentario(comentarioId);
    if (!comentario) return;
    
    // Mostrar formulario de respuesta
    const elemento = document.querySelector(`[data-comentario-id="${comentarioId}"]`);
    if (elemento) {
        let formRespuesta = elemento.querySelector('.form-respuesta');
        
        if (!formRespuesta) {
            formRespuesta = document.createElement('div');
            formRespuesta.className = 'form-respuesta mt-3';
            formRespuesta.innerHTML = `
                <textarea class="form-control mb-2" rows="2" placeholder="Escribe tu respuesta..."></textarea>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-primary" onclick="enviarRespuesta(${comentarioId})">
                        <i class="fas fa-paper-plane me-1"></i> Enviar
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="cancelarRespuesta(${comentarioId})">
                        <i class="fas fa-times me-1"></i> Cancelar
                    </button>
                </div>
            `;
            elemento.appendChild(formRespuesta);
        }
        
        formRespuesta.style.display = 'block';
        formRespuesta.querySelector('textarea').focus();
    }
}

/**
 * Envía una respuesta a un comentario
 */
async function enviarRespuesta(comentarioId) {
    const elemento = document.querySelector(`[data-comentario-id="${comentarioId}"]`);
    if (!elemento) return;
    
    const textarea = elemento.querySelector('.form-respuesta textarea');
    if (!textarea) return;
    
    const contenido = textarea.value.trim();
    const postId = obtenerPostIdDesdeURL();
    
    if (await crearComentario(postId, contenido, comentarioId)) {
        // Ocultar formulario
        elemento.querySelector('.form-respuesta').style.display = 'none';
        textarea.value = '';
    }
}

/**
 * Cancela la respuesta
 */
function cancelarRespuesta(comentarioId) {
    const elemento = document.querySelector(`[data-comentario-id="${comentarioId}"]`);
    if (!elemento) return;
    
    const formRespuesta = elemento.querySelector('.form-respuesta');
    if (formRespuesta) {
        formRespuesta.style.display = 'none';
        formRespuesta.querySelector('textarea').value = '';
    }
}

// ===================================
// REPORTAR COMENTARIO
// ===================================

/**
 * Reporta un comentario
 */
function reportarComentario(comentarioId) {
    const razon = prompt('¿Por qué deseas reportar este comentario?');
    if (!razon || razon.trim().length === 0) return;
    
    // TODO: Enviar reporte al backend
    // API.reportarComentario(comentarioId, razon);
    
    mostrarNotificacion('success', 'Comentario reportado. Gracias por tu colaboración.');
}

// ===================================
// UTILIDADES
// ===================================

/**
 * Busca un comentario por ID
 */
function buscarComentario(comentarioId) {
    for (const comentario of comentarios) {
        if (comentario.id === comentarioId) {
            return comentario;
        }
        if (comentario.respuestas) {
            const respuesta = comentario.respuestas.find(r => r.id === comentarioId);
            if (respuesta) return respuesta;
        }
    }
    return null;
}

/**
 * Obtiene el ID del post desde la URL
 */
function obtenerPostIdDesdeURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || null;
}

/**
 * Valida el contenido de un comentario
 */
function validarComentario(contenido) {
    if (!contenido || contenido.trim().length < CommentsConfig.minLength) {
        mostrarNotificacion('error', `El comentario debe tener al menos ${CommentsConfig.minLength} caracteres`);
        return false;
    }
    
    if (contenido.length > CommentsConfig.maxLength) {
        mostrarNotificacion('error', `El comentario no puede tener más de ${CommentsConfig.maxLength} caracteres`);
        return false;
    }
    
    return true;
}

// ===================================
// INICIALIZACIÓN
// ===================================

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        const postId = obtenerPostIdDesdeURL();
        if (postId) {
            cargarComentarios(postId);
        }
    });
} else {
    const postId = obtenerPostIdDesdeURL();
    if (postId) {
        cargarComentarios(postId);
    }
}

// ===================================
// EXPORTAR FUNCIONES
// ===================================
window.cargarComentarios = cargarComentarios;
window.crearComentario = crearComentario;
window.editarComentario = editarComentario;
window.eliminarComentario = eliminarComentario;
window.votarComentario = votarComentario;
window.responderComentario = responderComentario;
window.enviarRespuesta = enviarRespuesta;
window.cancelarRespuesta = cancelarRespuesta;
window.reportarComentario = reportarComentario;

