<?php

namespace App\Http\Requests\MaintenanceRequest;

use Illuminate\Foundation\Http\FormRequest;

class CancelMaintenanceRequestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        
        // Admin, Inventory Manager, and Lab Staff can cancel maintenance requests
        return $user && ($user->hasRole('Admin') || $user->hasRole('Inventory Manager') || $user->hasRole('Lab Staff'));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'resolution_notes' => 'required|string|max:1000',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array
     */
    public function messages(): array
    {
        return [
            'resolution_notes.required' => 'İptal notu zorunludur.',
            'resolution_notes.string' => 'İptal notu metin olmalıdır.',
            'resolution_notes.max' => 'İptal notu en fazla 1000 karakter olabilir.',
        ];
    }

    /**
     * Handle a failed authorization attempt.
     *
     * @return void
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    protected function failedAuthorization()
    {
        throw new \Illuminate\Auth\Access\AuthorizationException(
            'Bu talebi iptal etme yetkiniz yok.'
        );
    }
}
