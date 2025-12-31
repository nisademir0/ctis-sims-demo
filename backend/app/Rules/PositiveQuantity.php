<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validates that a quantity is a positive integer.
 * Matches the database CHECK constraint for quantity > 0.
 */
class PositiveQuantity implements ValidationRule
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

        $quantity = (int) $value;

        if ($quantity <= 0) {
            $fail("The {$attribute} must be greater than zero.");
        }

        if ($quantity != $value) {
            $fail("The {$attribute} must be a whole number.");
        }
    }
}
