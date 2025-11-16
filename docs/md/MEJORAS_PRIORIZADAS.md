# 🚀 Mejoras Priorizadas - Foro Académico UPA

## 📊 Resumen Ejecutivo

Este documento presenta mejoras adicionales organizadas por **prioridad** y **categoría**, basadas en el análisis del código actual.

**Total de Mejoras Sugeridas**: 60+
**Tiempo Estimado de Implementación**: 2-4 semanas (dependiendo de prioridad)
**Impacto Esperado**: Alto en UX, Performance y Funcionalidad

---

## 🔥 ALTA PRIORIDAD (Implementar en 1-2 semanas)

### 1. **Skeleton Loading States** ⚡ **UX**
**Problema**: Las vistas muestran contenido vacío mientras cargan, causando layout shifts.

**Solución**:
```css
/* Agregar a styles.css */
.skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s ease-in-out infinite;
    border-radius: 4px;
    min-height: 1em;
}

@keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

.skeleton-text { height: 1em; margin: 0.5em 0; }
.skeleton-avatar { width: 40px; height: 40px; border-radius: 50%; }
.skeleton-card { min-height: 200px; }
```

**Archivos a modificar**:
- `frontend/css/styles.css`
- `frontend/views/post.html`, `materia.html`, `foro.html`, `dashboard.html`
- Todos los archivos JS (mostrar/ocultar skeleton)

**Impacto**: Mejora significativamente la percepción de velocidad y reduce CLS.

---

### 2. **Manejo de Errores Centralizado** ⚠️ **STABILITY**
**Problema**: Errores no siempre se muestran claramente al usuario.

**Solución**:
```javascript
// Agregar a api.js
const ERROR_HANDLERS = {
    401: () => {
        localStorage.removeItem('upa_token');
        mostrarNotificacion('warning', 'Sesión expirada. Por favor, inicia sesión nuevamente.');
        setTimeout(() => window.location.href = '/index', 2000);
    },
    403: () => mostrarNotificacion('warning', 'No tienes permiso para realizar esta acción'),
    404: () => mostrarNotificacion('info', 'Recurso no encontrado'),
    429: (error) => {
        const retryAfter = error.headers?.get('Retry-After') || 60;
        mostrarNotificacion('warning', `Demasiadas solicitudes. Intenta en ${retryAfter}s`);
    },
    500: () => {
        mostrarNotificacion('error', 'Error del servidor. Nuestro equipo ha sido notificado.');
        // Enviar a servicio de monitoreo
        logErrorToService(error);
    },
    network: () => {
        mostrarNotificacion('warning', 'Error de conexión. Verifica tu internet.');
        // Mostrar opción de reintentar
        mostrarRetryButton();
    }
};

// Retry automático con backoff exponencial
async function fetchWithRetry(url, options, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return response;
            throw new Error(`HTTP ${response.status}`);
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
}
```

**Archivos a modificar**:
- `frontend/js/api.js`

**Impacto**: Mejor experiencia de usuario, debugging más fácil.

---

### 3. **Infinite Scroll con Intersection Observer** ⚡ **UX**
**Problema**: Los botones "Cargar más" requieren click adicional.

**Solución**:
```javascript
// Agregar a posts.js, foro.js, materia.js
function setupInfiniteScroll(loadMoreFunction, containerId = 'feedContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const sentinel = document.createElement('div');
    sentinel.id = 'scroll-sentinel';
    sentinel.style.height = '1px';
    sentinel.style.marginTop = '20px';
    container.appendChild(sentinel);
    
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !state.cargando && state.hasMore) {
            loadMoreFunction();
        }
    }, { 
        rootMargin: '200px', // Cargar 200px antes de llegar al final
        threshold: 0.1
    });
    
    observer.observe(sentinel);
}
```

**Archivos a modificar**:
- `frontend/js/posts.js`
- `frontend/js/foro.js`
- `frontend/js/materia.js`

**Impacto**: Mejor UX, menos clicks necesarios.

---

### 4. **Búsqueda Avanzada con Filtros** 🔍 **FEATURE**
**Problema**: La búsqueda solo busca texto simple sin filtros.

