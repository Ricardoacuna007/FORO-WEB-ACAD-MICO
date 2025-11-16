<?php

namespace App\Http\Controllers;

use App\Models\Carrera;
use App\Models\Cuatrimestre;
use App\Models\Materia;
use App\Models\Publicacion;
use App\Models\Comentario;
use App\Models\Usuario;
use App\Models\Estudiante;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NavegacionController extends Controller
{
    /**
     * Obtener todas las carreras
     */
    public function carreras()
    {
        try {
            $usuario = auth()->user();

            $query = Carrera::where('activo', true)
                ->withCount(['estudiantes', 'materias']);

            if ($usuario && $usuario->isEstudiante()) {
                $carreraId = optional($usuario->estudiante)->carrera_id;
                if (!$carreraId) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No se encontró la carrera del estudiante'
                    ], 404);
                }
                $query->where('id', $carreraId);
            }

            $carreras = $query->get()->map(function ($carrera) {
                $publicacionesCount = Publicacion::whereHas('materia.cuatrimestre', function ($query) use ($carrera) {
                    $query->where('carrera_id', $carrera->id);
                })->count();

                return [
                    'id' => $carrera->id,
                    'codigo' => $carrera->codigo,
                    'nombre' => $carrera->nombre,
                    'descripcion' => $carrera->descripcion,
                    'estudiantes_count' => $carrera->estudiantes_count,
                    'materias_count' => $carrera->materias_count,
                    'publicaciones_count' => $publicacionesCount,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $carreras
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar carreras',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function carrerasPublic()
    {
        try {
            $carreras = Carrera::where('activo', true)
                ->orderBy('nombre')
                ->get(['id', 'codigo', 'nombre', 'descripcion']);

            return response()->json([
                'success' => true,
                'data' => $carreras,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar carreras',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener una carrera específica
     */
    public function carrera($id)
    {
        try {
            $usuario = auth()->user();
            $carrera = Carrera::withCount(['estudiantes', 'materias'])
                ->findOrFail($id);

            if ($usuario && $usuario->isEstudiante()) {
                $carreraUsuario = optional($usuario->estudiante)->carrera_id;
                if ((int) $carreraUsuario !== (int) $carrera->id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No tienes permiso para acceder a esta carrera'
                    ], 403);
                }
            }

            // Contar publicaciones
            $publicacionesCount = Publicacion::whereHas('materia.cuatrimestre', function ($query) use ($carrera) {
                $query->where('carrera_id', $carrera->id);
            })->count();

            $carrera->publicaciones_count = $publicacionesCount;

            return response()->json([
                'success' => true,
                'data' => $carrera
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar la carrera',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener cuatrimestres de una carrera
     */
    public function cuatrimestres($carreraId)
    {
        try {
            $usuario = auth()->user();

            if ($usuario && $usuario->isEstudiante()) {
                $carreraUsuario = optional($usuario->estudiante)->carrera_id;
                if ((int) $carreraUsuario !== (int) $carreraId) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No tienes permiso para acceder a esta carrera'
                    ], 403);
                }
            }

            $cuatrimestres = Cuatrimestre::where('carrera_id', $carreraId)
                ->where('activo', true)
                ->withCount(['materias'])
                ->get()
                ->map(function ($cuatrimestre) {
                    $publicacionesCount = Publicacion::whereHas('materia', function ($query) use ($cuatrimestre) {
                        $query->where('cuatrimestre_id', $cuatrimestre->id);
                    })->count();

                    return [
                        'id' => $cuatrimestre->id,
                        'numero' => $cuatrimestre->numero,
                        'nombre' => sprintf('%d° Cuatrimestre', $cuatrimestre->numero),
                        'materias_count' => $cuatrimestre->materias_count,
                        'publicaciones_count' => $publicacionesCount,
                        'activo' => (bool) $cuatrimestre->activo,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $cuatrimestres
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar cuatrimestres',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener materias de un cuatrimestre o carrera
     */
    public function materias(Request $request)
    {
        try {
            $usuario = auth()->user();
            $query = Materia::with(['profesor.usuario', 'cuatrimestre.carrera']);

            if ($request->has('cuatrimestre_id')) {
                $query->where('cuatrimestre_id', $request->cuatrimestre_id);
            }

            if ($request->has('carrera_id')) {
                $query->whereHas('cuatrimestre', function ($q) use ($request) {
                    $q->where('carrera_id', $request->carrera_id);
                });
            }

            if ($usuario && $usuario->isEstudiante()) {
                $carreraUsuario = optional($usuario->estudiante)->carrera_id;
                $query->whereHas('cuatrimestre', function ($q) use ($carreraUsuario) {
                    $q->where('carrera_id', $carreraUsuario);
                });
            } elseif ($usuario && $usuario->isProfesor()) {
                $profesorId = optional($usuario->profesor)->id;
                if ($profesorId) {
                    $query->where(function ($q) use ($profesorId, $request) {
                        $q->where('profesor_id', $profesorId);
                        if ($request->filled('carrera_id')) {
                            $q->orWhereHas('cuatrimestre', function ($sub) use ($request) {
                                $sub->where('carrera_id', $request->carrera_id);
                            });
                        }
                    });
                }
            }

            $materias = $query->where('activo', true)
                ->get()
                ->map(function ($materia) {
                    $publicaciones = Publicacion::where('materia_id', $materia->id)
                        ->selectRaw('categoria, COUNT(*) as count')
                        ->groupBy('categoria')
                        ->pluck('count', 'categoria');

                    $totalPublicaciones = Publicacion::where('materia_id', $materia->id)->count();

                    $carrera = optional($materia->cuatrimestre)->carrera;

                    return [
                        'id' => $materia->id,
                        'nombre' => $materia->nombre,
                        'codigo' => $materia->codigo,
                        'descripcion' => $materia->descripcion,
                        'profesor' => $materia->profesor ? [
                            'nombre' => optional($materia->profesor->usuario)->nombre_completo,
                            'especialidad' => $materia->profesor->especialidad,
                        ] : null,
                        'carrera' => $carrera ? [
                            'id' => $carrera->id,
                            'nombre' => $carrera->nombre,
                            'codigo' => $carrera->codigo,
                        ] : null,
                        'publicaciones_count' => $totalPublicaciones,
                        'publicaciones_por_categoria' => [
                            'duda' => $publicaciones->get('duda', 0),
                            'recurso' => $publicaciones->get('recurso', 0),
                            'aviso' => $publicaciones->get('aviso', 0),
                            'discusion' => $publicaciones->get('discusion', 0),
                        ],
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $materias
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar materias',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener una materia específica
     */
    public function materia($id)
    {
        try {
            $usuario = auth()->user();
            $materia = Materia::with(['profesor.usuario', 'cuatrimestre.carrera'])
                ->findOrFail($id);

            if ($usuario && $usuario->isEstudiante()) {
                $carreraUsuario = optional($usuario->estudiante)->carrera_id;
                $carreraMateria = optional(optional($materia->cuatrimestre)->carrera)->id;
                if (!$carreraMateria || (int) $carreraUsuario !== (int) $carreraMateria) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No tienes permiso para acceder a esta materia'
                    ], 403);
                }
            } elseif ($usuario && $usuario->isProfesor()) {
                $profesorId = optional($usuario->profesor)->id;
                if ($profesorId && $materia->profesor_id && (int) $materia->profesor_id !== (int) $profesorId) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No tienes permiso para acceder a esta materia'
                    ], 403);
                }
            }

            // Contar estudiantes inscritos
            $estudiantesCount = $materia->estudiantes()->count();

            // Contar publicaciones
            $publicacionesCount = Publicacion::where('materia_id', $id)->count();

            // Contar por categoría
            $publicacionesPorCategoria = Publicacion::where('materia_id', $id)
                ->selectRaw('categoria, COUNT(*) as count')
                ->groupBy('categoria')
                ->pluck('count', 'categoria');

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $materia->id,
                    'nombre' => $materia->nombre,
                    'codigo' => $materia->codigo,
                    'descripcion' => $materia->descripcion,
                    'profesor' => $materia->profesor ? [
                        'nombre' => optional($materia->profesor->usuario)->nombre_completo,
                        'especialidad' => $materia->profesor->especialidad,
                    ] : null,
                    'carrera' => $materia->cuatrimestre && $materia->cuatrimestre->carrera ? [
                        'id' => $materia->cuatrimestre->carrera->id,
                        'nombre' => $materia->cuatrimestre->carrera->nombre,
                    ] : null,
                    'cuatrimestre' => $materia->cuatrimestre ? [
                        'numero' => $materia->cuatrimestre->numero,
                        'nombre' => sprintf('%d° Cuatrimestre', $materia->cuatrimestre->numero),
                    ] : null,
                    'estudiantes_count' => $estudiantesCount,
                    'publicaciones_count' => $publicacionesCount,
                    'publicaciones_por_categoria' => [
                        'duda' => $publicacionesPorCategoria->get('duda', 0),
                        'recurso' => $publicacionesPorCategoria->get('recurso', 0),
                        'aviso' => $publicacionesPorCategoria->get('aviso', 0),
                        'discusion' => $publicacionesPorCategoria->get('discusion', 0),
                    ],
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar la materia',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas generales
     */
    public function estadisticas()
    {
        try {
            $usuario = auth()->user();

            if ($usuario && $usuario->isEstudiante()) {
                $carreraId = optional($usuario->estudiante)->carrera_id;

                $estudiantesCount = Estudiante::where('carrera_id', $carreraId)->count();
                $publicacionesCount = Publicacion::activas()
                    ->whereHas('materia.cuatrimestre', function ($q) use ($carreraId) {
                        $q->where('carrera_id', $carreraId);
                    })->count();
                $recursosCount = Publicacion::where('categoria', 'recurso')->activas()
                    ->whereHas('materia.cuatrimestre', function ($q) use ($carreraId) {
                        $q->where('carrera_id', $carreraId);
                    })->count();
                $carrerasCount = 1;
            } else {
                $estudiantesCount = Estudiante::count();
                $publicacionesCount = Publicacion::activas()->count();
                $recursosCount = Publicacion::where('categoria', 'recurso')->activas()->count();
                $carrerasCount = Carrera::where('activo', true)->count();
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'estudiantes' => $estudiantesCount,
                    'publicaciones' => $publicacionesCount,
                    'recursos' => $recursosCount,
                    'carreras' => $carrerasCount,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar estadísticas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Búsqueda general en publicaciones, comentarios, usuarios y materias
     */
    public function buscar(Request $request)
    {
        try {
            $query = $request->get('q', '');
            $tipo = $request->get('tipo', 'todos');
            
            if (empty($query) || strlen($query) < 3) {
                return response()->json([
                    'success' => false,
                    'message' => 'La búsqueda debe tener al menos 3 caracteres'
                ], 422);
            }

            $queryEscaped = '%' . addcslashes($query, '%_\\') . '%';
            $queryTrimmed = trim($query);
            $palabras = array_filter(explode(' ', $queryTrimmed), function($palabra) {
                return strlen(trim($palabra)) >= 3;
            });
            
            $resultados = [];

            // Búsqueda en publicaciones con coincidencia precisa y ranking de relevancia
            if ($tipo === 'todos' || $tipo === 'publicaciones' || $tipo === 'publicacion') {
                $publicacionesQuery = Publicacion::where('activo', true);
                
                if (count($palabras) > 1) {
                    // Si hay múltiples palabras, buscar que todas estén presentes
                    $publicacionesQuery->where(function ($q) use ($palabras) {
                        foreach ($palabras as $palabra) {
                            $palabraEscaped = '%' . addcslashes(trim($palabra), '%_\\') . '%';
                            $q->where(function($subQ) use ($palabraEscaped) {
                                $subQ->where('titulo', 'LIKE', $palabraEscaped)
                                     ->orWhere('contenido', 'LIKE', $palabraEscaped);
                            });
                        }
                    });
                } else {
                    // Búsqueda simple con el término completo
                    $publicacionesQuery->where(function ($q) use ($queryTrimmed) {
                        $q->where('titulo', 'LIKE', '%' . addcslashes($queryTrimmed, '%_\\') . '%')
                          ->orWhere('contenido', 'LIKE', '%' . addcslashes($queryTrimmed, '%_\\') . '%');
                    });
                }
                
                $publicaciones = $publicacionesQuery
                    ->with(['autor:id,nombre,apellidos,avatar', 'materia:id,nombre,cuatrimestre_id', 'materia.cuatrimestre:id,carrera_id', 'materia.cuatrimestre.carrera:id,nombre'])
                    ->select('id', 'titulo', 'contenido', 'categoria', 'autor_id', 'materia_id', 'num_likes', 'num_comentarios', 'vistas', 'created_at')
                    ->limit(50)
                    ->get()
                    ->map(function ($pub) use ($queryTrimmed, $palabras) {
                        // Calcular relevancia: título tiene más peso que contenido
                        $relevancia = 0;
                        $tituloLower = mb_strtolower($pub->titulo);
                        $contenidoLower = mb_strtolower($pub->contenido);
                        $queryLower = mb_strtolower($queryTrimmed);
                        
                        // Coincidencia exacta en título = mayor relevancia
                        if (strpos($tituloLower, $queryLower) !== false) {
                            $relevancia += 100;
                            // Si está al inicio del título, aún más relevante
                            if (strpos($tituloLower, $queryLower) === 0) {
                                $relevancia += 50;
                            }
                        }
                        
                        // Coincidencia en contenido = menor relevancia
                        if (strpos($contenidoLower, $queryLower) !== false) {
                            $relevancia += 20;
                        }
                        
                        // Si hay múltiples palabras, verificar que todas estén
                        if (count($palabras) > 1) {
                            $palabrasEnTitulo = 0;
                            $palabrasEnContenido = 0;
                            foreach ($palabras as $palabra) {
                                $palabraLower = mb_strtolower(trim($palabra));
                                if (strpos($tituloLower, $palabraLower) !== false) {
                                    $palabrasEnTitulo++;
                                }
                                if (strpos($contenidoLower, $palabraLower) !== false) {
                                    $palabrasEnContenido++;
                                }
                            }
                            $relevancia += ($palabrasEnTitulo * 30) + ($palabrasEnContenido * 10);
                        }
                        
                        // Bonus por popularidad (likes y vistas)
                        $relevancia += min($pub->num_likes ?? 0, 20) * 0.5;
                        $relevancia += min($pub->vistas ?? 0, 100) * 0.1;
                        
                        return [
                            'id' => $pub->id,
                            'tipo' => 'publicacion',
                            'titulo' => $pub->titulo,
                            'contenido' => $pub->contenido,
                            'autor' => $pub->autor ? [
                                'id' => $pub->autor->id,
                                'nombre' => $pub->autor->nombre . ' ' . $pub->autor->apellidos,
                                'avatar_url' => $pub->autor->avatar_url
                            ] : null,
                            'materia' => $pub->materia ? [
                                'id' => $pub->materia->id,
                                'nombre' => $pub->materia->nombre,
                                'carrera' => $pub->materia->cuatrimestre->carrera->nombre ?? null
                            ] : null,
                            'categoria' => $pub->categoria,
                            'num_likes' => $pub->num_likes,
                            'num_comentarios' => $pub->num_comentarios,
                            'vistas' => $pub->vistas,
                            'created_at' => $pub->created_at,
                            'relevancia' => $relevancia,
                        ];
                    })
                    ->sortByDesc('relevancia')
                    ->values();
                
                $resultados = array_merge($resultados, $publicaciones->toArray());
            }

            // Búsqueda en comentarios
            if ($tipo === 'todos' || $tipo === 'comentarios' || $tipo === 'comentario') {
                $comentarios = Comentario::where('activo', true)
                    ->where('contenido', 'LIKE', '%' . addcslashes($queryTrimmed, '%_\\') . '%')
                    ->with(['autor:id,nombre,apellidos,avatar', 'publicacion:id,titulo'])
                    ->select('id', 'contenido', 'autor_id', 'publicacion_id', 'num_likes', 'created_at')
                    ->limit(30)
                    ->get()
                    ->map(function ($com) {
                        return [
                            'id' => $com->id,
                            'tipo' => 'comentario',
                            'contenido' => $com->contenido,
                            'autor' => $com->autor ? [
                                'id' => $com->autor->id,
                                'nombre' => $com->autor->nombre . ' ' . $com->autor->apellidos,
                                'avatar_url' => $com->autor->avatar_url
                            ] : null,
                            'publicacion_id' => $com->publicacion_id,
                            'publicacion' => $com->publicacion ? $com->publicacion->titulo : null,
                            'num_likes' => $com->num_likes,
                            'created_at' => $com->created_at,
                        ];
                    });
                
                $resultados = array_merge($resultados, $comentarios->toArray());
            }

            // Búsqueda en usuarios
            if ($tipo === 'todos' || $tipo === 'usuarios' || $tipo === 'usuario') {
                $usuarios = Usuario::where('activo', true)
                    ->where(function ($q) use ($queryTrimmed) {
                        $queryEscaped = '%' . addcslashes($queryTrimmed, '%_\\') . '%';
                        $q->where('nombre', 'LIKE', $queryEscaped)
                          ->orWhere('apellidos', 'LIKE', $queryEscaped)
                          ->orWhere('email', 'LIKE', $queryEscaped);
                    })
                    ->select('id', 'nombre', 'apellidos', 'email', 'rol', 'avatar')
                    ->limit(20)
                    ->get()
                    ->map(function ($user) {
                        return [
                            'id' => $user->id,
                            'tipo' => 'usuario',
                            'nombre' => $user->nombre . ' ' . $user->apellidos,
                            'email' => $user->email,
                            'rol' => $user->rol,
                            'avatar_url' => $user->avatar_url,
                        ];
                    });
                
                $resultados = array_merge($resultados, $usuarios->toArray());
            }

            // Búsqueda en materias
            if ($tipo === 'todos' || $tipo === 'materias' || $tipo === 'materia') {
                $materias = Materia::where('activo', true)
                    ->where(function ($q) use ($queryTrimmed) {
                        $queryEscaped = '%' . addcslashes($queryTrimmed, '%_\\') . '%';
                        $q->where('nombre', 'LIKE', $queryEscaped)
                          ->orWhere('codigo', 'LIKE', $queryEscaped)
                          ->orWhere('descripcion', 'LIKE', $queryEscaped);
                    })
                    ->with(['cuatrimestre:id,carrera_id', 'cuatrimestre.carrera:id,nombre'])
                    ->select('id', 'nombre', 'codigo', 'descripcion', 'cuatrimestre_id')
                    ->limit(20)
                    ->get()
                    ->map(function ($mat) {
                        return [
                            'id' => $mat->id,
                            'tipo' => 'materia',
                            'nombre' => $mat->nombre,
                            'codigo' => $mat->codigo,
                            'descripcion' => $mat->descripcion,
                            'carrera' => $mat->cuatrimestre->carrera->nombre ?? null,
                            'carrera_id' => $mat->cuatrimestre->carrera_id ?? null,
                        ];
                    });
                
                $resultados = array_merge($resultados, $materias->toArray());
            }

            return response()->json([
                'success' => true,
                'data' => $resultados,
                'total' => count($resultados)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al realizar la búsqueda',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
