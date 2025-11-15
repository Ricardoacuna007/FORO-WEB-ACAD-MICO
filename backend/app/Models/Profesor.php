<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Profesor extends Model
{
    protected $table = 'profesores';
    
    protected $fillable = [
        'usuario_id',
        'num_empleado',
        'especialidad',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    // ==================== RELACIONES ====================
    
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function materias(): HasMany
    {
        return $this->hasMany(Materia::class, 'profesor_id');
    }
}
