<?php

namespace App\Http\Requests\Transaction;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request for listing transactions.
 * 
 * Validates filter parameters for transaction queries.
 */
class IndexTransactionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * All authenticated users can view transactions.
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
                'nullable',
                'exists:items,id',
            ],
            'user_id' => [
                'nullable',
                'exists:users,id',
            ],
            'status' => [
                'nullable',
                'in:active,returned,overdue',
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
            'item_id.exists' => 'Seçilen öğe mevcut değil.',
            'user_id.exists' => 'Seçilen kullanıcı mevcut değil.',
            'status.in' => 'Durum active, returned veya overdue olmalıdır.',
            'page.integer' => 'Sayfa numarası tam sayı olmalıdır.',
            'page.min' => 'Sayfa numarası en az 1 olmalıdır.',
            'per_page.integer' => 'Sayfa başına öğe sayısı tam sayı olmalıdır.',
            'per_page.min' => 'Sayfa başına öğe sayısı en az 1 olmalıdır.',
            'per_page.max' => 'Sayfa başına öğe sayısı en fazla 100 olabilir.',
        ];
    }
}
