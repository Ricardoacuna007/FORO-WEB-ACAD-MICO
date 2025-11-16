<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo($request): ?string
    {
        // Para peticiones API, no redirigir (devolver JSON)
        if ($request->is('api/*') || $request->expectsJson()) {
            return null;
        }

        // Solo para rutas web, redirigir a login si existe la ruta
        if (! $request->expectsJson()) {
            // Verificar si existe la ruta 'login' antes de intentar usarla
            try {
                return route('login');
            } catch (\Exception $e) {
                // Si la ruta no existe, no redirigir
                return null;
            }
        }
        
        return null;
    }
}
