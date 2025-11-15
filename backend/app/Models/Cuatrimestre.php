<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cuatrimestre extends Model
{
    protected $table = 'cuatrimestres';
    
    protected $fillable = [
        'numero',
        'carrera_id',
        'activo',
    ];

    protected $casts = [
        'numero' => 'integer',
        'activo' => 'boolean',
    ];

    // ==================== RELACIONES ====================
    
    public function carrera(): BelongsTo
    {
        return $this->belongsTo(Carrera::class, 'carrera_id');
    }

    public function materias(): HasMany
    {
        return $this->hasMany(Materia::class, 'cuatrimestre_id');
    }
}

