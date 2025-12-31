<?php

namespace App\Http\Requests\PurchaseRequest;

use Illuminate\Foundation\Http\FormRequest;

class MarkAsReceivedRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        
        // Only Admin and Inventory Manager can mark as received
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
            'actual_cost' => 'nullable|numeric|min:0',
            'actual_quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:1000',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array
     */
    public function messages(): array
    {
        return [
            'actual_cost.numeric' => 'Gerçek maliyet sayısal bir değer olmalıdır.',
            'actual_cost.min' => 'Gerçek maliyet negatif olamaz.',
            'actual_quantity.required' => 'Gerçek miktar zorunludur.',
            'actual_quantity.integer' => 'Gerçek miktar tam sayı olmalıdır.',
            'actual_quantity.min' => 'Gerçek miktar en az 1 olmalıdır.',
            'notes.string' => 'Notlar metin olmalıdır.',
            'notes.max' => 'Notlar en fazla 1000 karakter olabilir.',
        ];
    }

    /**
     * Handle a failed authorization attempt.
     *
     * @return void
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    protected function failedAuthorization()
    {
        throw new \Illuminate\Auth\Access\AuthorizationException(
            'Bu talebi teslim alındı olarak işaretleme yetkiniz yok.'
        );
    }
}
