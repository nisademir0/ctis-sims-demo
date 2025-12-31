<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Transaction;
use App\Models\Item;
use App\Models\User;
use App\Models\Role;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;
use Carbon\Carbon;

/**
 * Feature tests for Transaction API endpoints
 * 
 * Tests all HTTP endpoints with authentication and authorization
 */
class TransactionApiTest extends TestCase
{
    use DatabaseTransactions;

    protected User $adminUser;
    protected User $staffUser;
    protected Item $testItem;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Get or create roles
        $adminRole = Role::firstOrCreate(['role_name' => 'Admin'], ['id' => 1]);
        $staffRole = Role::firstOrCreate(['role_name' => 'Staff'], ['id' => 3]);
        
        // Create users
        $this->adminUser = User::factory()->create([
            'role_id' => $adminRole->id,
            'email' => 'admin@test.com',
        ]);
        
        $this->staffUser = User::factory()->create([
            'role_id' => $staffRole->id,
            'email' => 'staff@test.com',
        ]);
        
        // Get or create test category and vendor (required by foreign keys)
        $category = \App\Models\Category::firstOrCreate(['category_name' => 'Test Category']);
        $vendor = \App\Models\Vendor::firstOrCreate(['vendor_name' => 'Test Vendor']);
        
        // Create test item
        $this->testItem = Item::create([
            'inventory_number' => 'TEST-001',
            'name' => 'Test Laptop',
            'category_id' => $category->id,
            'vendor_id' => $vendor->id,
            'location' => 'Test Lab',
            'status' => 'available',
            'condition_status' => 'new',
            'acquisition_method' => 'purchase',
            'is_active' => true,
        ]);
    }

    /** @test */
    public function it_requires_authentication_for_checkout()
    {
        // Act
        $response = $this->postJson('/api/transactions/checkout', [
            'item_id' => $this->testItem->id,
            'user_id' => $this->staffUser->id,
            'due_date' => Carbon::now()->addDays(14)->toDateString(),
        ]);
        
        // Assert
        $response->assertStatus(401);
    }

    /** @test */
    public function admin_can_checkout_item()
    {
        // Arrange
        Sanctum::actingAs($this->adminUser);
        
        // Act
        $response = $this->postJson('/api/transactions/checkout', [
            'item_id' => $this->testItem->id,
            'user_id' => $this->staffUser->id,
            'due_date' => Carbon::now()->addDays(14)->toDateString(),
            'notes' => 'Test checkout',
        ]);
        
        // Assert
        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'item_id',
                    'user_id',
                    'checkout_date',
                    'due_date',
                    'status',
                    'late_fee',
                    'item',
                    'user',
                    'checked_out_by',
                ],
                'due_date',
            ])
            ->assertJson([
                'message' => 'Item checked out successfully',
                'data' => [
                    'status' => 'active',
                    'late_fee' => '0.00',
                ],
            ]);
        
        // Verify database
        $this->assertDatabaseHas('transactions', [
            'item_id' => $this->testItem->id,
            'user_id' => $this->staffUser->id,
            'status' => 'active',
        ]);
        
        $this->assertDatabaseHas('items', [
            'id' => $this->testItem->id,
            'status' => 'lent',
            'current_holder_id' => $this->staffUser->id,
        ]);
    }

    /** @test */
    public function it_validates_required_fields_for_checkout()
    {
        // Arrange
        Sanctum::actingAs($this->adminUser);
        
        // Act
        $response = $this->postJson('/api/transactions/checkout', [
            // Missing required fields (due_date is optional, defaults to 14 days)
        ]);
        
        // Assert
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['item_id', 'user_id']);
    }

    /** @test */
    public function it_prevents_checkout_of_unavailable_item()
    {
        // Arrange
        Sanctum::actingAs($this->adminUser);
        $this->testItem->update(['status' => 'lent']);
        
        // Act
        $response = $this->postJson('/api/transactions/checkout', [
            'item_id' => $this->testItem->id,
            'user_id' => $this->staffUser->id,
            'due_date' => Carbon::now()->addDays(14)->toDateString(),
        ]);
        
        // Assert
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['item_id']);
    }

    /** @test */
    public function it_validates_future_due_date()
    {
        // Arrange
        Sanctum::actingAs($this->adminUser);
        
        // Act
        $response = $this->postJson('/api/transactions/checkout', [
            'item_id' => $this->testItem->id,
            'user_id' => $this->staffUser->id,
            'due_date' => Carbon::now()->subDays(1)->toDateString(), // Past date
        ]);
        
        // Assert
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['due_date']);
    }

    /** @test */
    public function admin_can_return_item()
    {
        // Arrange
        Sanctum::actingAs($this->adminUser);
        
        $transaction = Transaction::create([
            'item_id' => $this->testItem->id,
            'user_id' => $this->staffUser->id,
            'checkout_date' => Carbon::now()->subDays(7),
            'due_date' => Carbon::now()->addDays(7),
            'status' => 'active',
            'checked_out_by' => $this->adminUser->id,
        ]);
        
        $this->testItem->update([
            'status' => 'lent',
            'current_holder_id' => $this->staffUser->id,
        ]);
        
        // Act
        $response = $this->postJson("/api/transactions/{$transaction->id}/return", [
            'return_condition' => 'good',
            'return_notes' => 'All good',
        ]);
        
        // Assert
        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'status',
                    'return_date',
                    'return_condition',
                    'return_notes',
                    'late_fee',
                ],
                'was_overdue',
                'days_overdue',
                'late_fee',
            ])
            ->assertJson([
                'message' => 'Item returned successfully',
                'was_overdue' => false,
                'days_overdue' => 0,
                'late_fee' => '0.00',
            ]);
        
        // Verify database
        $this->assertDatabaseHas('transactions', [
            'id' => $transaction->id,
            'status' => 'returned',
            'return_condition' => 'good',
        ]);
        
        $this->assertDatabaseHas('items', [
            'id' => $this->testItem->id,
            'status' => 'available',
            'current_holder_id' => null,
        ]);
    }

    /** @test */
    public function it_calculates_late_fee_on_overdue_return()
    {
        // Arrange
        Sanctum::actingAs($this->adminUser);
        
        $transaction = Transaction::create([
            'item_id' => $this->testItem->id,
            'user_id' => $this->staffUser->id,
            'checkout_date' => Carbon::now()->subDays(20),
            'due_date' => Carbon::now()->subDays(10), // 10 days overdue
            'status' => 'overdue',
            'checked_out_by' => $this->adminUser->id,
        ]);
        
        $this->testItem->update(['status' => 'lent']);
        
        // Act
        $response = $this->postJson("/api/transactions/{$transaction->id}/return", [
            'return_condition' => 'good',
            'return_notes' => 'Sorry for delay',
        ]);
        
        // Assert
        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Item returned late. Late fee applied.',
                'was_overdue' => true,
                'days_overdue' => 10,
                'late_fee' => '10.00',
            ]);
        
        $this->assertDatabaseHas('transactions', [
            'id' => $transaction->id,
            'status' => 'late_return',
            'late_fee' => 10.00,
            'late_fee_paid' => false,
        ]);
    }

    /** @test */
    public function it_sets_item_to_maintenance_for_damaged_return()
    {
        // Arrange
        Sanctum::actingAs($this->adminUser);
        
        $transaction = Transaction::create([
            'item_id' => $this->testItem->id,
            'user_id' => $this->staffUser->id,
            'checkout_date' => Carbon::now()->subDays(5),
            'due_date' => Carbon::now()->addDays(9),
            'status' => 'active',
            'checked_out_by' => $this->adminUser->id,
        ]);
        
        $this->testItem->update(['status' => 'lent']);
        
        // Act
        $response = $this->postJson("/api/transactions/{$transaction->id}/return", [
            'return_condition' => 'damaged',
            'return_notes' => 'Screen cracked',
            'damage_reported' => true,
            'damage_description' => 'Laptop screen is cracked',
            'maintenance_type' => 'hardware_failure',
            'maintenance_priority' => 'high',
        ]);
        
        // Assert
        $response->assertStatus(200)
            ->assertJsonStructure([
                'maintenance_request' => ['id', 'item_id', 'status', 'priority'],
            ]);
        
        $this->assertDatabaseHas('items', [
            'id' => $this->testItem->id,
            'status' => 'maintenance',
        ]);
        
        $this->assertDatabaseHas('maintenance_requests', [
            'item_id' => $this->testItem->id,
            'status' => 'pending',
            'priority' => 'high',
        ]);
    }

    /** @test */
    public function it_validates_return_condition_enum()
    {
        // Arrange
        Sanctum::actingAs($this->adminUser);
        
        $transaction = Transaction::create([
            'item_id' => $this->testItem->id,
            'user_id' => $this->staffUser->id,
            'checkout_date' => Carbon::now()->subDays(5),
            'due_date' => Carbon::now()->addDays(9),
            'status' => 'active',
            'checked_out_by' => $this->adminUser->id,
        ]);
        
        // Act
        $response = $this->postJson("/api/transactions/{$transaction->id}/return", [
            'return_condition' => 'invalid_condition',
        ]);
        
        // Assert
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['return_condition']);
    }

    /** @test */
    public function admin_can_list_all_transactions()
    {
        // Arrange
        Sanctum::actingAs($this->adminUser);
        
        // Create multiple transactions
        Transaction::factory()->count(15)->create();
        
        // Act
        $response = $this->getJson('/api/transactions?per_page=10');
        
        // Assert
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'item_id',
                        'user_id',
                        'status',
                        'checkout_date',
                        'due_date',
                        'item',
                        'user',
                    ],
                ],
                'meta' => [
                    'current_page',
                    'last_page',
                    'per_page',
                    'total',
                ],
            ]);
        
        $this->assertCount(10, $response->json('data'));
    }

    /** @test */
    public function it_filters_transactions_by_status()
    {
        // Arrange
        Sanctum::actingAs($this->adminUser);
        
        $t1 = Transaction::factory()->create(['status' => 'active', 'user_id' => $this->staffUser->id]);
        $t2 = Transaction::factory()->create(['status' => 'active', 'user_id' => $this->staffUser->id]);
        Transaction::factory()->create(['status' => 'returned', 'user_id' => $this->staffUser->id]);
        
        // Act - Filter by both status and user_id
        $response = $this->getJson('/api/transactions?status=active&user_id=' . $this->staffUser->id);
        
        // Assert
        $response->assertStatus(200);
        
        $transactions = $response->json('data');
        $this->assertCount(2, $transactions);
        $this->assertEquals('active', $transactions[0]['status']);
        $this->assertEquals('active', $transactions[1]['status']);
    }

    /** @test */
    public function staff_can_only_see_their_own_transactions()
    {
        // Arrange
        Sanctum::actingAs($this->staffUser);
        
        // Create transactions for different users
        Transaction::factory()->create(['user_id' => $this->staffUser->id]);
        Transaction::factory()->create(['user_id' => $this->staffUser->id]);
        Transaction::factory()->create(['user_id' => $this->adminUser->id]); // Different user
        
        // Act
        $response = $this->getJson('/api/transactions');
        
        // Assert
        $response->assertStatus(200);
        
        $transactions = $response->json('data');
        $this->assertCount(2, $transactions); // Only staff user's transactions
    }

    /** @test */
    public function it_gets_overdue_transactions()
    {
        // Arrange
        Sanctum::actingAs($this->adminUser);
        
        // Create overdue transaction (status='active' with past due_date triggers scopeOverdue)
        Transaction::factory()->create([
            'due_date' => Carbon::now()->subDays(5),
            'status' => 'active', // Must be active for scopeOverdue to find it
        ]);
        
        // Create active (not overdue) transaction
        Transaction::factory()->create([
            'due_date' => Carbon::now()->addDays(5),
            'status' => 'active',
        ]);
        
        // Act
        $response = $this->getJson('/api/transactions/overdue');
        
        // Assert
        $response->assertStatus(200)
            ->assertJsonStructure([
                'overdue_count',
                'transactions' => [
                    '*' => [
                        'transaction',
                        'days_overdue',
                        'severity',
                        'overdue_weeks',
                    ],
                ],
                'severity_breakdown' => [
                    'critical',
                    'high',
                    'medium',
                ],
            ]);
        
        // Assert overdue count is at least 1 (includes seeded data)
        $this->assertGreaterThanOrEqual(1, $response->json('overdue_count'));
    }

    /** @test */
    public function it_returns_404_for_non_existent_transaction()
    {
        // Arrange
        Sanctum::actingAs($this->adminUser);
        
        // Act
        $response = $this->postJson('/api/transactions/99999/return', [
            'return_condition' => 'good',
        ]);
        
        // Assert
        $response->assertStatus(404);
    }

    /** @test */
    public function it_prevents_returning_already_returned_transaction()
    {
        // Arrange
        Sanctum::actingAs($this->adminUser);
        
        $transaction = Transaction::create([
            'item_id' => $this->testItem->id,
            'user_id' => $this->staffUser->id,
            'checkout_date' => Carbon::now()->subDays(14),
            'due_date' => Carbon::now()->subDays(7),
            'return_date' => Carbon::now()->subDays(3),
            'status' => 'returned',
            'checked_out_by' => $this->adminUser->id,
            'returned_to' => $this->adminUser->id,
        ]);
        
        // Act
        $response = $this->postJson("/api/transactions/{$transaction->id}/return", [
            'return_condition' => 'good',
        ]);
        
        // Assert
        $response->assertStatus(500); // Exception thrown by service
    }
}
