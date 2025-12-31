<?php

namespace App\Http\Requests\PurchaseRequest;

use App\Rules\PositiveQuantity;
use App\Rules\NonNegativeCost;
use App\Rules\ValidPriority;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request for updating an existing purchase request.
 * 
 * Validates update fields. Requester can update their own pending requests.
 */
class UpdatePurchaseRequestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Users can update their own pending requests (additional checks in controller).
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
            'item_name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],
            'description' => [
                'sometimes',
                'required',
                'string',
                'max:1000',
            ],
            'category' => [
                'nullable',
                'string',
                'max:255',
            ],
            'quantity' => [
                'sometimes',
                'required',
                new PositiveQuantity(),
            ],
            'estimated_cost' => [
                'nullable',
                new NonNegativeCost(),
            ],
            'justification' => [
                'sometimes',
                'required',
                'string',
                'max:1000',
            ],
            'priority' => [
                'sometimes',
                'required',
                new ValidPriority(),
            ],
            'needed_by_date' => [
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
            'item_name.required' => 'Item name is required.',
            'description.required' => 'Description is required.',
            'quantity.required' => 'Quantity is required.',
            'justification.required' => 'Justification is required.',
            'priority.required' => 'Priority is required.',
            'needed_by_date.after_or_equal' => 'Needed by date cannot be in the past.',
        ];
    }
}