**Solución**:
```html
<!-- Agregar a search.html -->
<div class="card mb-3">
    <div class="card-body">
        <h5 class="card-title"><i class="fas fa-filter me-2"></i> Filtros</h5>
        <div class="row g-3">
            <div class="col-md-3">
                <label class="form-label">Tipo</label>
                <select class="form-select" id="filtroTipo">
                    <option value="">Todos</option>
                    <option value="publicacion">Publicaciones</option>
                    <option value="comentario">Comentarios</option>
                    <option value="usuario">Usuarios</option>
                    <option value="materia">Materias</option>
                </select>
            </div>
            <div class="col-md-3">
                <label class="form-label">Categoría</label>
                <select class="form-select" id="filtroCategoria">
                    <option value="">Todas</option>
                    <option value="duda">Dudas</option>
                    <option value="recurso">Recursos</option>
                    <option value="aviso">Avisos</option>
                    <option value="discusion">Discusión</option>
                </select>
            </div>
            <div class="col-md-3">
                <label class="form-label">Materia</label>
                <select class="form-select" id="filtroMateria">
                    <option value="">Todas</option>
                </select>
            </div>
            <div class="col-md-3">
                <label class="form-label">Fecha</label>
                <select class="form-select" id="filtroFecha">
                    <option value="">Cualquiera</option>
                    <option value="today">Hoy</option>
                    <option value="week">Esta semana</option>
                    <option value="month">Este mes</option>
                    <option value="year">Este año</option>
                </select>
            </div>
        </div>
        <div class="mt-3">
            <button class="btn btn-primary" onclick="aplicarFiltros()">
                <i class="fas fa-search me-2"></i> Aplicar Filtros
            </button>
            <button class="btn btn-outline-secondary" onclick="limpiarFiltros()">
                <i class="fas fa-times me-2"></i> Limpiar
            </button>
        </div>
    </div>
</div>
```

**Archivos a modificar**:
- `frontend/views/search.html`
- `frontend/js/search.js`
- `backend/app/Http/Controllers/NavegacionController.php` (agregar filtros a búsqueda)

**Impacto**: Búsqueda más útil y precisa.

---

### 5. **Optimistic Updates Completos** ⚡ **UX**
**Problema**: Acciones esperan respuesta del servidor antes de actualizar UI.

**Solución**: Implementar optimistic updates en todas las acciones.

```javascript
// Ejemplo para likes (mejorar implementación actual)
async function toggleLike(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const wasLiked = post.likeado;
    const previousLikes = post.num_likes;
    
    // Optimistic update
    post.likeado = !wasLiked;
    post.num_likes += wasLiked ? -1 : 1;
    renderPost(post);
    
    try {
        await API.likePost(postId);
    } catch (error) {
        // Revertir en caso de error
        post.likeado = wasLiked;
        post.num_likes = previousLikes;
        renderPost(post);
        mostrarNotificacion('error', 'No se pudo actualizar el like. Intenta de nuevo.');
    }
}
```

**Archivos a modificar**:
- `frontend/js/posts.js` (likes, guardar, eliminar)
- `frontend/js/comments.js` (likes, eliminar, editar)
- `frontend/js/notifications.js` (ya implementado, verificar)

**Impacto**: UI más responsive y rápida.

---

### 6. **Búsqueda con Highlight de Resultados** ✨ **UX**
**Problema**: No se resalta el texto encontrado en resultados.

**Solución**:
```javascript
// Agregar a search.js
function highlightText(texto, termino) {
    if (!termino || !texto) return texto;
    
    const regex = new RegExp(`(${termino})`, 'gi');
    return texto.replace(regex, '<mark class="bg-warning">$1</mark>');
}

function renderizarResultado(resultado, termino) {
    const tituloDestacado = highlightText(resultado.titulo || resultado.nombre, termino);
    const contenidoDestacado = highlightText(resultado.contenido?.substring(0, 200), termino);
    
    return `
        <div class="resultado-item">
            <h6>${tituloDestacado}</h6>
            <p>${contenidoDestacado}...</p>
        </div>
    `;
}
```

**Archivos a modificar**:
- `frontend/js/search.js`

**Impacto**: Resultados más fáciles de encontrar.

---

### 7. **Compartir Posts en Redes Sociales** 📤 **SOCIAL**
**Problema**: No hay forma fácil de compartir posts.

