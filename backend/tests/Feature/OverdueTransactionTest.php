<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Item;
use App\Models\Transaction;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;
use Carbon\Carbon;

class OverdueTransactionTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    /**
     * Test getting overdue transactions
     */
    public function test_admin_can_get_overdue_transactions()
    {
        $admin = User::where('email', 'admin@ctis.edu.tr')->first();
        Sanctum::actingAs($admin);

        // Create an overdue transaction
        $item = Item::where('status', 'available')->first();
        $staff = User::where('email', 'leyla@ctis.edu.tr')->first();

        $transaction = Transaction::create([
            'user_id' => $staff->id,
            'item_id' => $item->id,
            'checkout_date' => now()->subDays(30),
            'due_date' => now()->subDays(5), // 5 days overdue
            'status' => 'active',
            'checked_out_by' => $admin->id,
        ]);

        $item->update(['status' => 'lent', 'current_holder_id' => $staff->id]);

        $response = $this->getJson('/api/transactions/overdue');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'overdue_count',
                'transactions',
                'severity_breakdown' => ['critical', 'high', 'medium']
            ]);

        $this->assertGreaterThan(0, $response->json('overdue_count'));
    }

    /**
     * Test overdue severity calculation
     */
    public function test_overdue_transactions_have_correct_severity()
    {
        $admin = User::where('email', 'admin@ctis.edu.tr')->first();
        Sanctum::actingAs($admin);

        $staff = User::where('email', 'leyla@ctis.edu.tr')->first();
        $items = Item::where('status', 'available')->take(3)->get();

        // Create transactions with different overdue periods
        // Medium (5 days)
        $transaction1 = Transaction::create([
            'user_id' => $staff->id,
            'item_id' => $items[0]->id,
            'checkout_date' => now()->subDays(20),
            'due_date' => now()->subDays(5),
            'status' => 'active',
            'checked_out_by' => $admin->id,
        ]);
        $items[0]->update(['status' => 'lent', 'current_holder_id' => $staff->id]);

        // High (20 days)
        $transaction2 = Transaction::create([
            'user_id' => $staff->id,
            'item_id' => $items[1]->id,
            'checkout_date' => now()->subDays(40),
            'due_date' => now()->subDays(20),
            'status' => 'active',
            'checked_out_by' => $admin->id,
        ]);
        $items[1]->update(['status' => 'lent', 'current_holder_id' => $staff->id]);

        // Critical (40 days)
        $transaction3 = Transaction::create([
            'user_id' => $staff->id,
            'item_id' => $items[2]->id,
            'checkout_date' => now()->subDays(70),
            'due_date' => now()->subDays(40),
            'status' => 'active',
            'checked_out_by' => $admin->id,
        ]);
        $items[2]->update(['status' => 'lent', 'current_holder_id' => $staff->id]);

        $response = $this->getJson('/api/transactions/overdue');

        $response->assertStatus(200);
        
        $breakdown = $response->json('severity_breakdown');
        $this->assertGreaterThanOrEqual(1, $breakdown['medium']);
        $this->assertGreaterThanOrEqual(1, $breakdown['high']);
        $this->assertGreaterThanOrEqual(1, $breakdown['critical']);
    }

    /**
     * Test late fee calculation
     */
    public function test_late_fee_is_calculated_correctly()
    {
        $admin = User::where('email', 'admin@ctis.edu.tr')->first();
        Sanctum::actingAs($admin);

        $item = Item::where('status', 'available')->first();
        $staff = User::where('email', 'leyla@ctis.edu.tr')->first();

        $daysOverdue = 10;
        $transaction = Transaction::create([
            'user_id' => $staff->id,
            'item_id' => $item->id,
            'checkout_date' => now()->subDays(30),
            'due_date' => now()->subDays($daysOverdue),
            'status' => 'active',
            'checked_out_by' => $admin->id,
        ]);

        $item->update(['status' => 'lent', 'current_holder_id' => $staff->id]);

        $expectedLateFee = $daysOverdue * 1.0; // $1 per day
        $actualLateFee = $transaction->calculateLateFee();

        $this->assertEquals($expectedLateFee, $actualLateFee);
    }

    /**
     * Test days overdue calculation
     */
    public function test_days_overdue_is_calculated_correctly()
    {
        $item = Item::where('status', 'available')->first();
        $staff = User::where('email', 'leyla@ctis.edu.tr')->first();
        $admin = User::where('email', 'admin@ctis.edu.tr')->first();

        $daysOverdue = 15;
        $transaction = Transaction::create([
            'user_id' => $staff->id,
            'item_id' => $item->id,
            'checkout_date' => now()->subDays(30),
            'due_date' => now()->subDays($daysOverdue),
            'status' => 'active',
            'checked_out_by' => $admin->id,
        ]);

        $actualDaysOverdue = $transaction->daysOverdue();

        $this->assertEquals($daysOverdue, $actualDaysOverdue);
    }

    /**
     * Test non-overdue transaction returns zero days overdue
     */
    public function test_non_overdue_transaction_returns_zero()
    {
        $item = Item::where('status', 'available')->first();
        $staff = User::where('email', 'leyla@ctis.edu.tr')->first();
        $admin = User::where('email', 'admin@ctis.edu.tr')->first();

        $transaction = Transaction::create([
            'user_id' => $staff->id,
            'item_id' => $item->id,
            'checkout_date' => now()->subDays(5),
            'due_date' => now()->addDays(5), // Future due date
            'status' => 'active',
            'checked_out_by' => $admin->id,
        ]);

        $this->assertEquals(0, $transaction->daysOverdue());
        $this->assertFalse($transaction->isOverdue());
    }

    /**
     * Test staff can only see their own overdue transactions
     */
    public function test_staff_cannot_see_all_overdue_transactions()
    {
        $staff = User::where('email', 'leyla@ctis.edu.tr')->first();
        Sanctum::actingAs($staff);

        // Create overdue transaction for different user
        $otherStaff = User::where('role_id', $staff->role_id)
            ->where('id', '!=', $staff->id)
            ->first();
        $item = Item::where('status', 'available')->first();

        $transaction = Transaction::create([
            'user_id' => $otherStaff->id,
            'item_id' => $item->id,
            'checkout_date' => now()->subDays(30),
            'due_date' => now()->subDays(5),
            'status' => 'active',
            'checked_out_by' => $otherStaff->id,
        ]);

        $response = $this->getJson('/api/transactions/overdue');

        // Staff users typically don't have access to overdue endpoint
        // or only see their own transactions
        $response->assertStatus(403); // Forbidden
    }

    /**
     * Test returned transactions are not shown as overdue
     */
    public function test_returned_transactions_not_in_overdue_list()
    {
        $admin = User::where('email', 'admin@ctis.edu.tr')->first();
        Sanctum::actingAs($admin);

        $item = Item::where('status', 'available')->first();
        $staff = User::where('email', 'leyla@ctis.edu.tr')->first();

        // Create and return a transaction that was overdue
        $transaction = Transaction::create([
            'user_id' => $staff->id,
            'item_id' => $item->id,
            'checkout_date' => now()->subDays(30),
            'due_date' => now()->subDays(5),
            'status' => 'late_return',
            'return_date' => now(),
            'late_fee' => 5.0,
            'checked_out_by' => $admin->id,
            'returned_to_id' => $admin->id,
        ]);

        $response = $this->getJson('/api/transactions/overdue');

        $response->assertStatus(200);
        
        $transactions = $response->json('transactions');
        $transactionIds = collect($transactions)->pluck('transaction.id')->toArray();
        
        $this->assertNotContains($transaction->id, $transactionIds);
    }
}
