<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Publicacion extends Model
{
    protected $table = 'publicaciones';
    
    protected $fillable = [
        'titulo',
        'contenido',
        'categoria',
        'materia_id',
        'autor_id',
        'etiquetas',
        'vistas',
        'num_comentarios',
        'num_likes',
        'fijado',
        'activo',
    ];

    protected $casts = [
        'fijado' => 'boolean',
        'activo' => 'boolean',
        'vistas' => 'integer',
        'num_comentarios' => 'integer',
        'num_likes' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ==================== RELACIONES ====================
    
    public function autor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'autor_id');
    }

    public function materia(): BelongsTo
    {
        return $this->belongsTo(Materia::class, 'materia_id');
    }

    public function comentarios(): HasMany
    {
        return $this->hasMany(Comentario::class, 'publicacion_id');
    }

    public function likesUsuarios(): BelongsToMany
    {
        return $this->belongsToMany(Usuario::class, 'likes_publicaciones', 'publicacion_id', 'usuario_id')
            ->withPivot(['created_at']);
    }

    public function usuariosGuardados(): BelongsToMany
    {
        return $this->belongsToMany(Usuario::class, 'guardados', 'publicacion_id', 'usuario_id')
            ->withPivot(['created_at']);
    }

    // ==================== SCOPES ====================
    
    public function scopePorCategoria($query, $categoria)
    {
        if ($categoria && $categoria !== 'todas') {
            return $query->where('categoria', $categoria);
        }
        return $query;
    }

    public function scopePorMateria($query, $materiaId)
    {
        return $query->where('materia_id', $materiaId);
    }

    public function scopeFijadas($query)
    {
        return $query->where('fijado', true);
    }

    public function scopeActivas($query)
    {
        return $query->where('activo', true);
    }

    // ==================== ACCESORES / MUTADORES ====================

    public function getEtiquetasAttribute($value)
    {
        if (is_null($value) || $value === '') {
            return [];
        }

        if (is_array($value)) {
            return $value;
        }

        return collect(explode(',', $value))
            ->map(fn ($etiqueta) => trim($etiqueta))
            ->filter()
            ->values()
            ->toArray();
    }

    public function setEtiquetasAttribute($value)
    {
        if (is_array($value)) {
            $this->attributes['etiquetas'] = implode(',', array_map('trim', $value));
        } else {
            $this->attributes['etiquetas'] = $value;
        }
    }

    // ==================== MÉTODOS AUXILIARES ====================
    
    public function esAutor($usuarioId)
    {
        return $this->autor_id === $usuarioId;
    }

    public function incrementarVistas()
    {
        $this->increment('vistas');
    }

    public function sincronizarContadores()
    {
        $this->num_comentarios = $this->comentarios()->count();
        $this->num_likes = $this->likesUsuarios()->count();
        $this->save();
    }
}