**Solución**:
```javascript
// Agregar a posts.js
async function compartirPost(post) {
    const url = `${window.location.origin}/post?id=${post.id}`;
    const texto = post.contenido.substring(0, 200);
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: post.titulo,
                text: texto,
                url: url
            });
            mostrarNotificacion('success', 'Post compartido exitosamente');
        } catch (error) {
            if (error.name !== 'AbortError') {
                copiarURLAlPortapapeles(url);
            }
        }
    } else {
        // Fallback: copiar URL al portapapeles
        copiarURLAlPortapapeles(url);
    }
}

function copiarURLAlPortapapeles(url) {
    navigator.clipboard.writeText(url).then(() => {
        mostrarNotificacion('success', 'URL copiada al portapapeles');
    });
}
```

**Archivos a modificar**:
- `frontend/js/posts.js`
- `frontend/views/post.html` (agregar botón de compartir)

**Impacto**: Mayor engagement y alcance.

---

## ⚡ MEDIA PRIORIDAD (Implementar después)

### 8. **Gráficas Interactivas en Dashboard** 📊 **ANALYTICS**
**Problema**: Estadísticas solo muestran números sin visualización.

**Solución**: Usar Chart.js para gráficas.

```javascript
// Agregar a dashboard-page.js
import Chart from 'chart.js/auto';

async function renderizarGraficas(stats) {
    // Gráfica de actividad semanal
    const ctxSemanal = document.getElementById('actividadSemanalChart');
    if (ctxSemanal) {
        new Chart(ctxSemanal, {
            type: 'line',
            data: {
                labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                datasets: [{
                    label: 'Publicaciones',
                    data: stats.publicaciones_semana,
                    borderColor: '#003366',
                    backgroundColor: 'rgba(0, 51, 102, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Comentarios',
                    data: stats.comentarios_semana,
                    borderColor: '#FF6600',
                    backgroundColor: 'rgba(255, 102, 0, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
    
    // Gráfica de categorías (pie chart)
    const ctxCategorias = document.getElementById('categoriasChart');
    if (ctxCategorias) {
        new Chart(ctxCategorias, {
            type: 'doughnut',
            data: {
                labels: ['Dudas', 'Recursos', 'Avisos', 'Discusión'],
                datasets: [{
                    data: [
                        stats.categoria_duda,
                        stats.categoria_recurso,
                        stats.categoria_aviso,
                        stats.categoria_discusion
                    ],
                    backgroundColor: [
                        '#0d6efd',
                        '#198754',
                        '#ffc107',
                        '#0dcaf0'
                    ]
                }]
            }
        });
    }
}
```

**Archivos a crear/modificar**:
- Agregar Chart.js CDN a `dashboard.html`
- `frontend/js/dashboard-page.js`
- `backend/app/Http/Controllers/NavegacionController.php` (agregar estadísticas semanales)

**Impacto**: Dashboard más informativo y visual.

---

### 9. **Editor de Markdown en Comentarios** ✍️ **FEATURE**
**Problema**: Los comentarios solo permiten texto plano.

**Solución**: Integrar editor Markdown simple.

```javascript
// Usar marked.js (ligero) o SimpleMDE
import { marked } from 'marked';

// Configurar marked
marked.setOptions({
    breaks: true,
    gfm: true
});

function renderizarMarkdown(texto) {
    return marked.parse(texto);
}

// Preview de Markdown en textarea de comentarios
const comentarioTextarea = document.getElementById('comentarioContenido');
const previewDiv = document.getElementById('comentarioPreview');

if (comentarioTextarea && previewDiv) {
    comentarioTextarea.addEventListener('input', (e) => {
        const markdown = e.target.value;
        previewDiv.innerHTML = renderizarMarkdown(markdown);
    });
    
    // Toggle entre editor y preview
    document.getElementById('togglePreview').addEventListener('click', () => {
        comentarioTextarea.classList.toggle('d-none');
        previewDiv.classList.toggle('d-none');
    });
}
```

**Archivos a modificar**:
- `frontend/views/post.html` (agregar preview de Markdown)
- `frontend/js/comments.js`

**Impacto**: Comentarios más ricos y formateados.

---

### 10. **Navegación entre Posts Relacionados** 🔗 **UX**
**Problema**: No hay forma fácil de navegar entre posts similares.

**Solución**: Sidebar con posts relacionados y "anterior/siguiente".

