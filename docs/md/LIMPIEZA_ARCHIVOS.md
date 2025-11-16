# 🧹 Limpieza de Archivos No Usados

## ✅ Archivos Eliminados

### Frontend

#### 1. **test.html** ✅
- **Ubicación**: `/var/www/FORO-WEB-ACAD-MICO/frontend/test.html`
- **Razón**: Archivo de prueba para testing de API, no necesario en producción
- **Contenido**: Scripts de prueba para login, registro y rutas protegidas

#### 2. **CSS No Usados** ✅
- **bootstrap.main.css** - No referenciado en ningún HTML
- **components.css** - No referenciado en ningún HTML
- **layout.css** - No referenciado en ningún HTML
- **themes.css** - No referenciado en ningún HTML
- **Razón**: Solo `styles.css` está siendo usado en todos los archivos HTML

#### 3. **foro_academico_upa.sql** ✅
- **Ubicación**: `/var/www/FORO-WEB-ACAD-MICO/frontend/foro_academico_upa.sql`
- **Razón**: Archivo SQL de backup que no está siendo usado, debe estar en backups externos
- **Tamaño**: 56.9 KiB

#### 4. **Componentes HTML Vacíos/No Usados** ⚠️
- **Nota**: Los componentes en `/frontend/components/` no están siendo importados/usados en ningún HTML
- **Componentes encontrados**:
  - `navbar.html` (vacío)
  - `sidebar.html`
  - `footer.html`
  - `modal-crear-post.html`
  - `modal-editar-perfil.html`
  - `post-card.html`
  - `comment-item.html`
  - `breadcrumb.html`
  - `notification-badge.html`
- **Decisión**: No eliminados por si se necesitan en el futuro, pero no están siendo usados actualmente

### Backend

#### 1. **Migración Duplicada** ✅
- **Eliminado**: `2025_11_10_210155_create_personal_access_tokens_table.php`
- **Mantenido**: `2025_11_10_215132_create_personal_access_tokens_table.php` (ya ejecutada)
- **Razón**: Ambas migraciones crean la misma tabla `personal_access_tokens`, solo se necesita una

---

## 🎨 Botón de Tema Eliminado

### Archivos HTML Modificados:
1. ✅ `index.html`
2. ✅ `dashboard.html`
3. ✅ `views/post.html`
4. ✅ `views/materia.html`
5. ✅ `views/search.html`
6. ✅ `views/notificaciones.html`
7. ✅ `views/crear-post.html`
8. ✅ `views/calendario.html`
9. ✅ `views/foro.html`
10. ✅ `views/perfil.html`
11. ✅ `views/moderacion.html` (ya estaba hecho)

**Cambio aplicado**: Eliminado el botón de tema (`#toggleThemeBtn`) de todos los navbars. El cambio de tema ahora solo está disponible en la configuración del perfil.

---

## 📊 Resumen

### Archivos Eliminados:
- ✅ `test.html` (archivo de prueba)
- ✅ `bootstrap.main.css` (no usado)
- ✅ `components.css` (no usado)
- ✅ `layout.css` (no usado)
- ✅ `themes.css` (no usado)
- ✅ `foro_academico_upa.sql` (backup)
- ✅ `2025_11_10_210155_create_personal_access_tokens_table.php` (duplicado)

### Archivos Modificados:
- ✅ 11 archivos HTML (botón de tema eliminado)

### Espacio Liberado:
- Aproximadamente **60+ KiB** (archivos pequeños pero todos suman)

---

## ⚠️ Notas

### Componentes HTML No Eliminados:
Los componentes en `/frontend/components/` no están siendo usados actualmente, pero:
- Pueden ser útiles para futuras refactorizaciones
- No ocupan mucho espacio
- Pueden servir como referencia
- **Recomendación**: Si no se planea usarlos, pueden eliminarse más adelante

### Archivos de Prueba Backend:
- `tests/Unit/ExampleTest.php` - Test de ejemplo de Laravel (puede eliminarse)
- `tests/Feature/ExampleTest.php` - Test de ejemplo de Laravel (puede eliminarse)
- **Nota**: Estos archivos son parte del scaffolding de Laravel y pueden mantenerse como plantillas

---

**Status**: ✅ Limpieza completada

