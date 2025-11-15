# Cómo Iniciar el Servidor Laravel

## Problema Común

Si ves el error `ERR_CONNECTION_REFUSED` o `Failed to fetch` al intentar hacer login o cualquier petición a la API, significa que el servidor Laravel no está corriendo.

## Solución Rápida

### Opción 1: Terminal en Windows (PowerShell o CMD)

```bash
cd "C:\xamppp\htdocs\FORO WEB ACADÉMICO\backend"
php artisan serve
```

El servidor se iniciará en: `http://localhost:8000`

### Opción 2: Terminal en la raíz del proyecto

```bash
cd backend
php artisan serve --host=127.0.0.1 --port=8000
```

### Opción 3: XAMPP (si estás usando XAMPP)

Si prefieres usar Apache de XAMPP, configura un VirtualHost para el backend Laravel.

## Verificar que el Servidor Está Corriendo

Una vez iniciado, deberías ver algo como:

```
INFO  Server running on [http://127.0.0.1:8000].
```

También puedes verificar abriendo en tu navegador:
- `http://localhost:8000/api/auth/me` (debería dar un error 401/401 si el servidor está corriendo)

## Detener el Servidor

Presiona `Ctrl + C` en la terminal donde está corriendo el servidor.

## Notas Importantes

1. **Mantén el servidor corriendo**: El servidor debe estar activo mientras usas el frontend
2. **Puerto 8000**: Asegúrate de que el puerto 8000 no esté siendo usado por otra aplicación
3. **Variables de entorno**: Si es la primera vez, asegúrate de tener configurado el archivo `.env` en el backend

## Solución de Problemas

### El puerto 8000 ya está en uso

```bash
# Usa otro puerto
php artisan serve --port=8001
```

Luego actualiza `API_BASE_URL` en `frontend/js/api.js`:

```javascript
const API_BASE_URL = 'http://localhost:8001/api';
```

### Error "Command not found: php"

Asegúrate de que PHP esté en tu PATH o usa la ruta completa:

```bash
# En Windows con XAMPP
C:\xampp\php\php.exe artisan serve

# O agrega PHP al PATH de Windows
```

### Base de datos no configurada

1. Copia `.env.example` a `.env` si no existe
2. Configura la base de datos en `.env`
3. Ejecuta las migraciones:

```bash
cd backend
php artisan migrate
```

---

**Última actualización**: 2025-11-14