```javascript
// Agregar a post.js
async function cargarPostsRelacionados(postId) {
    try {
        const response = await API.getRelatedPosts(postId);
        if (response.success && response.data) {
            renderizarRelacionados(response.data);
        }
    } catch (error) {
        console.error('Error al cargar posts relacionados:', error);
    }
}

function renderizarRelacionados(posts) {
    const container = document.getElementById('postsRelacionados');
    if (!container || !posts.length) return;
    
    container.innerHTML = `
        <h5 class="mb-3"><i class="fas fa-link me-2"></i> Posts Relacionados</h5>
        ${posts.map(post => `
            <div class="card mb-2">
                <div class="card-body p-3">
                    <a href="/post?id=${post.id}" class="text-decoration-none">
                        <h6 class="mb-1">${post.titulo}</h6>
                        <small class="text-muted">${post.materia?.nombre || ''}</small>
                    </a>
                </div>
            </div>
        `).join('')}
    `;
}
```

**Archivos a modificar**:
- `frontend/views/post.html` (agregar sidebar de relacionados)
- `frontend/js/posts.js`
- `backend/app/Http/Controllers/PublicacionController.php` (método `relacionadas` ya existe, mejorar)

**Impacto**: Mejor navegación y descubrimiento de contenido.

---

### 11. **Sistema de Etiquetas con Autocompletado** 🏷️ **FEATURE**
**Problema**: Las etiquetas son simples strings sin sugerencias.

**Solución**: Usar Tagify.js para autocompletado.

```html
<!-- Reemplazar input de etiquetas -->
<input type="text" id="etiquetas" name="etiquetas" placeholder="Ej: JavaScript, Laravel, PHP">

<script src="https://cdn.jsdelivr.net/npm/@yaireo/tagify@4.17.9/dist/tagify.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@yaireo/tagify@4.17.9/dist/tagify.css">
```

```javascript
// Inicializar Tagify con sugerencias
const tagInput = document.getElementById('etiquetas');
const tagify = new Tagify(tagInput, {
    whitelist: [], // Se carga dinámicamente desde API
    maxTags: 10,
    dropdown: {
        maxItems: 20,
        classname: 'tags-look',
        enabled: 0,
        closeOnSelect: false
    }
});

// Cargar etiquetas populares
async function cargarEtiquetasPopulares() {
    const response = await API.getEtiquetasPopulares();
    if (response.success && response.data) {
        tagify.settings.whitelist = response.data;
    }
}
```

**Archivos a modificar**:
- `frontend/views/crear-post.html`, `views/post.html` (agregar Tagify)
- `frontend/js/posts.js`
- `backend/app/Http/Controllers/PublicacionController.php` (endpoint de etiquetas populares)

**Impacto**: Mejor organización y búsqueda por etiquetas.

---

### 12. **Exportar Eventos a Google Calendar/iCal** 📅 **FEATURE**
**Problema**: No se pueden exportar eventos del calendario.

**Solución**: Generar archivos `.ics` para importar.

```javascript
// Agregar a calendario.js
function exportarEvento(evento) {
    const ics = generarICS(evento);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${evento.titulo.replace(/[^a-z0-9]/gi, '_')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
}

function generarICS(evento) {
    const fechaInicio = formatDateICS(evento.start);
    const fechaFin = formatDateICS(evento.end);
    
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Foro UPA//Evento//ES
BEGIN:VEVENT
UID:${evento.id}@foro.upa.edu.mx
DTSTAMP:${formatDateICS(new Date())}
DTSTART:${fechaInicio}
DTEND:${fechaFin}
SUMMARY:${evento.titulo}
DESCRIPTION:${evento.descripcion || ''}
LOCATION:${evento.materia?.nombre || ''}
END:VEVENT
END:VCALENDAR`;
}

function formatDateICS(fecha) {
    const d = new Date(fecha);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}
