<?php

namespace App\Http\Requests\MaintenanceRequest;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request for completing a maintenance request.
 * 
 * Validates completion notes and ensures user is assigned to the request.
 */
class CompleteMaintenanceRequestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * User must be assigned to the maintenance request (checked in controller).
     */
    public function authorize(): bool
    {
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
            'resolution_notes' => [
                'required',
                'string',
                'max:1000',
            ],
            'cost' => [
                'nullable',
                'numeric',
                'min:0',
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'resolution_notes.required' => 'Tamamlama notları zorunludur.',
            'resolution_notes.max' => 'Tamamlama notları en fazla 1000 karakter olabilir.',
            'cost.numeric' => 'Maliyet sayısal bir değer olmalıdır.',
            'cost.min' => 'Maliyet negatif olamaz.',
        ];
    }
}
