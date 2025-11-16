# 🔧 Corrección de Problemas Finales

## ❌ Problema 1: Trusted Types en CSP

### Error
```
This document requires 'TrustedHTML' assignment. The action has been blocked.
This document requires 'TrustedScriptURL' assignment. The action has been blocked.
```

### Causa
El CSP incluía `require-trusted-types-for 'script'`, pero el código JavaScript usa `innerHTML` y `script.src` directamente sin Trusted Types.

### Solución Aplicada ✅
Removido `require-trusted-types-for 'script'` del CSP en `/etc/nginx/conf.d/miweb.conf`.

**Nota**: Si el navegador sigue mostrando errores, haz un **hard refresh** (Ctrl+Shift+R o Ctrl+F5) para limpiar la caché del CSP.

---

## ❌ Problema 2: contenido_id cannot be null

### Error
```
SQLSTATE[23000]: Integrity constraint violation: 1048 Column 'contenido_id' cannot be null
```

### Causa
La columna `contenido_id` en la tabla `historial_moderacion` estaba definida como `NOT NULL`, pero el código intenta insertar `NULL` para avisos generales (que no están asociados a una publicación o comentario específico).

### Solución Aplicada ✅
Creada migración `2025_11_15_214700_make_contenido_id_nullable_in_historial_moderacion_table.php` que hace `contenido_id` nullable.

**Archivo**: `/var/www/FORO-WEB-ACAD-MICO/backend/database/migrations/2025_11_15_214700_make_contenido_id_nullable_in_historial_moderacion_table.php`

**Cambio**:
```php
// up()
$table->unsignedBigInteger('contenido_id')->nullable()->change();

// down()
$table->unsignedBigInteger('contenido_id')->nullable(false)->change();
```

---

## 📝 Verificaciones

### 1. Verificar CSP
```bash
curl -I https://forodigital.org | grep -i "content-security-policy"
```

No debe incluir `require-trusted-types-for 'script'`.

### 2. Verificar Migración
```bash
cd /var/www/FORO-WEB-ACAD-MICO/backend
php artisan migrate:status
```

La migración `2025_11_15_214700_make_contenido_id_nullable_in_historial_moderacion_table` debe estar marcada como ejecutada.

### 3. Verificar Estructura de Tabla
```bash
cd /var/www/FORO-WEB-ACAD-MICO/backend
php artisan tinker --execute="\$col = DB::select('DESCRIBE historial_moderacion')[4]; echo \$col->Field . ' - Null: ' . \$col->Null . PHP_EOL;"
```

Debe mostrar: `contenido_id - Null: YES`

---

## ⚠️ Instrucciones para el Usuario

1. **Recargar Nginx** (si no se ha hecho automáticamente):
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

2. **Limpiar caché del navegador**:
   - Chrome/Edge: Ctrl+Shift+Delete → "Cached images and files" → "Clear data"
   - O hacer **Hard Refresh**: Ctrl+Shift+R (Windows/Linux) o Cmd+Shift+R (Mac)

3. **Probar creación de avisos**:
   - Ir al panel de moderación
   - Crear un aviso general
   - Verificar que no aparezca el error SQL

---

**Status**: ✅ Problemas corregidos

