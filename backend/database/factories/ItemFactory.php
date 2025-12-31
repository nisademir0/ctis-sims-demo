<?php

namespace Database\Factories;

use App\Models\Item;
use App\Models\Category;
use App\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Item>
 */
class ItemFactory extends Factory
{
    protected $model = Item::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Ensure category and vendor exist
        $category = Category::first() ?? Category::factory()->create();
        $vendor = Vendor::first() ?? Vendor::factory()->create();

        $purchaseDate = fake()->dateTimeBetween('-2 years', 'now');
        $purchaseValue = fake()->randomFloat(2, 500, 50000);
        $ageInMonths = now()->diffInMonths($purchaseDate);
        $depreciationRate = 0.15; // 15% per year
        $currentValue = max(0, $purchaseValue * (1 - ($depreciationRate * ($ageInMonths / 12))));

        return [
            'name' => fake()->words(3, true),
            'inventory_number' => 'INV-' . fake()->unique()->numberBetween(1000, 9999),
            'category_id' => $category->id,
            'vendor_id' => $vendor->id,
            'location' => fake()->randomElement(['Lab A', 'Lab B', 'Office', 'Storage Room']),
            'status' => 'available',
            'condition_status' => fake()->randomElement(['new', 'used', 'refurbished']),
            'acquisition_method' => fake()->randomElement(['purchase', 'donation', 'transfer']),
            'purchase_date' => $purchaseDate,
            'purchase_value' => $purchaseValue,
            'current_value' => round($currentValue, 2),
            'depreciation_method' => 'straight-line',
            'warranty_period_months' => fake()->randomElement([12, 24, 36, 60]),
            'warranty_expiry_date' => (clone $purchaseDate)->modify('+' . fake()->randomElement([12, 24, 36]) . ' months'),
        ];
    }

    /**
     * Indicate that the item is available.
     */
    public function available(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'available',
        ]);
    }

    /**
     * Indicate that the item is lent (checked out).
     */
    public function lent(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'lent',
        ]);
    }

    /**
     * Indicate that the item is in maintenance.
     */
    public function inMaintenance(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'maintenance',
        ]);
    }

    /**
     * Indicate that the item is retired.
     */
    public function retired(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'retired',
        ]);
    }
}
