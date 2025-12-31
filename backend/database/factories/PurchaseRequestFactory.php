<?php

namespace Database\Factories;

use App\Models\PurchaseRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PurchaseRequest>
 */
class PurchaseRequestFactory extends Factory
{
    protected $model = PurchaseRequest::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Ensure user exists
        $user = User::first() ?? User::factory()->create();

        return [
            'item_name' => fake()->words(3, true),
            'description' => fake()->sentence(10),
            'category' => fake()->randomElement(['Electronics', 'Furniture', 'Office Supplies', 'Lab Equipment']),
            'quantity' => fake()->numberBetween(1, 20),
            'estimated_cost' => fake()->randomFloat(2, 100, 50000),
            'justification' => fake()->sentence(15),
            'priority' => fake()->randomElement(['low', 'medium', 'high', 'urgent']),
            'status' => 'pending',
            'requested_by' => $user->id,
            'needed_by_date' => fake()->dateTimeBetween('+1 week', '+3 months'),
        ];
    }

    /**
     * Indicate that the purchase request is pending.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
        ]);
    }

    /**
     * Indicate that the purchase request is approved.
     */
    public function approved(): static
    {
        return $this->state(function (array $attributes) {
            $admin = User::factory()->admin()->create();
            return [
                'status' => 'approved',
                'approved_by' => $admin->id,
                'approved_cost' => $attributes['estimated_cost'] ?? fake()->randomFloat(2, 100, 50000),
            ];
        });
    }

    /**
     * Indicate that the purchase request is rejected.
     */
    public function rejected(): static
    {
        return $this->state(function (array $attributes) {
            $admin = User::factory()->admin()->create();
            return [
                'status' => 'rejected',
                'rejected_by' => $admin->id,
                'rejection_reason' => fake()->sentence(10),
            ];
        });
    }

    /**
     * Indicate that the purchase request is ordered.
     */
    public function ordered(): static
    {
        return $this->state(function (array $attributes) {
            $admin = User::factory()->admin()->create();
            return [
                'status' => 'ordered',
                'approved_by' => $admin->id,
                'approved_cost' => $attributes['estimated_cost'] ?? fake()->randomFloat(2, 100, 50000),
            ];
        });
    }

    /**
     * Indicate that the purchase request is received.
     */
    public function received(): static
    {
        return $this->state(function (array $attributes) {
            $admin = User::factory()->admin()->create();
            $quantity = $attributes['quantity'] ?? fake()->numberBetween(1, 20);
            return [
                'status' => 'received',
                'approved_by' => $admin->id,
                'approved_cost' => $attributes['estimated_cost'] ?? fake()->randomFloat(2, 100, 50000),
                'received_at' => fake()->dateTimeBetween('-1 week', 'now'),
                'actual_quantity' => $quantity,
            ];
        });
    }
}
