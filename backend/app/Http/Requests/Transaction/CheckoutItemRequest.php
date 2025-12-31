<?php

namespace App\Http\Requests\Transaction;

use App\Rules\ItemAvailableForCheckout;
use App\Rules\ValidDueDate;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request for checking out an item to a user.
 * 
 * Validates checkout data and ensures item is available.
 * Uses custom business logic validation (ItemAvailableForCheckout).
 */
class CheckoutItemRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * All authenticated users can checkout items (specific permissions handled by controller/policy).
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
                new ItemAvailableForCheckout(), // Custom business logic validation
            ],
            'user_id' => [
                'required',
                'exists:users,id',
            ],
            'due_date' => [
                'nullable', // Nullable for infinite duration (zimmet/assignment)
                'date',
                'after:today',
                new ValidDueDate(90), // Max 90 days ahead
            ],
            'expected_return_date' => [ // Alias for due_date (for API compatibility)
                'nullable',
                'date',
                'after:today',
                new ValidDueDate(90),
            ],
            'notes' => [
                'nullable',
                'string',
                'max:500',
            ],
            'is_assignment' => [
                'nullable',
                'boolean',
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
            'item_id.required' => 'Item selection is required.',
            'item_id.exists' => 'The selected item does not exist.',
            'user_id.required' => 'User selection is required.',
            'user_id.exists' => 'The selected user does not exist.',
            'due_date.after' => 'Due date must be in the future.',
            'notes.max' => 'Notes cannot exceed 500 characters.',
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
            'user_id' => 'user',
        ];
    }
}