```

**Archivos a modificar**:
- `frontend/js/calendario.js`
- `frontend/views/calendario.html` (agregar botón de exportar)

**Impacto**: Integración con calendarios externos.

---

### 13. **Gráfica de Actividad en Perfil** 📊 **ANALYTICS**
**Problema**: No hay visualización de actividad del usuario.

**Solución**:
```javascript
// Agregar a perfil.js
async function renderizarGraficaActividad(datos) {
    const ctx = document.getElementById('actividadChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: datos.meses,
            datasets: [{
                label: 'Publicaciones',
                data: datos.publicaciones,
                backgroundColor: '#003366'
            }, {
                label: 'Comentarios',
                data: datos.comentarios,
                backgroundColor: '#FF6600'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}
```

**Archivos a modificar**:
- `frontend/views/perfil.html` (agregar canvas para gráfica)
- `frontend/js/perfil.js`
- `backend/app/Http/Controllers/PerfilController.php` (agregar estadísticas mensuales)

**Impacto**: Usuario puede ver su actividad a lo largo del tiempo.

---

### 14. **Sistema de Insignias/Logros** 🏆 **GAMIFICATION**
**Problema**: No hay gamificación o reconocimiento.

**Solución**:
```php
// En backend, agregar tabla de logros
Schema::create('logros', function (Blueprint $table) {
    $table->id();
    $table->string('codigo')->unique();
    $table->string('nombre');
    $table->text('descripcion');
    $table->string('icono');
    $table->string('color');
    $table->timestamps();
});

Schema::create('usuario_logros', function (Blueprint $table) {
    $table->id();
    $table->foreignId('usuario_id')->constrained();
    $table->foreignId('logro_id')->constrained();
    $table->timestamp('obtenido_en');
    $table->timestamps();
});
```

```javascript
// Frontend: mostrar insignias en perfil
const logros = {
    'primer-post': { nombre: 'Primer Post', icon: 'fa-pen-fancy', color: 'primary' },
    '10-comentarios': { nombre: 'Comentarista', icon: 'fa-comments', color: 'success' },
    '50-likes': { nombre: 'Popular', icon: 'fa-heart', color: 'danger' },
    'experto': { nombre: 'Experto', icon: 'fa-star', color: 'warning' }
};
```

**Archivos a crear/modificar**:
- Migración para tablas de logros
- `backend/app/Models/Logro.php`, `UsuarioLogro.php`
- `backend/app/Http/Controllers/PerfilController.php` (agregar lógica de logros)
- `frontend/views/perfil.html` (mostrar insignias)

**Impacto**: Mayor engagement y motivación de usuarios.

---

## 💡 BAJA PRIORIDAD (Nice to have)

### 15. **PWA con Service Worker** 📱 **PROGRESSIVE**
**Problema**: No funciona offline y no puede instalarse como app.

**Solución**:
```javascript
// sw.js - Service Worker
const CACHE_NAME = 'foro-upa-v1';
const urlsToCache = [
    '/',
    '/css/styles.css',
    '/js/main.js',
    '/js/api.js',
    '/favicon.ico'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});
```

**Archivos a crear**:
- `frontend/sw.js`
- `frontend/manifest.json`

**Impacto**: Funciona offline, puede instalarse como app móvil.

---

### 16. **Búsqueda por Voz** 🎤 **INNOVATION**
**Problema**: Requiere escribir manualmente.

**Solución**: Web Speech API.

```javascript
// Agregar a search.js
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'es-ES';
recognition.continuous = false;
recognition.interimResults = false;

document.getElementById('voiceSearchBtn').addEventListener('click', () => {
    recognition.start();
    mostrarNotificacion('info', 'Escuchando...');
});

recognition.onresult = (event) => {
    const query = event.results[0][0].transcript;
    document.getElementById('searchInput').value = query;
    buscar(query);
};

recognition.onerror = (error) => {
    mostrarNotificacion('error', 'Error en reconocimiento de voz');
};
```

**Impacto**: Búsqueda más rápida y accesible.

---

### 17. **Widgets Personalizables en Dashboard** 🎨 **CUSTOMIZATION**
**Problema**: Dashboard tiene contenido fijo.

**Solución**: Drag and drop con SortableJS.

```javascript
import Sortable from 'sortablejs';

const dashboardGrid = document.getElementById('dashboardGrid');
new Sortable(dashboardGrid, {
    animation: 150,
    handle: '.widget-header',
    onEnd: () => {
        guardarOrdenWidgets();
    }
});

function guardarOrdenWidgets() {
    const orden = Array.from(dashboardGrid.children).map(widget => widget.id);
    localStorage.setItem('dashboard_widgets_order', JSON.stringify(orden));
}
```

**Impacto**: Dashboard personalizable por usuario.

---

### 18. **Sistema de Ban Automático** 🤖 **AUTOMATION**
**Problema**: Los bans son manuales.

**Solución**: Reglas automáticas.

```php
// En ModeracionController
public function checkAutoBan($usuarioId) {
    $reportes = Reporte::where('usuario_id', $usuarioId)
        ->where('estado', 'resuelto')
        ->where('created_at', '>=', now()->subDays(30))
        ->count();
    
    if ($reportes >= 5) {
        // Ban automático de 7 días
        $this->bloquearUsuario($usuarioId, 7, 'Auto-ban: Múltiples reportes en 30 días');
    }
    
    // Otros criterios automáticos
    $comentariosSpam = Comentario::where('autor_id', $usuarioId)
        ->where('created_at', '>=', now()->subHours(1))
        ->count();
    
    if ($comentariosSpam >= 10) {
        $this->bloquearUsuario($usuarioId, 24, 'Auto-ban: Comportamiento sospechoso');
    }
}
```

**Impacto**: Moderación más eficiente.

---

## 📋 MEJORAS POR VISTA ESPECÍFICA

### 🏠 **Dashboard (`dashboard.html`)**
1. ✅ Gráficas interactivas (Chart.js)
2. ✅ Widgets personalizables (drag & drop)
3. ✅ Vista de actividades recientes mejorada
4. ✅ Quick actions (crear post rápido, ver notificaciones)

### 📝 **Vista de Publicación (`post.html`)**
1. ✅ Editor de Markdown en comentarios
2. ✅ Posts relacionados en sidebar
3. ✅ Compartir en redes sociales
4. ✅ Etiquetas con autocompletado
5. ✅ Historial de ediciones (si aplica)

### 🔍 **Búsqueda (`search.html`)**
1. ✅ Búsqueda avanzada con filtros múltiples
2. ✅ Highlight de resultados
3. ✅ Búsqueda por voz
4. ✅ Búsqueda guardada/favoritos

### 📅 **Calendario (`calendario.html`)**
1. ✅ Vista de lista de eventos
2. ✅ Exportar a Google Calendar/iCal
3. ✅ Notificaciones push de eventos próximos
4. ✅ Filtros por materia/carrera

### 👤 **Perfil (`perfil.html`)**
1. ✅ Gráfica de actividad mensual
2. ✅ Insignias/Logros
3. ✅ Exportar datos personales (GDPR)
4. ✅ Vista de estadísticas detalladas

### 🛡️ **Moderación (`moderacion.html`)**
1. ✅ Dashboard de estadísticas avanzadas
2. ✅ Gráficas de tendencias
3. ✅ Sistema de ban automático
4. ✅ Log de actividad con filtros avanzados

---

## 🎨 MEJORAS DE UX/UI GENERALES

### 1. **Animaciones y Transiciones Suaves** ✨
```css
/* Agregar a styles.css */
.card, .btn, .dropdown-item {
    transition: all 0.2s ease;
}

.card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.post-item, .comment-item {
    animation: fadeInUp 0.3s ease;
}
```

### 2. **Tooltips Informativos** 💡
```javascript
// Inicializar tooltips de Bootstrap en todos los elementos
document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
    new bootstrap.Tooltip(el);
});
```

### 3. **Confirmaciones Contextuales** ⚠️
```javascript
// Confirmación mejorada para acciones destructivas
async function confirmarAccion(mensaje, accion) {
    return new Promise((resolve) => {
        const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
        document.getElementById('confirmMessage').textContent = mensaje;
        document.getElementById('confirmBtn').onclick = () => {
            accion();
            modal.hide();
            resolve(true);
        };
        modal.show();
    });
}
```

### 4. **Breadcrumbs Dinámicos** 🗺️
```javascript
// Breadcrumbs dinámicos basados en navegación
function actualizarBreadcrumbs(items) {
    const breadcrumb = document.getElementById('breadcrumb');
    breadcrumb.innerHTML = items.map((item, index) => {
        const isLast = index === items.length - 1;
        return `<li class="breadcrumb-item ${isLast ? 'active' : ''}">
            ${isLast ? item.texto : `<a href="${item.url}">${item.texto}</a>`}
        </li>`;
    }).join('');
}
```

---

## ⚡ MEJORAS DE PERFORMANCE

### 1. **Lazy Loading de Imágenes Mejorado** 🖼️
```javascript
// Intersection Observer para lazy loading
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy-image');
            imageObserver.unobserve(img);
        }
    });
}, { rootMargin: '50px' });

