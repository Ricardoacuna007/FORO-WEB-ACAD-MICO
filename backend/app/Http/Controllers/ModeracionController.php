<?php

namespace App\Http\Controllers;

use App\Models\Reporte;
use App\Models\HistorialModeracion;
use App\Models\Materia;
use App\Models\Usuario;
use App\Models\Publicacion;
use App\Models\Comentario;
use App\Models\Notificacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ModeracionController extends Controller
{
    /**
     * Resumen principal del panel de moderación
     */
    public function dashboard()
    {
        try {
            $moderador = auth()->user();

            $estadisticas = [
                'reportes_pendientes' => Reporte::where('estado', 'pendiente')->count(),
                'resueltos_hoy' => Reporte::where('estado', 'resuelto')
                    ->whereDate('updated_at', Carbon::today())
                    ->count(),
                'contenido_eliminado' => HistorialModeracion::where('accion', 'eliminacion_contenido')->count(),
                'advertencias_enviadas' => HistorialModeracion::where('accion', 'advertencia')->count(),
            ];

            $materias = Materia::where('activo', true)
                ->orderBy('nombre')
                ->get(['id', 'nombre']);

            $tipos = collect([
                ['id' => 'spam', 'nombre' => 'Spam'],
                ['id' => 'ofensivo', 'nombre' => 'Ofensivo'],
                ['id' => 'inapropiado', 'nombre' => 'Contenido inapropiado'],
                ['id' => 'plagio', 'nombre' => 'Plagio'],
                ['id' => 'otro', 'nombre' => 'Otro'],
            ]);

            $estados = Reporte::select('estado', DB::raw('COUNT(*) as total'))
                ->groupBy('estado')
                ->pluck('total', 'estado');

            $prioridades = Reporte::select('prioridad', DB::raw('COUNT(*) as total'))
                ->groupBy('prioridad')
                ->pluck('total', 'prioridad');

            $statsDetalladas = [
                'indicadores' => [
                    ['nombre' => 'Reportes resueltos', 'valor' => Reporte::where('estado', 'resuelto')->count(), 'color' => 'success'],
                    ['nombre' => 'Reportes en revisión', 'valor' => Reporte::where('estado', 'en_revision')->count(), 'color' => 'warning'],
                    ['nombre' => 'Usuarios advertidos', 'valor' => HistorialModeracion::where('accion', 'advertencia')->distinct('usuario_afectado_id')->count('usuario_afectado_id'), 'color' => 'info'],
                    ['nombre' => 'Contenido eliminado', 'valor' => HistorialModeracion::where('accion', 'eliminacion_contenido')->count(), 'color' => 'danger'],
                ],
                'categorias' => [
                    ['nombre' => 'Pendientes', 'porcentaje' => $this->calcularPorcentaje($estadisticas['reportes_pendientes']), 'color' => 'danger'],
                    ['nombre' => 'Resueltos', 'porcentaje' => $this->calcularPorcentaje(Reporte::where('estado', 'resuelto')->count()), 'color' => 'success'],
                    ['nombre' => 'Revisión', 'porcentaje' => $this->calcularPorcentaje($estados->get('en_revision', 0)), 'color' => 'warning'],
                ],
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'moderador' => [
                        'id' => $moderador->id,
                        'nombre' => $moderador->nombre,
                        'apellidos' => $moderador->apellidos,
                        'email' => $moderador->email,
                        'rol' => $moderador->rol,
                    ],
                    'estadisticas' => $estadisticas,
                    'materias' => $materias,
                    'tipos' => $tipos,
                    'estados' => $estados,
                    'prioridades' => $prioridades,
                    'stats_detalladas' => $statsDetalladas,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar el panel de moderación',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Listado de reportes con filtros
     */
    public function reportes(Request $request)
    {
        try {
            $query = Reporte::with([
                'publicacion.autor',
                'publicacion.materia',
                'comentario.autor',
                'reportante',
                'moderador',
            ]);

            if ($request->filled('prioridad')) {
                $query->where('prioridad', $request->prioridad);
            }

            if ($request->filled('estado')) {
                $query->where('estado', $request->estado);
            }

            if ($request->filled('materia_id')) {
                $query->whereHas('publicacion', function ($q) use ($request) {
                    $q->where('materia_id', $request->materia_id);
                });
            }

            if ($request->filled('tipo')) {
                $query->where('motivo', $request->tipo);
            }

            $reportes = $query->orderBy('prioridad', 'desc')
                ->orderBy('created_at', 'desc')
                ->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'data' => $reportes
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar los reportes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener detalle de un reporte
     */
    public function reporte($id)
    {
        try {
            $reporte = Reporte::with([
                'publicacion.autor',
                'publicacion.materia',
                'comentario.autor',
                'reportante',
                'moderador',
            ])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $reporte
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar el reporte',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Aprobar un reporte (descartar)
     */
    public function aprobar($id)
    {
        try {
            $reporte = Reporte::findOrFail($id);
            $reporte->update([
                'estado' => 'resuelto',
                'resuelto_por' => auth()->id(),
                'accion_tomada' => 'Reporte aprobado',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Reporte marcado como resuelto'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al aprobar el reporte',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Advertir al autor del contenido reportado
     */
    public function advertir(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'mensaje' => 'required|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $reporte = Reporte::with(['publicacion', 'comentario'])->findOrFail($id);
            $autorId = $reporte->comentario_id
                ? $reporte->comentario?->autor_id
                : $reporte->publicacion?->autor_id;

            HistorialModeracion::create([
                'moderador_id' => auth()->id(),
                'usuario_afectado_id' => $autorId,
                'accion' => 'advertencia',
                'contenido_tipo' => $reporte->comentario_id ? 'comentario' : 'publicacion',
                'contenido_id' => $reporte->comentario_id ?? $reporte->publicacion_id,
                'motivo' => $request->mensaje,
            ]);

            $reporte->update([
                'estado' => 'en_revision',
                'resuelto_por' => auth()->id(),
                'accion_tomada' => 'Advertencia enviada',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Advertencia registrada'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al enviar advertencia',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar contenido reportado
     */
    public function eliminar(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'motivo' => 'required|string|max:1000'
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

            $reporte = Reporte::with(['publicacion', 'comentario'])->findOrFail($id);

            if ($reporte->comentario) {
                $comentario = $reporte->comentario;
                $comentario->update(['activo' => false]);
                $comentario->publicacion?->decrement('num_comentarios');
            } elseif ($reporte->publicacion) {
                $reporte->publicacion->update(['activo' => false]);
            }

            HistorialModeracion::create([
                'moderador_id' => auth()->id(),
                'usuario_afectado_id' => $reporte->comentario?->autor_id ?? $reporte->publicacion?->autor_id,
                'accion' => 'eliminacion_contenido',
                'contenido_tipo' => $reporte->comentario_id ? 'comentario' : 'publicacion',
                'contenido_id' => $reporte->comentario_id ?? $reporte->publicacion_id,
                'motivo' => $request->motivo,
            ]);

            $reporte->update([
                'estado' => 'resuelto',
                'resuelto_por' => auth()->id(),
                'accion_tomada' => 'Contenido eliminado',
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Contenido eliminado y reporte resuelto'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el contenido',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actividad reciente de moderación
     */
    public function actividad()
    {
        try {
            $actividad = HistorialModeracion::with(['moderador', 'usuarioAfectado'])
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();

            $transformada = $actividad->map(function ($registro) {
                return [
                    'id' => $registro->id,
                    'accion' => $registro->accion,
                    'descripcion' => $this->formatearDescripcionActividad($registro),
                    'fecha' => $registro->created_at,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $transformada
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar la actividad',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Alertas de usuarios con múltiples reportes
     */
    public function alertas()
    {
        try {
            $reportes = Reporte::with(['publicacion.autor', 'comentario.autor'])->get();

            $agrupados = $reportes->groupBy(function ($reporte) {
                return $reporte->comentario?->autor_id ?? $reporte->publicacion?->autor_id;
            })->filter(function ($items, $usuarioId) {
                return $usuarioId !== null && $items->count() >= 3;
            })->map(function ($items, $usuarioId) {
                $reporte = $items->first();
                $autor = $reporte->comentario?->autor ?? $reporte->publicacion?->autor;
                $total = $items->count();

                return [
                    'usuario' => $autor?->nombre_completo ?? $autor?->email,
                    'reportes' => $total,
                    'nivel' => $total >= 5 ? 'alto' : 'medio',
                    'motivo' => $total >= 5 ? 'Revisión urgente' : 'Seguimiento',
                ];
            })->values();

            return response()->json([
                'success' => true,
                'data' => $agrupados
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar alertas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Buscar usuarios
     */
    public function buscarUsuarios(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'q' => 'required|string|min:2'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $termino = $request->q;
            $usuarios = Usuario::where('nombre', 'like', "%$termino%")
                ->orWhere('apellidos', 'like', "%$termino%")
                ->orWhere('email', 'like', "%$termino%")
                ->limit(20)
                ->get(['id', 'nombre', 'apellidos', 'email', 'rol', 'activo']);

            return response()->json([
                'success' => true,
                'data' => $usuarios
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al buscar usuarios',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bloquear/desactivar usuario
     */
    public function bloquearUsuario(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'usuario_id' => 'required|exists:usuarios,id',
            'motivo' => 'required|string|max:500',
            'duracion' => 'nullable|integer|min:1',
            'unidad' => 'nullable|in:minutos,horas,dias,semanas,meses'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $moderador = auth()->user();

            if (!$moderador || !$moderador->isAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para realizar esta acción'
                ], 403);
            }

            $usuario = Usuario::findOrFail($request->usuario_id);

            $finSuspension = null;
            if ($request->filled('duracion') && $this->suspensionColumnsDisponibles()) {
                $duracion = (int) $request->duracion;
                $unidad = $request->get('unidad', 'dias');

                $finSuspension = match ($unidad) {
                    'minutos' => Carbon::now()->addMinutes($duracion),
                    'horas' => Carbon::now()->addHours($duracion),
                    'dias' => Carbon::now()->addDays($duracion),
                    'semanas' => Carbon::now()->addWeeks($duracion),
                    'meses' => Carbon::now()->addMonths($duracion),
                    default => Carbon::now()->addDays($duracion),
                };
            }

            $updateData = [
                'activo' => false,
            ];

            if ($this->suspensionColumnsDisponibles()) {
                $updateData['suspension_activa'] = true;
                $updateData['suspendido_hasta'] = $finSuspension;
                $updateData['suspension_motivo'] = $request->motivo;
            }

            $usuario->update($updateData);

            HistorialModeracion::create([
                'moderador_id' => $moderador->id,
                'usuario_afectado_id' => $usuario->id,
                'accion' => 'suspension',
                'contenido_tipo' => 'publicacion',
                'contenido_id' => 0,
                'motivo' => $request->motivo ?? 'Suspensión desde panel de moderación',
                'created_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Usuario bloqueado correctamente',
                'data' => [
                    'usuario' => $usuario,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al bloquear usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function usuariosBloqueados()
    {
        try {
            $moderador = auth()->user();
            if (!$moderador || !$moderador->isAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para consultar esta información'
                ], 403);
            }

            $query = Usuario::query();

            if ($this->suspensionColumnsDisponibles()) {
                $query->where(function ($q) {
                    $q->where('suspension_activa', true)
                        ->orWhere('activo', false);
                });
            } else {
                $query->where('activo', false);
            }

            $usuarios = $query->orderBy('updated_at', 'desc')
                ->paginate(20);

            $usuarios->getCollection()->transform(function ($usuario) {
                return [
                    'id' => $usuario->id,
                    'nombre' => $usuario->nombre,
                    'apellidos' => $usuario->apellidos,
                    'nombre_completo' => trim(($usuario->nombre ?? '') . ' ' . ($usuario->apellidos ?? '')),
                    'email' => $usuario->email,
                    'rol' => $usuario->rol,
                    'suspension_activa' => $this->suspensionColumnsDisponibles() ? (bool) $usuario->suspension_activa : false,
                    'suspendido_hasta' => $this->suspensionColumnsDisponibles() ? $usuario->suspendido_hasta : null,
                    'suspension_motivo' => $this->suspensionColumnsDisponibles() ? $usuario->suspension_motivo : null,
                    'activo' => (bool) $usuario->activo,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $usuarios,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener usuarios bloqueados',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function reactivarUsuario(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'usuario_id' => 'required|exists:usuarios,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $moderador = auth()->user();
            if (!$moderador || !$moderador->isAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para realizar esta acción'
                ], 403);
            }

            $usuario = Usuario::findOrFail($request->usuario_id);
            $updateData = [
                'activo' => true,
            ];

            if ($this->suspensionColumnsDisponibles()) {
                $updateData['suspension_activa'] = false;
                $updateData['suspendido_hasta'] = null;
                $updateData['suspension_motivo'] = null;
            }

            $usuario->update($updateData);

            HistorialModeracion::create([
                'moderador_id' => $moderador->id,
                'usuario_afectado_id' => $usuario->id,
                'accion' => 'aprobacion',
                'contenido_tipo' => 'publicacion',
                'contenido_id' => 0,
                'motivo' => 'Reactivación manual desde panel de moderación',
                'created_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Usuario reactivado correctamente',
                'data' => $usuario,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al reactivar usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function advertirUsuario(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'usuario_id' => 'required|exists:usuarios,id',
            'mensaje' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $moderador = auth()->user();
            if (!$moderador || !$moderador->isAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para realizar esta acción'
                ], 403);
            }

            $usuario = Usuario::findOrFail($request->usuario_id);

            Notificacion::create([
                'usuario_id' => $usuario->id,
                'tipo' => 'aviso',
                'titulo' => 'Advertencia del equipo de moderación',
                'mensaje' => $request->mensaje,
                'link' => null,
                'leida' => false,
            ]);

            HistorialModeracion::create([
                'moderador_id' => $moderador->id,
                'usuario_afectado_id' => $usuario->id,
                'accion' => 'advertencia',
                'contenido_tipo' => 'publicacion',
                'contenido_id' => 0,
                'motivo' => $request->mensaje,
                'created_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Advertencia enviada correctamente.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al enviar advertencia',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Exportar log de moderación en base64
     */
    public function exportarLog()
    {
        try {
            $reportes = Reporte::with(['publicacion', 'comentario', 'reportante', 'moderador'])->get();
            $historial = HistorialModeracion::with(['moderador', 'usuarioAfectado'])->get();

            $payload = [
                'generado_en' => Carbon::now()->toDateTimeString(),
                'moderador' => auth()->user()->email,
                'reportes' => $reportes,
                'historial' => $historial,
            ];

            $json = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            $base64 = base64_encode($json);

            return response()->json([
                'success' => true,
                'data' => [
                    'archivo' => $base64,
                    'nombre' => 'moderacion-log-' . now()->format('Ymd_His') . '.json'
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al exportar el log',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function crearAviso(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'titulo' => 'required|string|max:255',
            'mensaje' => 'required|string|max:1000',
            'enlace' => 'nullable|string|max:500',
            'destino' => 'nullable|in:todos,carrera,rol,usuario',
            'carrera_id' => 'nullable|exists:carreras,id',
            'rol' => 'nullable|in:estudiante,profesor,admin',
            'usuario_id' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $moderador = auth()->user();
            if (!$moderador || !$moderador->isAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo un administrador puede crear avisos globales.'
                ], 403);
            }

            $destino = $request->get('destino', 'todos');
            $usuariosQuery = Usuario::query()->where('activo', true);

            switch ($destino) {
                case 'carrera':
                    if (!$request->filled('carrera_id')) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Debes seleccionar una carrera para este destino.'
                        ], 422);
                    }
                    $usuariosQuery->whereHas('estudiante', function ($q) use ($request) {
                        $q->where('carrera_id', $request->carrera_id);
                    });
                    break;
                case 'rol':
                    if (!$request->filled('rol')) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Debes especificar el rol destino.'
                        ], 422);
                    }
                    $usuariosQuery->where('rol', $request->rol);
                    break;
                case 'usuario':
                    if (!$request->filled('usuario_id')) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Selecciona un usuario válido.'
                        ], 422);
                    }
                    $usuarioReferencia = trim((string) $request->usuario_id);
                    if (!ctype_digit($usuarioReferencia)) {
                        $usuarioUnico = Usuario::where('email', $usuarioReferencia)->first();
                        if (!$usuarioUnico) {
                            return response()->json([
                                'success' => false,
                                'message' => 'No encontramos un usuario con esas credenciales.'
                            ], 404);
                        }
                        $usuariosQuery->where('id', $usuarioUnico->id);
                    } else {
                        $usuariosQuery->where('id', $usuarioReferencia);
                    }
                    break;
                case 'todos':
                default:
                    break;
            }

            $total = 0;
            $usuariosQuery->chunkById(200, function ($usuarios) use ($request, &$total) {
                foreach ($usuarios as $usuario) {
                    Notificacion::create([
                        'usuario_id' => $usuario->id,
                        'tipo' => 'aviso',
                        'titulo' => $request->titulo,
                        'mensaje' => $request->mensaje,
                        'link' => $request->enlace,
                        'leida' => false,
                    ]);
                    $total++;
                }
            });

            if ($total === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron destinatarios para el aviso.',
                ], 404);
            }

            // contenido_tipo solo acepta 'publicacion' o 'comentario', usar NULL para avisos generales
            HistorialModeracion::create([
                'moderador_id' => $moderador->id,
                'accion' => 'advertencia',
                'contenido_tipo' => 'publicacion', // Usar 'publicacion' como valor por defecto para avisos (la columna es NOT NULL)
                'contenido_id' => null,
                'usuario_afectado_id' => null, // NULL para avisos globales
                'motivo' => sprintf('Aviso enviado: %s (destino: %s)', $request->titulo, $destino),
                'created_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Aviso creado y enviado correctamente.',
                'data' => [
                    'total_destinatarios' => $total,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el aviso',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function calcularPorcentaje($valor)
    {
        $total = Reporte::count();
        if ($total === 0) {
            return 0;
        }
        return round(($valor / $total) * 100, 2);
    }

    private function formatearDescripcionActividad(HistorialModeracion $registro)
    {
        $accion = match ($registro->accion) {
            'advertencia' => 'Advertencia enviada',
            'eliminacion_contenido' => 'Contenido eliminado',
            'suspension' => 'Usuario suspendido',
            'aprobacion' => 'Reporte aprobado',
            default => Str::title(str_replace('_', ' ', $registro->accion)),
        };

        $usuario = $registro->usuarioAfectado?->nombre ?? $registro->usuarioAfectado?->email ?? 'usuario';
        return sprintf('%s a %s', $accion, $usuario);
    }

    private function suspensionColumnsDisponibles(): bool
    {
        static $cache = null;
        if ($cache !== null) {
            return $cache;
        }

        $cache = Schema::hasColumn('usuarios', 'suspension_activa')
            && Schema::hasColumn('usuarios', 'suspendido_hasta')
            && Schema::hasColumn('usuarios', 'suspension_motivo');

        return $cache;
    }
}
