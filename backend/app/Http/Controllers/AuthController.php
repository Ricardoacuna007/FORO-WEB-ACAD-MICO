<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use App\Models\Estudiante;
use App\Models\Profesor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

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
            'turno' => 'required_if:rol,estudiante|in:matutino,vespertino',
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
                    'turno' => $request->turno,
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
            return response()->json([
                'success' => false,
                'message' => 'Cuenta desactivada'
            ], 401);
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
}

