<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Evento extends Model
{
    protected $table = 'eventos_calendario';
    
    protected $fillable = [
        'titulo',
        'descripcion',
        'categoria',
        'materia_id',
        'fecha_inicio',
        'fecha_fin',
        'todo_el_dia',
        'creador_id',
        'recordatorio',
    ];

    protected $casts = [
        'fecha_inicio' => 'datetime',
        'fecha_fin' => 'datetime',
        'todo_el_dia' => 'boolean',
        'recordatorio' => 'boolean',
    ];

    // ==================== RELACIONES ====================
    
    public function materia(): BelongsTo
    {
        return $this->belongsTo(Materia::class, 'materia_id');
    }

    public function creador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'creador_id');
    }

    // ==================== SCOPES ====================
    
    public function scopePosterioresA($query, $fecha)
    {
        return $query->whereDate('fecha_inicio', '>=', $fecha);
    }

    public function scopeCategoria($query, $categoria)
    {
        if ($categoria) {
            return $query->where('categoria', $categoria);
        }
        return $query;
    }
}
