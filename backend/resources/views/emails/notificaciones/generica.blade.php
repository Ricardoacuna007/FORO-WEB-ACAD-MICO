<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Nueva notificación</title>
</head>
<body style="font-family: Arial, sans-serif; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #003366;">Hola {{ $usuario?->nombre ?? 'Usuario' }} 👋</h1>

        <p style="font-size: 16px; line-height: 1.5;">
            Tienes una nueva notificación en el Foro Académico UPA:
        </p>

        <div style="border-left: 4px solid #ff6600; padding: 16px 24px; margin: 24px 0; background: #f8f9fa;">
            <h2 style="margin-top: 0; color: #003366;">{{ $notificacion->titulo ?? 'Notificación' }}</h2>
            <p style="margin: 0;">{{ $notificacion->mensaje ?? 'Revisa tu panel para más detalles.' }}</p>
        </div>

        @if(!empty($notificacion->enlace))
            <p style="text-align: center;">
                <a href="{{ $notificacion->enlace }}" style="display: inline-block; padding: 12px 24px; background: #003366; color: #fff; text-decoration: none; border-radius: 6px;">
                    Ver detalle en el foro
                </a>
            </p>
        @endif

        <p style="font-size: 14px; color: #666; margin-top: 32px;">
            Si no quieres recibir más correos, puedes ajustar tus preferencias desde tu perfil.
        </p>

        <p style="font-size: 14px; color: #666;">
            — Equipo Foro Académico UPA
        </p>
    </div>
</body>
</html>

