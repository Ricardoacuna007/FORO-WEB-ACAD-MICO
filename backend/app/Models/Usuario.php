<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;

class Usuario extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'usuarios';
    
    protected $fillable = [
        'nombre',
        'apellidos',
        'email',
        'password',
        'rol',
        'avatar',
        'activo',
        'suspension_activa',
        'suspendido_hasta',
        'suspension_motivo',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'suspension_activa' => 'boolean',
        'suspendido_hasta' => 'datetime',
    ];

    protected $appends = [
        'avatar_url',
    ];

    // ==================== RELACIONES ====================
    
    public function estudiante()
    {
        return $this->hasOne(Estudiante::class, 'usuario_id');
    }

    public function profesor()
    {
        return $this->hasOne(Profesor::class, 'usuario_id');
    }

    public function publicaciones()
    {
        return $this->hasMany(Publicacion::class, 'autor_id');
    }

    public function comentarios()
    {
        return $this->hasMany(Comentario::class, 'autor_id');
    }

    public function publicacionesGuardadas()
    {
        return $this->belongsToMany(Publicacion::class, 'guardados', 'usuario_id', 'publicacion_id')
            ->withPivot(['created_at']);
    }

    // ==================== MÉTODOS AUXILIARES ====================
    
    public function isEstudiante()
    {
        return $this->rol === 'estudiante';
    }

    public function isProfesor()
    {
        return $this->rol === 'profesor';
    }

    public function isAdmin()
    {
        return $this->rol === 'admin';
    }

    public function getNombreCompletoAttribute()
    {
        return $this->nombre . ' ' . $this->apellidos;
    }

    public function getAvatarUrlAttribute(): ?string
    {
        if (!$this->avatar) {
            return null;
        }

        if (Str::startsWith($this->avatar, ['http://', 'https://'])) {
            return $this->avatar;
        }

        $relative = ltrim($this->avatar, '/');

        if (Str::startsWith($relative, 'frontend/storage/')) {
            $relative = substr($relative, strlen('frontend/'));
        }

        if (Str::startsWith($relative, 'frontend/uploads/')) {
            $relative = substr($relative, strlen('frontend/'));
        }

        if (Str::startsWith($relative, 'uploads/avatars/')) {
            $relative = 'storage/' . substr($relative, strlen('uploads/'));
        }

        $publicPath = public_path($relative);

        if (File::exists($publicPath)) {
            return asset($relative);
        }

        if (Str::startsWith($relative, 'storage/')) {
            $storageRelative = substr($relative, strlen('storage/'));
            if ($storageRelative) {
                $storagePath = Storage::disk('public')->path($storageRelative);
                if (File::exists($storagePath)) {
                    $publicDir = dirname($publicPath);
                    if (!File::exists($publicDir)) {
                        File::makeDirectory($publicDir, 0755, true, true);
                    }
                    File::copy($storagePath, $publicPath);
                    return asset($relative);
                }
            }
        }

        return null;
    }
}