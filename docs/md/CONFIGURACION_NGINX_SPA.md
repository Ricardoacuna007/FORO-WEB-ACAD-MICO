# 🔧 Configuración de Nginx para SPA

## 📋 Problema Actual

La URL cambia (ej: de `/index` a `/moderacion`) pero la vista no cambia porque Nginx no está configurado como SPA.

## ✅ Solución: Configuración Nginx

Necesitas configurar Nginx para que sirva los archivos HTML correctos según la ruta.

### Opción 1: Configuración Básica SPA (Recomendada)

```nginx
server {
    listen 80;
    server_name forodigital.org www.forodigital.org;
    
    root /var/www/FORO-WEB-ACAD-MICO/frontend;
    index index.html;
    
    # Servir archivos estáticos directamente
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Rutas específicas
    location = / {
        try_files /index.html =404;
    }
    
    location = /index {
        try_files /index.html =404;
    }
    
    location = /dashboard {
        try_files /dashboard.html =404;
    }
    
    location = /registro {
        try_files /registro.html =404;
    }
    
    # Rutas de vistas
    location ~ ^/(moderacion|calendario|foro|perfil|notificaciones|search|crear-post)$ {
        try_files /views/$1.html =404;
    }
    
    location ~ ^/(carrera|cuatrimestre|materia|post)$ {
        try_files /views/$1.html =404;
    }
    
    # Fallback: si no encuentra archivo, servir index.html (para SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        root /var/www/FORO-WEB-ACAD-MICO/backend/public;
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    # PHP para API
    location ~ \.php$ {
        root /var/www/FORO-WEB-ACAD-MICO/backend/public;
        fastcgi_pass unix:/var/run/php-fpm/php-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

### Opción 2: Configuración Más Específica (Si la Opción 1 no funciona)

```nginx
server {
    listen 80;
    server_name forodigital.org www.forodigital.org;
    
    root /var/www/FORO-WEB-ACAD-MICO/frontend;
    index index.html;
    
    # Assets estáticos
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
    
    # Mapeo de rutas a archivos HTML
    location = / { try_files /index.html =404; }
    location = /index { try_files /index.html =404; }
    location = /dashboard { try_files /dashboard.html =404; }
    location = /registro { try_files /registro.html =404; }
    
    # Vistas
    location = /moderacion { try_files /views/moderacion.html =404; }
    location = /calendario { try_files /views/calendario.html =404; }
    location = /foro { try_files /views/foro.html =404; }
    location = /perfil { try_files /views/perfil.html =404; }
    location = /notificaciones { try_files /views/notificaciones.html =404; }
    location = /search { try_files /views/search.html =404; }
    location = /crear-post { try_files /views/crear-post.html =404; }
    
    # Rutas con parámetros (carrera, materia, etc.)
    location ~ ^/(carrera|cuatrimestre|materia|post)(/.*)?$ {
        try_files /views/$1.html =404;
    }
    
    # Fallback para otras rutas
    location / {
        try_files $uri /index.html;
    }
    
    # Backend API
    location /api {
        root /var/www/FORO-WEB-ACAD-MICO/backend/public;
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    # PHP
    location ~ \.php$ {
        root /var/www/FORO-WEB-ACAD-MICO/backend/public;
        fastcgi_pass unix:/var/run/php-fpm/php-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

## 🔍 Verificar Configuración

Después de actualizar Nginx:

```bash
# Probar configuración
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx

# Verificar logs si hay errores
sudo tail -f /var/log/nginx/error.log
```

## 📝 Nota

El problema es que el frontend usa navegación tradicional (`window.location.href`) que hace recargas completas de página. Para que funcione correctamente, Nginx debe servir el archivo HTML correcto según la URL.

---

**Archivo:** CONFIGURACION_NGINX_SPA.md  
**Fecha:** 2025-01-22
