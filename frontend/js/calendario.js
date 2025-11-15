/**
 * CALENDARIO.JS - Manejo del Calendario Académico
 * ===============================================
 * Gestión de eventos del calendario usando FullCalendar
 */

// ===================================
// CONFIGURACIÓN
// ===================================
const CalendarioConfig = {
    categorias: {
        examen: { color: '#dc3545', nombre: 'Examen' },
        entrega: { color: '#ffc107', nombre: 'Entrega' },
        clase: { color: '#0d6efd', nombre: 'Clase Especial' },
        evento: { color: '#198754', nombre: 'Evento Institucional' },
        otro: { color: '#6f42c1', nombre: 'Otro' }
    }
};

// ===================================
// VARIABLES GLOBALES
// ===================================
let calendarInstance = null;
let eventos = [];

// ===================================
// INICIALIZACIÓN DEL CALENDARIO
// ===================================

/**
 * Inicializa el calendario FullCalendar
 */
async function inicializarCalendario() {
    const calendarEl = document.getElementById('calendar');
    
    if (!calendarEl) {
        console.warn('Elemento del calendario no encontrado');
        return;
    }

    // Cargar FullCalendar de forma diferida
    try {
        // Cargar CSS primero
        if (typeof cargarCSSLazy === 'function') {
            await cargarCSSLazy('https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/index.global.min.css', 'fullcalendar-css');
        }
        
        // Cargar JS después
        if (typeof cargarScriptLazy === 'function') {
            await cargarScriptLazy('https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/index.global.min.js', 'fullcalendar-js');
        }
        
        // Verificar que FullCalendar esté disponible
        if (typeof FullCalendar === 'undefined') {
            throw new Error('FullCalendar no se pudo cargar');
        }
    } catch (error) {
        console.error('Error al cargar FullCalendar:', error);
        if (calendarEl) {
            calendarEl.innerHTML = `
                <div class="alert alert-danger">
                    <h5>Error al cargar el calendario</h5>
                    <p>No se pudo cargar la librería FullCalendar. Por favor, recarga la página.</p>
                    <button class="btn btn-primary" onclick="location.reload()">Recargar</button>
                </div>
            `;
        }
        return;
    }

    calendarInstance = new FullCalendar.Calendar(calendarEl, {
        locale: 'es',
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek'
        },
        buttonText: {
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            list: 'Lista'
        },
        height: 'auto',
        editable: true,
        selectable: true,
        selectMirror: true,
        dayMaxEvents: true,
        weekends: true,
        events: eventos,
        eventClick: manejarClickEvento,
        select: manejarSeleccionFecha,
        eventDrop: manejarArrastrarEvento,
        eventResize: manejarRedimensionarEvento,
        eventsSet: actualizarVistaEventos
    });

    calendarInstance.render();
    cargarEventos();
}

/**
 * Carga eventos desde el backend
 */
async function cargarEventos(params = {}) {
    try {
        mostrarLoading();
        
        const response = await API.getEventos(params);
        
        if (response.success && response.data) {
            eventos = response.data.map(procesarEvento);
            
            if (calendarInstance) {
                calendarInstance.removeAllEvents();
                eventos.forEach(evento => {
                    calendarInstance.addEvent(evento);
                });
            }
            
            actualizarProximosEventos(eventos);
        } else {
            eventos = [];
        }
        
    } catch (error) {
        console.error('Error al cargar eventos:', error);
        mostrarNotificacion('error', error.message || 'No se pudieron cargar los eventos');
        eventos = [];
    } finally {
        ocultarLoading();
    }
}

/**
 * Procesa un evento de la API para el formato de FullCalendar
 */
