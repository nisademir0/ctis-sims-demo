<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Item;
use App\Models\Category;
use App\Models\MaintenanceRequest;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class MaintenanceRequestTest extends TestCase
{
    use DatabaseTransactions;

    protected $admin;
    protected $staff;
    protected $inventoryManager;
    protected $item;
    protected $category;

    protected function setUp(): void
    {
        parent::setUp();

        // Run all migrations
        $this->artisan('migrate');

        // Create a test category
        $this->category = DB::table('item_categories')->insertGetId([
            'category_name' => 'Electronics',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Create test users with different roles
        $this->admin = User::factory()->admin()->create();
        $this->inventoryManager = User::factory()->inventoryManager()->create();
        $this->staff = User::factory()->staff()->create();

        // Create test item
        $this->item = Item::create([
            'name' => 'Test Laptop',
            'inventory_number' => 'TEST-001',
            'category_id' => $this->category,
            'location' => 'Lab A',
            'status' => 'available'
        ]);
    }

    /** @test */
    public function staff_can_create_maintenance_request()
    {
        $response = $this->actingAs($this->staff)->postJson('/api/maintenance-requests', [
            'item_id' => $this->item->id,
            'description' => 'Screen is cracked',
            'priority' => 'high',
            'maintenance_type' => 'hardware_failure',
            'requested_by' => $this->staff->id
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'item_id',
                    'description',
                    'priority',
                    'status',
                    'requested_by',
                    'created_at'
                ]
            ]);

        $this->assertDatabaseHas('maintenance_requests', [
            'item_id' => $this->item->id,
            'description' => 'Screen is cracked',
            'status' => 'pending'
        ]);
    }

    /** @test */
    public function inventory_manager_can_assign_maintenance_request()
    {
        $request = MaintenanceRequest::create([
            'item_id' => $this->item->id,
            'description' => 'Needs repair',
            'priority' => 'medium',
            'maintenance_type' => 'hardware_failure',
            'status' => 'pending',
            'requested_by' => $this->staff->id
        ]);

        $response = $this->actingAs($this->inventoryManager)
            ->postJson("/api/maintenance-requests/{$request->id}/assign", [
                'assigned_to' => $this->staff->id
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'in_progress',
                    'assigned_to' => $this->staff->id
                ]
            ]);

        $this->assertDatabaseHas('maintenance_requests', [
            'id' => $request->id,
            'status' => 'in_progress',
            'assigned_to' => $this->staff->id
        ]);
    }

    /** @test */
    public function assigned_staff_can_complete_maintenance_request()
    {
        $request = MaintenanceRequest::create([
            'item_id' => $this->item->id,
            'description' => 'Needs repair',
            'priority' => 'medium',
            'maintenance_type' => 'hardware_failure',
            'status' => 'in_progress',
            'requested_by' => $this->staff->id,
            'assigned_to' => $this->staff->id
        ]);

        $response = $this->actingAs($this->staff)
            ->postJson("/api/maintenance-requests/{$request->id}/complete", [
                'resolution_notes' => 'Replaced screen'
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'completed'
                ]
            ]);

        $this->assertDatabaseHas('maintenance_requests', [
            'id' => $request->id,
            'status' => 'completed',
            'resolution_notes' => 'Replaced screen'
        ]);

        // Item should be back to available
        $this->item->refresh();
        $this->assertEquals('available', $this->item->status);
    }

    /** @test */
    public function admin_can_view_maintenance_statistics()
    {
        // Create various requests
        MaintenanceRequest::create([
            'item_id' => $this->item->id,
            'description' => 'Test 1',
            'priority' => 'high',
            'maintenance_type' => 'hardware_failure',
            'status' => 'pending',
            'requested_by' => $this->staff->id
        ]);

        MaintenanceRequest::create([
            'item_id' => $this->item->id,
            'description' => 'Test 2',
            'priority' => 'low',
            'maintenance_type' => 'software_issue',
            'status' => 'completed',
            'requested_by' => $this->staff->id,
            'completed_date' => now()
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/maintenance-requests/stats');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'total',
                    'by_status' => ['pending', 'in_progress', 'completed', 'cancelled'],
                    'by_priority' => ['low', 'medium', 'high', 'urgent']
                ]
            ]);
    }

    /** @test */
    public function unauthorized_user_cannot_access_maintenance_requests()
    {
        $response = $this->postJson('/api/maintenance-requests', [
            'item_id' => $this->item->id,
            'description' => 'Test'
        ]);

        $response->assertStatus(401);
    }

    /** @test */
    public function cannot_complete_request_not_assigned_to_user()
    {
        $otherStaff = User::factory()->staff()->create();
        
        $request = MaintenanceRequest::create([
            'item_id' => $this->item->id,
            'description' => 'Needs repair',
            'priority' => 'medium',
            'maintenance_type' => 'hardware_failure',
            'status' => 'in_progress',
            'requested_by' => $this->staff->id,
            'assigned_to' => $otherStaff->id
        ]);

        $response = $this->actingAs($this->staff)
            ->postJson("/api/maintenance-requests/{$request->id}/complete", [
                'resolution_notes' => 'Attempted completion'
            ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function can_filter_by_status()
    {
        MaintenanceRequest::create([
            'item_id' => $this->item->id,
            'description' => 'Pending',
            'priority' => 'low',
            'maintenance_type' => 'routine_cleaning',
            'status' => 'pending',
            'requested_by' => $this->staff->id
        ]);

        MaintenanceRequest::create([
            'item_id' => $this->item->id,
            'description' => 'Completed',
            'priority' => 'low',
            'maintenance_type' => 'routine_cleaning',
            'status' => 'completed',
            'requested_by' => $this->staff->id
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/maintenance-requests?status=pending');

        $response->assertOk();
        
        $data = $response->json('data'); // Paginated response has 'data' key
        $this->assertGreaterThanOrEqual(1, count($data));
        // Verify at least one has the expected status
        $pendingFound = collect($data)->contains('status', 'pending');
        $this->assertTrue($pendingFound, 'At least one pending maintenance request should exist');
    }
}
