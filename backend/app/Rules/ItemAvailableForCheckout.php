<?php

namespace App\Rules;

use App\Models\Item;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validates that an item is available for checkout/borrowing.
 * An item is available if:
 * - It exists
 * - Its status is 'available'
 * - It doesn't have an active (unreturned) transaction
 */
class ItemAvailableForCheckout implements ValidationRule
{
    private ?string $errorMessage = null;

    /**
     * Run the validation rule.
     *
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $item = Item::find($value);

        if (!$item) {
            $fail('The selected item does not exist.');
            return;
        }

        if ($item->status !== 'available') {
            $fail("The item is not available for checkout. Current status: {$item->status}.");
            return;
        }

        // Check if there's an active transaction (checkout without return)
        $hasActiveTransaction = $item->transactions()
            ->whereNull('return_date')
            ->exists();

        if ($hasActiveTransaction) {
            $fail('The item is currently checked out to another user.');
        }
    }
}
