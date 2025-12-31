<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Category;
use App\Models\Item;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    /**
     * Seed the application's database for DEMO purposes.
     * Limited data for 3 use cases only.
     */
    public function run(): void
    {
        // Create roles
        $adminRole = Role::firstOrCreate(['role_name' => 'Admin']);
        $managerRole = Role::firstOrCreate(['role_name' => 'Manager']);
        $staffRole = Role::firstOrCreate(['role_name' => 'Staff']);

        // Create demo users
        $admin = User::firstOrCreate(
            ['email' => 'admin@ctis.edu.tr'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
                'role_id' => $adminRole->id,
            ]
        );

        $manager = User::firstOrCreate(
            ['email' => 'manager@ctis.edu.tr'],
            [
                'name' => 'Manager User',
                'password' => Hash::make('password'),
                'role_id' => $managerRole->id,
            ]
        );

        $staff = User::firstOrCreate(
            ['email' => 'staff@ctis.edu.tr'],
            [
                'name' => 'Staff Member',
                'password' => Hash::make('password'),
                'role_id' => $staffRole->id,
            ]
        );

        // Create predefined categories
        $categories = [
            ['category_name' => 'Computers', 'description' => 'Desktop and laptop computers'],
            ['category_name' => 'Monitors', 'description' => 'Display monitors'],
            ['category_name' => 'Projectors', 'description' => 'Projection equipment'],
            ['category_name' => 'Cables', 'description' => 'Cables and connectors'],
            ['category_name' => 'Furniture', 'description' => 'Office furniture'],
        ];

        foreach ($categories as $category) {
            Category::firstOrCreate(
                ['category_name' => $category['category_name']],
                ['description' => $category['description']]
            );
        }

        // Create sample inventory items
        $items = [
            // Computers
            ['name' => 'Dell OptiPlex 7090', 'category' => 'Computers', 'quantity' => 10, 'location' => 'Lab-101', 'holder' => null],
            ['name' => 'HP EliteDesk 800', 'category' => 'Computers', 'quantity' => 8, 'location' => 'Lab-102', 'holder' => null],
            ['name' => 'Lenovo ThinkCentre', 'category' => 'Computers', 'quantity' => 5, 'location' => 'Office-A', 'holder' => $staff->id],
            
            // Monitors
            ['name' => 'Dell P2422H 24"', 'category' => 'Monitors', 'quantity' => 15, 'location' => 'Lab-101', 'holder' => null],
            ['name' => 'HP E24 G4', 'category' => 'Monitors', 'quantity' => 12, 'location' => 'Lab-102', 'holder' => null],
            ['name' => 'LG 27UK850', 'category' => 'Monitors', 'quantity' => 3, 'location' => 'Office-A', 'holder' => $staff->id],
            
            // Projectors
            ['name' => 'Epson EB-2250U', 'category' => 'Projectors', 'quantity' => 2, 'location' => 'Lab-101', 'holder' => null],
            ['name' => 'BenQ MH535FHD', 'category' => 'Projectors', 'quantity' => 3, 'location' => 'Lab-102', 'holder' => null],
            ['name' => 'Sony VPL-FHZ75', 'category' => 'Projectors', 'quantity' => 1, 'location' => 'Conference Room', 'holder' => $staff->id],
            
            // Cables
            ['name' => 'HDMI Cable 2m', 'category' => 'Cables', 'quantity' => 50, 'location' => 'Storage', 'holder' => null],
            ['name' => 'USB-C Cable 1.5m', 'category' => 'Cables', 'quantity' => 30, 'location' => 'Storage', 'holder' => null],
            ['name' => 'DisplayPort Cable', 'category' => 'Cables', 'quantity' => 20, 'location' => 'Storage', 'holder' => $staff->id],
            
            // Furniture
            ['name' => 'Ergonomic Office Chair', 'category' => 'Furniture', 'quantity' => 25, 'location' => 'Lab-101', 'holder' => null],
            ['name' => 'Adjustable Desk', 'category' => 'Furniture', 'quantity' => 20, 'location' => 'Lab-102', 'holder' => null],
            ['name' => 'Filing Cabinet', 'category' => 'Furniture', 'quantity' => 10, 'location' => 'Office-A', 'holder' => $staff->id],
        ];

        foreach ($items as $item) {
            $category = Category::where('category_name', $item['category'])->first();
            
            Item::firstOrCreate(
                ['name' => $item['name']],
                [
                    'inventory_number' => 'INV-' . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT),
                    'category_id' => $category->id,
                    'location' => $item['location'],
                    'current_holder_id' => $item['holder'],
                    'status' => 'available',
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('✅ Demo database seeded successfully!');
        $this->command->info('   - Users: 3 (Admin, Manager, Staff)');
        $this->command->info('   - Categories: 5 (predefined)');
        $this->command->info('   - Items: 15 (sample inventory)');
        $this->command->info('   - 5 items assigned to staff member');
    }
}
