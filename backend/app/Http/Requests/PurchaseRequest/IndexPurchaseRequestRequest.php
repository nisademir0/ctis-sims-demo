<?php

namespace App\Http\Requests\PurchaseRequest;

use Illuminate\Foundation\Http\FormRequest;

class IndexPurchaseRequestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // All authenticated users can view purchase requests
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => 'sometimes|in:pending,approved,rejected,ordered,received,cancelled',
            'priority' => 'sometimes|in:low,medium,high,urgent',
            'my_requests' => 'sometimes|in:true,false',
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
            'status.in' => 'Geçersiz durum değeri.',
            'priority.in' => 'Geçersiz öncelik değeri.',
            'my_requests.in' => 'my_requests parametresi true veya false olmalıdır.',
        ];
    }
}
