<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Reporte extends Model
{
    protected $table = 'reportes';

    protected $fillable = [
        'publicacion_id',
        'comentario_id',
        'reportado_por',
        'motivo',
        'descripcion',
        'estado',
        'prioridad',
        'resuelto_por',
        'accion_tomada',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function publicacion(): BelongsTo
    {
        return $this->belongsTo(Publicacion::class, 'publicacion_id');
    }

    public function comentario(): BelongsTo
    {
        return $this->belongsTo(Comentario::class, 'comentario_id');
    }

    public function reportante(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'reportado_por');
    }

    public function moderador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'resuelto_por');
    }
}
