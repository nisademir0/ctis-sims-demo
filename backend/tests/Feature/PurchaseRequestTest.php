<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\PurchaseRequest;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class PurchaseRequestTest extends TestCase
{
    use DatabaseTransactions;

    protected $admin;
    protected $staff;
    protected $inventoryManager;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->admin()->create();
        $this->inventoryManager = User::factory()->inventoryManager()->create();
        $this->staff = User::factory()->staff()->create();
    }

    /** @test */
    public function staff_can_create_purchase_request()
    {
        $response = $this->actingAs($this->staff)->postJson('/api/purchase-requests', [
            'item_name' => 'New Projector',
            'description' => 'High-quality projector for presentations',
            'category' => 'Electronics',
            'quantity' => 2,
            'estimated_cost' => 15000.00,
            'justification' => 'Old projectors are broken',
            'priority' => 'high'
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'item_name',
                    'quantity',
                    'estimated_cost',
                    'status',
                    'requested_by'
                ]
            ]);

        $this->assertDatabaseHas('purchase_requests', [
            'item_name' => 'New Projector',
            'quantity' => 2,
            'status' => 'pending'
        ]);
    }

    /** @test */
    public function admin_can_approve_purchase_request()
    {
        $request = PurchaseRequest::create([
            'item_name' => 'Laptop',
            'description' => 'High-performance laptops',
            'category' => 'Computers',
            'quantity' => 5,
            'estimated_cost' => 50000.00,
            'justification' => 'For new students',
            'status' => 'pending',
            'priority' => 'high',
            'requested_by' => $this->staff->id
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/purchase-requests/{$request->id}/approve", [
                'approved_cost' => 45000.00,
                'notes' => 'Approved with budget adjustment'
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'approved'
                ]
            ]);

        $this->assertDatabaseHas('purchase_requests', [
            'id' => $request->id,
            'status' => 'approved',
            'approved_by' => $this->admin->id,
            'approved_cost' => 45000.00
        ]);
    }

    /** @test */
    public function admin_can_reject_purchase_request()
    {
        $request = PurchaseRequest::create([
            'item_name' => 'Luxury Item',
            'description' => 'Expensive luxury equipment',
            'category' => 'Luxury',
            'quantity' => 1,
            'estimated_cost' => 100000.00,
            'justification' => 'Nice to have',
            'status' => 'pending',
            'priority' => 'low',
            'requested_by' => $this->staff->id
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/purchase-requests/{$request->id}/reject", [
                'rejection_reason' => 'Not in budget'
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'rejected'
                ]
            ]);

        $this->assertDatabaseHas('purchase_requests', [
            'id' => $request->id,
            'status' => 'rejected',
            'rejection_reason' => 'Not in budget'
        ]);
    }

    /** @test */
    public function inventory_manager_can_mark_as_ordered()
    {
        $request = PurchaseRequest::create([
            'item_name' => 'Printer',
            'description' => 'Office printers',
            'category' => 'Office Equipment',
            'quantity' => 3,
            'estimated_cost' => 30000.00,
            'justification' => 'Replacement',
            'status' => 'approved',
            'priority' => 'medium',
            'requested_by' => $this->staff->id,
            'approved_by' => $this->admin->id
        ]);

        $response = $this->actingAs($this->inventoryManager)
            ->postJson("/api/purchase-requests/{$request->id}/mark-ordered", [
                'actual_cost' => 28000.00,
                'vendor' => 'Tech Supplies Inc'
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'ordered'
                ]
            ]);

        $this->assertDatabaseHas('purchase_requests', [
            'id' => $request->id,
            'status' => 'ordered',
            'vendor' => 'Tech Supplies Inc'
        ]);
    }

    /** @test */
    public function inventory_manager_can_mark_as_received()
    {
        $request = PurchaseRequest::create([
            'item_name' => 'Monitor',
            'description' => 'LCD Monitors for lab',
            'category' => 'Displays',
            'quantity' => 10,
            'estimated_cost' => 100000.00,
            'justification' => 'Lab upgrade',
            'status' => 'ordered',
            'priority' => 'high',
            'requested_by' => $this->staff->id,
            'approved_by' => $this->admin->id
        ]);

        $response = $this->actingAs($this->inventoryManager)
            ->postJson("/api/purchase-requests/{$request->id}/mark-received", [
                'actual_quantity' => 10,
                'notes' => 'All items in good condition'
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'received'
                ]
            ]);

        $this->assertDatabaseHas('purchase_requests', [
            'id' => $request->id,
            'status' => 'received',
            'actual_quantity' => 10
        ]);
    }

    /** @test */
    public function staff_cannot_approve_purchase_request()
    {
        $request = PurchaseRequest::create([
            'item_name' => 'Item',
            'description' => 'Test item',
            'category' => 'Test',
            'quantity' => 1,
            'estimated_cost' => 1000.00,
            'justification' => 'Test',
            'status' => 'pending',
            'priority' => 'low',
            'requested_by' => $this->staff->id
        ]);

        $response = $this->actingAs($this->staff)
            ->postJson("/api/purchase-requests/{$request->id}/approve");

        $response->assertStatus(403);
    }

    /** @test */
    public function can_view_purchase_statistics()
    {
        // Create various requests
        PurchaseRequest::create([
            'item_name' => 'Item 1',
            'description' => 'Test item 1',
            'category' => 'Test',
            'quantity' => 1,
            'estimated_cost' => 1000.00,
            'justification' => 'Test',
            'status' => 'pending',
            'priority' => 'low',
            'requested_by' => $this->staff->id
        ]);

        PurchaseRequest::create([
            'item_name' => 'Item 2',
            'description' => 'Test item 2',
            'category' => 'Test',
            'quantity' => 2,
            'estimated_cost' => 2000.00,
            'justification' => 'Test',
            'status' => 'approved',
            'priority' => 'medium',
            'requested_by' => $this->staff->id,
            'approved_by' => $this->admin->id
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/purchase-requests/stats');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'total',
                    'by_status',
                    'total_estimated_cost'
                ]
            ]);
    }

    /** @test */
    public function can_filter_purchase_requests()
    {
        PurchaseRequest::create([
            'item_name' => 'Pending Item',
            'description' => 'Test pending item',
            'category' => 'Test',
            'quantity' => 1,
            'estimated_cost' => 1000.00,
            'justification' => 'Test',
            'status' => 'pending',
            'priority' => 'low',
            'requested_by' => $this->staff->id
        ]);

        PurchaseRequest::create([
            'item_name' => 'Approved Item',
            'description' => 'Test approved item',
            'category' => 'Test',
            'quantity' => 1,
            'estimated_cost' => 2000.00,
            'justification' => 'Test',
            'status' => 'approved',
            'priority' => 'medium',
            'requested_by' => $this->staff->id,
            'approved_by' => $this->admin->id
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/purchase-requests?status=approved');

        $response->assertOk();
        
        $data = $response->json('data'); // Paginated response
        $this->assertGreaterThanOrEqual(1, count($data));
        // Verify at least one has the expected status
        $approvedFound = collect($data)->contains('status', 'approved');
        $this->assertTrue($approvedFound, 'At least one approved purchase request should exist');
    }

    /** @test */
    public function cannot_mark_as_ordered_if_not_approved()
    {
        $request = PurchaseRequest::create([
            'item_name' => 'Item',
            'description' => 'Test item',
            'category' => 'Test',
            'quantity' => 1,
            'estimated_cost' => 1000.00,
            'justification' => 'Test',
            'status' => 'pending',
            'priority' => 'low',
            'requested_by' => $this->staff->id
        ]);

        $response = $this->actingAs($this->inventoryManager)
            ->postJson("/api/purchase-requests/{$request->id}/mark-ordered", [
                'actual_cost' => 1000.00
            ]);

        $response->assertStatus(422);
    }
}