document.querySelectorAll('.lazy-image').forEach(img => imageObserver.observe(img));
```

### 2. **Code Splitting de JavaScript** 📦
```javascript
// Cargar módulos solo cuando se necesiten
async function cargarModuloModeracion() {
    if (!window.moduloModeracionCargado) {
        await import('./js/moderacion.js');
        window.moduloModeracionCargado = true;
    }
}
```

### 3. **Precarga de Recursos Críticos** 🚀
```html
<!-- Agregar a <head> -->
<link rel="prefetch" href="/js/api.js">
<link rel="prefetch" href="/js/auth.js">
<link rel="dns-prefetch" href="https://cdn.jsdelivr.net">
```

### 4. **Virtual Scrolling para Listas Largas** 📜
```javascript
// Usar react-window o similar para listas muy largas (1000+ items)
// Mejora rendimiento significativamente
```

---

## 🔒 MEJORAS DE SEGURIDAD

### 1. **Sanitización de HTML en Frontend** 🧹
```javascript
// Usar DOMPurify para sanitizar contenido HTML
import DOMPurify from 'dompurify';

function sanitizarHTML(html) {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'code', 'pre'],
        ALLOWED_ATTR: ['href', 'class']
    });
}
```

### 2. **Validación de Archivos en Backend** 📎
```php
// En PerfilController
$request->validate([
    'avatar' => [
        'required',
        'image',
        'mimes:jpeg,png,jpg',
        'max:2048',
        'dimensions:min_width=100,min_height=100,max_width=2000,max_height=2000'
    ]
]);

