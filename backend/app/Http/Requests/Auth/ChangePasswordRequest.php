<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ChangePasswordRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // User must be authenticated to change password
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'current_password' => [
                'required',
                'string',
            ],
            'new_password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                'different:current_password',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/', // At least one lowercase, uppercase, and digit
            ],
        ];
    }

    /**
     * Get custom error messages in Turkish.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'current_password.required' => 'Mevcut şifre zorunludur.',
            'new_password.required' => 'Yeni şifre zorunludur.',
            'new_password.min' => 'Yeni şifre en az 8 karakter olmalıdır.',
            'new_password.confirmed' => 'Yeni şifre onayı eşleşmiyor.',
            'new_password.different' => 'Yeni şifre mevcut şifreden farklı olmalıdır.',
            'new_password.regex' => 'Yeni şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir.',
        ];
    }
}
