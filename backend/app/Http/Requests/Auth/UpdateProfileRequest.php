<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // User must be authenticated to update their profile
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = $this->user()?->id;
        
        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],
            'email' => [
                'sometimes',
                'required',
                'email',
                'unique:users,email,' . $userId,
            ],
            'phone' => [
                'nullable',
                'string',
                'max:20',
                'regex:/^[\d\s\+\-\(\)]+$/', // Allow digits, spaces, +, -, (, )
            ],
            'bio' => [
                'nullable',
                'string',
                'max:500',
            ],
            'avatar' => [
                'nullable',
                'image',
                'mimes:jpeg,png,jpg,gif',
                'max:2048', // 2MB max
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
            'name.required' => 'İsim zorunludur.',
            'name.string' => 'İsim metin formatında olmalıdır.',
            'name.max' => 'İsim en fazla 255 karakter olabilir.',
            'email.required' => 'E-posta adresi zorunludur.',
            'email.email' => 'Geçerli bir e-posta adresi giriniz.',
            'email.unique' => 'Bu e-posta adresi zaten kullanılıyor.',
            'phone.string' => 'Telefon numarası metin formatında olmalıdır.',
            'phone.max' => 'Telefon numarası en fazla 20 karakter olabilir.',
            'phone.regex' => 'Geçerli bir telefon numarası giriniz.',
            'bio.string' => 'Biyografi metin formatında olmalıdır.',
            'bio.max' => 'Biyografi en fazla 500 karakter olabilir.',
            'avatar.image' => 'Avatar bir resim dosyası olmalıdır.',
            'avatar.mimes' => 'Avatar jpeg, png, jpg veya gif formatında olmalıdır.',
            'avatar.max' => 'Avatar boyutu en fazla 2MB olabilir.',
        ];
    }
}
