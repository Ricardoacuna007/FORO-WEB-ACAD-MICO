/**
 * MAIN.JS - Script principal de inicialización
 * ==============================================
 * Este archivo maneja la inicialización general de la aplicación
 */

// ===================================
// CONFIGURACIÓN GLOBAL
// ===================================
const APP_CONFIG = {
    nombre: 'Foro Académico UPA',
    version: '1.0.0',
    debug: true // Cambiar a false en producción
};

// ===================================
// INICIALIZACIÓN AL CARGAR EL DOM
// ===================================
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar AOS (animaciones al scroll)
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            once: true,
            offset: 100,
            easing: 'ease-in-out'
        });
    }
    
    // Log de inicialización en modo debug
    if (APP_CONFIG.debug) {
        console.log(`%c${APP_CONFIG.nombre} v${APP_CONFIG.version}`, 
            'color: #003366; font-size: 16px; font-weight: bold;');
        console.log('%cModo DEBUG activado', 'color: #FF6600; font-weight: bold;');
        console.log('API Mock Data:', localStorage.getItem('upa_token') ? 'Sesión activa' : 'Sin sesión');
    }
    
    // Inicializar tooltips de Bootstrap (si existen)
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Inicializar popovers de Bootstrap (si existen)
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
    
    // Cargar datos del usuario si está autenticado
    cargarDatosUsuario();
    
    // Inicializar barra de búsqueda
    inicializarBusqueda();
    
    // Detectar cambios de tema (para futuras implementaciones)
    detectarPreferenciaTema();
});

// ===================================
// CARGA DE DATOS DEL USUARIO
// ===================================

/**
 * Carga y muestra los datos del usuario en el DOM
 */
function cargarDatosUsuario() {
    const userData = localStorage.getItem('user_data');
    
    if (!userData) return;
    
    try {
        const user = JSON.parse(userData);
        
        // Actualizar nombre en navbar
        const nombreUsuario = document.getElementById('nombreUsuario');
        if (nombreUsuario) {
            nombreUsuario.textContent = user.nombre;
        }
        
        // Actualizar nombre completo en dropdown
        const nombreCompleto = document.getElementById('nombreUsuarioCompleto');
        if (nombreCompleto) {
            nombreCompleto.textContent = `${user.nombre} ${user.apellidos || ''}`;
        }
        
        // Actualizar email
        const emailUsuario = document.getElementById('emailUsuario');
        if (emailUsuario) {
            emailUsuario.textContent = user.email;
        }
        
        // Actualizar nombre en dashboard
        const nombreDashboard = document.getElementById('nombreDashboard');
        if (nombreDashboard) {
            nombreDashboard.textContent = user.nombre;
        }
        
        // Actualizar avatares con iniciales
        const avatares = document.querySelectorAll('img[alt="Avatar"]');
        const iniciales = `${user.nombre[0]}${user.apellidos ? user.apellidos[0] : ''}`;
        const urlAvatar = `https://ui-avatars.com/api/?name=${iniciales}&background=FF6600&color=fff&size=128`;
        
        avatares.forEach(avatar => {
            if (!user.avatar) {
                avatar.src = urlAvatar;
            }
        });
        
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
    }
}

// ===================================
// SISTEMA DE BÚSQUEDA
// ===================================

/**
 * Inicializa la funcionalidad de búsqueda
 */
function inicializarBusqueda() {
    const searchInput = document.getElementById('searchInput');
    
    if (!searchInput) return;
    
    // Búsqueda en tiempo real (con debounce)
    let timeoutId;
    searchInput.addEventListener('input', function(e) {
        clearTimeout(timeoutId);
        
        const query = e.target.value.trim();
        
        if (query.length < 3) {
            ocultarResultadosBusqueda();
            return;
        }
        
        timeoutId = setTimeout(() => {
            realizarBusqueda(query);
        }, 500); // Esperar 500ms después de que el usuario deje de escribir
    });
    
    // Búsqueda al enviar formulario
    const searchForm = searchInput.closest('form');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query.length >= 3) {
                realizarBusqueda(query);
            }
        });
    }
}

