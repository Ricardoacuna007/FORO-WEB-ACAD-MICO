/**
 * UTILS.JS - Utilidades Compartidas
 * ==================================
 * Funciones utilitarias reutilizables en toda la aplicación
 */

// ===================================
// FORMATEO DE FECHAS
// ===================================

/**
 * Formatea una fecha en formato legible
 * @param {Date|string} fecha - Fecha a formatear
 * @param {string} formato - Formato deseado ('completo', 'corto', 'relativo')
 * @returns {string} Fecha formateada
 */
function formatearFecha(fecha, formato = 'completo') {
    if (!fecha) return '';
    
    const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
    
    if (isNaN(fechaObj.getTime())) {
        return 'Fecha inválida';
    }
    
    switch (formato) {
        case 'completo':
            return fechaObj.toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
        case 'corto':
            return fechaObj.toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
        case 'relativo':
            return tiempoTranscurrido(fechaObj);
            
        case 'hora':
            return fechaObj.toLocaleTimeString('es-MX', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
        default:
            return fechaObj.toLocaleDateString('es-MX');
    }
}

/**
 * Calcula el tiempo transcurrido desde una fecha
 * @param {Date|string} fecha - Fecha de referencia
 * @returns {string} Tiempo transcurrido (ej: "Hace 2 horas")
 */
function tiempoTranscurrido(fecha) {
    if (!fecha) return '';
    
    const ahora = new Date();
    const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
    const diferencia = ahora - fechaObj;
    
    if (diferencia < 0) {
        return 'En el futuro';
    }
    
    const segundos = Math.floor(diferencia / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    const semanas = Math.floor(dias / 7);
    const meses = Math.floor(dias / 30);
    const anos = Math.floor(dias / 365);
    
    if (segundos < 60) return 'Justo ahora';
    if (minutos < 60) return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    if (dias < 7) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
    if (semanas < 4) return `Hace ${semanas} semana${semanas > 1 ? 's' : ''}`;
    if (meses < 12) return `Hace ${meses} mes${meses > 1 ? 'es' : ''}`;
    return `Hace ${anos} año${anos > 1 ? 's' : ''}`;
}

// ===================================
// FORMATEO DE TEXTO
// ===================================

/**
 * Trunca un texto a una longitud específica
 * @param {string} texto - Texto a truncar
 * @param {number} longitud - Longitud máxima
 * @param {string} sufijo - Sufijo a agregar (default: '...')
 * @returns {string} Texto truncado
 */
function truncarTexto(texto, longitud = 100, sufijo = '...') {
    if (!texto) return '';
    if (texto.length <= longitud) return texto;
    return texto.substring(0, longitud).trim() + sufijo;
}

/**
 * Capitaliza la primera letra de un texto
 * @param {string} texto - Texto a capitalizar
 * @returns {string} Texto capitalizado
 */
function capitalizar(texto) {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

/**
 * Convierte texto a formato slug (URL-friendly)
 * @param {string} texto - Texto a convertir
 * @returns {string} Slug
 */
function slugificar(texto) {
    if (!texto) return '';
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/[^a-z0-9]+/g, '-') // Reemplazar caracteres especiales
        .replace(/^-+|-+$/g, ''); // Remover guiones al inicio y final
}

/**
 * Escapa HTML para prevenir XSS
 * @param {string} texto - Texto a escapar
 * @returns {string} Texto escapado
 */
function escaparHTML(texto) {
    if (!texto) return '';
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

// ===================================
// FORMATEO DE NÚMEROS
// ===================================

/**
 * Formatea un número con separadores de miles
 * @param {number} numero - Número a formatear
 * @param {number} decimales - Número de decimales
 * @returns {string} Número formateado
 */
function formatearNumero(numero, decimales = 0) {
    if (isNaN(numero)) return '0';
    return new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales
    }).format(numero);
}

/**
 * Formatea el tamaño de un archivo
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} Tamaño formateado (ej: "2.5 MB")
 */
function formatearTamanoArchivo(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// ===================================
// VALIDACIÓN
// ===================================

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean} True si es válido
 */
function esEmailValido(email) {
    if (!email) return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Valida un email institucional UPA
 * @param {string} email - Email a validar
 * @returns {boolean} True si es válido
 */
function esEmailInstitucional(email) {
    if (!email) return false;
    return email.endsWith('@upatlacomulco.edu.mx');
}

/**
 * Valida una contraseña
 * @param {string} password - Contraseña a validar
 * @returns {object} { valido: boolean, mensaje: string }
 */
function validarPassword(password) {
    if (!password) {
        return { valido: false, mensaje: 'La contraseña es requerida' };
    }
    
    const tieneMinimo8 = password.length >= 8;
    const tieneMayuscula = /[A-Z]/.test(password);
    const tieneMinuscula = /[a-z]/.test(password);
    const tieneNumero = /[0-9]/.test(password);
    const tieneEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!tieneMinimo8) {
        return { valido: false, mensaje: 'La contraseña debe tener al menos 8 caracteres' };
    }
    if (!tieneMayuscula) {
        return { valido: false, mensaje: 'La contraseña debe contener al menos una mayúscula' };
    }
    if (!tieneMinuscula) {
        return { valido: false, mensaje: 'La contraseña debe contener al menos una minúscula' };
    }
    if (!tieneNumero) {
        return { valido: false, mensaje: 'La contraseña debe contener al menos un número' };
    }
    
    return { valido: true, mensaje: 'Contraseña válida' };
}

// ===================================
// MANIPULACIÓN DE DOM
// ===================================

/**
 * Crea un elemento HTML
 * @param {string} tag - Tag del elemento
 * @param {object} atributos - Atributos del elemento
 * @param {string} contenido - Contenido HTML
 * @returns {HTMLElement} Elemento creado
 */
function crearElemento(tag, atributos = {}, contenido = '') {
    const elemento = document.createElement(tag);
    
    Object.keys(atributos).forEach(key => {
        if (key === 'className') {
            elemento.className = atributos[key];
        } else if (key === 'dataset') {
            Object.keys(atributos[key]).forEach(dataKey => {
                elemento.dataset[dataKey] = atributos[key][dataKey];
            });
        } else {
            elemento.setAttribute(key, atributos[key]);
        }
    });
    
    if (contenido) {
        elemento.innerHTML = contenido;
    }
    
    return elemento;
}

/**
 * Remueve todos los hijos de un elemento
 * @param {HTMLElement} elemento - Elemento padre
 */
function limpiarElemento(elemento) {
    if (!elemento) return;
    while (elemento.firstChild) {
        elemento.removeChild(elemento.firstChild);
    }
}

/**
 * Hace scroll suave hacia un elemento
 * @param {string|HTMLElement} elemento - ID del elemento o elemento HTML
 * @param {object} opciones - Opciones de scroll
 */
function scrollHacia(elemento, opciones = {}) {
    const elementoObj = typeof elemento === 'string' 
        ? document.getElementById(elemento) 
        : elemento;
    
    if (!elementoObj) return;
    
    elementoObj.scrollIntoView({
        behavior: opciones.behavior || 'smooth',
        block: opciones.block || 'start',
        inline: opciones.inline || 'nearest'
    });
}

// ===================================
// LOCALSTORAGE
// ===================================

/**
 * Guarda un valor en localStorage
 * @param {string} clave - Clave
 * @param {*} valor - Valor a guardar
 */
function guardarEnStorage(clave, valor) {
    try {
        const valorSerializado = JSON.stringify(valor);
        localStorage.setItem(clave, valorSerializado);
    } catch (error) {
        console.error('Error al guardar en localStorage:', error);
    }
}

/**
 * Obtiene un valor de localStorage
 * @param {string} clave - Clave
 * @param {*} valorPorDefecto - Valor por defecto si no existe
 * @returns {*} Valor obtenido
 */
function obtenerDeStorage(clave, valorPorDefecto = null) {
    try {
        const valor = localStorage.getItem(clave);
        return valor ? JSON.parse(valor) : valorPorDefecto;
    } catch (error) {
        console.error('Error al obtener de localStorage:', error);
        return valorPorDefecto;
    }
}

/**
 * Elimina un valor de localStorage
 * @param {string} clave - Clave
 */
function eliminarDeStorage(clave) {
    try {
        localStorage.removeItem(clave);
    } catch (error) {
        console.error('Error al eliminar de localStorage:', error);
    }
}

/**
 * Limpia todo el localStorage
 */
function limpiarStorage() {
    try {
        localStorage.clear();
    } catch (error) {
        console.error('Error al limpiar localStorage:', error);
    }
}

// ===================================
// URL Y QUERY PARAMS
// ===================================

/**
 * Obtiene un parámetro de la URL
 * @param {string} nombre - Nombre del parámetro
 * @returns {string|null} Valor del parámetro
 */
function obtenerParametroURL(nombre) {
    const params = new URLSearchParams(window.location.search);
    return params.get(nombre);
}

/**
 * Establece un parámetro en la URL
 * @param {string} nombre - Nombre del parámetro
 * @param {string} valor - Valor del parámetro
 */
function establecerParametroURL(nombre, valor) {
    const url = new URL(window.location);
    url.searchParams.set(nombre, valor);
    window.history.pushState({}, '', url);
}

/**
 * Remueve un parámetro de la URL
 * @param {string} nombre - Nombre del parámetro
 */
function removerParametroURL(nombre) {
    const url = new URL(window.location);
    url.searchParams.delete(nombre);
    window.history.pushState({}, '', url);
}

// ===================================
// DEBOUNCE Y THROTTLE
// ===================================

/**
 * Debounce: ejecuta una función después de que haya pasado un tiempo sin llamadas
 * @param {Function} funcion - Función a ejecutar
 * @param {number} delay - Tiempo de espera en ms
 * @returns {Function} Función con debounce
 */
function debounce(funcion, delay = 300) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => funcion.apply(this, args), delay);
    };
}

