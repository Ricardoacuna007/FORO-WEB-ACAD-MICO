/**
 * VALIDATION.JS - Sistema de Validación de Formularios
 * =====================================================
 * Validación completa de formularios con feedback visual
 */

// ===================================
// CONFIGURACIÓN
// ===================================
const ValidationConfig = {
    mensajes: {
        requerido: 'Este campo es requerido',
        email: 'Ingresa un email válido',
        emailInstitucional: 'Debes usar tu correo institucional (@upatlacomulco.edu.mx)',
        minLength: 'Este campo debe tener al menos {min} caracteres',
        maxLength: 'Este campo no puede tener más de {max} caracteres',
        password: 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número',
        passwordMatch: 'Las contraseñas no coinciden',
        numero: 'Ingresa un número válido',
        telefono: 'Ingresa un teléfono válido',
        url: 'Ingresa una URL válida',
        fecha: 'Ingresa una fecha válida',
        archivo: 'Selecciona un archivo válido',
        archivoTamano: 'El archivo es demasiado grande (máximo {max}MB)',
        archivoTipo: 'Tipo de archivo no permitido'
    }
};

function esEmailValido(email) {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function esEmailInstitucional(email) {
    if (!email) return false;
    return /^[^\s@]+@upatlacomulco\.edu\.mx$/i.test(email);
}

window.esEmailValido = esEmailValido;
window.esEmailInstitucional = esEmailInstitucional;

// ===================================
// VALIDADORES
// ===================================

/**
 * Valida un campo de formulario
 * @param {HTMLElement} campo - Campo a validar
 * @param {object} reglas - Reglas de validación
 * @returns {object} { valido: boolean, mensaje: string }
 */
function validarCampo(campo, reglas = {}) {
    const valor = campo.value.trim();
    const tipo = campo.type || campo.tagName.toLowerCase();
    
    // Validar requerido
    if (reglas.requerido && !valor) {
        return {
            valido: false,
            mensaje: ValidationConfig.mensajes.requerido
        };
    }
    
    // Si no es requerido y está vacío, es válido
    if (!reglas.requerido && !valor) {
        return { valido: true, mensaje: '' };
    }
    
    // Validar email
    if (reglas.email || tipo === 'email') {
        if (!esEmailValido(valor)) {
            return {
                valido: false,
                mensaje: reglas.emailInstitucional 
                    ? ValidationConfig.mensajes.emailInstitucional 
                    : ValidationConfig.mensajes.email
            };
        }
        
        if (reglas.emailInstitucional && !esEmailInstitucional(valor)) {
            return {
                valido: false,
                mensaje: ValidationConfig.mensajes.emailInstitucional
            };
        }
    }
    
    // Validar longitud mínima
    if (reglas.minLength && valor.length < reglas.minLength) {
        return {
            valido: false,
            mensaje: ValidationConfig.mensajes.minLength.replace('{min}', reglas.minLength)
        };
    }
    
    // Validar longitud máxima
    if (reglas.maxLength && valor.length > reglas.maxLength) {
        return {
            valido: false,
            mensaje: ValidationConfig.mensajes.maxLength.replace('{max}', reglas.maxLength)
        };
    }
    
    // Validar contraseña
    if (reglas.password || tipo === 'password') {
        const validacion = validarPassword(valor);
        if (!validacion.valido) {
            return {
                valido: false,
                mensaje: validacion.mensaje || ValidationConfig.mensajes.password
            };
        }
    }
    
    // Validar coincidencia de contraseñas
    if (reglas.passwordMatch) {
        const campoPassword = document.querySelector(reglas.passwordMatch);
        if (campoPassword && valor !== campoPassword.value) {
            return {
                valido: false,
                mensaje: ValidationConfig.mensajes.passwordMatch
            };
        }
    }
    
    // Validar número
    if (reglas.numero || tipo === 'number') {
        if (isNaN(valor) || valor === '') {
            return {
                valido: false,
                mensaje: ValidationConfig.mensajes.numero
            };
        }
    }
    
    // Validar teléfono
    if (reglas.telefono) {
        const regex = /^[0-9]{10}$/;
        if (!regex.test(valor.replace(/[\s-()]/g, ''))) {
            return {
                valido: false,
                mensaje: ValidationConfig.mensajes.telefono
            };
        }
    }
    
    // Validar URL
    if (reglas.url || tipo === 'url') {
        try {
            new URL(valor);
        } catch {
            return {
                valido: false,
                mensaje: ValidationConfig.mensajes.url
            };
        }
    }
    
    // Validar fecha
    if (reglas.fecha || tipo === 'date') {
        const fecha = new Date(valor);
        if (isNaN(fecha.getTime())) {
            return {
                valido: false,
                mensaje: ValidationConfig.mensajes.fecha
            };
        }
    }
    
    // Validar archivo
    if (reglas.archivo || tipo === 'file') {
        const archivo = campo.files[0];
        if (reglas.requerido && !archivo) {
            return {
                valido: false,
                mensaje: ValidationConfig.mensajes.archivo
            };
        }
        
        if (archivo) {
            // Validar tamaño
            if (reglas.maxTamano && archivo.size > reglas.maxTamano) {
                const maxMB = (reglas.maxTamano / (1024 * 1024)).toFixed(2);
                return {
                    valido: false,
                    mensaje: ValidationConfig.mensajes.archivoTamano.replace('{max}', maxMB)
                };
            }
            
            // Validar tipo
            if (reglas.tiposPermitidos) {
                const extension = archivo.name.split('.').pop().toLowerCase();
                if (!reglas.tiposPermitidos.includes(extension)) {
                    return {
                        valido: false,
                        mensaje: ValidationConfig.mensajes.archivoTipo
                    };
                }
            }
        }
    }
    
    // Validación personalizada
    if (reglas.custom && typeof reglas.custom === 'function') {
        const resultado = reglas.custom(valor, campo);
        if (resultado !== true) {
            return {
                valido: false,
                mensaje: resultado || 'Validación fallida'
            };
        }
    }
    
    return { valido: true, mensaje: '' };
}

/**
 * Valida un formulario completo
 * @param {HTMLFormElement} formulario - Formulario a validar
 * @param {object} reglas - Reglas de validación por campo
 * @returns {boolean} True si el formulario es válido
 */
function validarFormulario(formulario, reglas = {}) {
    if (!formulario) return false;
    
    let esValido = true;
    const campos = formulario.querySelectorAll('input, textarea, select');
    
    campos.forEach(campo => {
        // Obtener reglas del campo
        const campoReglas = reglas[campo.name] || reglas[campo.id] || {};
        
        // Agregar requerido si el campo tiene el atributo required
        if (campo.hasAttribute('required')) {
            campoReglas.requerido = true;
        }
        
        // Validar campo
        const resultado = validarCampo(campo, campoReglas);
        
        if (!resultado.valido) {
            esValido = false;
            mostrarErrorCampo(campo, resultado.mensaje);
        } else {
            limpiarErrorCampo(campo);
        }
    });
    
    // Agregar clase was-validated para mostrar feedback de Bootstrap
    if (!esValido) {
        formulario.classList.add('was-validated');
        
        // Hacer scroll al primer campo con error
        const primerError = formulario.querySelector('.is-invalid');
        if (primerError) {
            primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            primerError.focus();
        }
    }
    
    return esValido;
}

// ===================================
// FEEDBACK VISUAL
// ===================================

/**
 * Muestra un error en un campo
 * @param {HTMLElement} campo - Campo con error
 * @param {string} mensaje - Mensaje de error
 */
function mostrarErrorCampo(campo, mensaje) {
    if (!campo) return;
    
    // Agregar clase de error
    campo.classList.add('is-invalid');
    campo.classList.remove('is-valid');
    
    // Buscar o crear elemento de feedback
    let feedback = campo.parentElement.querySelector('.invalid-feedback');
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        campo.parentElement.appendChild(feedback);
    }
    
    feedback.textContent = mensaje;
    feedback.style.display = 'block';
}

