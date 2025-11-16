<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UsuarioResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'apellidos' => $this->apellidos,
            'nombre_completo' => $this->nombre_completo,
            'email' => $this->email,
            'rol' => $this->rol,
            'avatar' => $this->avatar,
            'avatar_url' => $this->avatar_url,
            'activo' => (bool) $this->activo,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Relaciones
            'estudiante' => new EstudianteResource($this->whenLoaded('estudiante')),
            'profesor' => new ProfesorResource($this->whenLoaded('profesor')),
        ];
    }
}

