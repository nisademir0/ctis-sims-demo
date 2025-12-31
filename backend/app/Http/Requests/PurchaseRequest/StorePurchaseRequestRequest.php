<?php

namespace App\Http\Requests\PurchaseRequest;

use App\Rules\PositiveQuantity;
use App\Rules\NonNegativeCost;
use App\Rules\ValidPriority;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request for creating a new purchase request.
 * 
 * Validates all required fields including custom validation for quantity and cost.
 * All authenticated users can create purchase requests.
 */
class StorePurchaseRequestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * All authenticated users can submit purchase requests.
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
                'required',
                'string',
                'max:255',
            ],
            'description' => [
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
                'required',
                new PositiveQuantity(), // Custom validation: quantity > 0
            ],
            'estimated_cost' => [
                'nullable',
                new NonNegativeCost(), // Custom validation: cost >= 0
            ],
            'justification' => [
                'required',
                'string',
                'max:1000',
            ],
            'priority' => [
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
            'item_name.max' => 'Item name cannot exceed 255 characters.',
            'description.required' => 'Description is required.',
            'description.max' => 'Description cannot exceed 1000 characters.',
            'quantity.required' => 'Quantity is required.',
            'justification.required' => 'Justification is required.',
            'justification.max' => 'Justification cannot exceed 1000 characters.',
            'priority.required' => 'Priority is required.',
            'needed_by_date.after_or_equal' => 'Needed by date cannot be in the past.',
        ];
    }
}
