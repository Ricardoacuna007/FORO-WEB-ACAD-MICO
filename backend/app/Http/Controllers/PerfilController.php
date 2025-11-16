<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use App\Models\Publicacion;
use App\Models\Comentario;
use App\Models\Evento;
use App\Http\Requests\UpdateAvatarRequest;
use App\Http\Resources\UsuarioResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class PerfilController extends Controller
{
    /**
     * Obtener perfil del usuario actual
     */
    public function perfil()
    {
        try {
            $usuario = auth()->user();
            
            // Cargar relaciones según el rol
            if ($usuario->isEstudiante()) {
                $usuario->load(['estudiante.carrera']);
            } elseif ($usuario->isProfesor()) {
                $usuario->load(['profesor']);
            }

            // Estadísticas
            $publicacionesCount = Publicacion::where('autor_id', $usuario->id)->count();
            $comentariosCount = Comentario::where('autor_id', $usuario->id)->count();
            $respuestasUtilesCount = Comentario::where('autor_id', $usuario->id)
                ->where('es_respuesta_util', true)
                ->count();
            $publicacionesGuardadasCount = $usuario->publicacionesGuardadas()->count();
            $eventosCreados = Evento::where('creador_id', $usuario->id)->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'usuario' => $usuario,
                    'estadisticas' => [
                        'publicaciones' => $publicacionesCount,
                        'comentarios' => $comentariosCount,
                        'respuestas_utiles' => $respuestasUtilesCount,
                        'guardados' => $publicacionesGuardadasCount,
                        'eventos' => $eventosCreados,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar el perfil',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener perfil de otro usuario
     */
    public function show($id)
    {
        try {
            $usuario = Usuario::with([
                'estudiante.carrera',
                'profesor',
            ])->findOrFail($id);

            // Estadísticas
            $publicacionesCount = Publicacion::where('autor_id', $usuario->id)->count();
            $comentariosCount = Comentario::where('autor_id', $usuario->id)->count();
            $respuestasUtilesCount = Comentario::where('autor_id', $usuario->id)
                ->where('es_respuesta_util', true)
                ->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'usuario' => $usuario,
                    'estadisticas' => [
                        'publicaciones' => $publicacionesCount,
                        'comentarios' => $comentariosCount,
                        'respuestas_utiles' => $respuestasUtilesCount,
                    ]
                ]
            ]);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar el perfil',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar perfil
     */
    public function update(Request $request)
    {
        $usuario = auth()->user();

        $validator = Validator::make($request->all(), [
            'nombre' => 'sometimes|required|string|max:100',
            'apellidos' => 'sometimes|required|string|max:100',
                        'avatar' => 'sometimes|string|max:500',
            'matricula' => 'sometimes|required|string|max:20',
            'carrera_id' => 'sometimes|required|exists:carreras,id',
            'cuatrimestre_actual' => 'sometimes|required|integer|min:1|max:11',
            'num_empleado' => 'sometimes|nullable|string|max:20',
            'especialidad' => 'sometimes|nullable|string|max:255',
            'configuracion' => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $datosUsuario = array_filter($request->only(['nombre', 'apellidos', 'avatar']), function ($valor) {
                return $valor !== null;
            });

            if (!empty($datosUsuario)) {
                $usuario->update($datosUsuario);
            }

            if ($usuario->isEstudiante() && $usuario->estudiante) {
                $datosEstudiante = array_filter([
                    'matricula' => $request->input('matricula'),
                    'carrera_id' => $request->input('carrera_id'),
                    'cuatrimestre_actual' => $request->input('cuatrimestre_actual'),
                ], function ($valor) {
                    return $valor !== null && $valor !== '';
                });

                if (!empty($datosEstudiante)) {
                    $usuario->estudiante->update($datosEstudiante);
                }
            } elseif ($usuario->isProfesor() && $usuario->profesor) {
                $datosProfesor = array_filter([
                    'num_empleado' => $request->input('num_empleado'),
                    'especialidad' => $request->input('especialidad'),
                ], function ($valor) {
                    return $valor !== null;
                });

                if (!empty($datosProfesor)) {
                    $usuario->profesor->update($datosProfesor);
                }
            }

            if ($usuario->isEstudiante()) {
                $usuario->load(['estudiante.carrera']);
            } elseif ($usuario->isProfesor()) {
                $usuario->load(['profesor']);
            }

            return response()->json([
                'success' => true,
                'message' => 'Perfil actualizado exitosamente',
                'data' => $usuario
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el perfil',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function actualizarAvatar(UpdateAvatarRequest $request)
    {
        $usuario = auth()->user();

        try {
            // Validación ya hecha por UpdateAvatarRequest
            $archivo = $request->file('avatar');

            $extension = strtolower($archivo->getClientOriginalExtension() ?: 'jpg');
            $nombreArchivo = Str::uuid()->toString() . '.' . $extension;

            $rutaStorage = $archivo->storeAs('avatars', $nombreArchivo, 'public');

            $publicStorageDir = public_path('storage/avatars');
            if (!File::exists($publicStorageDir)) {
                File::makeDirectory($publicStorageDir, 0755, true, true);
            }

            $origen = Storage::disk('public')->path($rutaStorage);
            $destinoPublico = $publicStorageDir . DIRECTORY_SEPARATOR . $nombreArchivo;
            File::copy($origen, $destinoPublico);

            if ($usuario->avatar) {
                $rutaAnterior = ltrim($usuario->avatar, '/');
                $rutaPublicaAnterior = public_path($rutaAnterior);
                if (File::exists($rutaPublicaAnterior)) {
                    @File::delete($rutaPublicaAnterior);
                }

                if (Str::startsWith($rutaAnterior, 'storage/')) {
                    $relativaStorage = substr($rutaAnterior, strlen('storage/'));
                    if ($relativaStorage) {
                        $rutaStorageAnterior = Storage::disk('public')->path($relativaStorage);
                        if (File::exists($rutaStorageAnterior)) {
                            @File::delete($rutaStorageAnterior);
                        }
                    }
                }
            }

            $usuario->update(['avatar' => 'storage/' . $rutaStorage]);
            $usuario->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Avatar actualizado correctamente',
                'data' => $usuario,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el avatar',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cambiar contraseña
     */
    public function cambiarPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'password_actual' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
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

            // Verificar contraseña actual
            if (!Hash::check($request->password_actual, $usuario->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'La contraseña actual es incorrecta'
                ], 422);
            }

            // Actualizar contraseña
            $usuario->update([
                'password' => Hash::make($request->password)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Contraseña actualizada exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar la contraseña',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener publicaciones del usuario
     */
    public function publicaciones(Request $request)
    {
        try {
            $usuarioId = $request->get('usuario_id', auth()->id());
            
            $publicaciones = Publicacion::where('autor_id', $usuarioId)
                ->with(['materia.cuatrimestre.carrera', 'comentarios'])
                ->orderBy('created_at', 'desc')
                ->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'data' => $publicaciones
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
     * Obtener publicaciones guardadas
     */
    public function guardados(Request $request)
    {
        try {
            $usuario = auth()->user();
            
            $publicaciones = $usuario->publicacionesGuardadas()
                ->with(['autor', 'materia.cuatrimestre.carrera'])
                ->orderByPivot('created_at', 'desc')
                ->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'data' => $publicaciones
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar publicaciones guardadas',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