/**
 * Realiza la búsqueda y muestra resultados
 */
async function realizarBusqueda(query) {
    if (APP_CONFIG.debug) {
        console.log('Buscando:', query);
    }
    
    // TODO: Implementar búsqueda real cuando el backend esté listo
    mostrarNotificacion('info', `Búsqueda de "${query}" (funcionalidad pendiente)`);
}

/**
 * Oculta los resultados de búsqueda
 */
function ocultarResultadosBusqueda() {
    // TODO: Implementar cuando tengamos dropdown de resultados
}

// ===================================
// TEMA CLARO/OSCURO (FUTURO)
// ===================================

/**
 * Detecta la preferencia de tema del usuario
 */
function detectarPreferenciaTema() {
    // Verificar si el usuario tiene preferencia guardada
    const temaGuardado = localStorage.getItem('tema_preferido');
    
    if (temaGuardado) {
        aplicarTema(temaGuardado);
    } else {
        // Detectar preferencia del sistema
        const prefiereTemaOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
        aplicarTema(prefiereTemaOscuro ? 'oscuro' : 'claro');
    }
}

/**
 * Aplica el tema seleccionado
 */
function aplicarTema(tema) {
    // TODO: Implementar en futuras versiones
    document.documentElement.setAttribute('data-theme', tema);
    localStorage.setItem('tema_preferido', tema);
}

// ===================================
// MANEJO DE ERRORES GLOBAL
// ===================================

// ===================================
// MANEJO DE ERRORES GLOBAL
// ===================================

/**
 * Maneja errores no capturados
 */
window.addEventListener('error', function(e) {
    if (APP_CONFIG.debug) {
        console.error('Error global capturado:', e.error);
    }
});

/**
 * Maneja promesas rechazadas no capturadas
 */
window.addEventListener('unhandledrejection', function(e) {
    if (APP_CONFIG.debug) {
        console.error('Promise rechazada no manejada:', e.reason);
    }
});

// ===================================
// UTILIDADES GENERALES
// ===================================

/**
 * Formatea una fecha en formato legible
 * @param {string} fecha - Fecha en formato ISO
 * @returns {string} Fecha formateada
 */
function formatearFecha(fecha) {
    const opciones = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(fecha).toLocaleDateString('es-MX', opciones);
}

/**
 * Calcula el tiempo transcurrido desde una fecha
 * @param {string} fecha - Fecha en formato ISO
 * @returns {string} Tiempo transcurrido (ej: "Hace 2 horas")
 */
function tiempoTranscurrido(fecha) {
    const ahora = new Date();
    const fechaObj = new Date(fecha);
    const diferencia = ahora - fechaObj;
    
    const segundos = Math.floor(diferencia / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    const meses = Math.floor(dias / 30);
    const anos = Math.floor(dias / 365);
    
    if (segundos < 60) return 'Justo ahora';
    if (minutos < 60) return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    if (dias < 30) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
    if (meses < 12) return `Hace ${meses} mes${meses > 1 ? 'es' : ''}`;
    return `Hace ${anos} año${anos > 1 ? 's' : ''}`;
}

/**
 * Trunca un texto a una longitud específica
 * @param {string} texto - Texto a truncar
 * @param {number} longitud - Longitud máxima
 * @returns {string} Texto truncado
 */
function truncarTexto(texto, longitud = 100) {
    if (texto.length <= longitud) return texto;
    return texto.substring(0, longitud) + '...';
}

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean} True si es válido
 */
