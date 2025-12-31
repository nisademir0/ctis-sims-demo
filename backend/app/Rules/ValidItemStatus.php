<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validates that an item status value is one of the allowed values.
 * Matches the database CHECK constraint for items.status.
 */
class ValidItemStatus implements ValidationRule
{
    /**
     * Allowed item status values.
     */
    private const VALID_STATUSES = [
        'available',
        'lent',
        'maintenance',
        'retired',
        'donated',
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
