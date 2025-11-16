# Flujos Optimizados - Foro Académico UPA

Este documento describe los flujos principales del sistema optimizado y las guías de debug.

## Tabla de Contenidos

1. [Flujo de Autenticación](#flujo-de-autenticación)
2. [Flujo de Creación de Publicaciones](#flujo-de-creación-de-publicaciones)
3. [Flujo de Moderación](#flujo-de-moderación)
4. [Flujo de Notificaciones](#flujo-de-notificaciones)
5. [Guías de Debug](#guías-de-debug)
6. [Optimizaciones Aplicadas](#optimizaciones-aplicadas)

---

## Flujo de Autenticación

### 1. Login
- **Archivo**: `frontend/js/auth.js`
- **Endpoint**: `POST /api/auth/login`
- **Optimizaciones**:
  - Validación en tiempo real con debounce
  - Caché de usuario después de login exitoso (60 segundos)
  - Redirección automática según rol del usuario
  - Verificación de cuenta suspendida antes de permitir login

### 2. Registro
- **Archivo**: `frontend/js/registro.js`
- **Endpoint**: `POST /api/auth/register`
- **Optimizaciones**:
  - Validación en tiempo real de campos
  - Indicador de fortaleza de contraseña
  - Carga dinámica de carreras desde API
  - Limpieza automática de caché después de registro

### 3. Logout
- **Archivo**: `frontend/js/auth.js`
- **Endpoint**: `POST /api/auth/logout`
- **Optimizaciones**:
  - Confirmación única (evita duplicados)
  - Limpieza completa de localStorage
  - Invalidación de caché
  - Redirección limpia a index

---

## Flujo de Creación de Publicaciones

### 1. Vista de Crear Publicación
- **Archivo**: `frontend/js/crear-post-page.js`
- **Vista**: `frontend/views/crear-post.html`
- **Endpoint**: `POST /api/publicaciones`

### 2. Proceso Optimizado

1. **Carga Inicial**:
   - Carga diferida de FullCalendar (solo si se necesita)
   - Carga dinámica de materias desde API
   - Validación en tiempo real de campos

2. **Envío de Formulario**:
   - Validación completa antes de enviar
   - Indicador de carga global
   - Manejo de errores con sistema centralizado
   - Sin notificaciones redundantes (feedback visual suficiente)

3. **Después de Crear**:
   - Invalidación de caché de publicaciones
   - Redirección a la publicación creada
   - Actualización automática de contadores

### 3. Optimizaciones Aplicadas
- Debounce en validación (300ms)
- Lazy loading de assets pesados
- Caché inteligente con invalidación
- Feedback visual sin alertas innecesarias

---

## Flujo de Moderación

### 1. Panel de Moderación
- **Archivo**: `frontend/js/moderacion.js`
- **Vista**: `frontend/views/moderacion.html`
- **Endpoints**: `/api/moderacion/*`

### 2. Funcionalidades Principales

#### a) Gestión de Reportes
- **Paginación dinámica**: 10 reportes por página
- **Skeleton loaders**: Indicadores de carga durante fetch
- **Caché inteligente**: Reutilización de datos ya cargados
- **Actualización automática**: Sin recargar toda la vista

#### b) Creación de Avisos
- **Endpoint**: `POST /api/moderacion/avisos`
- **Destinos**: Todos, Carrera, Rol, Usuario
- **Optimizaciones**:
  - Validación de destinatarios antes de enviar
  - Registro en historial de moderación
  - Notificaciones automáticas a usuarios afectados

#### c) Gestión de Usuarios
- **Bloqueo/Suspensión**:
  - Soporte para suspensiones temporales
  - Motivo obligatorio en historial
  - Validación de foreign keys (NULL para avisos globales)
  
- **Reactivar Usuario**:
  - Limpieza de campos de suspensión
  - Registro en historial de moderación
  - Notificación al usuario

#### d) Limpieza de Actividad
- **Función**: `limpiarActividad()`
- **Confirmación**: Con Toasty.js
- **Limpieza**: Estado local sin afectar base de datos

### 3. Optimizaciones Aplicadas
- Paginación eficiente con "Cargar más"
- Caché de reportes con invalidación inteligente
- Debounce en búsqueda de usuarios
- Lazy loading de componentes pesados

---

## Flujo de Notificaciones

### 1. Sistema de Notificaciones
- **Archivo**: `frontend/js/notifications.js`
- **Vista**: `frontend/views/notificaciones.html`
- **Endpoints**: `/api/notificaciones/*`

### 2. Funcionalidades

#### a) Carga de Notificaciones
- **Caché**: 60 segundos TTL
- **Actualización**: Automática cada 30 segundos
- **Filtros**: Todas, No leídas, Esta semana

#### b) Marcado como Leídas
- **Individual**: Click en notificación
- **Todas**: Botón "Marcar todas como leídas"
- **Optimización**: Actualización optimista (UI primero)

#### c) Visualización
- **Toasty.js**: Notificaciones no bloqueantes
- **Contraste mejorado**: WCAG AA compliant
- **Accesibilidad**: Soporte para screen readers

### 3. Optimizaciones Aplicadas
- Caché con TTL corto para datos dinámicos
- Actualización optimista para mejor UX
- Lazy loading de avatares en notificaciones
- Debounce en acciones masivas

---

## Guías de Debug

### 1. Sistema Centralizado de Errores

#### Acceso a Errores
```javascript
// Obtener todos los errores
const errores = ErrorHandler.getErrors();

// Obtener último error
const ultimoError = ErrorHandler.getLastError();

// Formato para diagnóstico
const diagnostico = ErrorHandler.formatForDiagnostics();

// Limpiar errores
ErrorHandler.clearErrors();
```

#### Visualización en Consola
```javascript
// Habilitar modo debug
window.__API_DEBUG__ = true;

// Los errores se registrarán automáticamente en ErrorHandler
// y se mostrarán en consola con contexto completo
```

### 2. Diagnóstico de Caché

#### Ver Estado del Caché
```javascript
// Ver todas las entradas del caché
console.log(API_CACHE);

// Ver claves específicas
const cacheKeys = Array.from(API_CACHE.keys());
console.log('Claves de caché:', cacheKeys);
```

#### Limpiar Caché
```javascript
// Limpiar todo el caché
clearCache();

// Limpiar caché específico
clearCache(['publicaciones', 'eventos']);
```

### 3. Diagnóstico de localStorage

#### Ver Contenido
```javascript
// Ver todas las claves
Object.keys(localStorage).forEach(key => {
    console.log(key, localStorage.getItem(key));
});

// Limpiar localStorage manualmente
limpiarLocalStorage();

// Ver resultado de limpieza
const resultado = limpiarLocalStorage();
console.log('Limpiadas:', resultado.eliminadas);
console.log('Mantenidas:', resultado.mantenidas);
```

### 4. Debug de Búsqueda

#### Ver Resultados
```javascript
// En search.js, habilitar debug
SearchConfig.debug = true;

// Ver resultados de búsqueda
console.log('Resultados:', resultadosBusqueda);
console.log('Query:', busquedaActual);
console.log('Filtros:', filtrosActivos);
```

### 5. Debug de Performance

#### Medir Tiempo de Carga
```javascript
// Marcar inicio
performance.mark('inicio');

// ... código a medir ...

// Marcar fin
performance.mark('fin');

// Medir diferencia
performance.measure('duracion', 'inicio', 'fin');
const medida = performance.getEntriesByName('duracion')[0];
console.log('Duración:', medida.duration, 'ms');
```

### 6. Verificar Lazy Loading

#### Comprobar Scripts Cargados
```javascript
// Ver scripts cargados
Array.from(document.querySelectorAll('script')).forEach(script => {
    console.log(script.src, script.dataset.loaded === 'true' ? '✓' : '✗');
});

// Ver CSS cargados
Array.from(document.querySelectorAll('link[rel="stylesheet"]')).forEach(link => {
    console.log(link.href, link.media);
});
```

---

## Optimizaciones Aplicadas

### Frontend

1. **Lazy Loading**
   - Imágenes: `loading="lazy"` en todas las imágenes
   - Scripts: FullCalendar carga de forma diferida
   - CSS: Carga diferida para assets no críticos

2. **Caché Inteligente**
   - TTL configurable por endpoint
   - Invalidación automática en mutaciones
   - Limpieza automática cuando excede límite

3. **Debounce/Throttle**
   - Búsqueda: 300ms debounce
   - Validación: 300ms debounce
   - Scroll events: Throttle 100ms

4. **Prefetch/Preconnect**
   - DNS-prefetch para API backend
   - Preconnect para CDNs
   - Prefetch para endpoints críticos

5. **Notificaciones**
   - Contraste WCAG AA
   - Accesibilidad mejorada
   - Soporte para prefers-reduced-motion

### Backend

1. **Índices SQL**
   - `publicaciones`: (activo, titulo), contenido
   - `comentarios`: activo, contenido
   - `usuarios`: (activo, nombre), email
   - `materias`: (activo, nombre), codigo

2. **Eager Loading Optimizado**
   - Selección específica de columnas
   - Carga selectiva de relaciones
   - Límites en todas las consultas

3. **Búsqueda Mejorada**
   - Ranking de relevancia
   - Búsqueda precisa con múltiples palabras
   - Ordenamiento por relevancia

4. **Caché de Respuestas**
   - Headers de caché apropiados
   - ETags para validación
   - Compresión GZIP

---

## Mejores Prácticas

### 1. Manejo de Errores
- Siempre usar `ErrorHandler.log()` para errores de API
- Incluir contexto suficiente para diagnóstico
- No mostrar detalles técnicos al usuario

### 2. Caché
- Usar TTL corto (60s) para datos dinámicos
- Invalidar caché después de mutaciones
- Limpiar caché periódicamente

### 3. Performance
- Lazy load assets pesados
- Usar debounce en interacciones frecuentes
- Prefetch recursos críticos

### 4. Accesibilidad
- Contraste mínimo 4.5:1 (WCAG AA)
- Áreas clickables mínimo 32x32px
- Soporte para prefers-reduced-motion

---

## Checklist de Debug

Antes de reportar un bug, verifica:

- [ ] Errores en consola del navegador
- [ ] Estado del caché (`API_CACHE`)
- [ ] Contenido de localStorage
- [ ] Últimos errores registrados (`ErrorHandler.getLastError()`)
- [ ] Red requests en DevTools
- [ ] Performance marks/measures

---

## Recursos Adicionales

- **Lighthouse**: Auditar rendimiento, accesibilidad, SEO
- **Chrome DevTools**: Network, Performance, Application tabs
- **ErrorHandler**: Sistema centralizado de errores
- **API_CACHE**: Sistema de caché de API

---

**Última actualización**: 2025-11-14

