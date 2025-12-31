<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validates that estimated cost is non-negative.
 * Matches the database CHECK constraint for estimated_cost >= 0.
 */
class NonNegativeCost implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!is_numeric($value)) {
            $fail("The {$attribute} must be a number.");
            return;
        }

        $cost = (float) $value;

        if ($cost < 0) {
            $fail("The {$attribute} cannot be negative.");
        }
    }
}
