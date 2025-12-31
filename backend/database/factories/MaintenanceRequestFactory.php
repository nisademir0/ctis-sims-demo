<?php

namespace Database\Factories;

use App\Models\MaintenanceRequest;
use App\Models\Item;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\MaintenanceRequest>
 */
class MaintenanceRequestFactory extends Factory
{
    protected $model = MaintenanceRequest::class;

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

        return [
            'item_id' => $item->id,
            'description' => fake()->sentence(10),
            'priority' => fake()->randomElement(['low', 'medium', 'high', 'urgent']),
            'maintenance_type' => fake()->randomElement(['hardware_failure', 'software_issue', 'routine_cleaning', 'consumable_replacement']),
            'status' => 'pending',
            'requested_by' => $user->id,
        ];
    }

    /**
     * Indicate that the maintenance request is pending.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
        ]);
    }

    /**
     * Indicate that the maintenance request is in progress.
     */
    public function inProgress(): static
    {
        return $this->state(function (array $attributes) {
            $user = User::first() ?? User::factory()->create();
            return [
                'status' => 'in_progress',
                'assigned_to' => $user->id,
            ];
        });
    }

    /**
     * Indicate that the maintenance request is completed.
     */
    public function completed(): static
    {
        return $this->state(function (array $attributes) {
            $user = User::first() ?? User::factory()->create();
            return [
                'status' => 'completed',
                'assigned_to' => $user->id,
                'resolution_notes' => fake()->sentence(15),
                'completed_date' => fake()->dateTimeBetween('-1 month', 'now'),
                'cost' => fake()->randomFloat(2, 50, 5000),
            ];
        });
    }

    /**
     * Indicate that the maintenance request is cancelled.
     */
    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'cancelled',
        ]);
    }
}
