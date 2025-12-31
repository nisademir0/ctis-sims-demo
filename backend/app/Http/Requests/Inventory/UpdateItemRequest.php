<?php

namespace App\Http\Requests\Inventory;

use App\Rules\ValidItemStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Form Request for updating an existing inventory item.
 * 
 * Validates all fields and applies custom validation rules.
 * Only Admin and Inventory Manager can update items (authorization).
 */
class UpdateItemRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Only Admin and Inventory Manager roles can update items.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        
        // Allow Admin and Inventory Manager, deny Staff
        return $user && ($user->hasRole('Admin') || $user->hasRole('Inventory Manager'));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // Get the item ID from the route parameter
        $itemId = $this->route('id');

        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],
            'inventory_number' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('items', 'inventory_number')->ignore($itemId),
            ],
            'category_id' => [
                'sometimes',
                'required',
                'exists:item_categories,id',
            ],
            'vendor_id' => [
                'nullable',
                'exists:vendors,id',
            ],
            'location' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],
            'status' => [
                'sometimes',
                'required',
                new ValidItemStatus(),
            ],
            'specifications' => [
                'nullable',
                'array',
            ],
            'current_holder_id' => [
                'nullable',
                'exists:users,id',
            ],
            'purchase_date' => [
                'nullable',
                'date',
                'before_or_equal:today',
            ],
            'warranty_expiry_date' => [
                'nullable',
                'date',
                'after_or_equal:purchase_date',
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
            'name.required' => 'Item name is required.',
            'inventory_number.required' => 'Inventory number is required.',
            'inventory_number.unique' => 'This inventory number is already in use.',
            'category_id.required' => 'Category is required.',
            'category_id.exists' => 'The selected category does not exist.',
            'location.required' => 'Location is required.',
            'purchase_date.before_or_equal' => 'Purchase date cannot be in the future.',
            'warranty_expiry_date.after_or_equal' => 'Warranty expiry must be after purchase date.',
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
            'category_id' => 'category',
            'vendor_id' => 'vendor',
            'current_holder_id' => 'current holder',
        ];
    }
}
