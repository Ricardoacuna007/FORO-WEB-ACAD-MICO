<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Usuario extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'usuarios';

    protected $fillable = [
        'nombre',
        'apellidos',
        'email',
        'password',
        'rol',
        'avatar',
        'activo',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'activo' => 'boolean',
    ];

    // Relaciones
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

    public function notificaciones()
    {
        return $this->hasMany(Notificacion::class, 'usuario_id');
    }

    // Scopes
    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }

    public function scopeEstudiantes($query)
    {
        return $query->where('rol', 'estudiante');
    }

    public function scopeProfesores($query)
    {
        return $query->where('rol', 'profesor');
    }

    // Métodos de utilidad
    public function getNombreCompletoAttribute()
    {
        return $this->nombre . ' ' . $this->apellidos;
    }

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
}