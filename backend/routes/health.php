<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

/**
 * Health Check Routes
 * Endpoints para verificar el estado del sistema
 */
Route::get('/health', function () {
    $checks = [
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
        'version' => '1.0.0',
    ];

    // Verificar conexión a base de datos
    try {
        DB::connection()->getPdo();
        $checks['database'] = 'connected';
    } catch (\Exception $e) {
        $checks['database'] = 'disconnected';
        $checks['status'] = 'error';
    }

    // Verificar caché
    try {
        Cache::put('health_check', 'ok', 10);
        $checks['cache'] = Cache::get('health_check') === 'ok' ? 'working' : 'error';
    } catch (\Exception $e) {
        $checks['cache'] = 'error';
        $checks['status'] = 'error';
    }

    // Verificar storage
    try {
        $checks['storage'] = is_writable(storage_path()) ? 'writable' : 'readonly';
    } catch (\Exception $e) {
        $checks['storage'] = 'error';
    }

    $statusCode = $checks['status'] === 'ok' ? 200 : 503;

    return response()->json($checks, $statusCode);
});

Route::get('/health/detailed', function () {
    $checks = [
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
        'version' => config('app.version', '1.0.0'),
        'environment' => config('app.env'),
        'debug' => config('app.debug'),
    ];

    // Base de datos
    try {
        $pdo = DB::connection()->getPdo();
        $checks['database'] = [
            'status' => 'connected',
            'driver' => $pdo->getAttribute(\PDO::ATTR_DRIVER_NAME),
            'server_version' => $pdo->getAttribute(\PDO::ATTR_SERVER_VERSION),
        ];
    } catch (\Exception $e) {
        $checks['database'] = [
            'status' => 'error',
            'message' => $e->getMessage(),
        ];
        $checks['status'] = 'error';
    }

    // Caché
    try {
        $key = 'health_check_' . time();
        Cache::put($key, 'test', 10);
        $checks['cache'] = [
            'status' => Cache::get($key) === 'test' ? 'working' : 'error',
            'driver' => config('cache.default'),
        ];
        Cache::forget($key);
    } catch (\Exception $e) {
        $checks['cache'] = [
            'status' => 'error',
            'message' => $e->getMessage(),
        ];
    }

    // Storage
    $checks['storage'] = [
        'storage_path' => is_writable(storage_path()) ? 'writable' : 'readonly',
        'public_path' => is_writable(public_path()) ? 'writable' : 'readonly',
    ];

    // Memoria
    $checks['memory'] = [
        'usage' => round(memory_get_usage(true) / 1024 / 1024, 2) . ' MB',
        'peak' => round(memory_get_peak_usage(true) / 1024 / 1024, 2) . ' MB',
        'limit' => ini_get('memory_limit'),
    ];

    // PHP
    $checks['php'] = [
        'version' => PHP_VERSION,
        'sapi' => php_sapi_name(),
    ];

    $statusCode = $checks['status'] === 'ok' ? 200 : 503;

    return response()->json($checks, $statusCode);
})->middleware('throttle:10,1'); // Rate limit para endpoint detallado

