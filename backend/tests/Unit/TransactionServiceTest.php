<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\TransactionService;
use App\Models\Transaction;
use App\Models\Item;
use App\Models\User;
use App\Models\Role;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

/**
 * Unit tests for TransactionService
 * 
 * Tests all core business logic including:
 * - Item checkout validation
 * - Return processing
 * - Late fee calculation
 * - Transaction queries
 */
class TransactionServiceTest extends TestCase
{
    use DatabaseTransactions;

    protected TransactionService $service;
    protected User $testUser;
    protected User $adminUser;
    protected Item $testItem;
    protected $categoryId;
    protected $vendorId;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create service instance
        $this->service = new TransactionService();
        
        // Get or create test roles
        $staffRole = Role::firstOrCreate(['role_name' => 'Staff'], ['id' => 3]);
        $adminRole = Role::firstOrCreate(['role_name' => 'Admin'], ['id' => 1]);
        
        // Create test users
        $this->testUser = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'role_id' => $staffRole->id,
        ]);
        
        $this->adminUser = User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'role_id' => $adminRole->id,
        ]);
        
        // Create test category and vendor (required by foreign keys)
        $category = \App\Models\Category::create(['category_name' => 'Test Category']);
        $vendor = \App\Models\Vendor::create(['vendor_name' => 'Test Vendor']);
        $this->categoryId = $category->id;
        $this->vendorId = $vendor->id;
        
        // Create test item
        $this->testItem = Item::create([
            'inventory_number' => 'TEST-001',
            'name' => 'Test Laptop',
            'category_id' => $this->categoryId,
            'vendor_id' => $this->vendorId,
            'location' => 'Test Lab',
            'status' => 'available',
            'condition_status' => 'new',
            'acquisition_method' => 'purchase',
            'is_active' => true,
        ]);
        
        // Authenticate as admin for tests
        Auth::login($this->adminUser);
    }

    /** @test */
    public function it_checks_out_an_available_item_successfully()
    {
        // Arrange
        $dueDate = Carbon::now()->addDays(14);
        
        // Act
        $transaction = $this->service->checkOutItem(
            itemId: $this->testItem->id,
            userId: $this->testUser->id,
            dueDate: $dueDate,
            notes: 'Test checkout'
        );
        
        // Assert
        $this->assertInstanceOf(Transaction::class, $transaction);
        $this->assertEquals('active', $transaction->status);
        $this->assertEquals($this->testItem->id, $transaction->item_id);
        $this->assertEquals($this->testUser->id, $transaction->user_id);
        $this->assertEquals(0, $transaction->late_fee);
        $this->assertEquals($this->adminUser->id, $transaction->checked_out_by);
        
        // Verify item status updated
        $this->testItem->refresh();
        $this->assertEquals('lent', $this->testItem->status);
        $this->assertEquals($this->testUser->id, $this->testItem->current_holder_id);
    }

    /** @test */
    public function it_prevents_checkout_of_unavailable_item()
    {
        // Arrange
        $this->testItem->update(['status' => 'lent']);
        $dueDate = Carbon::now()->addDays(14);
        
        // Act & Assert
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('not available for checkout');
        
        $this->service->checkOutItem(
            itemId: $this->testItem->id,
            userId: $this->testUser->id,
            dueDate: $dueDate
        );
    }

    /** @test */
    public function it_prevents_checkout_to_user_with_overdue_items()
    {
        // Arrange - Create an overdue transaction for the user
        Transaction::create([
            'item_id' => $this->testItem->id,
            'user_id' => $this->testUser->id,
            'checkout_date' => Carbon::now()->subDays(20),
            'due_date' => Carbon::now()->subDays(5),
            'status' => 'overdue',
            'checked_out_by' => $this->adminUser->id,
        ]);
        
        // Create another available item
        $anotherItem = Item::create([
            'inventory_number' => 'TEST-002',
            'name' => 'Test Mouse',
            'category_id' => $this->categoryId,
            'vendor_id' => $this->vendorId,
            'location' => 'Test Lab',
            'status' => 'available',
            'condition_status' => 'new',
            'acquisition_method' => 'purchase',
            'is_active' => true,
        ]);
        
        // Act & Assert
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('overdue item');
        
        $this->service->checkOutItem(
            itemId: $anotherItem->id,
            userId: $this->testUser->id,
            dueDate: Carbon::now()->addDays(14)
        );
    }

    /** @test */
    public function it_prevents_checkout_to_user_with_unpaid_late_fees()
    {
        // Arrange - Create a returned transaction with unpaid late fee
        Transaction::create([
            'item_id' => $this->testItem->id,
            'user_id' => $this->testUser->id,
            'checkout_date' => Carbon::now()->subDays(30),
            'due_date' => Carbon::now()->subDays(20),
            'return_date' => Carbon::now()->subDays(15),
            'status' => 'late_return',
            'late_fee' => 5.00,
            'late_fee_paid' => false,
            'checked_out_by' => $this->adminUser->id,
            'returned_to' => $this->adminUser->id,
        ]);
        
        // Create another available item
        $anotherItem = Item::create([
            'inventory_number' => 'TEST-003',
            'name' => 'Test Keyboard',
            'category_id' => $this->categoryId,
            'vendor_id' => $this->vendorId,
            'location' => 'Test Lab',
            'status' => 'available',
            'condition_status' => 'new',
            'acquisition_method' => 'purchase',
            'is_active' => true,
        ]);
        
        // Act & Assert
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('unpaid late fee');
        
        $this->service->checkOutItem(
            itemId: $anotherItem->id,
            userId: $this->testUser->id,
            dueDate: Carbon::now()->addDays(14)
        );
    }

    /** @test */
    public function it_returns_item_on_time_successfully()
    {
        // Arrange - Create an active transaction
        $transaction = Transaction::create([
            'item_id' => $this->testItem->id,
            'user_id' => $this->testUser->id,
            'checkout_date' => Carbon::now()->subDays(7),
            'due_date' => Carbon::now()->addDays(7), // Still 7 days left
            'status' => 'active',
            'checked_out_by' => $this->adminUser->id,
        ]);
        
        $this->testItem->update([
            'status' => 'lent',
            'current_holder_id' => $this->testUser->id,
        ]);
        
        // Act
        $returnedTransaction = $this->service->returnItem(
            transactionId: $transaction->id,
            condition: 'good',
            notes: 'All good'
        );
        
        // Assert
        $this->assertEquals('returned', $returnedTransaction->status);
        $this->assertEquals('good', $returnedTransaction->return_condition);
        $this->assertEquals('All good', $returnedTransaction->return_notes);
        $this->assertEquals(0, $returnedTransaction->late_fee);
        $this->assertEquals($this->adminUser->id, $returnedTransaction->returned_to);
        $this->assertNotNull($returnedTransaction->return_date);
        
        // Verify item status
        $this->testItem->refresh();
        $this->assertEquals('available', $this->testItem->status);
        $this->assertNull($this->testItem->current_holder_id);
    }

    /** @test */
    public function it_calculates_late_fee_for_overdue_return()
    {
        // Arrange - Create an overdue transaction (10 days late)
        $transaction = Transaction::create([
            'item_id' => $this->testItem->id,
            'user_id' => $this->testUser->id,
            'checkout_date' => Carbon::now()->subDays(20),
            'due_date' => Carbon::now()->subDays(10), // 10 days overdue
            'status' => 'overdue',
            'checked_out_by' => $this->adminUser->id,
        ]);
        
        $this->testItem->update([
            'status' => 'lent',
            'current_holder_id' => $this->testUser->id,
        ]);
        
        // Act
        $returnedTransaction = $this->service->returnItem(
            transactionId: $transaction->id,
            condition: 'good',
            notes: 'Sorry for being late'
        );
        
        // Assert
        $this->assertEquals('late_return', $returnedTransaction->status);
        $this->assertEquals(10.00, $returnedTransaction->late_fee); // $1/day * 10 days
        $this->assertFalse($returnedTransaction->late_fee_paid);
    }

    /** @test */
    public function it_sets_item_to_maintenance_for_damaged_return()
    {
        // Arrange
        $transaction = Transaction::create([
            'item_id' => $this->testItem->id,
            'user_id' => $this->testUser->id,
            'checkout_date' => Carbon::now()->subDays(7),
            'due_date' => Carbon::now()->addDays(7),
            'status' => 'active',
            'checked_out_by' => $this->adminUser->id,
        ]);
        
        $this->testItem->update([
            'status' => 'lent',
            'current_holder_id' => $this->testUser->id,
        ]);
        
        // Act
        $returnedTransaction = $this->service->returnItem(
            transactionId: $transaction->id,
            condition: 'damaged',
            notes: 'Screen broken'
        );
        
        // Assert
        $this->assertEquals('damaged', $returnedTransaction->return_condition);
        
        // Verify item is in maintenance
        $this->testItem->refresh();
        $this->assertEquals('maintenance', $this->testItem->status);
    }

    /** @test */
    public function it_validates_return_condition_enum()
    {
        // Arrange
        $transaction = Transaction::create([
            'item_id' => $this->testItem->id,
            'user_id' => $this->testUser->id,
            'checkout_date' => Carbon::now()->subDays(7),
            'due_date' => Carbon::now()->addDays(7),
            'status' => 'active',
            'checked_out_by' => $this->adminUser->id,
        ]);
        
        $this->testItem->update(['status' => 'lent']);
        
        // Act & Assert
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Invalid condition');
        
        $this->service->returnItem(
            transactionId: $transaction->id,
            condition: 'invalid_condition',
            notes: 'Test'
        );
    }

    /** @test */
    public function it_prevents_returning_already_returned_transaction()
    {
        // Arrange
        $transaction = Transaction::create([
            'item_id' => $this->testItem->id,
            'user_id' => $this->testUser->id,
            'checkout_date' => Carbon::now()->subDays(14),
            'due_date' => Carbon::now()->subDays(7),
            'return_date' => Carbon::now()->subDays(3),
            'status' => 'returned',
            'checked_out_by' => $this->adminUser->id,
            'returned_to' => $this->adminUser->id,
        ]);
        
        // Act & Assert
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('not active');
        
        $this->service->returnItem(
            transactionId: $transaction->id,
            condition: 'good'
        );
    }

    /** @test */
    public function it_gets_active_transactions_for_user()
    {
        // Arrange - Create multiple transactions
        Transaction::create([
            'item_id' => $this->testItem->id,
            'user_id' => $this->testUser->id,
            'checkout_date' => Carbon::now()->subDays(5),
            'due_date' => Carbon::now()->addDays(9),
            'status' => 'active',
            'checked_out_by' => $this->adminUser->id,
        ]);
        
        Transaction::create([
            'item_id' => $this->testItem->id,
            'user_id' => $this->testUser->id,
            'checkout_date' => Carbon::now()->subDays(14),
            'due_date' => Carbon::now()->subDays(7),
            'return_date' => Carbon::now()->subDays(3),
            'status' => 'returned',
            'checked_out_by' => $this->adminUser->id,
        ]);
        
        // Act
        $activeTransactions = $this->service->getActiveTransactions($this->testUser->id);
        
        // Assert
        $this->assertCount(1, $activeTransactions);
        $this->assertEquals('active', $activeTransactions->first()->status);
    }

    /** @test */
    public function it_gets_overdue_transactions()
    {
        // Arrange - Create one overdue transaction (active but past due date)
        $overdueTransaction = Transaction::create([
            'item_id' => $this->testItem->id,
            'user_id' => $this->testUser->id,
            'checkout_date' => Carbon::now()->subDays(30),
            'due_date' => Carbon::now()->subDays(10),  // Past due date
            'status' => 'active',  // Still active (not yet returned)
            'checked_out_by' => $this->adminUser->id,
        ]);
        
        // Create one non-overdue active transaction
        $anotherItem = Item::create([
            'inventory_number' => 'TEST-004',
            'name' => 'Test Monitor',
            'category_id' => $this->categoryId,
            'vendor_id' => $this->vendorId,
            'location' => 'Test Lab',
            'status' => 'lent',
            'condition_status' => 'new',
            'acquisition_method' => 'purchase',
            'is_active' => true,
        ]);
        
        Transaction::create([
            'item_id' => $anotherItem->id,
            'user_id' => $this->testUser->id,
            'checkout_date' => Carbon::now()->subDays(5),
            'due_date' => Carbon::now()->addDays(9),  // Future due date
            'status' => 'active',
            'checked_out_by' => $this->adminUser->id,
        ]);
        
        // Act
        $overdueTransactions = $this->service->getOverdueTransactions();
        
        // Assert - Filter to only transactions from this test
        $testOverdueTransactions = $overdueTransactions->where('id', $overdueTransaction->id);
        $this->assertCount(1, $testOverdueTransactions);
        $this->assertEquals('active', $testOverdueTransactions->first()->status);  // Status is still 'active'
        $this->assertTrue($testOverdueTransactions->first()->isOverdue());  // But it's overdue
    }

    /** @test */
    public function it_marks_late_fee_as_paid()
    {
        // Arrange
        $transaction = Transaction::create([
            'item_id' => $this->testItem->id,
            'user_id' => $this->testUser->id,
            'checkout_date' => Carbon::now()->subDays(30),
            'due_date' => Carbon::now()->subDays(20),
            'return_date' => Carbon::now()->subDays(15),
            'status' => 'late_return',
            'late_fee' => 10.00,
            'late_fee_paid' => false,
            'checked_out_by' => $this->adminUser->id,
            'returned_to' => $this->adminUser->id,
        ]);
        
        // Act
        $updatedTransaction = $this->service->markLateFeeAsPaid($transaction->id);
        
        // Assert
        $this->assertTrue($updatedTransaction->late_fee_paid);
    }

    /** @test */
    public function it_cancels_active_transaction()
    {
        // Arrange
        $transaction = Transaction::create([
            'item_id' => $this->testItem->id,
            'user_id' => $this->testUser->id,
            'checkout_date' => Carbon::now()->subDays(2),
            'due_date' => Carbon::now()->addDays(12),
            'status' => 'active',
            'checked_out_by' => $this->adminUser->id,
        ]);
        
        $this->testItem->update([
            'status' => 'lent',
            'current_holder_id' => $this->testUser->id,
        ]);
        
        // Act
        $cancelledTransaction = $this->service->cancelTransaction(
            transactionId: $transaction->id
        );
        
        // Assert
        $this->assertEquals('cancelled', $cancelledTransaction->status);
        
        // Verify item is available again
        $this->testItem->refresh();
        $this->assertEquals('available', $this->testItem->status);
        $this->assertNull($this->testItem->current_holder_id);
    }

    /** @test */
    public function it_extends_due_date()
    {
        // Arrange
        $originalDueDate = Carbon::now()->addDays(7);
        $transaction = Transaction::create([
            'item_id' => $this->testItem->id,
            'user_id' => $this->testUser->id,
            'checkout_date' => Carbon::now()->subDays(7),
            'due_date' => $originalDueDate,
            'status' => 'active',
            'checked_out_by' => $this->adminUser->id,
        ]);
        
        $newDueDate = Carbon::now()->addDays(21); // Extend by 14 days
        
        // Act
        $extendedTransaction = $this->service->extendDueDate(
            transactionId: $transaction->id,
            newDueDate: $newDueDate
        );
        
        // Assert
        $this->assertEquals(
            $newDueDate->toDateString(),
            $extendedTransaction->due_date->toDateString()
        );
    }

    /** @test */
    public function it_calculates_late_fee_correctly()
    {
        // Arrange - Create transaction 15 days overdue
        $transaction = Transaction::create([
            'item_id' => $this->testItem->id,
            'user_id' => $this->testUser->id,
            'checkout_date' => Carbon::now()->subDays(30),
            'due_date' => Carbon::now()->subDays(15),
            'status' => 'active',
            'checked_out_by' => $this->adminUser->id,
        ]);
        
        // Act
        $lateFee = $transaction->calculateLateFee();
        
        // Assert
        $this->assertEquals(15.00, $lateFee); // $1/day * 15 days
    }

    /** @test */
    public function it_calculates_days_overdue_correctly_for_active_transaction()
    {
        // Arrange
        $transaction = Transaction::create([
            'item_id' => $this->testItem->id,
            'user_id' => $this->testUser->id,
            'checkout_date' => Carbon::now()->subDays(20),
            'due_date' => Carbon::now()->subDays(8),
            'status' => 'active',
            'checked_out_by' => $this->adminUser->id,
        ]);
        
        // Act
        $daysOverdue = $transaction->daysOverdue();
        
        // Assert
        $this->assertEquals(8, $daysOverdue);
    }

    /** @test */
    public function it_calculates_days_overdue_correctly_for_late_return()
    {
        // Arrange - Returned 5 days late
        $dueDate = Carbon::now()->subDays(10);
        $returnDate = Carbon::now()->subDays(5);
        
        $transaction = Transaction::create([
            'item_id' => $this->testItem->id,
            'user_id' => $this->testUser->id,
            'checkout_date' => Carbon::now()->subDays(20),
            'due_date' => $dueDate,
            'return_date' => $returnDate,
            'status' => 'late_return',
            'late_fee' => 5.00,
            'checked_out_by' => $this->adminUser->id,
            'returned_to' => $this->adminUser->id,
        ]);
        
        // Act
        $daysOverdue = $transaction->daysOverdue();
        
        // Assert
        $this->assertEquals(5, $daysOverdue); // due_date to return_date = 5 days
    }

    /** @test */
    public function it_returns_zero_days_overdue_for_on_time_transaction()
    {
        // Arrange - Not overdue
        $transaction = Transaction::create([
            'item_id' => $this->testItem->id,
            'user_id' => $this->testUser->id,
            'checkout_date' => Carbon::now()->subDays(5),
            'due_date' => Carbon::now()->addDays(9), // Still 9 days left
            'status' => 'active',
            'checked_out_by' => $this->adminUser->id,
        ]);
        
        // Act
        $daysOverdue = $transaction->daysOverdue();
        
        // Assert
        $this->assertEquals(0, $daysOverdue);
    }
}
