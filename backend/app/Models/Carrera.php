<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Carrera extends Model
{
    protected $table = 'carreras';
    
    protected $fillable = [
        'nombre',
        'codigo',
        'descripcion',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    // ==================== RELACIONES ====================
    
    public function estudiantes(): HasMany
    {
        return $this->hasMany(Estudiante::class, 'carrera_id');
    }

    public function materias(): HasManyThrough
    {
        return $this->hasManyThrough(
            Materia::class,
            Cuatrimestre::class,
            'carrera_id',      // Foreign key on cuatrimestres table...
            'cuatrimestre_id', // Foreign key on materias table...
            'id',              // Local key on carreras table...
            'id'               // Local key on cuatrimestres table...
        );
    }

    public function cuatrimestres(): HasMany
    {
        return $this->hasMany(Cuatrimestre::class, 'carrera_id');
    }
}