/**
 * Throttle: ejecuta una función como máximo una vez por intervalo de tiempo
 * @param {Function} funcion - Función a ejecutar
 * @param {number} limit - Tiempo límite en ms
 * @returns {Function} Función con throttle
 */
function throttle(funcion, limit = 300) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            funcion.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ===================================
// COLORES Y AVATARES
// ===================================

/**
 * Genera un color aleatorio en formato hexadecimal
 * @returns {string} Color en formato #RRGGBB
 */
function colorAleatorio() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

/**
 * Obtiene las iniciales de un nombre
 * @param {string} nombre - Nombre completo
 * @returns {string} Iniciales (máximo 2 caracteres)
 */
function obtenerIniciales(nombre) {
    if (!nombre) return 'U';
    const palabras = nombre.trim().split(' ');
    if (palabras.length === 1) {
        return palabras[0].substring(0, 2).toUpperCase();
    }
    return (palabras[0][0] + palabras[palabras.length - 1][0]).toUpperCase();
}

/**
 * Genera una URL de avatar usando UI Avatars
 * @param {string} nombre - Nombre para el avatar
 * @param {string} colorFondo - Color de fondo en hexadecimal
 * @param {number} tamano - Tamaño del avatar
 * @returns {string} URL del avatar
 */
function generarAvatarURL(nombre, colorFondo = 'FF6600', tamano = 128) {
    const iniciales = obtenerIniciales(nombre);
    return `https://ui-avatars.com/api/?name=${iniciales}&background=${colorFondo}&color=fff&size=${tamano}`;
}

