<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Materia extends Model
{
    protected $table = 'materias';
    
    protected $fillable = [
        'nombre',
        'codigo',
        'descripcion',
        'cuatrimestre_id',
        'profesor_id',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    protected $appends = [
        'carrera',
    ];

    // ==================== RELACIONES ====================
    
    public function cuatrimestre(): BelongsTo
    {
        return $this->belongsTo(Cuatrimestre::class, 'cuatrimestre_id');
    }

    public function profesor(): BelongsTo
    {
        return $this->belongsTo(Profesor::class, 'profesor_id');
    }

    public function publicaciones(): HasMany
    {
        return $this->hasMany(Publicacion::class, 'materia_id');
    }

    public function estudiantes(): BelongsToMany
    {
        return $this->belongsToMany(Estudiante::class, 'inscripciones', 'materia_id', 'estudiante_id')
            ->withPivot(['created_at']);
    }

    // ==================== ACCESORES ====================

    public function getCarreraAttribute(): ?array
    {
        $carrera = $this->cuatrimestre?->carrera;

        if (!$carrera) {
            return null;
        }

        return [
            'id' => $carrera->id,
            'nombre' => $carrera->nombre,
            'codigo' => $carrera->codigo,
        ];
    }
}
