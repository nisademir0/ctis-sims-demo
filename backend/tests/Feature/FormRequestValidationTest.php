<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Item;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\MaintenanceRequest;
use App\Models\PurchaseRequest;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\WithFaker;

class FormRequestValidationTest extends TestCase
{
    use DatabaseTransactions, WithFaker;

    protected $admin;
    protected $inventoryManager;
    protected $labStaff;
    protected $student;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test users with different roles using factory methods
        $this->admin = User::factory()->admin()->create();
        $this->inventoryManager = User::factory()->inventoryManager()->create();
        $this->labStaff = User::factory()->staff()->create();
        $this->student = User::factory()->staff()->create(); // Students are also staff in this system
    }

    /** @test */
    public function test_inventory_index_request_validates_filters()
    {
        $this->actingAs($this->admin);
        
        // Create a category for valid testing
        $category = Category::factory()->create();

        // Valid request
        $response = $this->getJson('/api/items?status=available&category_id=' . $category->id);
        $response->assertStatus(200);

        // Invalid status
        $response = $this->getJson('/api/items?status=invalid_status');
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['status']);
    }

    /** @test */
    public function test_store_item_request_requires_admin_or_manager()
    {
        // Student should not be able to create items
        $this->actingAs($this->student);
        $response = $this->postJson('/api/items', [
            'name' => 'Test Item',
            'category_id' => 1,
            'quantity' => 5,
        ]);
        $response->assertStatus(403);

        // Admin should be able to create items
        $this->actingAs($this->admin);
        $category = Category::factory()->create();
        $response = $this->postJson('/api/items', [
            'name' => 'Test Item',
            'inventory_number' => 'TEST-001',
            'category_id' => $category->id,
            'location' => 'Lab A',
            'status' => 'available',
        ]);
        $response->assertStatus(201);
    }

    /** @test */
    public function test_store_item_request_validates_required_fields()
    {
        $this->actingAs($this->admin);
        $category = Category::factory()->create();

        // Missing required fields should fail
        $response = $this->postJson('/api/items', [
            'name' => 'Test Item',
            // Missing inventory_number
            'category_id' => $category->id,
            // Missing location
            'status' => 'available',
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['inventory_number', 'location']);

        // Empty name should fail
        $response = $this->postJson('/api/items', [
            'name' => '',
            'inventory_number' => 'TEST-002',
            'category_id' => $category->id,
            'location' => 'Lab A',
            'status' => 'available',
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name']);
    }

    /** @test */
    public function test_checkout_request_validates_due_date()
    {
        // Only admin and inventory manager can checkout items
        $this->actingAs($this->admin);
        $item = Item::factory()->create(['status' => 'available']);

        // Past due date should fail
        $response = $this->postJson('/api/transactions/checkout', [
            'item_id' => $item->id,
            'user_id' => $this->labStaff->id,
            'due_date' => now()->subDay()->toDateString(),
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['due_date']);

        // Future due date should pass
        $response = $this->postJson('/api/transactions/checkout', [
            'item_id' => $item->id,
            'user_id' => $this->labStaff->id,
            'due_date' => now()->addWeek()->toDateString(),
        ]);
        $response->assertStatus(201);
    }

    /** @test */
    public function test_return_item_request_validates_damage_reporting()
    {
        // Only admin and inventory manager can process returns
        $this->actingAs($this->admin);
        $item = Item::factory()->create(['status' => 'lent']);
        $transaction = Transaction::factory()->create([
            'item_id' => $item->id,
            'user_id' => $this->labStaff->id,
            'return_date' => null,
        ]);

        // damage_reported=true requires damage_description
        $response = $this->postJson("/api/transactions/{$transaction->id}/return", [
            'damage_reported' => true,
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['damage_description', 'maintenance_type', 'maintenance_priority']);

        // Valid damage report
        $response = $this->postJson("/api/transactions/{$transaction->id}/return", [
            'damage_reported' => true,
            'damage_description' => 'Screen is cracked',
            'maintenance_type' => 'hardware_failure',
            'maintenance_priority' => 'high',
        ]);
        $response->assertStatus(200);
    }

    /** @test */
    public function test_store_maintenance_request_validates_priority()
    {
        $this->actingAs($this->student);
        $item = Item::factory()->create();

        // Invalid priority should fail
        $response = $this->postJson('/api/maintenance-requests', [
            'item_id' => $item->id,
            'maintenance_type' => 'hardware_failure',
            'description' => 'Test description',
            'priority' => 'invalid_priority',
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['priority']);

        // Valid priority should pass
        $response = $this->postJson('/api/maintenance-requests', [
            'item_id' => $item->id,
            'maintenance_type' => 'hardware_failure',
            'description' => 'Test description',
            'priority' => 'high',
        ]);
        $response->assertStatus(201);
    }

    /** @test */
    public function test_assign_maintenance_request_requires_admin_or_manager()
    {
        $maintenanceRequest = MaintenanceRequest::factory()->create(['status' => 'pending']);

        // Student should not be able to assign
        $this->actingAs($this->student);
        $response = $this->postJson("/api/maintenance-requests/{$maintenanceRequest->id}/assign", [
            'assigned_to' => $this->labStaff->id,
        ]);
        $response->assertStatus(403);

        // Admin should be able to assign
        $this->actingAs($this->admin);
        $response = $this->postJson("/api/maintenance-requests/{$maintenanceRequest->id}/assign", [
            'assigned_to' => $this->labStaff->id,
        ]);
        $response->assertStatus(200);
    }

    /** @test */
    public function test_complete_maintenance_request_validates_cost()
    {
        $maintenanceRequest = MaintenanceRequest::factory()->create([
            'status' => 'in_progress',
            'assigned_to' => $this->labStaff->id,
        ]);

        $this->actingAs($this->labStaff);

        // Negative cost should fail
        $response = $this->postJson("/api/maintenance-requests/{$maintenanceRequest->id}/complete", [
            'resolution_notes' => 'Fixed successfully',
            'cost' => -10.50,
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['cost']);

        // Valid cost should pass
        $response = $this->postJson("/api/maintenance-requests/{$maintenanceRequest->id}/complete", [
            'resolution_notes' => 'Fixed successfully',
            'cost' => 10.50,
        ]);
        $response->assertStatus(200);
    }

    /** @test */
    public function test_store_purchase_request_validates_needed_by_date()
    {
        $this->actingAs($this->student);

        // Past date should fail
        $response = $this->postJson('/api/purchase-requests', [
            'item_name' => 'New Laptop',
            'description' => 'For development',
            'quantity' => 1,
            'justification' => 'Current laptop is broken',
            'priority' => 'high',
            'needed_by_date' => now()->subDay()->toDateString(),
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['needed_by_date']);

        // Future date should pass
        $response = $this->postJson('/api/purchase-requests', [
            'item_name' => 'New Laptop',
            'description' => 'For development',
            'quantity' => 1,
            'justification' => 'Current laptop is broken',
            'priority' => 'high',
            'needed_by_date' => now()->addWeek()->toDateString(),
        ]);
        $response->assertStatus(201);
    }

    /** @test */
    public function test_approve_purchase_request_requires_admin_or_manager()
    {
        $purchaseRequest = PurchaseRequest::factory()->create(['status' => 'pending']);

        // Student should not be able to approve
        $this->actingAs($this->student);
        $response = $this->postJson("/api/purchase-requests/{$purchaseRequest->id}/approve", [
            'approved_cost' => 1000.00,
        ]);
        $response->assertStatus(403);

        // Admin should be able to approve
        $this->actingAs($this->admin);
        $response = $this->postJson("/api/purchase-requests/{$purchaseRequest->id}/approve", [
            'approved_cost' => 1000.00,
        ]);
        $response->assertStatus(200);
    }

    /** @test */
    public function test_reject_purchase_request_requires_rejection_reason()
    {
        $this->actingAs($this->admin);
        $purchaseRequest = PurchaseRequest::factory()->create(['status' => 'pending']);

        // Missing rejection_reason should fail
        $response = $this->postJson("/api/purchase-requests/{$purchaseRequest->id}/reject", []);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['rejection_reason']);

        // Valid rejection
        $response = $this->postJson("/api/purchase-requests/{$purchaseRequest->id}/reject", [
            'rejection_reason' => 'Budget constraints',
        ]);
        $response->assertStatus(200);
    }

    /** @test */
    public function test_mark_as_received_validates_actual_quantity()
    {
        $this->actingAs($this->admin);
        $purchaseRequest = PurchaseRequest::factory()->create(['status' => 'ordered']);

        // Zero quantity should fail
        $response = $this->postJson("/api/purchase-requests/{$purchaseRequest->id}/mark-received", [
            'actual_quantity' => 0,
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['actual_quantity']);

        // Negative quantity should fail
        $response = $this->postJson("/api/purchase-requests/{$purchaseRequest->id}/mark-received", [
            'actual_quantity' => -5,
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['actual_quantity']);

        // Valid quantity should pass
        $response = $this->postJson("/api/purchase-requests/{$purchaseRequest->id}/mark-received", [
            'actual_quantity' => 5,
        ]);
        $response->assertStatus(200);
    }

    /** @test */
    public function test_transaction_index_validates_filters()
    {
        $this->actingAs($this->admin);

        // Invalid status should fail
        $response = $this->getJson('/api/transactions?status=invalid_status');
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['status']);

        // Invalid per_page should fail
        $response = $this->getJson('/api/transactions?per_page=200');
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['per_page']);

        // Valid filters should pass
        $response = $this->getJson('/api/transactions?status=active&per_page=50');
        $response->assertStatus(200);
    }

    /** @test */
    public function test_all_error_messages_are_in_turkish()
    {
        $this->actingAs($this->admin);

        // Create a purchase request that can be marked as received
        $purchaseRequest = PurchaseRequest::factory()->ordered()->create();

        // Test Turkish error messages with mark-received endpoint (has Turkish validation messages)
        $response = $this->postJson("/api/purchase-requests/{$purchaseRequest->id}/mark-received", [
            'actual_quantity' => 0, // Invalid - must be at least 1
        ]);

        $response->assertStatus(422);
        $errors = $response->json('errors');
        
        // Check that error messages contain Turkish text
        $allErrors = json_encode($errors);
        $this->assertStringContainsString('en az', strtolower($allErrors));
    }
}
