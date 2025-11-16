<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Comentario extends Model
{
    protected $table = 'comentarios';
    
    protected $fillable = [
        'contenido',
        'publicacion_id',
        'autor_id',
        'comentario_padre_id',
        'num_likes',
        'es_respuesta_util',
        'activo',
    ];

    protected $casts = [
        'num_likes' => 'integer',
        'es_respuesta_util' => 'boolean',
        'activo' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ==================== RELACIONES ====================
    
    public function autor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'autor_id');
    }

    public function publicacion(): BelongsTo
    {
        return $this->belongsTo(Publicacion::class, 'publicacion_id');
    }

    public function padre(): BelongsTo
    {
        return $this->belongsTo(Comentario::class, 'comentario_padre_id');
    }

    public function respuestas(): HasMany
    {
        return $this->hasMany(Comentario::class, 'comentario_padre_id');
    }

    public function likesUsuarios(): BelongsToMany
    {
        return $this->belongsToMany(Usuario::class, 'likes_comentarios', 'comentario_id', 'usuario_id')
            ->withPivot(['created_at']);
    }

    // ==================== SCOPES ====================
    
    public function scopePorPublicacion($query, $publicacionId)
    {
        return $query->where('publicacion_id', $publicacionId);
    }

    public function scopeRaices($query)
    {
        return $query->whereNull('comentario_padre_id');
    }

    public function scopeAceptadas($query)
    {
        return $query->where('es_respuesta_util', true);
    }

    // ==================== MÉTODOS AUXILIARES ====================
    
    public function esAutor($usuarioId)
    {
        return $this->autor_id === $usuarioId;
    }

    public function aceptarRespuesta()
    {
        $this->update(['es_respuesta_util' => true]);
    }

    public function sincronizarLikes()
    {
        $this->num_likes = $this->likesUsuarios()->count();
        $this->save();
    }
}