function procesarEvento(evento) {
    const categoria = evento.categoria || evento.tipo || 'otro';
    const categoriaConfig = CalendarioConfig.categorias[categoria] || CalendarioConfig.categorias.otro;

    const creadorNombre = (() => {
        if (!evento.creador) return null;
        if (evento.creador.nombre_completo) return evento.creador.nombre_completo;
        const nombre = evento.creador.nombre || '';
        const apellidos = evento.creador.apellidos || '';
        return `${nombre} ${apellidos}`.trim() || null;
    })();

    return {
        id: evento.id,
        title: evento.titulo,
        start: evento.fecha_inicio,
        end: evento.fecha_fin || evento.fecha_inicio,
        backgroundColor: evento.color || categoriaConfig.color,
        borderColor: evento.color || categoriaConfig.color,
        categoria,
        extendedProps: {
            descripcion: evento.descripcion || '',
            categoria,
            categoriaNombre: categoriaConfig.nombre,
            materia: evento.materia?.nombre || null,
            materia_id: evento.materia_id || null,
            carrera: evento.carrera?.nombre || evento.materia?.carrera?.nombre || null,
            carrera_id: evento.carrera_id || evento.materia?.carrera?.id || null,
            creador: creadorNombre,
            todoElDia: Boolean(evento.todo_el_dia)
        }
    };
}

// ===================================
// MANEJO DE EVENTOS
// ===================================

/**
 * Maneja el click en un evento del calendario
 */
function manejarClickEvento(info) {
    const evento = info.event;
    const eventData = evento.extendedProps;
    
    // Llenar modal con datos del evento
    document.getElementById('eventoTitulo').textContent = evento.title;
    
    // Mostrar detalles en el modal
    const modal = new bootstrap.Modal(document.getElementById('verEventoModal'));
    modal.show();
    
    // Actualizar contenido del modal con datos reales
    actualizarModalEvento(evento);
}

/**
 * Maneja la selección de una fecha para crear nuevo evento
 */
function manejarSeleccionFecha(selectInfo) {
    // Abrir modal para crear nuevo evento
    const modal = new bootstrap.Modal(document.getElementById('nuevoEventoModal'));
    
    // Pre-llenar fecha
    const fechaInput = document.querySelector('#nuevoEventoModal input[type="date"]');
    if (fechaInput) {
        const fecha = selectInfo.startStr.split('T')[0];
        fechaInput.value = fecha;
    }
    
    modal.show();
    
    // Limpiar selección
    calendarInstance.unselect();
}

/**
 * Maneja el arrastre de un evento
 */
async function manejarArrastrarEvento(info) {
    try {
        const evento = info.event;
        
        const eventoData = {
            fecha_inicio: evento.startStr,
            fecha_fin: evento.endStr || evento.startStr
        };
        
        const response = await API.updateEvento(evento.id, eventoData);
        
        if (response.success) {
            mostrarNotificacion('success', 'Evento actualizado');
        } else {
            throw new Error(response.message || 'Error al actualizar el evento');
        }
    } catch (error) {
        console.error('Error al actualizar evento:', error);
        mostrarNotificacion('error', error.message || 'No se pudo actualizar el evento');
        info.revert();
    }
}

/**
 * Maneja el redimensionamiento de un evento
 */
async function manejarRedimensionarEvento(info) {
    try {
        const evento = info.event;
        
        const eventoData = {
            fecha_inicio: evento.startStr,
            fecha_fin: evento.endStr || evento.startStr
        };
        
        const response = await API.updateEvento(evento.id, eventoData);
        
        if (response.success) {
            mostrarNotificacion('success', 'Evento actualizado');
        } else {
            throw new Error(response.message || 'Error al actualizar el evento');
        }
    } catch (error) {
        console.error('Error al actualizar evento:', error);
        mostrarNotificacion('error', error.message || 'No se pudo actualizar el evento');
        info.revert();
    }
}

/**
 * Actualiza la vista cuando cambian los eventos
 */
function actualizarVistaEventos(events) {
    // Actualizar contador de eventos
    const contador = document.getElementById('eventosCount');
    if (contador) {
        contador.textContent = events.length;
    }
    
    // Actualizar lista de próximos eventos
    actualizarProximosEventos(events);
}

// ===================================
// CRUD DE EVENTOS
// ===================================

