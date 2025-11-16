<?php

namespace Database\Factories;

use App\Models\Usuario;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Usuario>
 */
class UsuarioFactory extends Factory
{
    protected $model = Usuario::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nombre' => fake()->firstName(),
            'apellidos' => fake()->lastName() . ' ' . fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => Hash::make('Password123'), // Contraseña por defecto para tests
            'rol' => fake()->randomElement(['estudiante', 'profesor', 'admin']),
            'avatar' => null,
            'activo' => true,
            'suspension_activa' => false,
            'suspendido_hasta' => null,
            'suspension_motivo' => null,
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the user is an estudiante.
     */
    public function estudiante(): static
    {
        return $this->state(fn (array $attributes) => [
            'rol' => 'estudiante',
        ]);
    }

    /**
     * Indicate that the user is a profesor.
     */
    public function profesor(): static
    {
        return $this->state(fn (array $attributes) => [
            'rol' => 'profesor',
        ]);
    }

    /**
     * Indicate that the user is an admin.
     */
    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'rol' => 'admin',
        ]);
    }

    /**
     * Indicate that the user is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'activo' => false,
        ]);
    }
}

