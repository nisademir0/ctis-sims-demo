<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validates purchase request status values.
 */
class ValidPurchaseStatus implements ValidationRule
{
    /**
     * Allowed purchase status values.
     */
    private const VALID_STATUSES = [
        'pending',
        'approved',
        'rejected',
        'ordered',
        'received',
    ];

    /**
     * Run the validation rule.
     *
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!in_array($value, self::VALID_STATUSES, true)) {
            $validStatuses = implode(', ', self::VALID_STATUSES);
            $fail("The {$attribute} must be one of: {$validStatuses}.");
        }
    }

    /**
     * Get all valid status values.
     */
    public static function getValidStatuses(): array
    {
        return self::VALID_STATUSES;
    }
}