// ===================================
// ARCHIVOS
// ===================================

/**
 * Descarga un archivo
 * @param {string} url - URL del archivo
 * @param {string} nombreArchivo - Nombre con el que se guardará
 */
function descargarArchivo(url, nombreArchivo) {
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo || 'archivo';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Detecta el tipo de archivo por extensión
 * @param {string} nombreArchivo - Nombre del archivo
 * @returns {string} Tipo de archivo
 */
function detectarTipoArchivo(nombreArchivo) {
    if (!nombreArchivo) return 'Archivo';
    
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

/**
 * Copia texto al portapapeles
 * @param {string} texto - Texto a copiar
 * @returns {Promise<boolean>} True si se copió exitosamente
 */
async function copiarAlPortapapeles(texto) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(texto);
            return true;
        } else {
            // Fallback para navegadores antiguos
            const textarea = document.createElement('textarea');
            textarea.value = texto;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        }
    } catch (error) {
        console.error('Error al copiar al portapapeles:', error);
        return false;
    }
}

// ===================================
// EXPORTAR FUNCIONES
// ===================================
window.formatearFecha = formatearFecha;
window.tiempoTranscurrido = tiempoTranscurrido;
window.truncarTexto = truncarTexto;
window.capitalizar = capitalizar;
window.slugificar = slugificar;
window.escaparHTML = escaparHTML;
window.formatearNumero = formatearNumero;
window.formatearTamanoArchivo = formatearTamanoArchivo;
window.esEmailValido = esEmailValido;
window.esEmailInstitucional = esEmailInstitucional;
window.validarPassword = validarPassword;
window.crearElemento = crearElemento;
window.limpiarElemento = limpiarElemento;
window.scrollHacia = scrollHacia;
window.guardarEnStorage = guardarEnStorage;
window.obtenerDeStorage = obtenerDeStorage;
window.eliminarDeStorage = eliminarDeStorage;
window.limpiarStorage = limpiarStorage;
window.obtenerParametroURL = obtenerParametroURL;
window.establecerParametroURL = establecerParametroURL;
window.removerParametroURL = removerParametroURL;
window.debounce = debounce;
window.throttle = throttle;
window.colorAleatorio = colorAleatorio;
window.obtenerIniciales = obtenerIniciales;
window.generarAvatarURL = generarAvatarURL;
window.descargarArchivo = descargarArchivo;
window.detectarTipoArchivo = detectarTipoArchivo;
window.copiarAlPortapapeles = copiarAlPortapapeles;

