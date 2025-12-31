<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Vendor;
use App\Models\User;
use App\Models\Item;
use App\Models\Transaction;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Test Data Seeder - Creates realistic test data using factories
 * Used for automated testing and local development
 */
class TestDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Disable foreign key checks for clean slate
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        
        // Clear existing test data (preserve production data)
        Transaction::whereHas('item', function ($query) {
            $query->where('inventory_number', 'LIKE', 'TEST-%');
        })->delete();
        
        Item::query()->where('inventory_number', 'LIKE', 'TEST-%')->forceDelete();
        
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->command->info('🔧 Creating test data using factories...');

        // 1. Ensure roles exist
        $adminRole = DB::table('roles')->where('role_name', 'Admin')->first();
        $managerRole = DB::table('roles')->where('role_name', 'Inventory Manager')->first();
        $staffRole = DB::table('roles')->where('role_name', 'Staff')->first();

        if (!$adminRole) {
            $adminRoleId = DB::table('roles')->insertGetId(['role_name' => 'Admin']);
        } else {
            $adminRoleId = $adminRole->id;
        }

        if (!$managerRole) {
            $managerRoleId = DB::table('roles')->insertGetId(['role_name' => 'Inventory Manager']);
        } else {
            $managerRoleId = $managerRole->id;
        }

        if (!$staffRole) {
            $staffRoleId = DB::table('roles')->insertGetId(['role_name' => 'Staff']);
        } else {
            $staffRoleId = $staffRole->id;
        }

        // 2. Create test users
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@test.com'],
            [
                'name' => 'Test Admin',
                'password' => Hash::make('password'),
                'role_id' => $adminRoleId,
            ]
        );

        $managerUser = User::firstOrCreate(
            ['email' => 'manager@test.com'],
            [
                'name' => 'Test Manager',
                'password' => Hash::make('password'),
                'role_id' => $managerRoleId,
            ]
        );

        $staffUser = User::firstOrCreate(
            ['email' => 'staff@test.com'],
            [
                'name' => 'Test Staff',
                'password' => Hash::make('password'),
                'role_id' => $staffRoleId,
            ]
        );

        $this->command->info('✅ Test users created (admin@test.com, manager@test.com, staff@test.com)');

        // 3. Ensure categories exist (use existing or create minimal)
        $categoryCount = Category::count();
        if ($categoryCount === 0) {
            Category::factory(5)->create();
            $this->command->info('✅ Created 5 categories');
        } else {
            $this->command->info("✅ Using existing {$categoryCount} categories");
        }

        // 4. Ensure vendors exist (use existing or create minimal)
        $vendorCount = Vendor::count();
        if ($vendorCount === 0) {
            Vendor::factory(5)->create();
            $this->command->info('✅ Created 5 vendors');
        } else {
            $this->command->info("✅ Using existing {$vendorCount} vendors");
        }

        // 5. Create test items (20 items with TEST- prefix)
        $this->command->info('📦 Creating 20 test items...');
        
        $items = collect();
        for ($i = 1; $i <= 20; $i++) {
            $item = Item::factory()->create([
                'inventory_number' => sprintf('TEST-%03d', $i),
                'status' => 'available',
            ]);
            $items->push($item);
        }
        
        $this->command->info('✅ Created 20 test items (TEST-001 to TEST-020)');

        // 6. Create test transactions (10 active, 5 returned, 5 overdue)
        $this->command->info('📝 Creating test transactions...');

        // Active transactions (10)
        Transaction::factory(10)->create([
            'item_id' => fn() => $items->random()->id,
            'user_id' => fn() => collect([$adminUser->id, $managerUser->id, $staffUser->id])->random(),
            'status' => 'active',
        ]);

        // Returned transactions (5)
        Transaction::factory(5)->returned()->create([
            'item_id' => fn() => $items->random()->id,
            'user_id' => fn() => collect([$adminUser->id, $managerUser->id, $staffUser->id])->random(),
        ]);

        // Overdue transactions (5)
        Transaction::factory(5)->overdue()->create([
            'item_id' => fn() => $items->random()->id,
            'user_id' => fn() => collect([$adminUser->id, $managerUser->id, $staffUser->id])->random(),
        ]);

        // Late return transactions (3)
        Transaction::factory(3)->lateReturn()->create([
            'item_id' => fn() => $items->random()->id,
            'user_id' => fn() => collect([$adminUser->id, $managerUser->id, $staffUser->id])->random(),
        ]);

        $this->command->info('✅ Created 23 test transactions (10 active, 5 returned, 5 overdue, 3 late_return)');

        $this->command->info('');
        $this->command->info('🎉 Test data seeding complete!');
        $this->command->info('');
        $this->command->info('Test Users:');
        $this->command->info('  - admin@test.com / password');
        $this->command->info('  - manager@test.com / password');
        $this->command->info('  - staff@test.com / password');
        $this->command->info('');
        $this->command->info('Test Items: TEST-001 to TEST-020');
        $this->command->info('Test Transactions: 23 total (various statuses)');
    }
}
