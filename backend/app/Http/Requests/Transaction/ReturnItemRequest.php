<?php

namespace App\Http\Requests\Transaction;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request for returning an item.
 * 
 * Validates return data including condition and notes.
 */
class ReturnItemRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * All authenticated users can return items.
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
            'condition' => [
                'nullable',
                'in:good,damaged,needs_maintenance',
            ],
            // New enum field matching database schema
            'return_condition' => [
                'nullable',
                'in:excellent,good,fair,poor,damaged',
            ],
            'condition_notes' => [
                'nullable',
                'string',
                'max:500',
            ],
            'return_notes' => [
                'nullable',
                'string',
                'max:500',
            ],
            'is_damaged' => [
                'nullable',
                'boolean',
            ],
            'damage_reported' => [
                'nullable',
                'boolean',
            ],
            'damage_description' => [
                'required_if:damage_reported,true',
                'string',
                'max:1000',
            ],
            'maintenance_type' => [
                'required_if:damage_reported,true',
                'in:hardware_failure,software_issue,routine_cleaning,consumable_replacement',
            ],
            'maintenance_priority' => [
                'required_if:damage_reported,true',
                'in:low,medium,high,urgent',
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
            'condition.in' => 'Durum good, damaged veya needs_maintenance olmalıdır.',
            'condition_notes.max' => 'Durum notları en fazla 500 karakter olabilir.',
            'return_notes.max' => 'İade notları en fazla 500 karakter olabilir.',
            'damage_description.required_if' => 'Hasar bildirildiğinde hasar açıklaması zorunludur.',
            'damage_description.max' => 'Hasar açıklaması en fazla 1000 karakter olabilir.',
            'maintenance_type.required_if' => 'Hasar bildirildiğinde bakım türü zorunludur.',
            'maintenance_type.in' => 'Bakım türü geçersiz.',
            'maintenance_priority.required_if' => 'Hasar bildirildiğinde bakım önceliği zorunludur.',
            'maintenance_priority.in' => 'Bakım önceliği geçersiz.',
        ];
    }
}
