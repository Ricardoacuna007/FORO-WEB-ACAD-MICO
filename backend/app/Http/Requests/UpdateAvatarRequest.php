<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAvatarRequest extends FormRequest
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
            'avatar' => [
                'required',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048', // 2MB
                'dimensions:min_width=100,min_height=100,max_width=2000,max_height=2000,ratio=1/1'
            ]
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'avatar.required' => 'Debes seleccionar una imagen para tu avatar.',
            'avatar.image' => 'El archivo debe ser una imagen válida.',
            'avatar.mimes' => 'El formato de imagen debe ser JPG, JPEG, PNG o WEBP.',
            'avatar.max' => 'La imagen no debe exceder 2MB de tamaño.',
            'avatar.dimensions' => 'La imagen debe ser cuadrada y tener entre 100x100 y 2000x2000 píxeles.',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $file = $this->file('avatar');
            
            if ($file) {
                // Validar que el archivo no esté corrupto
                $imageInfo = @getimagesize($file->getPathname());
                if ($imageInfo === false) {
                    $validator->errors()->add('avatar', 'El archivo de imagen está corrupto o no es válido.');
                }

                // Validar extensión real del archivo (no solo el nombre)
                $mimeType = $file->getMimeType();
                $allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
                if (!in_array($mimeType, $allowedMimes)) {
                    $validator->errors()->add('avatar', 'El tipo MIME del archivo no es válido.');
                }
            }
        });
    }
}

