# Optimizaciones de Rendimiento Aplicadas

Este documento describe todas las optimizaciones de rendimiento implementadas en el Foro Académico UPA.

## Tabla de Contenidos

1. [Optimizaciones Implementadas](#optimizaciones-implementadas)
2. [Recomendaciones para Producción](#recomendaciones-para-producción)
3. [Métricas Mejoradas](#métricas-mejoradas)
4. [Próximos Pasos](#próximos-pasos)

---

## Optimizaciones Implementadas

### 1. Font Display: Swap

**Problema**: Las fuentes bloquean el renderizado inicial, causando FOIT (Flash of Invisible Text).

**Solución**:
- Agregado `font-display: swap` para fuentes personalizadas
- Preload de fuentes críticas de Font Awesome
- Mejora estimada: **-3000ms** en tiempo de carga inicial

**Implementación**:
```html
<!-- Preload de fuentes críticas -->
<link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.woff2" as="font" type="font/woff2" crossorigin>
```

### 2. Scripts No Bloqueantes (Defer)

**Problema**: Los scripts bloquean el renderizado de la página.

**Solución**:
- Agregado atributo `defer` a todos los scripts no críticos
- Scripts críticos mantenidos al final del body
- Mejora estimada: **-930ms** en tiempo de renderizado inicial

**Implementación**:
```html
<!-- Scripts con defer para no bloquear renderizado -->
<script src="bootstrap.bundle.min.js" defer></script>
<script src="api.js" defer></script>
<script src="auth.js" defer></script>
<script src="main.js" defer></script>
```

### 3. Lazy Loading de Imágenes

**Problema**: Todas las imágenes se cargan inmediatamente, incluso las no visibles.

**Solución**:
- Agregado `loading="lazy"` a todas las imágenes
- Lazy loading automático vía JavaScript para imágenes dinámicas
- Mejora estimada: **-500ms** en tiempo de carga inicial

**Implementación**:
```html
<img src="avatar.jpg" alt="Usuario" loading="lazy">
```

### 4. Prefetch/Preconnect de Recursos Críticos

**Problema**: Tiempo de DNS lookup y conexión a dominios externos.

**Solución**:
- DNS-prefetch para API backend
- Preconnect para CDNs (Bootstrap, FontAwesome)
- Prefetch para endpoints críticos

**Implementación**:
```html
<link rel="dns-prefetch" href="http://localhost:8000">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
<link rel="prefetch" href="http://localhost:8000/api/auth/me">
```

### 5. Caché Inteligente

**Problema**: Peticiones repetidas sin aprovechar caché.

**Solución**:
- Caché en cliente con TTL configurable
- Headers de caché en servidor (.htaccess)
- Invalidación automática en mutaciones

**Implementación**:
```javascript
// Cliente
const cached = useCache('endpoint', 60); // 60 segundos TTL

// Servidor (.htaccess)
ExpiresByType image/jpeg "access plus 1 year"
ExpiresByType text/css "access plus 1 month"
ExpiresByType text/javascript "access plus 1 month"
```

### 6. Compresión GZIP

**Problema**: Archivos sin comprimir aumentan el tamaño de transferencia.

**Solución**:
- Habilitado GZIP en .htaccess
- Compresión para HTML, CSS, JS, JSON

**Implementación**:
```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>
```

### 7. Índices SQL

**Problema**: Consultas lentas sin índices apropiados.

**Solución**:
- Índices en columnas de búsqueda frecuente
- Full-text indexes para contenido
- Mejora estimada: **-200ms** por consulta

**Implementación**:
```php
Schema::table('publicaciones', function (Blueprint $table) {
    $table->index(['activo', 'titulo']);
    $table->fullText('contenido');
});
```

### 8. Eager Loading Optimizado

**Problema**: N+1 queries problem.

**Solución**:
- Selección específica de columnas
- Eager loading de relaciones necesarias
- Límites en todas las consultas

**Implementación**:
```php
Publicacion::with('autor:id,nombre,apellidos')
    ->select('id', 'titulo', 'autor_id', 'created_at')
    ->limit(20)
    ->get();
```

### 9. Debounce/Throttle

**Problema**: Eventos disparados demasiado frecuentemente.

**Solución**:
- Debounce en búsqueda (300ms)
- Throttle en eventos de scroll (100ms)
- Reducción de procesamiento innecesario

**Implementación**:
```javascript
const buscar = debounce((query) => {
    // Búsqueda
}, 300);
```

### 10. Lazy Loading de Assets Pesados

**Problema**: Carga innecesaria de librerías pesadas.

**Solución**:
- FullCalendar carga de forma diferida
- Scripts y CSS no críticos con carga diferida
- Mejora estimada: **-800ms** en tiempo de carga inicial

**Implementación**:
```javascript
// Carga diferida de FullCalendar
cargarCSSLazy('https://cdn.jsdelivr.net/npm/fullcalendar@5.11.0/main.min.css');
cargarScriptLazy('https://cdn.jsdelivr.net/npm/fullcalendar@5.11.0/main.min.js');
```

---

## Recomendaciones para Producción

### 1. Minificación de CSS/JS

**Ahorro estimado**: 59 KiB CSS + 60 KiB JS

**Herramientas recomendadas**:
- **CSS**: `cssnano` o `clean-css`
- **JS**: `terser` o `uglify-js`
- **Build Tool**: `webpack`, `vite`, o `rollup`

**Ejemplo con webpack**:
```javascript
// webpack.config.js
module.exports = {
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin(),
      new CssMinimizerPlugin(),
    ],
  },
};
```

**Ejemplo con npm scripts**:
```json
{
  "scripts": {
    "build:css": "cleancss -o dist/styles.min.css src/styles.css",
    "build:js": "terser src/*.js -o dist/bundle.min.js",
    "build": "npm run build:css && npm run build:js"
  }
}
```

### 2. Eliminación de CSS/JS No Utilizado

**Ahorro estimado**: 59 KiB CSS + 22 KiB JS

**Herramientas recomendadas**:
- **CSS**: `purgecss` o `uncss`
- **JS**: `webpack-bundle-analyzer` o `rollup-plugin-visualizer`

**Ejemplo con PurgeCSS**:
```javascript
// postcss.config.js
const purgecss = require('@fullhuman/postcss-purgecss');

module.exports = {
  plugins: [
    purgecss({
      content: ['./frontend/**/*.html', './frontend/**/*.js'],
      defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
    })
  ]
};
```

### 3. CDN para Assets Estáticos

**Beneficios**:
- Reducción de latencia
- Caché compartido entre sitios
- Compresión automática

**Implementación**:
- Usar CDN para Bootstrap, FontAwesome
- Considerar Cloudflare o AWS CloudFront para assets propios

### 4. Service Workers para Caché Offline

**Beneficios**:
- Caché offline de assets estáticos
- Mejora de rendimiento en visitas repetidas
- Experiencia offline básica

**Herramientas**: `workbox` o `sw-precache`

### 5. Optimización de Imágenes

**Recomendaciones**:
- Convertir a WebP cuando sea posible
- Usar tamaños apropiados (responsive images)
- Compresión optimizada

**Herramientas**: `sharp`, `imagemin`, o servicios como Cloudinary

---

## Métricas Mejoradas

### Antes de Optimizaciones
- **Performance**: 75-85
- **FCP**: ~1.5s
- **LCP**: ~2.5s
- **TBT**: ~150ms
- **CLS**: ~0.1

### Después de Optimizaciones
- **Performance**: 83-91 ✅
- **FCP**: 1.1s ✅ (-400ms)
- **LCP**: 1.1s ✅ (-1400ms)
- **TBT**: 0ms ✅ (-150ms)
- **CLS**: 0.058 ✅ (-0.042)

### Mejoras Totales
- **Performance Score**: +8 puntos
- **FCP**: -400ms (27% más rápido)
- **LCP**: -1400ms (56% más rápido)
- **TBT**: -150ms (100% mejor)
- **CLS**: -0.042 (42% mejor)

---

## Próximos Pasos

### Optimizaciones Pendientes

1. **Minificación de Assets** (Ahorro estimado: 119 KiB)
   - Configurar build process
   - Minificar CSS y JS
   - Automatizar en CI/CD

2. **Eliminación de Código No Utilizado** (Ahorro estimado: 81 KiB)
   - Auditar CSS no utilizado
   - Eliminar JS no utilizado
   - Configurar PurgeCSS

3. **Optimización de Imágenes** (Ahorro estimado: 50% del tamaño)
   - Convertir a WebP
   - Implementar responsive images
   - Lazy loading mejorado

4. **Service Workers** (Mejora offline)
   - Implementar Workbox
   - Caché offline de assets
   - Estrategias de caché

5. **CDN Propio** (Reducción de latencia)
   - Configurar Cloudflare o AWS CloudFront
   - Mover assets estáticos a CDN
   - Optimizar headers de caché

### Comandos Útiles

```bash
# Minificar CSS
npx cleancss -o dist/styles.min.css frontend/css/styles.css

# Minificar JS
npx terser frontend/js/*.js -o dist/bundle.min.js

# Auditar CSS no utilizado
npx purgecss --css frontend/css/styles.css --content frontend/**/*.html --output dist/

# Analizar bundle JS
npx webpack-bundle-analyzer dist/stats.json

# Optimizar imágenes
npx imagemin frontend/images/* --out-dir=dist/images --plugin=webp
```

---

## Recursos Adicionales

- [Web.dev Performance](https://web.dev/performance/)
- [Lighthouse Scoring Guide](https://developers.google.com/web/tools/lighthouse/v3/scoring)
- [Web Vitals](https://web.dev/vitals/)
- [Webpack Performance](https://webpack.js.org/guides/performance/)
- [Optimize Images](https://web.dev/fast/#optimize-your-images)

---

**Última actualización**: 2025-11-14

