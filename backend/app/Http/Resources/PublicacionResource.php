<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicacionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $usuario = $request->user();
        
        return [
            'id' => $this->id,
            'titulo' => $this->titulo,
            'contenido' => $this->contenido,
            'categoria' => $this->categoria,
            'num_likes' => $this->num_likes ?? 0,
            'num_comentarios' => $this->num_comentarios ?? 0,
            'vistas' => $this->vistas ?? 0,
            'fijado' => (bool) ($this->fijado ?? false),
            'etiquetas' => $this->etiquetas ?? [],
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Relaciones
            'autor' => new UsuarioResource($this->whenLoaded('autor')),
            'materia' => new MateriaResource($this->whenLoaded('materia')),
            
            // Datos calculados/dinámicos
            'likeado' => $usuario ? $this->when(
                $this->relationLoaded('likesUsuarios'),
                fn() => $this->likesUsuarios->contains('id', $usuario->id),
                fn() => $this->likesUsuarios()->where('usuario_id', $usuario->id)->exists()
            ) : false,
            'guardado' => $usuario ? $this->when(
                isset($this->guardado),
                $this->guardado,
                fn() => $this->usuariosGuardados()->where('usuario_id', $usuario->id)->exists()
            ) : false,
        ];
    }
}

