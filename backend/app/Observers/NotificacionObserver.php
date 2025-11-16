<?php

namespace App\Observers;

use App\Jobs\SendNotificationEmail;
use App\Models\Notificacion;
use Illuminate\Support\Facades\Log;

class NotificacionObserver
{
    /**
     * Handle the Notificacion "created" event.
     */
    public function created(Notificacion $notificacion): void
    {
        $usuario = $notificacion->usuario;

        if (!$usuario || empty($usuario->email)) {
            return;
        }

        try {
            // Enviar email en background usando queue
            SendNotificationEmail::dispatch($notificacion);
        } catch (\Throwable $exception) {
            Log::warning('No se pudo encolar el correo de notificación.', [
                'notificacion_id' => $notificacion->id,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}

