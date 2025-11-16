<?php

namespace App\Jobs;

use App\Mail\NotificacionGenerica;
use App\Models\Notificacion;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendNotificationEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public Notificacion $notificacion;
    public int $tries = 3; // Intentar 3 veces
    public int $timeout = 60; // Timeout de 60 segundos

    /**
     * Create a new job instance.
     */
    public function __construct(Notificacion $notificacion)
    {
        $this->notificacion = $notificacion->withoutRelations();
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $notificacion = Notificacion::with('usuario')->find($this->notificacion->id);
        
        if (!$notificacion) {
            Log::warning('Notificación no encontrada para envío de email', [
                'notificacion_id' => $this->notificacion->id,
            ]);
            return;
        }

        $usuario = $notificacion->usuario;

        if (!$usuario || empty($usuario->email)) {
            Log::warning('Usuario no encontrado o sin email para notificación', [
                'notificacion_id' => $notificacion->id,
            ]);
            return;
        }

        try {
            Mail::to($usuario->email)->send(new NotificacionGenerica($notificacion));
            
            Log::info('Email de notificación enviado exitosamente', [
                'notificacion_id' => $notificacion->id,
                'usuario_id' => $usuario->id,
                'email' => $usuario->email,
            ]);
        } catch (\Throwable $exception) {
            Log::error('Error al enviar email de notificación', [
                'notificacion_id' => $notificacion->id,
                'usuario_id' => $usuario->id,
                'error' => $exception->getMessage(),
                'trace' => $exception->getTraceAsString(),
            ]);
            
            // Relanzar la excepción para que el job se reintente
            throw $exception;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Job de envío de email falló después de todos los intentos', [
            'notificacion_id' => $this->notificacion->id,
            'error' => $exception->getMessage(),
        ]);
    }
}

