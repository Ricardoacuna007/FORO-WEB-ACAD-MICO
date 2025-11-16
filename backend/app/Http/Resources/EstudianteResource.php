<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EstudianteResource extends JsonResource
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
            'matricula' => $this->matricula,
            'cuatrimestre_actual' => $this->cuatrimestre_actual,
            'turno' => $this->turno,
            'carrera' => new CarreraResource($this->whenLoaded('carrera')),
        ];
    }
}

