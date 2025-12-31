<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Item;
use App\Models\Role;
use App\Models\Category;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;

class InventoryApiTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;
    protected User $manager;
    protected User $staff;
    protected Item $item;
    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        // Get or create roles
        $adminRole = Role::firstOrCreate(['role_name' => 'Admin']);
        $managerRole = Role::firstOrCreate(['role_name' => 'Inventory Manager']);
        $staffRole = Role::firstOrCreate(['role_name' => 'Staff']);

        // Create users
        $this->admin = User::factory()->create(['role_id' => $adminRole->id]);
        $this->manager = User::factory()->create(['role_id' => $managerRole->id]);
        $this->staff = User::factory()->create(['role_id' => $staffRole->id]);

        // Get or create category and vendor
        $this->category = Category::firstOrCreate(['category_name' => 'Electronics']);
        $vendor = Vendor::firstOrCreate(['vendor_name' => 'Dell Inc']);

        // Create test item
        $this->item = Item::create([
            'inventory_number' => 'TEST-001',
            'name' => 'Test Laptop',
            'category_id' => $this->category->id,
            'vendor_id' => $vendor->id,
            'location' => 'Office-101',
            'status' => 'available',
            'specifications' => json_encode(['cpu' => 'i7', 'ram' => '16GB'])
        ]);
    }

    /** @test */
    public function admin_can_view_item_details()
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson("/api/items/{$this->item->id}");

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => [
                         'id',
                         'inventory_number',
                         'name',
                         'category',
                         'vendor',
                         'location',
                         'status',
                         'specifications'
                     ]
                 ])
                 ->assertJson([
                     'success' => true,
                     'data' => [
                         'id' => $this->item->id,
                         'inventory_number' => 'TEST-001',
                         'name' => 'Test Laptop'
                     ]
                 ]);
    }

    /** @test */
    public function manager_can_view_item_details()
    {
        Sanctum::actingAs($this->manager);

        $response = $this->getJson("/api/items/{$this->item->id}");

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'data' => [
                         'id' => $this->item->id
                     ]
                 ]);
    }

    /** @test */
    public function staff_can_view_their_assigned_item()
    {
        // Assign item to staff
        $this->item->update(['current_holder_id' => $this->staff->id, 'status' => 'lent']);

        Sanctum::actingAs($this->staff);

        $response = $this->getJson("/api/items/{$this->item->id}");

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'data' => [
                         'id' => $this->item->id,
                         'current_holder_id' => $this->staff->id
                     ]
                 ]);
    }

    /** @test */
    public function staff_cannot_view_other_users_items()
    {
        // Assign item to different user
        $this->item->update(['current_holder_id' => $this->manager->id, 'status' => 'lent']);

        Sanctum::actingAs($this->staff);

        $response = $this->getJson("/api/items/{$this->item->id}");

        $response->assertStatus(403)
                 ->assertJson([
                     'message' => 'Bu eşyayı görüntüleme yetkiniz yok'
                 ]);
    }

    /** @test */
    public function returns_404_for_nonexistent_item()
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/items/99999');

        $response->assertStatus(404)
                 ->assertJson([
                     'message' => 'Eşya bulunamadı'
                 ]);
    }

    /** @test */
    public function item_details_include_relationships()
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson("/api/items/{$this->item->id}");

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         'category' => ['id', 'category_name'],
                         'vendor' => ['id', 'vendor_name'],
                         'transactions'
                     ]
                 ]);
    }

    /** @test */
    public function unauthenticated_user_cannot_view_item()
    {
        $response = $this->getJson("/api/items/{$this->item->id}");

        $response->assertStatus(401);
    }

    /** @test */
    public function item_details_show_recent_transactions()
    {
        Sanctum::actingAs($this->admin);

        // Create some transactions
        for ($i = 0; $i < 15; $i++) {
            $this->item->transactions()->create([
                'user_id' => $this->staff->id,
                'checkout_date' => now()->subDays($i),
                'due_date' => now()->addDays(7 - $i),
                'status' => $i < 5 ? 'returned' : 'active'
            ]);
        }

        $response = $this->getJson("/api/items/{$this->item->id}");

        $response->assertStatus(200);
        
        $transactions = $response->json('data.transactions');
        
        // Should return max 10 transactions
        $this->assertLessThanOrEqual(10, count($transactions));
        
        // Should be ordered by checkout_date desc
        $dates = collect($transactions)->pluck('checkout_date')->toArray();
        $sortedDates = collect($dates)->sort()->reverse()->values()->toArray();
        $this->assertEquals($sortedDates, $dates);
    }
}