function esEmailValido(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Formatea un número con separadores de miles
 * @param {number} numero - Número a formatear
 * @returns {string} Número formateado
 */
function formatearNumero(numero) {
    return new Intl.NumberFormat('es-MX').format(numero);
}

/**
 * Genera un color aleatorio en formato hexadecimal
 * @returns {string} Color en formato #RRGGBB
 */
function colorAleatorio() {
    return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}

/**
 * Obtiene las iniciales de un nombre
 * @param {string} nombre - Nombre completo
 * @returns {string} Iniciales (máximo 2 caracteres)
 */
function obtenerIniciales(nombre) {
    const palabras = nombre.trim().split(' ');
    if (palabras.length === 1) {
        return palabras[0].substring(0, 2).toUpperCase();
    }
    return (palabras[0][0] + palabras[palabras.length - 1][0]).toUpperCase();
}

/**
 * Copia texto al portapapeles
 * @param {string} texto - Texto a copiar
 */
async function copiarAlPortapapeles(texto) {
    try {
        await navigator.clipboard.writeText(texto);
        mostrarNotificacion('success', 'Copiado al portapapeles');
    } catch (error) {
        console.error('Error al copiar:', error);
        mostrarNotificacion('error', 'No se pudo copiar al portapapeles');
    }
}

/**
 * Descarga un archivo
 * @param {string} url - URL del archivo
 * @param {string} nombreArchivo - Nombre con el que se guardará
 */
function descargarArchivo(url, nombreArchivo) {
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Formatea el tamaño de un archivo
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} Tamaño formateado (ej: "2.5 MB")
 */
function formatearTamanoArchivo(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Detecta el tipo de archivo por extensión
 * @param {string} nombreArchivo - Nombre del archivo
 * @returns {string} Tipo de archivo
 */
function detectarTipoArchivo(nombreArchivo) {
    const extension = nombreArchivo.split('.').pop().toLowerCase();
    
    const tipos = {
        // Documentos
        'pdf': 'PDF',
        'doc': 'Word',
        'docx': 'Word',
        'txt': 'Texto',
        'rtf': 'RTF',
        
        // Hojas de cálculo
        'xls': 'Excel',
        'xlsx': 'Excel',
        'csv': 'CSV',
        
        // Presentaciones
        'ppt': 'PowerPoint',
        'pptx': 'PowerPoint',
        
        // Imágenes
        'jpg': 'Imagen',
        'jpeg': 'Imagen',
        'png': 'Imagen',
        'gif': 'Imagen',
        'svg': 'Imagen',
        'webp': 'Imagen',
        
        // Código
        'html': 'HTML',
        'css': 'CSS',
        'js': 'JavaScript',
        'json': 'JSON',
        'xml': 'XML',
        'php': 'PHP',
        'py': 'Python',
        'java': 'Java',
        'cpp': 'C++',
        'c': 'C',
        
        // Comprimidos
        'zip': 'ZIP',
        'rar': 'RAR',
        '7z': '7Z',
        'tar': 'TAR',
        'gz': 'GZIP'
    };
    
    return tipos[extension] || 'Archivo';
}

// ===================================
// VALIDACIÓN DE FORMULARIOS
// ===================================

/**
 * Valida un formulario con Bootstrap validation
 * @param {HTMLFormElement} form - Formulario a validar
 * @returns {boolean} True si es válido
 */
function validarFormulario(form) {
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        
        // Hacer scroll al primer campo inválido
        const primerCampoInvalido = form.querySelector(':invalid');
        if (primerCampoInvalido) {
            primerCampoInvalido.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            primerCampoInvalido.focus();
        }
        
        return false;
    }
    
    return true;
}

/**
 * Limpia la validación de un formulario
 * @param {HTMLFormElement} form - Formulario a limpiar
 */
function limpiarValidacion(form) {
    form.classList.remove('was-validated');
    
    // Remover clases is-invalid de todos los campos
    form.querySelectorAll('.is-invalid').forEach(campo => {
        campo.classList.remove('is-invalid');
    });
}

// ===================================
// LOADING SPINNER
// ===================================

/**
 * Muestra un spinner de carga global
 */
function mostrarLoading() {
    // Verificar si ya existe
    if (document.getElementById('globalLoadingSpinner')) return;
    
    const spinner = document.createElement('div');
    spinner.id = 'globalLoadingSpinner';
    spinner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
    `;
    
    spinner.innerHTML = `
        <div class="spinner-border text-light" role="status" style="width: 3rem; height: 3rem;">
            <span class="visually-hidden">Cargando...</span>
        </div>
    `;
    
    document.body.appendChild(spinner);
}

/**
 * Oculta el spinner de carga global
 */
function ocultarLoading() {
    const spinner = document.getElementById('globalLoadingSpinner');
    if (spinner) {
        spinner.remove();
    }
}

// ===================================
// CONFIRMACIÓN DE ACCIONES
// ===================================

/**
 * Muestra un modal de confirmación
 * @param {string} titulo - Título del modal
 * @param {string} mensaje - Mensaje a mostrar
 * @param {Function} callback - Función a ejecutar si confirma
 */
function confirmarAccion(titulo, mensaje, callback) {
    // Usar el confirm nativo por ahora
    // TODO: Crear un modal personalizado más elegante
    if (confirm(`${titulo}\n\n${mensaje}`)) {
        callback();
    }
}

// ===================================
// MANEJO DE SCROLL
// ===================================

/**
 * Hace scroll suave hacia un elemento
 * @param {string} elementId - ID del elemento
 */
function scrollTo(elementId) {
    const elemento = document.getElementById(elementId);
    if (elemento) {
        elemento.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
}

/**
 * Botón para volver arriba (scroll to top)
 */
function inicializarScrollToTop() {
    // Crear botón
    const btnScrollTop = document.createElement('button');
    btnScrollTop.id = 'scrollToTopBtn';
    btnScrollTop.className = 'btn btn-upa-primary rounded-circle shadow-lg';
    btnScrollTop.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        display: none;
        z-index: 1000;
        border: none;
    `;
    btnScrollTop.innerHTML = '<i class="fas fa-arrow-up"></i>';
    
    // Mostrar/ocultar según scroll
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            btnScrollTop.style.display = 'block';
        } else {
            btnScrollTop.style.display = 'none';
        }
    });
    
    // Click para scroll hacia arriba
    btnScrollTop.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    document.body.appendChild(btnScrollTop);
}