/**
 * Limpia el error de un campo
 * @param {HTMLElement} campo - Campo a limpiar
 */
function limpiarErrorCampo(campo) {
    if (!campo) return;
    
    // Remover clase de error
    campo.classList.remove('is-invalid');
    campo.classList.add('is-valid');
    
    // Ocultar feedback
    const feedback = campo.parentElement.querySelector('.invalid-feedback');
    if (feedback) {
        feedback.style.display = 'none';
    }
}

/**
 * Limpia todos los errores de un formulario
 * @param {HTMLFormElement} formulario - Formulario a limpiar
 */
function limpiarValidacion(formulario) {
    if (!formulario) return;
    
    // Remover clase was-validated
    formulario.classList.remove('was-validated');
    
    // Limpiar errores de todos los campos
    const campos = formulario.querySelectorAll('.is-invalid, .is-valid');
    campos.forEach(campo => {
        campo.classList.remove('is-invalid', 'is-valid');
    });
    
    // Ocultar todos los mensajes de feedback
    const feedbacks = formulario.querySelectorAll('.invalid-feedback, .valid-feedback');
    feedbacks.forEach(feedback => {
        feedback.style.display = 'none';
    });
}

// ===================================
// VALIDACIÓN EN TIEMPO REAL
// ===================================

/**
 * Inicializa la validación en tiempo real para un formulario
 * @param {HTMLFormElement} formulario - Formulario a validar
 * @param {object} reglas - Reglas de validación
 */