// Escanear con ClamAV (si está disponible)
$file = $request->file('avatar');
$scanner = new ClamAV();
if (!$scanner->isClean($file->path())) {
    return response()->json(['error' => 'Archivo malicioso detectado'], 422);
}
```

### 3. **Logging de Actividades Sospechosas** 📝
```php
// Middleware para logging
class SecurityLogMiddleware {
    public function handle($request, Closure $next) {
        if ($this->esActividadSospechosa($request)) {
            Log::warning('Actividad sospechosa detectada', [
                'ip' => $request->ip(),
                'url' => $request->url(),
                'user' => auth()->id(),
                'user_agent' => $request->userAgent()
            ]);
        }
        return $next($request);
    }
}
```

---

## ♿ MEJORAS DE ACCESIBILIDAD

### 1. **Navegación por Teclado Mejorada** ⌨️
```javascript
// Atajos de teclado
document.addEventListener('keydown', (e) => {
    // Ctrl+K para búsqueda rápida
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput')?.focus();
    }
    
    // Escape para cerrar modales
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.show').forEach(modal => {
            bootstrap.Modal.getInstance(modal)?.hide();
        });
    }
    
    // Tab navigation mejorado
    if (e.key === 'Tab') {
        // Enfocar elementos con tabindex
    }
});
```

### 2. **ARIA Labels Mejorados** 🏷️
```html
<!-- Agregar aria-labels a todos los elementos interactivos -->
<button aria-label="Dar like a esta publicación">
    <i class="fas fa-heart"></i>
</button>

<nav aria-label="Breadcrumb">
    <!-- breadcrumb items -->
</nav>
```

### 3. **Skip Links** 🔗
```html
<!-- Agregar al inicio de cada página -->
<a href="#main-content" class="skip-link">Saltar al contenido principal</a>

<main id="main-content">
    <!-- Contenido -->
</main>
```

---

## 📊 PRIORIZACIÓN FINAL

### 🔥 **Sprint 1** (1 semana) - ALTA PRIORIDAD
1. ✅ Skeleton Loading States
2. ✅ Manejo de Errores Centralizado
3. ✅ Infinite Scroll
4. ✅ Búsqueda Avanzada con Filtros
5. ✅ Búsqueda con Highlight

### ⚡ **Sprint 2** (1 semana) - MEDIA PRIORIDAD
6. ✅ Optimistic Updates Completos
7. ✅ Gráficas en Dashboard
8. ✅ Compartir en Redes Sociales
9. ✅ Editor de Markdown
10. ✅ Posts Relacionados

### 💡 **Sprint 3** (2 semanas) - BAJA PRIORIDAD
11. ✅ Exportar Eventos (iCal)
12. ✅ Insignias/Logros
13. ✅ Gráfica de Actividad en Perfil
14. ✅ Sistema de Etiquetas con Autocompletado
15. ✅ PWA/Service Worker

---

**Total de Mejoras**: 60+
**Impacto Estimado**: Alto en UX, Performance, Funcionalidad y Engagement

