<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use App\Models\Estudiante;
use App\Models\Profesor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
            'email' => 'required|email|unique:usuarios|ends_with:@upatlacomulco.edu.mx',
            'password' => 'required|string|min:8|confirmed',
            'rol' => 'required|in:estudiante,profesor',
            'matricula' => 'required_if:rol,estudiante|string|unique:estudiantes',
            'carrera_id' => 'required_if:rol,estudiante|exists:carreras,id',
            'cuatrimestre_actual' => 'required_if:rol,estudiante|integer|min:1|max:11',
            'num_empleado' => 'required_if:rol,profesor|string|unique:profesores',
            'especialidad' => 'sometimes|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Crear usuario
            $usuario = Usuario::create([
                'nombre' => $request->nombre,
                'apellidos' => $request->apellidos,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'rol' => $request->rol,
            ]);

            // Crear perfil específico
            if ($request->rol === 'estudiante') {
                Estudiante::create([
                    'usuario_id' => $usuario->id,
                    'matricula' => $request->matricula,
                    'carrera_id' => $request->carrera_id,
                    'cuatrimestre_actual' => $request->cuatrimestre_actual,
                'turno' => 'matutino',
                ]);
            } elseif ($request->rol === 'profesor') {
                Profesor::create([
                    'usuario_id' => $usuario->id,
                    'num_empleado' => $request->num_empleado,
                    'especialidad' => $request->especialidad,
                ]);
            }

            // Generar token
            $token = $usuario->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Usuario registrado exitosamente',
                'data' => [
                    'user' => $usuario,
                    'token' => $token
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        // Buscar usuario
        $usuario = Usuario::where('email', $request->email)->first();

        if (!$usuario || !Hash::check($request->password, $usuario->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Credenciales incorrectas'
            ], 401);
        }

        if (!$usuario->activo) {
            $mensaje = 'Tu cuenta está desactivada.';

            if ($this->suspensionColumnsDisponibles()) {
                if ($usuario->suspension_activa) {
                    $mensaje = 'Tu cuenta fue suspendida por el equipo de moderación.';

                    if ($usuario->suspendido_hasta) {
                        $mensaje .= ' Podrás volver a iniciar sesión después del ' . $usuario->suspendido_hasta->format('d/m/Y H:i');
                    }

                    if ($usuario->suspension_motivo) {
                        $mensaje .= ' Motivo: ' . $usuario->suspension_motivo;
                    }
                } elseif ($usuario->suspension_motivo) {
                    $mensaje .= ' Motivo: ' . $usuario->suspension_motivo;
                }
            }

            return response()->json([
                'success' => false,
                'message' => $mensaje,
                'data' => $this->suspensionColumnsDisponibles() ? [
                    'motivo' => $usuario->suspension_motivo,
                    'suspendido_hasta' => optional($usuario->suspendido_hasta)->toIso8601String(),
                ] : null,
            ], 423);
        }

        if ($this->suspensionColumnsDisponibles() && $usuario->suspension_activa) {
            if ($usuario->suspendido_hasta && $usuario->suspendido_hasta->isPast()) {
                $usuario->update([
                    'suspension_activa' => false,
                    'suspendido_hasta' => null,
                    'suspension_motivo' => null,
                    'activo' => true,
                ]);
            } else {
                $mensaje = 'Tu cuenta se encuentra suspendida por el equipo de moderación.';
                if ($usuario->suspendido_hasta) {
                    $mensaje .= ' Podrás volver a iniciar sesión después del ' . $usuario->suspendido_hasta->format('d/m/Y H:i');
                }
                if ($usuario->suspension_motivo) {
                    $mensaje .= ' Motivo: ' . $usuario->suspension_motivo;
                }

                return response()->json([
                    'success' => false,
                    'message' => $mensaje,
                    'data' => [
                        'motivo' => $usuario->suspension_motivo,
                        'suspendido_hasta' => optional($usuario->suspendido_hasta)->toIso8601String(),
                    ]
                ], 423);
            }
        }

        // Generar token
        $token = $usuario->createToken('auth_token')->plainTextToken;

        // Cargar relaciones según el rol
        if ($usuario->isEstudiante()) {
            $usuario->load('estudiante.carrera');
        } elseif ($usuario->isProfesor()) {
            $usuario->load('profesor');
        }

        return response()->json([
            'success' => true,
            'message' => 'Login exitoso',
            'data' => [
                'user' => $usuario,
                'token' => $token
            ]
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sesión cerrada exitosamente'
        ]);
    }

    public function me(Request $request)
    {
        $usuario = $request->user();
        
        // Cargar relaciones según el rol
        if ($usuario->isEstudiante()) {
            $usuario->load('estudiante.carrera');
        } elseif ($usuario->isProfesor()) {
            $usuario->load('profesor');
        }

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $usuario
            ]
        ]);
    }

    /**
     * Solicitar recuperación de contraseña
     */
    public function solicitarRecuperacion(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:usuarios,email',
        ], [
            'email.exists' => 'No encontramos una cuenta con este correo institucional.'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $email = $request->email;
            $tokenPlano = Str::random(64);

            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $email],
                [
                    'token' => Hash::make($tokenPlano),
                    'created_at' => now(),
                ]
            );

            // TODO: Enviar correo con el enlace de recuperación

            $response = [
                'success' => true,
                'message' => 'Hemos generado un enlace de recuperación. Revisa tu correo institucional.',
            ];

            if (!app()->environment('production')) {
                $response['data'] = [
                    'token' => $tokenPlano,
                    'nota' => 'Este token se muestra solo en entornos de desarrollo para facilitar las pruebas.'
                ];
            }

            return response()->json($response);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al generar el enlace de recuperación',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restablecer contraseña con token
     */
    public function restablecerPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:usuarios,email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ], [
            'email.exists' => 'No encontramos una cuenta con este correo institucional.',
            'password.confirmed' => 'Las contraseñas no coinciden.'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $record = DB::table('password_reset_tokens')
                ->where('email', $request->email)
                ->first();

            if (!$record) {
                return response()->json([
                    'success' => false,
                    'message' => 'El token proporcionado no es válido o ya fue utilizado.'
                ], 422);
            }

            if (!Hash::check($request->token, $record->token)) {
                return response()->json([
                    'success' => false,
                    'message' => 'El token proporcionado no es válido.'
                ], 422);
            }

            if ($record->created_at && Carbon::parse($record->created_at)->addMinutes(60)->isPast()) {
                DB::table('password_reset_tokens')->where('email', $request->email)->delete();

                return response()->json([
                    'success' => false,
                    'message' => 'El token ha expirado. Solicita uno nuevo.'
                ], 422);
            }

            $usuario = Usuario::where('email', $request->email)->firstOrFail();
            $usuario->password = Hash::make($request->password);
            $usuario->save();

            // Invalidar tokens anteriores
            $usuario->tokens()->delete();

            DB::table('password_reset_tokens')->where('email', $request->email)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Tu contraseña se restableció correctamente. Inicia sesión con tu nueva contraseña.'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al restablecer la contraseña',
                'error' => $e->getMessage()
            ], 500);
        }
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

