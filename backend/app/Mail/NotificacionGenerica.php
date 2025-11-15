<?php

namespace App\Mail;

use App\Models\Notificacion;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class NotificacionGenerica extends Mailable
{
    use Queueable, SerializesModels;

    public Notificacion $notificacion;

    /**
     * Create a new message instance.
     */
    public function __construct(Notificacion $notificacion)
    {
        $this->notificacion = $notificacion->withoutRelations();
    }

    /**
     * Build the message.
     */
    public function build(): self
    {
        $usuario = $this->notificacion->usuario;
        $subject = $this->notificacion->titulo ?: 'Nueva notificación en el Foro Académico UPA';

        return $this->subject($subject)
            ->view('emails.notificaciones.generica')
            ->with([
                'notificacion' => $this->notificacion,
                'usuario' => $usuario,
            ]);
    }
}

