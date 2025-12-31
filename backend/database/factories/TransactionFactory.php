<?php

namespace Database\Factories;

use App\Models\Transaction;
use App\Models\Item;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\DB;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Transaction>
 */
class TransactionFactory extends Factory
{
    protected $model = Transaction::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Ensure item and user exist
        $item = Item::first() ?? Item::factory()->create();
        $user = User::first() ?? User::factory()->create();
        
        // Find admin role ID and get admin user (or fallback to any user)
        $adminRoleId = DB::table('roles')->where('role_name', 'Admin')->value('id');
        $checkedOutByUser = $adminRoleId 
            ? (User::where('role_id', $adminRoleId)->first() ?? $user)
            : $user;

        $checkoutDate = fake()->dateTimeBetween('-1 month', 'now');
        $dueDate = fake()->dateTimeBetween($checkoutDate, '+2 weeks');

        return [
            'item_id' => $item->id,
            'user_id' => $user->id,
            'checkout_date' => $checkoutDate,
            'due_date' => $dueDate,
            'return_date' => null,
            'status' => 'active',
            'late_fee' => 0.00,
            'late_fee_paid' => false,
            'return_condition' => null,
            'return_notes' => null,
            'checked_out_by' => $checkedOutByUser->id,
            'returned_to' => null,
            'checkout_email_sent' => false,
            'due_reminder_sent' => false,
            'overdue_reminder_sent' => false,
            'return_email_sent' => false,
            'notes' => null,
        ];
    }

    /**
     * Indicate that the transaction is active (checked out, not returned yet).
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
            'return_date' => null,
            'return_condition' => null,
            'return_notes' => null,
            'returned_to' => null,
        ]);
    }

    /**
     * Indicate that the transaction is returned on time.
     */
    public function returned(): static
    {
        return $this->state(function (array $attributes) {
            $returnDate = fake()->dateTimeBetween($attributes['checkout_date'] ?? '-1 week', $attributes['due_date'] ?? 'now');
            
            // Find admin user or fallback
            $adminRoleId = DB::table('roles')->where('role_name', 'Admin')->value('id');
            $returnedToUser = $adminRoleId 
                ? (User::where('role_id', $adminRoleId)->first() ?? User::first())
                : User::first();
            
            return [
                'status' => 'returned',
                'return_date' => $returnDate,
                'return_condition' => fake()->randomElement(['excellent', 'good', 'fair']),
                'return_notes' => fake()->optional(0.3)->sentence(),
                'returned_to' => $returnedToUser->id,
                'late_fee' => 0.00,
                'late_fee_paid' => false,
            ];
        });
    }

    /**
     * Indicate that the transaction is overdue (past due date, not returned).
     */
    public function overdue(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'overdue',
            'due_date' => fake()->dateTimeBetween('-2 weeks', '-1 day'),
            'return_date' => null,
            'return_condition' => null,
            'return_notes' => null,
            'returned_to' => null,
            'late_fee' => 0.00,
            'overdue_reminder_sent' => fake()->boolean(60),
        ]);
    }

    /**
     * Indicate that the transaction was returned late with a late fee.
     */
    public function lateReturn(): static
    {
        return $this->state(function (array $attributes) {
            $dueDate = fake()->dateTimeBetween('-3 weeks', '-1 week');
            $returnDate = fake()->dateTimeBetween($dueDate, 'now');
            $daysLate = \Carbon\Carbon::parse($returnDate)->diffInDays(\Carbon\Carbon::parse($dueDate));
            $lateFee = $daysLate * 1.0; // $1 per day
            
            // Find admin user or fallback
            $adminRoleId = DB::table('roles')->where('role_name', 'Admin')->value('id');
            $returnedToUser = $adminRoleId 
                ? (User::where('role_id', $adminRoleId)->first() ?? User::first())
                : User::first();
            
            return [
                'status' => 'late_return',
                'due_date' => $dueDate,
                'return_date' => $returnDate,
                'return_condition' => fake()->randomElement(['good', 'fair', 'poor']),
                'return_notes' => 'Returned late by ' . $daysLate . ' days.',
                'returned_to' => $returnedToUser->id,
                'late_fee' => $lateFee,
                'late_fee_paid' => fake()->boolean(40),
                'overdue_reminder_sent' => true,
            ];
        });
    }

    /**
     * Indicate that the transaction was cancelled.
     */
    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'cancelled',
            'return_date' => now(),
            'return_condition' => null,
            'return_notes' => 'Transaction cancelled by admin.',
            'late_fee' => 0.00,
        ]);
    }
}