function inicializarValidacionTiempoReal(formulario, reglas = {}) {
    if (!formulario) return;
    
    const campos = formulario.querySelectorAll('input, textarea, select');
    
    campos.forEach(campo => {
        // Validar al perder el foco
        campo.addEventListener('blur', function() {
            const campoReglas = reglas[campo.name] || reglas[campo.id] || {};
            if (campo.hasAttribute('required')) {
                campoReglas.requerido = true;
            }
            
            const resultado = validarCampo(campo, campoReglas);
            if (resultado.valido) {
                limpiarErrorCampo(campo);
            } else {
                mostrarErrorCampo(campo, resultado.mensaje);
            }
        });
        
        // Limpiar error al empezar a escribir
        campo.addEventListener('input', function() {
            if (campo.classList.contains('is-invalid')) {
                const campoReglas = reglas[campo.name] || reglas[campo.id] || {};
                if (campo.hasAttribute('required')) {
                    campoReglas.requerido = true;
                }
                
                const resultado = validarCampo(campo, campoReglas);
                if (resultado.valido) {
                    limpiarErrorCampo(campo);
                }
            }
        });
    });
}

// ===================================
// VALIDACIONES ESPECÍFICAS
// ===================================

/**
 * Valida un formulario de registro
 * @param {HTMLFormElement} formulario - Formulario de registro
 * @returns {boolean} True si es válido
 */
function validarFormularioRegistro(formulario) {
    const reglas = {
        nombre: {
            requerido: true,
            minLength: 2,
            maxLength: 50
        },
        apellidos: {
            requerido: true,
            minLength: 2,
            maxLength: 50
        },
        email: {
            requerido: true,
            email: true,
            emailInstitucional: true
        },
        password: {
            requerido: true,
            password: true,
            minLength: 8
        },
        confirmPassword: {
            requerido: true,
            passwordMatch: '#password'
        },
        rol: {
            requerido: true
        }
    };
    
    return validarFormulario(formulario, reglas);
}

/**
 * Valida un formulario de login
 * @param {HTMLFormElement} formulario - Formulario de login
 * @returns {boolean} True si es válido
 */
function validarFormularioLogin(formulario) {
    const reglas = {
        email: {
            requerido: true,
            email: true,
            emailInstitucional: true
        },
        password: {
            requerido: true
        }
    };
    
    return validarFormulario(formulario, reglas);
}

/**
 * Valida un formulario de publicación
 * @param {HTMLFormElement} formulario - Formulario de publicación
 * @returns {boolean} True si es válido
 */
function validarFormularioPublicacion(formulario) {
    const reglas = {
        titulo: {
            requerido: true,
            minLength: 5,
            maxLength: 200
        },
        contenido: {
            requerido: true,
            minLength: 10,
            maxLength: 5000
        },
        categoria: {
            requerido: true
        },
        materia: {
            requerido: true
        }
    };
    
    return validarFormulario(formulario, reglas);
}

// ===================================
// UTILIDADES
// ===================================

/**
 * Valida un campo específico y muestra el resultado
 * @param {string} campoId - ID del campo
 * @param {object} reglas - Reglas de validación
 * @returns {boolean} True si es válido
 */
function validarCampoPorId(campoId, reglas = {}) {
    const campo = document.getElementById(campoId);
    if (!campo) return false;
    
    const resultado = validarCampo(campo, reglas);
    
    if (resultado.valido) {
        limpiarErrorCampo(campo);
        return true;
    } else {
        mostrarErrorCampo(campo, resultado.mensaje);
        return false;
    }
}

/**
 * Verifica si un formulario tiene campos inválidos
 * @param {HTMLFormElement} formulario - Formulario a verificar
 * @returns {boolean} True si tiene campos inválidos
 */
function tieneErrores(formulario) {
    if (!formulario) return false;
    return formulario.querySelectorAll('.is-invalid').length > 0;
}

/**
 * Obtiene todos los errores de un formulario
 * @param {HTMLFormElement} formulario - Formulario a verificar
 * @returns {Array} Array de objetos con { campo, mensaje }
 */
function obtenerErrores(formulario) {
    if (!formulario) return [];
    
    const errores = [];
    const camposInvalidos = formulario.querySelectorAll('.is-invalid');
    
    camposInvalidos.forEach(campo => {
        const feedback = campo.parentElement.querySelector('.invalid-feedback');
        errores.push({
            campo: campo.name || campo.id,
            mensaje: feedback ? feedback.textContent : 'Campo inválido'
        });
    });
    
    return errores;
}

// ===================================
// EXPORTAR FUNCIONES
// ===================================
window.validarCampo = validarCampo;
window.validarFormulario = validarFormulario;
window.mostrarErrorCampo = mostrarErrorCampo;
window.limpiarErrorCampo = limpiarErrorCampo;
window.limpiarValidacion = limpiarValidacion;
window.inicializarValidacionTiempoReal = inicializarValidacionTiempoReal;
window.validarFormularioRegistro = validarFormularioRegistro;
window.validarFormularioLogin = validarFormularioLogin;
window.validarFormularioPublicacion = validarFormularioPublicacion;
window.validarCampoPorId = validarCampoPorId;
window.tieneErrores = tieneErrores;
window.obtenerErrores = obtenerErrores;

