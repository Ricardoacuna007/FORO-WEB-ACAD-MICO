<?php

namespace App\Http\Controllers;

use App\Models\Notificacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class NotificacionController extends Controller
{
    /**
     * Obtener notificaciones del usuario
     */
    public function index(Request $request)
    {
        try {
            $usuario = auth()->user();
            
            $query = Notificacion::where('usuario_id', $usuario->id)
                ->orderBy('created_at', 'desc');

            // Filtro por leídas/no leídas
            if ($request->has('leida')) {
                $query->where('leida', $request->leida);
            }

            $notificaciones = $query->paginate($request->get('per_page', 20));

            return response()->json([
                'success' => true,
                'data' => $notificaciones
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar notificaciones',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener notificaciones no leídas
     */
    public function noLeidas()
    {
        try {
            $usuario = auth()->user();
            
            $notificaciones = Notificacion::where('usuario_id', $usuario->id)
                ->noLeidas()
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();

            $count = Notificacion::where('usuario_id', $usuario->id)
                ->noLeidas()
                ->count();

            return response()->json([
                'success' => true,
                'data' => $notificaciones,
                'count' => $count
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar notificaciones',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Marcar notificación como leída
     */
    public function marcarLeida($id)
    {
        try {
            $usuario = auth()->user();
            $notificacion = Notificacion::where('usuario_id', $usuario->id)
                ->findOrFail($id);

            $notificacion->marcarComoLeida();

            return response()->json([
                'success' => true,
                'message' => 'Notificación marcada como leída'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al marcar notificación',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Marcar todas las notificaciones como leídas
     */
    public function marcarTodasLeidas()
    {
        try {
            $usuario = auth()->user();
            
            Notificacion::where('usuario_id', $usuario->id)
                ->noLeidas()
                ->update(['leida' => true]);

            return response()->json([
                'success' => true,
                'message' => 'Todas las notificaciones marcadas como leídas'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al marcar notificaciones',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar notificación
     */
    public function destroy($id)
    {
        try {
            $usuario = auth()->user();
            $notificacion = Notificacion::where('usuario_id', $usuario->id)
                ->findOrFail($id);

            $notificacion->delete();

            return response()->json([
                'success' => true,
                'message' => 'Notificación eliminada'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar notificación',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