// Inicializar scroll to top si estamos en una página con mucho contenido
if (document.body.scrollHeight > window.innerHeight * 2) {
    inicializarScrollToTop();
}

// ===================================
// EXPORTAR FUNCIONES ÚTILES
// ===================================
window.formatearFecha = formatearFecha;
window.tiempoTranscurrido = tiempoTranscurrido;
window.truncarTexto = truncarTexto;
window.esEmailValido = esEmailValido;
window.formatearNumero = formatearNumero;
window.colorAleatorio = colorAleatorio;
window.obtenerIniciales = obtenerIniciales;
window.copiarAlPortapapeles = copiarAlPortapapeles;
window.descargarArchivo = descargarArchivo;
window.formatearTamanoArchivo = formatearTamanoArchivo;
window.detectarTipoArchivo = detectarTipoArchivo;
window.validarFormulario = validarFormulario;
window.limpiarValidacion = limpiarValidacion;
window.mostrarLoading = mostrarLoading;
window.ocultarLoading = ocultarLoading;
window.confirmarAccion = confirmarAccion;
window.scrollTo = scrollTo;

// Log de funciones exportadas en modo debug
if (APP_CONFIG.debug) {
    console.log('%cFunciones útiles disponibles:', 'color: #28A745; font-weight: bold;');
    console.log('- formatearFecha(fecha)');
    console.log('- tiempoTranscurrido(fecha)');
    console.log('- truncarTexto(texto, longitud)');
    console.log('- formatearTamanoArchivo(bytes)');
    console.log('- copiarAlPortapapeles(texto)');
    console.log('- mostrarNotificacion(type, message)');
    console.log('Y más... revisar main.js para detalles');
}