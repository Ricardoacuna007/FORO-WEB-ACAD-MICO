<?php

namespace Tests\Feature;

use App\Models\Usuario;
use App\Models\Estudiante;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test: Usuario puede registrarse correctamente
     */
    public function test_usuario_puede_registrarse_como_estudiante(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'nombre' => 'Juan',
            'apellidos' => 'Pérez',
            'email' => 'juan.perez@upatlacomulco.edu.mx',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
            'rol' => 'estudiante',
            'matricula' => '2021210001',
            'carrera_id' => 1,
            'cuatrimestre_actual' => 5,
        ]);

        $response->assertStatus(201)
                 ->assertJson([
                     'success' => true,
                     'message' => 'Usuario registrado exitosamente'
                 ]);

        $this->assertDatabaseHas('usuarios', [
            'email' => 'juan.perez@upatlacomulco.edu.mx',
            'rol' => 'estudiante'
        ]);
    }

    /**
     * Test: Usuario puede iniciar sesión correctamente
     */
    public function test_usuario_puede_iniciar_sesion(): void
    {
        $usuario = Usuario::factory()->create([
            'email' => 'test@upatlacomulco.edu.mx',
            'password' => Hash::make('Password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@upatlacomulco.edu.mx',
            'password' => 'Password123',
        ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'message' => 'Login exitoso'
                 ])
                 ->assertJsonStructure([
                     'data' => [
                         'token',
                         'user' => [
                             'id',
                             'email',
                             'nombre'
                         ]
                     ]
                 ]);
    }

    /**
     * Test: Login falla con credenciales incorrectas
     */
    public function test_login_falla_con_credenciales_incorrectas(): void
    {
        $usuario = Usuario::factory()->create([
            'email' => 'test@upatlacomulco.edu.mx',
            'password' => Hash::make('Password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@upatlacomulco.edu.mx',
            'password' => 'PasswordIncorrecta',
        ]);

        $response->assertStatus(401)
                 ->assertJson([
                     'success' => false,
                     'message' => 'Credenciales incorrectas'
                 ]);
    }

    /**
     * Test: Rate limiting funciona en login
     */
    public function test_rate_limiting_en_login(): void
    {
        // Intentar login 11 veces (límite es 10 por minuto)
        for ($i = 0; $i < 11; $i++) {
            $response = $this->postJson('/api/auth/login', [
                'email' => 'test@upatlacomulco.edu.mx',
                'password' => 'password',
            ]);
        }

        // La última petición debe retornar 429 (Too Many Requests)
        $response->assertStatus(429);
    }

    /**
     * Test: Validación de email institucional
     */
    public function test_registro_requiere_email_institucional(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'nombre' => 'Juan',
            'apellidos' => 'Pérez',
            'email' => 'juan@gmail.com', // Email no institucional
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
            'rol' => 'estudiante',
            'matricula' => '2021210002',
            'carrera_id' => 1,
            'cuatrimestre_actual' => 5,
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test: Validación de contraseña segura
     */
    public function test_registro_requiere_contraseña_segura(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'nombre' => 'Juan',
            'apellidos' => 'Pérez',
            'email' => 'juan.perez@upatlacomulco.edu.mx',
            'password' => '12345678', // Contraseña sin mayúsculas
            'password_confirmation' => '12345678',
            'rol' => 'estudiante',
            'matricula' => '2021210003',
            'carrera_id' => 1,
            'cuatrimestre_actual' => 5,
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['password']);
    }
}

