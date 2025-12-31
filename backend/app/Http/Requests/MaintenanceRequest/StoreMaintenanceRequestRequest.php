<?php

namespace App\Http\Requests\MaintenanceRequest;

use App\Rules\ValidPriority;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request for creating a new maintenance request.
 * 
 * Validates all required fields for maintenance request creation.
 * All authenticated users can create maintenance requests.
 */
class StoreMaintenanceRequestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * All authenticated users can create maintenance requests.
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
            'item_id' => [
                'required',
                'exists:items,id',
            ],
            'maintenance_type' => [
                'required',
                'in:hardware_failure,software_issue,routine_cleaning,consumable_replacement',
            ],
            'description' => [
                'required',
                'string',
                'max:1000',
            ],
            'priority' => [
                'required',
                new ValidPriority(),
            ],
            'notes' => [
                'nullable',
                'string',
                'max:500',
            ],
            'transaction_id' => [
                'nullable',
                'exists:transactions,id',
            ],
            'scheduled_date' => [
                'nullable',
                'date',
                'after_or_equal:today',
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
            'item_id.required' => 'Öğe seçimi zorunludur.',
            'item_id.exists' => 'Seçilen öğe mevcut değil.',
            'maintenance_type.required' => 'Bakım türü zorunludur.',
            'maintenance_type.in' => 'Geçersiz bakım türü seçildi.',
            'description.required' => 'Açıklama zorunludur.',
            'description.max' => 'Açıklama en fazla 1000 karakter olabilir.',
            'priority.required' => 'Öncelik zorunludur.',
            'notes.max' => 'Notlar en fazla 500 karakter olabilir.',
            'scheduled_date.date' => 'Planlanan tarih geçerli bir tarih olmalıdır.',
            'scheduled_date.after_or_equal' => 'Planlanan tarih bugün veya sonrası olmalıdır.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'item_id' => 'item',
            'transaction_id' => 'transaction',
        ];
    }
}
