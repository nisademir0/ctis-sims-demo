<?php

namespace App\Rules;

use Carbon\Carbon;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validates that a due date is in the future and within acceptable range.
 * Due dates should be:
 * - In the future
 * - Not more than a configurable maximum days ahead (default: 90 days)
 */
class ValidDueDate implements ValidationRule
{
    private int $maxDaysAhead;

    public function __construct(int $maxDaysAhead = 90)
    {
        $this->maxDaysAhead = $maxDaysAhead;
    }

    /**
     * Run the validation rule.
     *
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        try {
            $dueDate = Carbon::parse($value);
            $now = Carbon::now();
            $maxDate = $now->copy()->addDays($this->maxDaysAhead);

            if ($dueDate->lessThanOrEqualTo($now)) {
                $fail("The {$attribute} must be a future date.");
                return;
            }

            if ($dueDate->greaterThan($maxDate)) {
                $fail("The {$attribute} cannot be more than {$this->maxDaysAhead} days in the future.");
            }
        } catch (\Exception $e) {
            $fail("The {$attribute} must be a valid date.");
        }
    }
}