/**
 * Crea un nuevo evento
 */
async function crearEvento(datosEvento) {
    try {
        mostrarLoading();
        
        // Validar datos
        if (!validarEvento(datosEvento)) {
            return false;
        }
        
        // Preparar datos para la API
        const fechaInicio = datosEvento.fechaInicio;
        const horaInicio = datosEvento.horaInicio || '00:00:00';
        const fechaFin = datosEvento.fechaFin || datosEvento.fechaInicio;
        const horaFin = datosEvento.horaFin || '23:59:59';
        
        const eventoData = {
            titulo: datosEvento.titulo.trim(),
            descripcion: datosEvento.descripcion || null,
            fecha_inicio: `${fechaInicio} ${horaInicio}`,
            fecha_fin: `${fechaFin} ${horaFin}`,
            categoria: datosEvento.categoria,
            materia_id: datosEvento.materia_id || null,
            color: CalendarioConfig.categorias[datosEvento.categoria]?.color || '#0d6efd'
        };
        
        // Eliminar campos null
        Object.keys(eventoData).forEach(key => eventoData[key] === null && delete eventoData[key]);
        
        const response = await API.createEvento(eventoData);
        
        if (response.success && response.data) {
            const nuevoEvento = procesarEvento(response.data);
            
            if (calendarInstance) {
                calendarInstance.addEvent(nuevoEvento);
            }
            
            // Recargar eventos para actualizar lista
            await cargarEventos();
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('nuevoEventoModal'));
            if (modal) {
                modal.hide();
            }
            
            // Limpiar formulario
            const form = document.querySelector('#nuevoEventoModal form');
            if (form) {
                form.reset();
            }
            
            mostrarNotificacion('success', response.message || 'Evento creado exitosamente');
            return true;
        } else {
            throw new Error(response.message || 'Error al crear el evento');
        }
        
    } catch (error) {
        console.error('Error al crear evento:', error);
        mostrarNotificacion('error', error.message || 'No se pudo crear el evento');
        return false;
    } finally {
        ocultarLoading();
    }
}

/**
 * Actualiza un evento existente
 */
async function actualizarEvento(eventoId, datosEvento) {
    try {
        mostrarLoading();
        
        const fechaInicio = datosEvento.fechaInicio;
        const horaInicio = datosEvento.horaInicio || '00:00:00';
        const fechaFin = datosEvento.fechaFin || datosEvento.fechaInicio;
        const horaFin = datosEvento.horaFin || '23:59:59';
        
        const eventoData = {
            titulo: datosEvento.titulo.trim(),
            descripcion: datosEvento.descripcion || null,
            fecha_inicio: `${fechaInicio} ${horaInicio}`,
            fecha_fin: `${fechaFin} ${horaFin}`,
            categoria: datosEvento.categoria,
            materia_id: datosEvento.materia_id || null,
            color: CalendarioConfig.categorias[datosEvento.categoria]?.color || '#0d6efd'
        };
        
        // Eliminar campos null
        Object.keys(eventoData).forEach(key => eventoData[key] === null && delete eventoData[key]);
        
        const response = await API.updateEvento(eventoId, eventoData);
        
        if (response.success && response.data) {
            // Recargar eventos para actualizar calendario
            await cargarEventos();
            
            mostrarNotificacion('success', response.message || 'Evento actualizado');
            return true;
        } else {
            throw new Error(response.message || 'Error al actualizar el evento');
        }
        
    } catch (error) {
        console.error('Error al actualizar evento:', error);
        mostrarNotificacion('error', error.message || 'No se pudo actualizar el evento');
        return false;
    } finally {
        ocultarLoading();
    }
}

/**
 * Elimina un evento
 */
