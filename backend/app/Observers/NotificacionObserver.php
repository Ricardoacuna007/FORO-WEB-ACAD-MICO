<?php

namespace App\Observers;

use App\Mail\NotificacionGenerica;
use App\Models\Notificacion;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

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
            Mail::to($usuario->email)->send(new NotificacionGenerica($notificacion));
        } catch (\Throwable $exception) {
            Log::warning('No se pudo enviar el correo de notificación.', [
                'notificacion_id' => $notificacion->id,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}

