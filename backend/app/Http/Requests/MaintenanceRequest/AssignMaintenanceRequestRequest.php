<?php

namespace App\Http\Requests\MaintenanceRequest;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request for assigning a maintenance request to a staff member.
 * 
 * Only Inventory Managers and Admins can assign maintenance requests.
 */
class AssignMaintenanceRequestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Only Admin and Inventory Manager roles can assign requests.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        
        // Allow Admin and Inventory Manager
        return $user && ($user->hasRole('Admin') || $user->hasRole('Inventory Manager'));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'assigned_to' => [
                'required',
                'exists:users,id',
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
            'assigned_to.required' => 'Staff member selection is required.',
            'assigned_to.exists' => 'The selected staff member does not exist.',
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
            'assigned_to' => 'staff member',
        ];
    }
}