async function eliminarEvento(eventoId) {
    try {
        const confirmado = await (window.mostrarConfirmacionToasty
            ? window.mostrarConfirmacionToasty({
                mensaje: '¿Estás seguro de que deseas eliminar este evento?',
                tipo: 'warning',
                textoConfirmar: 'Eliminar',
                textoCancelar: 'Cancelar'
            })
            : Promise.resolve(confirm('¿Estás seguro de que deseas eliminar este evento?')));

        if (!confirmado) {
            return false;
        }
        
        mostrarLoading();
        
        const response = await API.deleteEvento(eventoId);
        
        if (response.success) {
            // Eliminar del calendario
            const evento = calendarInstance.getEventById(eventoId);
            if (evento) {
                evento.remove();
            }
            
            // Recargar eventos para actualizar lista
            await cargarEventos();
            
            mostrarNotificacion('success', response.message || 'Evento eliminado');
            return true;
        } else {
            throw new Error(response.message || 'Error al eliminar el evento');
        }
        
    } catch (error) {
        console.error('Error al eliminar evento:', error);
        mostrarNotificacion('error', error.message || 'No se pudo eliminar el evento');
        return false;
    } finally {
        ocultarLoading();
    }
}

// ===================================
// VALIDACIÓN
// ===================================

/**
 * Valida los datos de un evento
 */
function validarEvento(datosEvento) {
    if (!datosEvento.titulo || datosEvento.titulo.trim().length === 0) {
        mostrarNotificacion('error', 'El título del evento es requerido');
        return false;
    }
    
    if (!datosEvento.categoria) {
        mostrarNotificacion('error', 'La categoría es requerida');
        return false;
    }
    
    if (!datosEvento.fechaInicio) {
        mostrarNotificacion('error', 'La fecha de inicio es requerida');
        return false;
    }
    
    return true;
}

// ===================================
// UTILIDADES
// ===================================

/**
 * Actualiza el modal con los datos del evento
 */
function actualizarModalEvento(evento) {
    const props = evento.extendedProps || {};
    const categoriaConfig = CalendarioConfig.categorias[props.categoria] || CalendarioConfig.categorias.otro;

    const badge = document.getElementById('eventoCategoriaBadge');
    if (badge) {
        badge.textContent = props.categoriaNombre || categoriaConfig.nombre;
        badge.style.backgroundColor = evento.backgroundColor || categoriaConfig.color;
        badge.className = 'badge mb-2 text-uppercase fw-semibold';
    }

    const fechaInicio = evento.start ? new Date(evento.start) : null;
    const fechaFin = evento.end ? new Date(evento.end) : null;

    const fechaLabel = document.getElementById('eventoFecha');
    if (fechaLabel) {
        fechaLabel.textContent = fechaInicio ? formatearFechaLarga(fechaInicio) : 'Fecha no disponible';
    }

    const horarioLabel = document.getElementById('eventoHorario');
    if (horarioLabel) {
        horarioLabel.textContent = formatearRangoHorario(fechaInicio, fechaFin, props.todoElDia);
    }

    const materiaWrapper = document.getElementById('eventoMateriaWrapper');
    const materiaLabel = document.getElementById('eventoMateria');
    if (materiaWrapper && materiaLabel) {
        if (props.materia) {
            materiaWrapper.style.display = '';
            materiaLabel.textContent = props.materia;
        } else {
            materiaWrapper.style.display = 'none';
        }
    }

    const carreraWrapper = document.getElementById('eventoCarreraWrapper');
    const carreraLabel = document.getElementById('eventoCarrera');
    if (carreraWrapper && carreraLabel) {
        if (props.carrera) {
            carreraWrapper.style.display = '';
            carreraLabel.textContent = props.carrera;
        } else {
            carreraWrapper.style.display = 'none';
        }
    }

    const creadorWrapper = document.getElementById('eventoCreadorWrapper');
    const creadorLabel = document.getElementById('eventoCreador');
    if (creadorWrapper && creadorLabel) {
        if (props.creador) {
            creadorWrapper.style.display = '';
            creadorLabel.textContent = props.creador;
        } else {
            creadorWrapper.style.display = 'none';
        }
    }

    const descripcionWrapper = document.getElementById('eventoDescripcionWrapper');
    const descripcionLabel = document.getElementById('eventoDescripcion');
    if (descripcionWrapper && descripcionLabel) {
        if (props.descripcion) {
            descripcionWrapper.style.display = '';
            descripcionLabel.textContent = props.descripcion;
        } else {
            descripcionWrapper.style.display = 'none';
            descripcionLabel.textContent = '';
        }
    }

    const googleButton = document.getElementById('btnGoogleCalendar');
    if (googleButton) {
        const enlaceGoogle = generarEnlaceGoogleCalendar(evento, props);
        if (enlaceGoogle) {
            googleButton.href = enlaceGoogle;
            googleButton.classList.remove('d-none');
        } else {
            googleButton.classList.add('d-none');
        }
    }
}

