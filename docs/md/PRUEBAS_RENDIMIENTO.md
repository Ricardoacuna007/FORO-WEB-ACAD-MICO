# Pruebas de Rendimiento - Foro Académico UPA

Este documento describe cómo realizar pruebas de rendimiento y los resultados esperados.

## Tabla de Contenidos

1. [Herramientas Recomendadas](#herramientas-recomendadas)
2. [Pruebas con Lighthouse](#pruebas-con-lighthouse)
3. [Pruebas con PageSpeed Insights](#pruebas-con-pagespeed-insights)
4. [Resultados Esperados](#resultados-esperados)
5. [Optimizaciones Aplicadas](#optimizaciones-aplicadas)
6. [Mejoras Continuas](#mejoras-continuas)

---

## Herramientas Recomendadas

### 1. Google Lighthouse
- **Herramienta**: Auditoría integrada en Chrome DevTools
- **Acceso**: F12 → Lighthouse tab
- **Métricas**: Performance, Accessibility, Best Practices, SEO

### 2. PageSpeed Insights
- **URL**: https://pagespeed.web.dev/
- **Métricas**: Core Web Vitals, Performance Score
- **Dispositivos**: Desktop, Mobile

### 3. Chrome DevTools
- **Network Tab**: Análisis de requests, tiempos de carga
- **Performance Tab**: Profiling de JavaScript
- **Coverage Tab**: Análisis de código no utilizado

---

## Pruebas con Lighthouse

### Comandos de Lighthouse CLI

```bash
# Instalar Lighthouse CLI
npm install -g lighthouse

# Ejecutar auditoría en localhost
lighthouse http://localhost/FORO%20WEB%20ACAD%C3%89MICO/frontend/index --output html --output-path ./lighthouse-report.html

# Ejecutar auditoría con opciones específicas
lighthouse http://localhost/FORO%20WEB%20ACAD%C3%89MICO/frontend/index \
  --only-categories=performance,accessibility \
  --view
```

### Configuración de Lighthouse

Crear archivo `.lighthouserc.js` en la raíz del proyecto:

```javascript
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost/FORO%20WEB%20ACAD%C3%89MICO/frontend/index',
        'http://localhost/FORO%20WEB%20ACAD%C3%89MICO/frontend/foro',
        'http://localhost/FORO%20WEB%20ACAD%C3%89MICO/frontend/dashboard',
        'http://localhost/FORO%20WEB%20ACAD%C3%89MICO/frontend/perfil',
      ],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', {minScore: 0.80}],
        'categories:accessibility': ['error', {minScore: 0.90}],
        'categories:best-practices': ['error', {minScore: 0.85}],
        'categories:seo': ['error', {minScore: 0.90}],
      },
    },
  },
};
```

### Ejecutar con Lighthouse CI

```bash
# Instalar Lighthouse CI
npm install -g @lhci/cli

# Ejecutar auditoría
lhci autorun
```

---

## Pruebas con PageSpeed Insights

### Pasos para Probar

1. **Abrir PageSpeed Insights**: https://pagespeed.web.dev/
2. **Ingresar URL**: `http://localhost/FORO%20WEB%20ACAD%C3%89MICO/frontend/index`
3. **Seleccionar dispositivo**: Desktop o Mobile
4. **Ejecutar análisis**: Click en "Analyze"

### Métricas Core Web Vitals

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

---

## Resultados Esperados

### Performance Score

| Página | Desktop | Mobile | Notas |
|--------|---------|--------|-------|
| index.html | 85-95 | 75-85 | Página ligera, sin contenido dinámico |
| foro.html | 80-90 | 70-80 | Contenido dinámico, lazy loading activo |
| dashboard.html | 75-85 | 65-75 | Múltiples widgets y gráficos |
| perfil.html | 80-90 | 70-80 | Contenido dinámico moderado |
| calendario.html | 70-80 | 60-70 | FullCalendar cargado de forma diferida |

### Accessibility Score

- **Objetivo**: 90-100 en todas las páginas
- **Optimizaciones aplicadas**:
  - Contraste WCAG AA (4.5:1)
  - Áreas clickables mínimo 32x32px
  - Labels asociados a todos los campos
  - Soporte para screen readers

### Best Practices Score

- **Objetivo**: 85-100 en todas las páginas
- **Optimizaciones aplicadas**:
  - HTTPS (en producción)
  - Políticas de seguridad (X-Content-Type-Options, X-Frame-Options)
  - Imágenes optimizadas
  - JavaScript moderno

### SEO Score

- **Objetivo**: 90-100 en todas las páginas
- **Optimizaciones aplicadas**:
  - Meta descriptions en todas las vistas
  - Títulos descriptivos
  - Estructura semántica HTML
  - robots.txt (en producción)

---

## Optimizaciones Aplicadas

### 1. Carga de Recursos

#### Lazy Loading
- ✅ Imágenes con `loading="lazy"`
- ✅ FullCalendar carga de forma diferida
- ✅ Scripts no críticos con async/defer

#### Prefetch/Preconnect
- ✅ DNS-prefetch para API backend
- ✅ Preconnect para CDNs (Bootstrap, FontAwesome)
- ✅ Prefetch para endpoints críticos

### 2. Caché

#### Headers de Caché
- ✅ Assets estáticos: 1 año
- ✅ CSS/JS: 1 mes
- ✅ HTML: Sin caché

#### Caché del Cliente
- ✅ API_CACHE con TTL configurable
- ✅ Limpieza automática cuando excede límite
- ✅ Invalidación en mutaciones

### 3. Compresión

#### GZIP
- ✅ Habilitado en .htaccess
- ✅ Tipos: HTML, CSS, JS, JSON

### 4. Imágenes

#### Optimización
- ✅ Lazy loading en todas las imágenes
- ✅ Formatos modernos (WebP cuando sea posible)
- ✅ Tamaños apropiados (responsive)

### 5. JavaScript

#### Optimizaciones
- ✅ Debounce en búsqueda (300ms)
- ✅ Throttle en eventos de scroll
- ✅ Código modular y reutilizable
- ✅ Minificación (en producción)

### 6. CSS

#### Optimizaciones
- ✅ Uso de CSS moderno
- ✅ Eliminación de código no utilizado
- ✅ Minificación (en producción)

---

## Mejoras Continuas

### Checklist de Optimización

#### Performance
- [ ] Lazy loading de imágenes
- [ ] Compresión GZIP habilitada
- [ ] Caché configurado correctamente
- [ ] Minificación de assets (producción)
- [ ] CDN para assets estáticos (producción)

#### Accessibility
- [ ] Contraste mínimo 4.5:1
- [ ] Áreas clickables mínimo 32x32px
- [ ] Labels en todos los campos
- [ ] Navegación por teclado
- [ ] Soporte para screen readers

#### SEO
- [ ] Meta descriptions en todas las páginas
- [ ] Títulos descriptivos
- [ ] Estructura semántica
- [ ] robots.txt configurado
- [ ] Sitemap.xml (producción)

### Métricas a Monitorear

#### Core Web Vitals
- **LCP**: Debe ser < 2.5s
- **FID**: Debe ser < 100ms
- **CLS**: Debe ser < 0.1

#### Performance Score
- **Desktop**: Objetivo 85+
- **Mobile**: Objetivo 75+

#### Accessibility
- **Todas las páginas**: Objetivo 90+

---

## Comandos Útiles

### Análisis Rápido
```bash
# Lighthouse rápido (solo performance)
lighthouse http://localhost/FORO%20WEB%20ACAD%C3%89MICO/frontend/index \
  --only-categories=performance \
  --view

# Análisis completo
lighthouse http://localhost/FORO%20WEB%20ACAD%C3%89MICO/frontend/index \
  --output json \
  --output-path ./report.json
```

### Análisis Comparativo
```bash
# Generar reportes para todas las páginas principales
for page in index foro dashboard perfil; do
  lighthouse "http://localhost/FORO%20WEB%20ACAD%C3%89MICO/frontend/$page" \
    --output html \
    --output-path "./reports/$page-report.html"
done
```

---

## Troubleshooting

### Problemas Comunes

#### Performance Score Bajo

**Posibles causas**:
1. Imágenes sin optimizar
2. JavaScript bloqueante
3. Caché no configurado
4. Assets sin comprimir

**Soluciones**:
- Verificar lazy loading de imágenes
- Mover scripts a async/defer
- Configurar headers de caché
- Habilitar compresión GZIP

#### Accessibility Score Bajo

**Posibles causas**:
1. Contraste insuficiente
2. Áreas clickables pequeñas
3. Labels faltantes
4. Navegación por teclado rota

**Soluciones**:
- Mejorar contraste (mínimo 4.5:1)
- Aumentar tamaño de áreas clickables (mínimo 32x32px)
- Agregar labels a todos los campos
- Probar navegación por teclado

#### SEO Score Bajo

**Posibles causas**:
1. Meta descriptions faltantes
2. Títulos no descriptivos
3. Estructura HTML no semántica
4. robots.txt mal configurado

**Soluciones**:
- Agregar meta descriptions a todas las páginas
- Usar títulos descriptivos y únicos
- Usar elementos semánticos (header, nav, main, footer)
- Configurar robots.txt correctamente

---

## Recursos Adicionales

- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [PageSpeed Insights](https://developers.google.com/speed/pagespeed/insights/)
- [Web Vitals](https://web.dev/vitals/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Última actualización**: 2025-11-14

