# 🔧 Solución de Error 500 en Producción

## Problemas Identificados y Soluciones Aplicadas

### ✅ 1. Manejo de Errores Mejorado

Se agregó `try-catch` en los métodos `login()` y `me()` del `AuthController` para capturar errores y devolver respuestas JSON apropiadas.

### ✅ 2. Manejo Global de Excepciones

Se actualizó `bootstrap/app.php` para que todos los errores en rutas API devuelvan JSON en lugar de HTML.

---

## 🔍 Pasos para Diagnosticar el Error 500

### 1. Verificar Logs de Laravel

```bash
# Ver últimos errores
tail -f /var/www/FORO-WEB-ACAD-MICO/backend/storage/logs/laravel.log

# O ver errores recientes
tail -n 100 /var/www/FORO-WEB-ACAD-MICO/backend/storage/logs/laravel.log
```

### 2. Verificar Configuración de Base de Datos

Asegúrate de que el archivo `.env` en `/var/www/FORO-WEB-ACAD-MICO/backend/` tenga:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=foro_academico_upa
DB_USERNAME=root
DB_PASSWORD=Tr3s_Ap4ch3!

APP_ENV=production
APP_DEBUG=false
APP_URL=https://forodigital.org
```

### 3. Probar Conexión a Base de Datos

```bash
cd /var/www/FORO-WEB-ACAD-MICO/backend
php artisan tinker

# En tinker:
DB::connection()->getPdo();
```

Si falla, verifica:
- Que MySQL/MariaDB esté corriendo: `sudo systemctl status mariadb` o `sudo systemctl status mysql`
- Que la base de datos exista: `mysql -u root -p` y luego `SHOW DATABASES;`
- Que las credenciales sean correctas

### 4. Verificar Permisos

```bash
# Permisos de storage
sudo chmod -R 775 /var/www/FORO-WEB-ACAD-MICO/backend/storage
sudo chmod -R 775 /var/www/FORO-WEB-ACAD-MICO/backend/bootstrap/cache

# Propietario
sudo chown -R nginx:nginx /var/www/FORO-WEB-ACAD-MICO/backend/storage
sudo chown -R nginx:nginx /var/www/FORO-WEB-ACAD-MICO/backend/bootstrap/cache
```

### 5. Limpiar Caché de Laravel

```bash
cd /var/www/FORO-WEB-ACAD-MICO/backend
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Regenerar caché de configuración
php artisan config:cache
php artisan route:cache
```

### 6. Verificar Migraciones

```bash
cd /var/www/FORO-WEB-ACAD-MICO/backend
php artisan migrate:status

# Si faltan migraciones:
php artisan migrate --force
```

---

## 🔧 Configuración de Nginx para Ver Errores

Temporalmente, puedes habilitar `APP_DEBUG=true` en `.env` para ver errores detallados:

```env
APP_DEBUG=true
```

**IMPORTANTE:** Desactívalo después de diagnosticar por seguridad.

---

## 🐛 Errores Comunes y Soluciones

### Error: "SQLSTATE[HY000] [2002] No such file or directory"
**Causa:** MySQL/MariaDB no está corriendo o la configuración de socket es incorrecta.

**Solución:**
```bash
sudo systemctl start mariadb
# O
sudo systemctl start mysql
```

### Error: "Access denied for user"
**Causa:** Credenciales incorrectas en `.env`.

**Solución:** Verificar `DB_USERNAME` y `DB_PASSWORD` en `.env`.

### Error: "Class 'App\...' not found"
**Causa:** Autoloader de Composer desactualizado.

**Solución:**
```bash
cd /var/www/FORO-WEB-ACAD-MICO/backend
composer dump-autoload
```

### Error: "The stream or file could not be opened"
**Causa:** Permisos incorrectos en `storage/logs`.

**Solución:**
```bash
sudo chmod -R 775 /var/www/FORO-WEB-ACAD-MICO/backend/storage
sudo chown -R nginx:nginx /var/www/FORO-WEB-ACAD-MICO/backend/storage
```

---

## 📝 Verificar que los Cambios Funcionen

Después de aplicar las correcciones, prueba:

```bash
# Desde el servidor
curl -X POST https://forodigital.org/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@upatlacomulco.edu.mx","password":"password123"}'

# Debe devolver JSON, no HTML de error
```

---

## ✅ Checklist Final

- [ ] Logs de Laravel revisados
- [ ] Base de datos conecta correctamente
- [ ] Permisos de storage correctos
- [ ] Caché de Laravel limpiada
- [ ] Migraciones ejecutadas
- [ ] `.env` configurado correctamente
- [ ] Nginx recargado (si se modificó)
- [ ] PHP-FPM recargado (si se modificó)

---

**Nota:** Los errores ahora se registrarán en `/var/www/FORO-WEB-ACAD-MICO/backend/storage/logs/laravel.log` con información detallada para facilitar el diagnóstico.