/**
 * Actualiza la lista de próximos eventos en el sidebar
 */
function actualizarProximosEventos(events) {
    const sidebar = document.getElementById('proximosEventosList');
    if (!sidebar) return;
    
    if (!events || events.length === 0) {
        sidebar.innerHTML = `
            <div class="text-center py-3 text-muted small">
                No hay eventos próximos
            </div>
        `;
        return;
    }
    
    // Ordenar eventos por fecha (eventos futuros)
    const ahora = new Date();
    const eventosOrdenados = events
        .map(evento => {
            const fecha = evento.start instanceof Date ? evento.start : new Date(evento.start);
            return { evento, fecha };
        })
        .filter(item => {
            return item.fecha instanceof Date && !Number.isNaN(item.fecha.getTime()) && item.fecha >= ahora;
        })
        .sort((a, b) => a.fecha - b.fecha)
        .slice(0, 5); // Solo los próximos 5
    
    if (eventosOrdenados.length === 0) {
        sidebar.innerHTML = `
            <div class="text-center py-3 text-muted small">
                No hay eventos próximos
            </div>
        `;
        return;
    }
    
    // Limpiar sidebar
    sidebar.innerHTML = '';
    
    // Agregar eventos
    eventosOrdenados.forEach(({ evento, fecha }) => {
        const dia = fecha.getDate();
        const mes = fecha.toLocaleDateString('es-MX', { month: 'short' }).toUpperCase();
        
        // Determinar color según categoría
        const categoria = evento.categoria || evento.extendedProps?.categoria || 'evento';
        let colorClass = 'bg-primary';
        if (categoria === 'examen') colorClass = 'bg-danger';
        else if (categoria === 'entrega') colorClass = 'bg-warning';
        else if (categoria === 'evento') colorClass = 'bg-success';
        else if (categoria === 'clase') colorClass = 'bg-info';
        
        const item = document.createElement('div');
        item.className = 'list-group-item';
        item.style.cursor = 'pointer';
        item.onclick = () => {
            const modal = new bootstrap.Modal(document.getElementById('verEventoModal'));
            document.getElementById('eventoTitulo').textContent = evento.title;
            // Llenar más detalles del modal si es necesario
            modal.show();
        };
        
        const esTodoElDia = Boolean(evento.allDay || evento.extendedProps?.todoElDia || evento.extendedProps?.todo_el_dia);
        const horaTexto = esTodoElDia
            ? 'Todo el día'
            : fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        
        item.innerHTML = `
            <div class="d-flex align-items-start">
                <div class="${colorClass} text-white rounded p-2 me-3" 
                     style="min-width: 50px; text-align: center;">
                    <strong class="d-block">${dia}</strong>
                    <small>${mes}</small>
                </div>
                <div class="flex-grow-1">
                    <h6 class="mb-1">${evento.title}</h6>
                    <small class="text-muted">
                        <i class="fas fa-clock me-1"></i> ${horaTexto}
                    </small>
                </div>
            </div>
        `;
        
        sidebar.appendChild(item);
    });
}

