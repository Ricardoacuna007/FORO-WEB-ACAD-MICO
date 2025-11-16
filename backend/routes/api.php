<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PublicacionController;
use App\Http\Controllers\ComentarioController;
use App\Http\Controllers\NavegacionController;
use App\Http\Controllers\NotificacionController;
use App\Http\Controllers\PerfilController;
use App\Http\Controllers\CalendarioController;
use App\Http\Controllers\ModeracionController;

// Ruta de prueba
Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'API Foro Académico UPA funcionando!',
        'timestamp' => now(),
        'data' => [
            'version' => '1.0.0',
            'status' => 'active'
        ]
    ]);
});

// ==================== RUTAS PÚBLICAS ====================

// Rutas de autenticación con Rate Limiting
Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:5,1'); // 5 intentos por minuto
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1'); // 10 intentos por minuto
Route::post('/auth/recuperar', [AuthController::class, 'solicitarRecuperacion'])->middleware('throttle:3,15'); // 3 intentos cada 15 minutos
Route::post('/auth/recuperar/confirmar', [AuthController::class, 'restablecerPassword'])->middleware('throttle:5,15'); // 5 intentos cada 15 minutos
Route::get('/public/carreras', [NavegacionController::class, 'carrerasPublic']);

// Publicaciones públicas (lectura)
Route::get('/publicaciones/destacadas', [PublicacionController::class, 'destacadas']);
Route::get('/publicaciones', [PublicacionController::class, 'index']);
Route::get('/publicaciones/{id}', [PublicacionController::class, 'show']);
Route::get('/publicaciones/{id}/relacionadas', [PublicacionController::class, 'relacionadas']);

// Comentarios públicos (lectura de una publicación)
Route::get('/publicaciones/{publicacionId}/comentarios', [ComentarioController::class, 'index']);

// ==================== RUTAS PROTEGIDAS ====================

Route::middleware('auth:sanctum')->group(function () {
    // Autenticación
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Navegación
    Route::get('/carreras', [NavegacionController::class, 'carreras']);
    Route::get('/carreras/{id}', [NavegacionController::class, 'carrera']);
    Route::get('/carreras/{carreraId}/cuatrimestres', [NavegacionController::class, 'cuatrimestres']);
    Route::get('/materias', [NavegacionController::class, 'materias']);
    Route::get('/materias/{id}', [NavegacionController::class, 'materia']);
    Route::get('/estadisticas', [NavegacionController::class, 'estadisticas']);
    Route::get('/buscar', [NavegacionController::class, 'buscar']);

    // Publicaciones (acciones que requieren sesión)
    Route::post('/publicaciones', [PublicacionController::class, 'store']);
    Route::put('/publicaciones/{id}', [PublicacionController::class, 'update']);
    Route::delete('/publicaciones/{id}', [PublicacionController::class, 'destroy']);
    Route::post('/publicaciones/{id}/votar', [PublicacionController::class, 'votar']);
    Route::post('/publicaciones/{id}/guardar', [PublicacionController::class, 'guardar']);

    // Comentarios (crear/editar requieren sesión)
    Route::post('/comentarios', [ComentarioController::class, 'store']);
    Route::put('/comentarios/{id}', [ComentarioController::class, 'update']);
    Route::delete('/comentarios/{id}', [ComentarioController::class, 'destroy']);
    Route::post('/comentarios/{id}/votar', [ComentarioController::class, 'votar']);
    Route::post('/comentarios/{id}/aceptar', [ComentarioController::class, 'aceptar']);

    // Perfil
    Route::get('/perfil/publicaciones', [PerfilController::class, 'publicaciones']);
    Route::get('/perfil/guardados', [PerfilController::class, 'guardados']);
    Route::get('/perfil', [PerfilController::class, 'perfil']);
    Route::get('/perfil/{id}', [PerfilController::class, 'show']);
    Route::put('/perfil', [PerfilController::class, 'update']);
    Route::post('/perfil/avatar', [PerfilController::class, 'actualizarAvatar']);
    Route::post('/perfil/cambiar-password', [PerfilController::class, 'cambiarPassword']);

    // Notificaciones
    Route::get('/notificaciones', [NotificacionController::class, 'index']);
    Route::get('/notificaciones/no-leidas', [NotificacionController::class, 'noLeidas']);
    Route::post('/notificaciones/{id}/marcar-leida', [NotificacionController::class, 'marcarLeida']);
    Route::post('/notificaciones/marcar-todas-leidas', [NotificacionController::class, 'marcarTodasLeidas']);
    Route::delete('/notificaciones/{id}', [NotificacionController::class, 'destroy']);

    // Calendario
    Route::get('/eventos', [CalendarioController::class, 'index']);
    Route::post('/eventos', [CalendarioController::class, 'store']);
    Route::put('/eventos/{id}', [CalendarioController::class, 'update']);
    Route::delete('/eventos/{id}', [CalendarioController::class, 'destroy']);

    // Moderación
    Route::prefix('moderacion')->group(function () {
        Route::get('/dashboard', [ModeracionController::class, 'dashboard']);
        Route::get('/reportes', [ModeracionController::class, 'reportes']);
        Route::get('/reportes/{id}', [ModeracionController::class, 'reporte']);
        Route::post('/reportes/{id}/aprobar', [ModeracionController::class, 'aprobar']);
        Route::post('/reportes/{id}/advertir', [ModeracionController::class, 'advertir']);
        Route::post('/reportes/{id}/eliminar', [ModeracionController::class, 'eliminar']);
        Route::get('/actividad', [ModeracionController::class, 'actividad']);
        Route::get('/alertas', [ModeracionController::class, 'alertas']);
        Route::get('/usuarios', [ModeracionController::class, 'buscarUsuarios']);
        Route::get('/usuarios/bloqueados', [ModeracionController::class, 'usuariosBloqueados']);
        Route::post('/usuarios/bloquear', [ModeracionController::class, 'bloquearUsuario']);
        Route::post('/usuarios/reactivar', [ModeracionController::class, 'reactivarUsuario']);
        Route::post('/usuarios/advertir', [ModeracionController::class, 'advertirUsuario']);
        Route::post('/avisos', [ModeracionController::class, 'crearAviso']);
        Route::post('/log/exportar', [ModeracionController::class, 'exportarLog']);
    });
});