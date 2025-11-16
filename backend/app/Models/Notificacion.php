<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Notificacion extends Model
{
    protected $table = 'notificaciones';
    
    protected $fillable = [
        'usuario_id',
        'tipo',
        'titulo',
        'mensaje',
        'link',
        'leida',
        'data',
    ];

    protected $casts = [
        'leida' => 'boolean',
        'data' => 'array',
        'created_at' => 'datetime',
    ];

    public $timestamps = false;
    const CREATED_AT = 'created_at';
    const UPDATED_AT = null;

    protected $appends = [
        'enlace',
    ];

    // ==================== RELACIONES ====================
    
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    // ==================== ACCESORES ====================

    public function getEnlaceAttribute(): ?string
    {
        $valor = $this->attributes['link'] ?? null;
        if (!$valor) {
            return null;
        }

        if (Str::startsWith($valor, ['http://', 'https://'])) {
            return $valor;
        }

        return url($valor);
    }

    public function setEnlaceAttribute(?string $value): void
    {
        $this->attributes['link'] = $value;
    }

    // ==================== SCOPES ====================
    
    public function scopeNoLeidas($query)
    {
        return $query->where('leida', false);
    }

    public function scopePorUsuario($query, $usuarioId)
    {
        return $query->where('usuario_id', $usuarioId);
    }

    // ==================== MÉTODOS AUXILIARES ====================
    
    public function marcarComoLeida()
    {
        $this->fill(['leida' => true]);
        $this->save();
    }
}
