<?php

namespace App\Http\Controllers;

use App\Models\Evento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CalendarioController extends Controller
{
    /**
     * Obtener eventos
     */
    public function index(Request $request)
    {
        try {
            $query = Evento::with(['materia.cuatrimestre.carrera', 'creador']);

            // Filtro por fecha
            if ($request->has('fecha_inicio')) {
                $query->whereDate('fecha_inicio', '>=', $request->fecha_inicio);
            }

            if ($request->has('fecha_fin')) {
                $query->whereDate('fecha_fin', '<=', $request->fecha_fin);
            }

            // Filtro por materia
            if ($request->has('materia_id')) {
                $query->where('materia_id', $request->materia_id);
            }

            // Filtro por categoría
            if ($request->has('categoria')) {
                $query->where('categoria', $request->categoria);
            }

            $eventos = $query->orderBy('fecha_inicio', 'asc')->get();

            return response()->json([
                'success' => true,
                'data' => $eventos
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar eventos',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear evento
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'titulo' => 'required|string|max:200',
            'descripcion' => 'sometimes|string|max:1000',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'sometimes|date|after_or_equal:fecha_inicio',
            'categoria' => 'required|in:examen,entrega,clase,evento,otro',
            'materia_id' => 'sometimes|exists:materias,id',
            'todo_el_dia' => 'sometimes|boolean',
            'recordatorio' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $evento = Evento::create([
                'titulo' => $request->titulo,
                'descripcion' => $request->descripcion ?? null,
                'categoria' => $request->categoria,
                'materia_id' => $request->materia_id ?? null,
                'fecha_inicio' => $request->fecha_inicio,
                'fecha_fin' => $request->fecha_fin ?? $request->fecha_inicio,
                'todo_el_dia' => $request->boolean('todo_el_dia', false),
                'recordatorio' => $request->boolean('recordatorio', true),
                'creador_id' => auth()->id(),
            ]);

            $evento->load(['materia.cuatrimestre.carrera', 'creador']);

            return response()->json([
                'success' => true,
                'message' => 'Evento creado exitosamente',
                'data' => $evento
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el evento',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar evento
     */
    public function update(Request $request, $id)
    {
        $evento = Evento::findOrFail($id);

        // Verificar que el usuario es el creador
        if ($evento->creador_id !== auth()->id() && !auth()->user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permiso para editar este evento'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'titulo' => 'sometimes|required|string|max:200',
            'descripcion' => 'sometimes|string|max:1000',
            'fecha_inicio' => 'sometimes|required|date',
            'fecha_fin' => 'sometimes|date|after_or_equal:fecha_inicio',
            'categoria' => 'sometimes|required|in:examen,entrega,clase,evento,otro',
            'todo_el_dia' => 'sometimes|boolean',
            'recordatorio' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $evento->update($request->only([
                'titulo',
                'descripcion',
                'fecha_inicio',
                'fecha_fin',
                'categoria',
                'todo_el_dia',
                'recordatorio',
            ]));

            $evento->load(['materia.cuatrimestre.carrera', 'creador']);

            return response()->json([
                'success' => true,
                'message' => 'Evento actualizado exitosamente',
                'data' => $evento
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el evento',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar evento
     */
    public function destroy($id)
    {
        $evento = Evento::findOrFail($id);

        // Verificar que el usuario es el creador o admin
        if ($evento->creador_id !== auth()->id() && !auth()->user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permiso para eliminar este evento'
            ], 403);
        }

        try {
            $evento->delete();

            return response()->json([
                'success' => true,
                'message' => 'Evento eliminado exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el evento',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
