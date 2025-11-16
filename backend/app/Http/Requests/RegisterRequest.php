<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:100', 'regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/'],
            'apellidos' => ['required', 'string', 'max:100', 'regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/'],
            'email' => [
                'required',
                'email',
                'unique:usuarios,email',
                'ends_with:@upatlacomulco.edu.mx',
                'max:255'
            ],
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/' // Al menos una mayúscula, una minúscula y un número
            ],
            'rol' => ['required', 'in:estudiante,profesor'],
            'matricula' => [
                'required_if:rol,estudiante',
                'string',
                'unique:estudiantes,matricula',
                'regex:/^[0-9]{10}$/'
            ],
            'carrera_id' => ['required_if:rol,estudiante', 'exists:carreras,id'],
            'cuatrimestre_actual' => ['required_if:rol,estudiante', 'integer', 'min:1', 'max:11'],
            'num_empleado' => [
                'required_if:rol,profesor',
                'string',
                'unique:profesores,num_empleado',
                'max:50'
            ],
            'especialidad' => ['sometimes', 'string', 'max:255', 'nullable'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'nombre.regex' => 'El nombre solo puede contener letras y espacios.',
            'apellidos.regex' => 'Los apellidos solo pueden contener letras y espacios.',
            'email.ends_with' => 'Debes usar un correo institucional (@upatlacomulco.edu.mx).',
            'password.regex' => 'La contraseña debe contener al menos una mayúscula, una minúscula y un número.',
            'matricula.regex' => 'La matrícula debe tener exactamente 10 dígitos.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
        ];
    }
}

