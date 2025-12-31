<?php

namespace App\Http\Requests\Inventory;

use App\Rules\ValidItemStatus;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request for filtering/searching inventory items.
 * 
 * Validates query parameters for the index/list endpoint.
 * All authenticated users can view items (with role-based filtering applied in controller).
 */
class IndexItemRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * All authenticated users can view items.
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
            'search' => [
                'nullable',
                'string',
                'max:255',
            ],
            'status' => [
                'nullable',
                new ValidItemStatus(),
            ],
            'category_id' => [
                'nullable',
                'exists:item_categories,id',
            ],
            'page' => [
                'nullable',
                'integer',
                'min:1',
            ],
            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
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
            'category_id.exists' => 'The selected category does not exist.',
            'page.min' => 'Page number must be at least 1.',
            'per_page.min' => 'Items per page must be at least 1.',
            'per_page.max' => 'Items per page cannot exceed 100.',
        ];
    }
}
