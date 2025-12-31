<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Comprehensive validation for item creation
 * 
 * Security features:
 * - XSS prevention via sanitization
 * - Business logic validation
 * - Role-based authorization
 * - Format enforcement via regex
 * - Array size limits (DoS prevention)
 */
class StoreItemRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        
        // Only Manager and Admin can create items
        return $user && ($user->hasRole('Manager') || $user->hasRole('Admin'));
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            // Item name: alphanumeric + spaces/hyphens only
            'name' => [
                'required',
                'string',
                'min:2',
                'max:255',
                'regex:/^[a-zA-Z0-9\s\-\.ğüşıöçĞÜŞİÖÇ]+$/u'  // Turkish characters allowed
            ],
            
            // Inventory number: Uppercase + numbers + hyphens, must be unique
            'inventory_number' => [
                'required',
                'string',
                'min:3',
                'max:50',
                'unique:items,inventory_number',
                'regex:/^[A-Z0-9\-]+$/'
            ],
            
            // Category must exist
            'category_id' => [
                'required',
                'integer',
                'exists:item_categories,id'
            ],
            
            // Vendor is optional but must exist if provided
            'vendor_id' => [
                'nullable',
                'integer',
                'exists:vendors,id'
            ],
            
            // Location: Building/Room format enforced
            'location' => [
                'required',
                'string',
                'min:2',
                'max:255',
                'regex:/^[A-Z0-9\s\-\/]+$/i'  // Examples: B212, A-Block/Room-5
            ],
            
            // Status: Enum validation
            'status' => [
                'required',
                Rule::in(['available', 'lent', 'maintenance', 'retired', 'donated'])
            ],
            
            // Specifications: Limited JSON object
            'specifications' => [
                'nullable',
                'array',
                'max:20'  // Max 20 key-value pairs (DoS prevention)
            ],
            'specifications.*' => [
                'string',
                'max:500'  // Each value max 500 chars
            ],
            
            // Current holder: Must be existing user
            'current_holder_id' => [
                'nullable',
                'integer',
                'exists:users,id',
                'required_if:status,lent'  // If status is 'lent', holder is required
            ],
            
            // Purchase date: Cannot be in future
            'purchase_date' => [
                'nullable',
                'date',
                'before_or_equal:today'
            ],
            
            // Warranty expiry: Must be after purchase date
            'warranty_expiry_date' => [
                'nullable',
                'date',
                'after_or_equal:purchase_date'
            ],
        ];
    }

    /**
     * Get custom error messages.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Eşya adı zorunludur.',
            'name.regex' => 'Eşya adı sadece harf, rakam ve tire içerebilir.',
            
            'inventory_number.required' => 'Envanter numarası zorunludur.',
            'inventory_number.unique' => 'Bu envanter numarası zaten kullanılıyor.',
            'inventory_number.regex' => 'Envanter numarası formatı: BÜYÜK HARF, RAKAM ve TİRE (örn: A-123-B)',
            
            'category_id.required' => 'Kategori seçimi zorunludur.',
            'category_id.exists' => 'Seçilen kategori bulunamadı.',
            
            'vendor_id.exists' => 'Seçilen tedarikçi bulunamadı.',
            
            'location.required' => 'Konum bilgisi zorunludur.',
            'location.regex' => 'Konum formatı geçersiz (örn: B212, A-Blok/Oda-5).',
            
            'status.required' => 'Durum seçimi zorunludur.',
            'status.in' => 'Geçersiz durum. Geçerli değerler: available, lent, maintenance, retired, donated',
            
            'specifications.array' => 'Özellikler bir dizi olmalıdır.',
            'specifications.max' => 'Maksimum 20 özellik ekleyebilirsiniz.',
            'specifications.*.max' => 'Her özellik değeri maksimum 500 karakter olabilir.',
            
            'current_holder_id.exists' => 'Seçilen kullanıcı bulunamadı.',
            'current_holder_id.required_if' => 'Eşya zimmetli ise kişi seçimi zorunludur.',
            
            'purchase_date.before_or_equal' => 'Satın alma tarihi bugünden ileri olamaz.',
            
            'warranty_expiry_date.after_or_equal' => 'Garanti bitiş tarihi, satın alma tarihinden önce olamaz.',
        ];
    }

    /**
     * Prepare data for validation (sanitization).
     */
    protected function prepareForValidation(): void
    {
        $data = [];

        // Trim all string inputs
        if ($this->has('name')) {
            $data['name'] = trim($this->name);
        }

        if ($this->has('inventory_number')) {
            // Force uppercase for inventory numbers
            $data['inventory_number'] = strtoupper(trim($this->inventory_number));
        }

        if ($this->has('location')) {
            $data['location'] = trim($this->location);
        }

        // Sanitize specifications (prevent XSS in JSON values)
        if ($this->has('specifications') && is_array($this->specifications)) {
            $data['specifications'] = $this->sanitizeSpecifications($this->specifications);
        }

        // If status is not 'lent', clear holder
        if ($this->has('status') && $this->status !== 'lent') {
            $data['current_holder_id'] = null;
        }

        $this->merge($data);
    }

    /**
     * Sanitize specifications array to prevent XSS.
     */
    private function sanitizeSpecifications(array $specs): array
    {
        $sanitized = [];

        foreach ($specs as $key => $value) {
            // Sanitize both key and value
            $cleanKey = htmlspecialchars($key, ENT_QUOTES, 'UTF-8');
            $cleanValue = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
            
            // Limit key length
            if (strlen($cleanKey) <= 100) {
                $sanitized[$cleanKey] = $cleanValue;
            }
        }

        return $sanitized;
    }

    /**
     * Handle a failed authorization attempt.
     */
    protected function failedAuthorization()
    {
        abort(403, 'Bu işlem için yetkiniz yok. Sadece Manager ve Admin eşya ekleyebilir.');
    }

}
