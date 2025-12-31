<?php

namespace Database\Factories;

use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Get or create a default Staff role
        $staffRole = Role::firstOrCreate(['role_name' => 'Staff']);

        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'role_id' => $staffRole->id,
            'phone' => fake()->optional(0.7)->phoneNumber(),
            'bio' => fake()->optional(0.5)->sentence(20),
            'avatar' => null,
            'last_login_at' => fake()->optional(0.8)->dateTimeBetween('-30 days', 'now'),
            'last_login_ip' => fake()->optional(0.8)->ipv4(),
        ];
    }

    /**
     * Create a user with Admin role.
     */
    public function admin(): static
    {
        return $this->state(function (array $attributes) {
            $adminRole = Role::firstOrCreate(['role_name' => 'Admin']);
            return [
                'role_id' => $adminRole->id,
            ];
        });
    }

    /**
     * Create a user with Inventory Manager role.
     */
    public function inventoryManager(): static
    {
        return $this->state(function (array $attributes) {
            $managerRole = Role::firstOrCreate(['role_name' => 'Inventory Manager']);
            return [
                'role_id' => $managerRole->id,
            ];
        });
    }

    /**
     * Create a user with Staff role.
     */
    public function staff(): static
    {
        return $this->state(function (array $attributes) {
            $staffRole = Role::firstOrCreate(['role_name' => 'Staff']);
            return [
                'role_id' => $staffRole->id,
            ];
        });
    }

    /**
     * Create a user with a specific role by name.
     */
    public function withRole(string $roleName): static
    {
        return $this->state(function (array $attributes) use ($roleName) {
            $role = Role::firstOrCreate(['role_name' => $roleName]);
            return [
                'role_id' => $role->id,
            ];
        });
    }

    /**
     * Indicate that the user's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Indicate that the user has an avatar.
     */
    public function withAvatar(): static
    {
        return $this->state(fn (array $attributes) => [
            'avatar' => 'avatars/default-avatar.png',
        ]);
    }
}
