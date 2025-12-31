<?php

namespace App\Http\Requests\PurchaseRequest;

use App\Rules\ValidPurchaseStatus;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request for updating purchase request status (ordered/received).
 * 
 * Only Inventory Manager and Admin can mark requests as ordered/received.
 */
class UpdatePurchaseStatusRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Only Admin and Inventory Manager can update status.
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
            'status' => [
                'required',
                new ValidPurchaseStatus(),
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
            'status.required' => 'Status is required.',
        ];
    }
}
