<?php

// =========================================
// RUTAS API - FORO ACADÉMICO UPA
// =========================================

Route::prefix('api')->group(function () {
    // Ruta de prueba
    Route::get('/test', function () {
        return response()->json([
            'success' => true,
            'message' => '✅ API Foro Académico UPA funcionando correctamente!',
            'timestamp' => now()->toDateTimeString(),
            'data' => [
                'version' => '1.0.0',
                'status' => 'active',
                'endpoints' => [
                    'POST /api/auth/register' => 'Registrar usuario',
                    'POST /api/auth/login' => 'Iniciar sesión', 
                    'GET /api/auth/me' => 'Obtener usuario actual',
                    'POST /api/auth/logout' => 'Cerrar sesión'
                ]
            ]
        ]);
    });

    // Rutas de autenticación
    Route::post('/auth/register', [App\Http\Controllers\AuthController::class, 'register']);
    Route::post('/auth/login', [App\Http\Controllers\AuthController::class, 'login']);
    
    // Rutas protegidas (requieren autenticación)
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [App\Http\Controllers\AuthController::class, 'logout']);
        Route::get('/auth/me', [App\Http\Controllers\AuthController::class, 'me']);
    });
});