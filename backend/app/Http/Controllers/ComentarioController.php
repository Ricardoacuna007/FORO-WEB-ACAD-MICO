<?php

namespace App\Http\Controllers;

use App\Models\Comentario;
use App\Models\Publicacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class ComentarioController extends Controller
{
    /**
     * Listar comentarios de una publicación
     */
    public function index(Request $request, $publicacionId)
    {
        try {
            $comentarios = Comentario::with(['autor', 'respuestas.autor'])
                ->porPublicacion($publicacionId)
                ->raices()
                ->orderBy('es_respuesta_util', 'desc')
                ->orderBy('num_likes', 'desc')
                ->orderBy('created_at', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $comentarios
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar comentarios',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear nuevo comentario
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'contenido' => 'required|string|max:5000|min:3',
            'publicacion_id' => 'required|exists:publicaciones,id',
            'comentario_padre_id' => 'sometimes|exists:comentarios,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $comentario = Comentario::create([
                'contenido' => $request->contenido,
                'publicacion_id' => $request->publicacion_id,
                'autor_id' => auth()->id(),
                'comentario_padre_id' => $request->comentario_padre_id ?? null,
                'num_likes' => 0,
                'es_respuesta_util' => false,
                'activo' => true,
            ]);

            $comentario->load(['autor', 'publicacion']);

            // Actualizar contador en la publicación
            $comentario->publicacion?->increment('num_comentarios');

            return response()->json([
                'success' => true,
                'message' => 'Comentario creado exitosamente',
                'data' => $comentario
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el comentario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar comentario
     */
    public function update(Request $request, $id)
    {
        $comentario = Comentario::findOrFail($id);

        // Verificar que el usuario es el autor
        if ($comentario->autor_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permiso para editar este comentario'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'contenido' => 'required|string|max:5000|min:3',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $comentario->update([
                'contenido' => $request->contenido
            ]);

            $comentario->load(['autor']);

            return response()->json([
                'success' => true,
                'message' => 'Comentario actualizado exitosamente',
                'data' => $comentario
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el comentario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar comentario
     */
    public function destroy($id)
    {
        $comentario = Comentario::findOrFail($id);

        // Verificar que el usuario es el autor o admin
        if ($comentario->autor_id !== auth()->id() && !auth()->user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permiso para eliminar este comentario'
            ], 403);
        }

        try {
            $publicacion = $comentario->publicacion;
            $comentario->delete();

            if ($publicacion) {
                $publicacion->num_comentarios = max(0, $publicacion->num_comentarios - 1);
                $publicacion->save();
            }

            return response()->json([
                'success' => true,
                'message' => 'Comentario eliminado exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el comentario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Gestionar like de un comentario
     */
    public function votar(Request $request, $id)
    {
        $comentario = Comentario::findOrFail($id);
        $usuario = auth()->user();

        $validator = Validator::make($request->all(), [
            'tipo' => 'required|in:up,down'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $yaLikeo = $comentario->likesUsuarios()->where('usuario_id', $usuario->id)->exists();
            if ($request->tipo === 'up') {
                if (!$yaLikeo) {
                    $comentario->likesUsuarios()->attach($usuario->id);
                }
            } else {
                if ($yaLikeo) {
                    $comentario->likesUsuarios()->detach($usuario->id);
                }
            }

            $comentario->sincronizarLikes();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Acción registrada correctamente',
                'data' => [
                    'num_likes' => $comentario->num_likes,
                    'likeado' => $request->tipo === 'up'
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al procesar la acción',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Aceptar respuesta (solo el autor de la publicación)
     */
    public function aceptar($id)
    {
        $comentario = Comentario::with('publicacion')->findOrFail($id);
        $publicacion = $comentario->publicacion;

        // Verificar que el usuario es el autor de la publicación
        if ($publicacion->autor_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Solo el autor de la publicación puede aceptar respuestas'
            ], 403);
        }

        try {
            // Desmarcar otras respuestas aceptadas de esta publicación
            Comentario::where('publicacion_id', $publicacion->id)
                ->where('id', '!=', $id)
                ->update(['es_respuesta_util' => false]);

            // Marcar esta respuesta como aceptada
            $comentario->aceptarRespuesta();

            return response()->json([
                'success' => true,
                'message' => 'Respuesta aceptada exitosamente',
                'data' => $comentario
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al aceptar la respuesta',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
