<?php

namespace App\Http\Requests\PurchaseRequest;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request for approving or rejecting a purchase request.
 * 
 * Only Admin and Inventory Manager can approve/reject requests.
 */
class ApprovePurchaseRequestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Only Admin and Inventory Manager roles can approve/reject.
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
            'approved_cost' => [
                'nullable',
                'numeric',
                'min:0',
                'max:999999.99',
            ],
            'notes' => [
                'nullable',
                'string',
                'max:1000',
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
            'approved_cost.numeric' => 'Approved cost must be a number.',
            'approved_cost.min' => 'Approved cost cannot be negative.',
            'approved_cost.max' => 'Approved cost cannot exceed 999,999.99.',
            'notes.max' => 'Notes cannot exceed 1000 characters.',
        ];
    }
}
