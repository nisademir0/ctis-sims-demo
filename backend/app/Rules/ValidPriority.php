<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validates priority values for maintenance and purchase requests.
 */
class ValidPriority implements ValidationRule
{
    /**
     * Allowed priority values.
     */
    private const VALID_PRIORITIES = [
        'low',
        'medium',
        'high',
        'urgent',
    ];

    /**
     * Run the validation rule.
     *
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!in_array($value, self::VALID_PRIORITIES, true)) {
            $validPriorities = implode(', ', self::VALID_PRIORITIES);
            $fail("The {$attribute} must be one of: {$validPriorities}.");
        }
    }

    /**
     * Get all valid priority values.
     */
    public static function getValidPriorities(): array
    {
        return self::VALID_PRIORITIES;
    }
}
