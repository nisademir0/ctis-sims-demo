<?php

namespace App\Http\Requests\PurchaseRequest;

use Illuminate\Foundation\Http\FormRequest;

class MarkAsOrderedRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        
        // Only Admin and Inventory Manager can mark as ordered
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
            'vendor' => 'nullable|string|max:255',
            'vendor_id' => 'nullable|exists:vendors,id',
            'actual_cost' => 'nullable|numeric|min:0',
            'expected_delivery_date' => 'nullable|date|after_or_equal:today',
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
            'vendor.string' => 'Tedarikçi adı metin olmalıdır.',
            'vendor.max' => 'Tedarikçi adı en fazla 255 karakter olabilir.',
            'vendor_id.exists' => 'Seçilen tedarikçi mevcut değil.',
            'actual_cost.numeric' => 'Gerçek maliyet sayısal bir değer olmalıdır.',
            'actual_cost.min' => 'Gerçek maliyet negatif olamaz.',
            'expected_delivery_date.date' => 'Beklenen teslimat tarihi geçerli bir tarih olmalıdır.',
            'expected_delivery_date.after_or_equal' => 'Beklenen teslimat tarihi bugün veya sonrası olmalıdır.',
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
            'Bu talebi sipariş edildi olarak işaretleme yetkiniz yok.'
        );
    }
}
