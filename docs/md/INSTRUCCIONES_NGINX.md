# 🔧 Instrucciones para Actualizar Configuración de Nginx

## 📋 Pasos a Seguir

### 1. Hacer Backup de la Configuración Actual

```bash
sudo cp /etc/nginx/conf.d/miweb.conf /etc/nginx/conf.d/miweb.conf.backup
```

### 2. Aplicar Nueva Configuración

**Opción A: Usar el script automático**
```bash
cd /var/www/FORO-WEB-ACAD-MICO
sudo ./APLICAR_CONFIG_NGINX.sh
```

**Opción B: Manualmente**
```bash
# Copiar nueva configuración
sudo cp /var/www/FORO-WEB-ACAD-MICO/nginx_miweb.conf /etc/nginx/conf.d/miweb.conf

# Probar configuración
sudo nginx -t

# Si la prueba es exitosa, recargar Nginx
sudo systemctl reload nginx
```

### 3. Verificar que Funciona

Después de recargar Nginx, prueba:

1. **Página principal:** https://forodigital.org
2. **Dashboard:** https://forodigital.org/dashboard  
3. **Moderación:** https://forodigital.org/moderacion
4. **API:** https://forodigital.org/api/test

### 4. Si Hay Errores

```bash
# Ver logs de error
sudo tail -f /var/log/nginx/forodigital_error.log

# Ver logs de acceso
sudo tail -f /var/log/nginx/forodigital_access.log

# Restaurar backup si es necesario
sudo cp /etc/nginx/conf.d/miweb.conf.backup /etc/nginx/conf.d/miweb.conf
sudo systemctl reload nginx
```

## 🔍 Cambios Aplicados

La nueva configuración mapea las rutas correctamente:

- `/` → `/index.html`
- `/index` → `/index.html`
- `/dashboard` → `/dashboard.html`
- `/moderacion` → `/views/moderacion.html`
- `/calendario` → `/views/calendario.html`
- `/foro` → `/views/foro.html`
- `/perfil` → `/views/perfil.html`
- `/notificaciones` → `/views/notificaciones.html`
- `/search` → `/views/search.html`
- `/crear-post` → `/views/crear-post.html`
- `/carrera`, `/materia`, `/post`, etc. → `/views/[nombre].html`
- `/api/*` → Proxy a Laravel en puerto 8000

## ⚠️ Importante

**Asegúrate de que Laravel esté corriendo en el puerto 8000:**

```bash
cd /var/www/FORO-WEB-ACAD-MICO/backend
php artisan serve --host=127.0.0.1 --port=8000
```

O configurar como servicio systemd para que siempre esté corriendo.

---

**Fecha:** 2025-01-22
