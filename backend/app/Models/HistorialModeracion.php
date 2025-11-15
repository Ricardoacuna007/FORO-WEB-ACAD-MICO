<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HistorialModeracion extends Model
{
    protected $table = 'historial_moderacion';
    public $timestamps = false;

    protected $fillable = [
        'moderador_id',
        'usuario_afectado_id',
        'accion',
        'contenido_tipo',
        'contenido_id',
        'motivo',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function moderador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'moderador_id');
    }

    public function usuarioAfectado(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_afectado_id');
    }
}