function generarEnlaceGoogleCalendar(evento, props = {}) {
    if (!(evento?.start instanceof Date)) {
        return null;
    }

    const allDay = Boolean(props.todoElDia);
    const inicio = evento.start;
    const fin = calcularFechaFinEvento(evento, allDay);

    const inicioFormato = formatearFechaGoogle(inicio, allDay);
    const finFormato = formatearFechaGoogle(fin, allDay);

    if (!inicioFormato || !finFormato) {
        return null;
    }

    const titulo = encodeURIComponent(evento.title || 'Evento académico');
    const descripcion = encodeURIComponent(props.descripcion || '');
    const ubicacion = encodeURIComponent(props.materia || props.carrera || props.categoriaNombre || '');

    let url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${titulo}&dates=${inicioFormato}/${finFormato}&details=${descripcion}`;
    if (ubicacion) {
        url += `&location=${ubicacion}`;
    }

    return url;
}

function calcularFechaFinEvento(evento, allDay) {
    if (evento?.end instanceof Date) {
        return evento.end;
    }

    const base = new Date(evento.start.getTime());

    if (allDay) {
        base.setDate(base.getDate() + 1);
    } else {
        base.setHours(base.getHours() + 1);
    }

    return base;
}

function formatearFechaGoogle(fecha, allDay) {
    if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) {
        return '';
    }

    if (allDay) {
        const year = fecha.getUTCFullYear();
        const month = String(fecha.getUTCMonth() + 1).padStart(2, '0');
        const day = String(fecha.getUTCDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    return fecha.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function formatearFechaLarga(fecha) {
    try {
        return fecha.toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch {
        return fecha?.toISOString()?.split('T')[0] || 'Fecha no disponible';
    }
}

function formatearHora(fecha) {
    if (!fecha) return '';
    return fecha.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatearRangoHorario(fechaInicio, fechaFin, todoElDia = false) {
    if (todoElDia) return 'Todo el día';
    const horaInicio = formatearHora(fechaInicio);
    const horaFin = formatearHora(fechaFin);

    if (horaInicio && horaFin && horaInicio !== horaFin) {
        return `${horaInicio} - ${horaFin}`;
    }

    return horaInicio || 'Horario no definido';
}

/**
 * Filtra eventos por categoría
 */
function filtrarEventosPorCategoria(categoria) {
    if (!calendarInstance) return;
    
    if (categoria === 'todas') {
        calendarInstance.removeAllEvents();
        calendarInstance.addEventSource(eventos);
    } else {
        const eventosFiltrados = eventos.filter(e => {
            return e.categoria === categoria || e.extendedProps?.categoria === categoria;
        });
        calendarInstance.removeAllEvents();
        calendarInstance.addEventSource(eventosFiltrados);
    }
}

/**
 * Exporta eventos a Google Calendar
 */
function exportarAGoogleCalendar() {
    // Generar archivo ICS
    const eventosICS = eventos.map(evento => {
        const start = new Date(evento.start);
        const end = evento.end ? new Date(evento.end) : new Date(start.getTime() + 3600000); // +1 hora por defecto
        
        return `BEGIN:VEVENT
DTSTART:${start.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${end.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${evento.title}
DESCRIPTION:${evento.extendedProps.descripcion || ''}
END:VEVENT`;
    }).join('\n');
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Foro Académico UPA//Calendario//ES
${eventosICS}
END:VCALENDAR`;
    
    // Descargar archivo
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    descargarArchivo(url, 'calendario-academico.ics');
    
    mostrarNotificacion('success', 'Calendario exportado');
}

// ===================================
// INICIALIZACIÓN AUTOMÁTICA
// ===================================

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarCalendario);
} else {
    inicializarCalendario();
}

// ===================================
// EXPORTAR FUNCIONES
// ===================================
window.inicializarCalendario = inicializarCalendario;
window.crearEvento = crearEvento;
window.actualizarEvento = actualizarEvento;
window.eliminarEvento = eliminarEvento;
window.filtrarEventosPorCategoria = filtrarEventosPorCategoria;
window.exportarAGoogleCalendar = exportarAGoogleCalendar;

