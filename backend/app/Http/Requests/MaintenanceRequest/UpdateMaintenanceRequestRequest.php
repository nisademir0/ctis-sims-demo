<?php

namespace App\Http\Requests\MaintenanceRequest;

use App\Rules\ValidMaintenanceStatus;
use App\Rules\ValidPriority;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request for updating an existing maintenance request.
 * 
 * Validates update fields including status and priority.
 */
class UpdateMaintenanceRequestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Authorization depends on user role (handled by controller/policy).
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
            'status' => [
                'sometimes',
                'required',
                new ValidMaintenanceStatus(),
            ],
            'priority' => [
                'sometimes',
                'required',
                new ValidPriority(),
            ],
            'description' => [
                'sometimes',
                'required',
                'string',
                'max:1000',
            ],
            'notes' => [
                'nullable',
                'string',
                'max:500',
            ],
            'resolution_notes' => [
                'nullable',
                'string',
                'max:1000',
            ],
            'resolution_notes' => [
                'nullable',
                'string',
                'max:1000',
            ],
            'cost' => [
                'nullable',
                'numeric',
                'min:0',
            ],
            'scheduled_date' => [
                'nullable',
                'date',
            ],
            'assigned_to' => [
                'nullable',
                'exists:users,id',
            ],
            'maintenance_type' => [
                'sometimes',
                'in:hardware_failure,software_issue,routine_cleaning,consumable_replacement',
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
            'description.required' => 'Açıklama zorunludur.',
            'description.max' => 'Açıklama en fazla 1000 karakter olabilir.',
            'notes.max' => 'Notlar en fazla 500 karakter olabilir.',
            'resolution_notes.max' => 'Tamamlama notları en fazla 1000 karakter olabilir.',
            'resolution_notes.max' => 'Çözüm notları en fazla 1000 karakter olabilir.',
            'cost.numeric' => 'Maliyet sayısal bir değer olmalıdır.',
            'cost.min' => 'Maliyet negatif olamaz.',
            'scheduled_date.date' => 'Planlanan tarih geçerli bir tarih olmalıdır.',
            'assigned_to.exists' => 'Seçilen kullanıcı mevcut değil.',
            'maintenance_type.in' => 'Geçersiz bakım türü seçildi.',
        ];
    }
}
