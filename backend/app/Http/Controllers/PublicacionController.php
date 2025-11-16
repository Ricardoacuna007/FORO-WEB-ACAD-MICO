<?php

namespace App\Http\Controllers;

use App\Models\Publicacion;
use App\Models\Materia;
use App\Models\Usuario;
use App\Http\Resources\PublicacionResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class PublicacionController extends Controller
{
    /**
     * Listar publicaciones con filtros
     */
    public function index(Request $request)
    {
        try {
            $usuario = auth()->user();
            // Eager loading mejorado para evitar N+1 queries
            $query = Publicacion::with([
                'autor.estudiante.carrera',
                'autor.profesor',
                'materia.cuatrimestre.carrera'
            ])->activas();

            $carreraId = null;

            if ($usuario) {
                if ($usuario->isEstudiante()) {
                    $carreraId = optional($usuario->estudiante)->carrera_id;
                } elseif ($usuario->isAdmin() || $usuario->isProfesor()) {
                    if ($request->filled('carrera_id')) {
                        $carreraId = (int) $request->carrera_id;
                    }
                }
            } elseif ($request->filled('carrera_id')) {
                $carreraId = (int) $request->carrera_id;
            }

            if ($carreraId) {
                $query->whereHas('materia.cuatrimestre', function ($q) use ($carreraId) {
                    $q->where('carrera_id', $carreraId);
                });
            }

            // Filtro por materia
            if ($request->has('materia_id')) {
                $query->porMateria($request->materia_id);
            }

            // Filtro por categoría
            if ($request->has('categoria')) {
                $query->porCategoria($request->categoria);
            }

            // Ordenamiento
            $orden = $request->get('orden', 'reciente');
            switch ($orden) {
                case 'popular':
                    $query->orderBy('num_likes', 'desc');
                    break;
                case 'sin_responder':
                    $query->where('num_comentarios', 0);
                    break;
                case 'reciente':
                default:
                    $query->orderBy('created_at', 'desc');
                    break;
            }

            // Publicaciones fijadas primero
            $query->orderBy('fijado', 'desc');

            // Cargar relaciones necesarias para el usuario actual
            if ($usuario) {
                $query->with(['likesUsuarios' => function ($q) use ($usuario) {
                    $q->where('usuario_id', $usuario->id);
                }]);
            }
            
            // Cache key único basado en filtros
            $cacheKey = 'publicaciones_' . md5(json_encode([
                'carrera_id' => $carreraId,
                'materia_id' => $request->materia_id,
                'categoria' => $request->categoria,
                'orden' => $orden,
                'page' => $request->page,
                'per_page' => $request->get('per_page', 15),
                'usuario_id' => $usuario?->id ?? 'anon'
            ]));

            $publicaciones = Cache::remember($cacheKey, 300, function () use ($query, $request) {
                return $query->paginate($request->get('per_page', 15));
            });
            
            // Agregar información de guardado para cada publicación
            if ($usuario) {
                $publicacionIds = $publicaciones->pluck('id')->toArray();
                $guardadas = $usuario->publicacionesGuardadas()
                    ->whereIn('publicacion_id', $publicacionIds)
                    ->pluck('publicacion_id')
                    ->toArray();
                
                foreach ($publicaciones->items() as $publicacion) {
                    $publicacion->guardado = in_array($publicacion->id, $guardadas);
                }
            }

            return response()->json([
                'success' => true,
                'data' => PublicacionResource::collection($publicaciones->items()),
                'meta' => [
                    'current_page' => $publicaciones->currentPage(),
                    'last_page' => $publicaciones->lastPage(),
                    'per_page' => $publicaciones->perPage(),
                    'total' => $publicaciones->total(),
                    'from' => $publicaciones->firstItem(),
                    'to' => $publicaciones->lastItem(),
                ],
                'links' => [
                    'first' => $publicaciones->url(1),
                    'last' => $publicaciones->url($publicaciones->lastPage()),
                    'prev' => $publicaciones->previousPageUrl(),
                    'next' => $publicaciones->nextPageUrl(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar publicaciones',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener una publicación específica
     */
    public function show($id)
    {
        try {
            $usuario = auth()->user();
            
            // Cache para publicación individual (5 minutos)
            $cacheKey = 'publicacion_' . $id;
            $publicacion = Cache::remember($cacheKey, 300, function () use ($id) {
                return Publicacion::with([
                    'autor.estudiante.carrera',
                    'autor.profesor',
                    'materia.cuatrimestre.carrera',
                    'comentarios.autor.estudiante.carrera',
                    'comentarios.autor.profesor'
                ])->findOrFail($id);
            });

            if (!$this->usuarioPuedeAccederAPublicacion($publicacion, $usuario)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permiso para acceder a esta publicación'
                ], 403);
            }

            // Incrementar vistas
            $publicacion->incrementarVistas();
            $publicacion->refresh()->load(['autor', 'materia.cuatrimestre.carrera']);

            // Verificar si el usuario guardó o dio like a esta publicación
            if ($usuario instanceof Usuario) {
                $publicacion->guardado = $publicacion->usuariosGuardados()
                    ->where('usuario_id', $usuario->id)
                    ->exists();

                $publicacion->likeado = $publicacion->likesUsuarios()
                    ->where('usuario_id', $usuario->id)
                    ->exists();
            } else {
                $publicacion->guardado = false;
                $publicacion->likeado = false;
            }

            return response()->json([
                'success' => true,
                'data' => $publicacion
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar la publicación',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear nueva publicación
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'titulo' => 'required|string|max:200|min:5',
            'contenido' => 'required|string|max:5000|min:10',
            'categoria' => 'required|in:duda,recurso,aviso,discusion',
            'materia_id' => 'required|exists:materias,id',
            'etiquetas' => 'sometimes|array',
            'etiquetas.*' => 'string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $usuario = auth()->user();
            $materia = Materia::with('cuatrimestre')->findOrFail($request->materia_id);

            if ($usuario && $usuario->isEstudiante()) {
                $carreraUsuario = optional($usuario->estudiante)->carrera_id;
                $carreraMateria = optional($materia->cuatrimestre)->carrera_id;

                if (!$carreraUsuario || !$carreraMateria || (int) $carreraUsuario !== (int) $carreraMateria) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No puedes crear publicaciones en una carrera diferente a la tuya'
                    ], 403);
                }
            }

            $publicacion = Publicacion::create([
                'titulo' => $request->titulo,
                'contenido' => $request->contenido,
                'categoria' => $request->categoria,
                'materia_id' => $request->materia_id,
                'autor_id' => auth()->id(),
                'etiquetas' => $request->etiquetas ?? [],
                'vistas' => 0,
                'num_comentarios' => 0,
                'num_likes' => 0,
                'fijado' => false,
                'activo' => true,
            ]);

            $publicacion->load(['autor', 'materia.cuatrimestre.carrera']);

            return response()->json([
                'success' => true,
                'message' => 'Publicación creada exitosamente',
                'data' => $publicacion
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear la publicación',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar publicación
     */
    public function update(Request $request, $id)
    {
        $publicacion = Publicacion::findOrFail($id);

        // Verificar que el usuario es el autor
        if ($publicacion->autor_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permiso para editar esta publicación'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'titulo' => 'sometimes|required|string|max:200|min:5',
            'contenido' => 'sometimes|required|string|max:5000|min:10',
            'categoria' => 'sometimes|required|in:duda,recurso,aviso,discusion',
            'etiquetas' => 'sometimes|array',
            'etiquetas.*' => 'string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $publicacion->update($request->only([
                'titulo', 'contenido', 'categoria', 'etiquetas'
            ]));

            $publicacion->load(['autor', 'materia.cuatrimestre.carrera']);

            return response()->json([
                'success' => true,
                'message' => 'Publicación actualizada exitosamente',
                'data' => $publicacion
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar la publicación',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar publicación
     */
    public function destroy($id)
    {
        $publicacion = Publicacion::findOrFail($id);

        // Verificar que el usuario es el autor o admin
        if ($publicacion->autor_id !== auth()->id() && !auth()->user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permiso para eliminar esta publicación'
            ], 403);
        }

        try {
            $publicacion->delete();

            return response()->json([
                'success' => true,
                'message' => 'Publicación eliminada exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la publicación',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Gestionar like de una publicación
     */
    public function votar(Request $request, $id)
    {
        $publicacion = Publicacion::findOrFail($id);
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

            $yaLikeo = $publicacion->likesUsuarios()->where('usuario_id', $usuario->id)->exists();

            if ($request->tipo === 'up') {
                if (!$yaLikeo) {
                    $publicacion->likesUsuarios()->attach($usuario->id);
                }
            } else { // down => quitar like
                if ($yaLikeo) {
                    $publicacion->likesUsuarios()->detach($usuario->id);
                }
            }

            $publicacion->sincronizarContadores();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Acción registrada correctamente',
                'data' => [
                    'num_likes' => $publicacion->num_likes,
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
     * Guardar publicación en favoritos
     */
    public function guardar($id)
    {
        $publicacion = Publicacion::findOrFail($id);
        $usuario = auth()->user();

        try {
            if ($publicacion->usuariosGuardados()->where('usuario_id', $usuario->id)->exists()) {
                // Quitar de guardados
                $publicacion->usuariosGuardados()->detach($usuario->id);
                $guardado = false;
            } else {
                // Agregar a guardados
                $publicacion->usuariosGuardados()->attach($usuario->id);
                $guardado = true;
            }

            return response()->json([
                'success' => true,
                'message' => $guardado ? 'Publicación guardada' : 'Publicación quitada de guardados',
                'data' => ['guardado' => $guardado]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al guardar la publicación',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener publicaciones relacionadas
     */
    public function relacionadas($id)
    {
        try {
            $publicacion = Publicacion::findOrFail($id);
            
            $relacionadas = Publicacion::where('materia_id', $publicacion->materia_id)
                ->where('id', '!=', $id)
                ->activas()
                ->with(['autor', 'materia'])
                ->orderBy('num_likes', 'desc')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $relacionadas
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar publicaciones relacionadas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener publicaciones destacadas
     */
    public function destacadas()
    {
        try {
            $usuario = auth()->user();
            $carreraId = null;

            if ($usuario && $usuario->isEstudiante()) {
                $carreraId = optional($usuario->estudiante)->carrera_id;
            } elseif (request()->filled('carrera_id')) {
                $carreraId = (int) request()->carrera_id;
            }

            $query = Publicacion::with(['autor', 'materia.cuatrimestre.carrera'])
                ->activas();

            if ($carreraId) {
                $query->whereHas('materia.cuatrimestre', function ($q) use ($carreraId) {
                    $q->where('carrera_id', $carreraId);
                });
            }

            $destacadas = $query
                ->orderBy('num_likes', 'desc')
                ->orderBy('vistas', 'desc')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $destacadas
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar publicaciones destacadas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Determina si un usuario puede ver una publicación específica.
     *
     * Regla general:
     * - Si no hay usuario autenticado: no tiene acceso (son rutas públicas, pero el frontend controla la visibilidad).
     * - Usuarios autenticados siempre pueden ver la publicación.
     * - La restricción por carrera se aplica principalmente en listados (index).
     * - Admins y profesores siempre pueden ver cualquier publicación.
     * - Para estudiantes, solo se valida la carrera si la relación está completamente cargada;
     *   si faltan datos de relaciones, se permite el acceso para evitar falsos 403.
     */
    protected function usuarioPuedeAccederAPublicacion(Publicacion $publicacion, ?Usuario $usuario): bool
    {
        // Si no hay usuario autenticado, PERMITIMOS acceso de lectura.
        // La restricción por carrera se aplica solo para usuarios autenticados (en listados).
        if (!$usuario) {
            return true;
        }

        // Admins y profesores tienen acceso total
        if (method_exists($usuario, 'isAdmin') && $usuario->isAdmin()) {
            return true;
        }

        if (method_exists($usuario, 'isProfesor') && $usuario->isProfesor()) {
            return true;
        }

        // Estudiantes: aplicar restricción de carrera solo si tenemos datos completos
        if (method_exists($usuario, 'isEstudiante') && $usuario->isEstudiante()) {
            // Si no hay relaciones cargadas o faltan datos, no bloqueamos: permitimos acceso
            if (
                !$publicacion->relationLoaded('materia') ||
                !$publicacion->materia ||
                !$publicacion->materia->relationLoaded('cuatrimestre') ||
                !$publicacion->materia->cuatrimestre
            ) {
                return true;
            }

            $carreraUsuario = optional($usuario->estudiante)->carrera_id;
            $carreraPublicacion = optional($publicacion->materia->cuatrimestre)->carrera_id;

            // Si alguna carrera no está definida, también permitimos acceso
            if (!$carreraUsuario || !$carreraPublicacion) {
                return true;
            }

            // Solo restringimos cuando ambas carreras están definidas
            return (int) $carreraUsuario === (int) $carreraPublicacion;
        }

        // Cualquier otro tipo de usuario tiene acceso por defecto
        return true;
    }
}
