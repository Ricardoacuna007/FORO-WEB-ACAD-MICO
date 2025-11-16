# 🔍 Debug de Autenticación

## Problema Actual
Error 500 en `/api/auth/me` - "Unauthenticated"

## Pasos para Verificar

### 1. Verificar Token en Frontend
En la consola del navegador, ejecuta:
```javascript
localStorage.getItem('upa_token')
```
Debería devolver algo como: `2|5CC9WcS1KNRrCDaOJB...`

### 2. Verificar que el Token se Envía
En la pestaña Network del navegador:
1. Busca la petición a `/api/auth/me`
2. Revisa los Headers
3. Debe tener: `Authorization: Bearer 2|5CC9WcS1KNRrCDaOJB...`

### 3. Si el Token No se Envía
Limpia el localStorage y vuelve a iniciar sesión:
```javascript
localStorage.clear();
location.reload();
```

### 4. Verificar Token en Backend
```bash
cd /var/www/FORO-WEB-ACAD-MICO/backend
php artisan tinker
```
En tinker:
```php
$token = '2|5CC9WcS1KNRrCDaOJB'; // Reemplaza con tu token
$personalAccessToken = Laravel\Sanctum\PersonalAccessToken::findToken($token);
if($personalAccessToken) {
    echo "Token válido para: " . $personalAccessToken->tokenable->email;
} else {
    echo "Token inválido";
}
```

## Cambios Aplicados
1. ✅ Header `Accept: application/json` agregado
2. ✅ Header `X-Requested-With: XMLHttpRequest` agregado
3. ✅ `credentials: 'same-origin'` configurado
4. ✅ Middleware Authenticate corregido para no redirigir en API
5. ✅ Manejo de errores mejorado en `me()`

## Próximos Pasos
1. Recargar la página (Ctrl+F5 para forzar)
2. Verificar que el token se envía en los headers
3. Si sigue fallando, limpiar localStorage y volver a iniciar sesión
