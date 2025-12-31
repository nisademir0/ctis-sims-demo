<?php

namespace Tests\Feature;

use App\Mail\CheckoutConfirmation;
use App\Mail\ReturnConfirmation;
use App\Mail\OverdueNotification;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Item;
use App\Models\Category;
use App\Models\Vendor;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class EmailNotificationTest extends TestCase
{
    use DatabaseTransactions;

    private $user;
    private $admin;
    private $item;
    private $transaction;

    protected function setUp(): void
    {
        parent::setUp();

        // Create category and vendor
        $category = Category::create(['category_name' => 'Test Category']);
        $vendor = Vendor::create([
            'vendor_name' => 'Test Vendor',
            'contact_info' => json_encode(['phone' => '123-456-7890'])
        ]);

        // Create users
        $this->user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'user@test.com',
        ]);
        
        $this->admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@test.com',
        ]);

        // Create item
        $this->item = Item::factory()->create([
            'inventory_number' => 'TEST-001',
            'name' => 'Test Item',
            'status' => 'lent',
            'category_id' => $category->id,
            'vendor_id' => $vendor->id,
        ]);

        // Create transaction
        $this->transaction = Transaction::create([
            'item_id' => $this->item->id,
            'user_id' => $this->user->id,
            'checkout_date' => now(),
            'due_date' => now()->addDays(14),
            'status' => 'active',
            'checked_out_by' => $this->admin->id,
            'late_fee' => 0,
            'late_fee_paid' => false,
        ]);
    }

    /** @test */
    public function checkout_confirmation_email_can_be_rendered()
    {
        $this->transaction->load(['item.category', 'user', 'checkedOutBy']);
        
        $mailable = new CheckoutConfirmation($this->transaction);
        
        $mailable->assertSeeInHtml('Item Checkout Confirmation');
        $mailable->assertSeeInHtml('Test Item');
        $mailable->assertSeeInHtml('TEST-001');
        $mailable->assertSeeInHtml('Test User');
    }

    /** @test */
    public function return_confirmation_email_can_be_rendered()
    {
        $this->transaction->update([
            'status' => 'returned',
            'return_date' => now(),
            'return_condition' => 'good',
            'returned_to' => $this->admin->id,
        ]);
        $this->transaction->load(['item', 'user', 'returnedTo']);
        
        $mailable = new ReturnConfirmation($this->transaction);
        
        $mailable->assertSeeInHtml('Item Return Confirmation');
        $mailable->assertSeeInHtml('Test Item');
    }

    /** @test */
    public function overdue_notification_email_can_be_rendered()
    {
        $this->transaction->update([
            'due_date' => now()->subDays(7),
            'status' => 'overdue',
        ]);
        $this->transaction->load(['item', 'user']);
        
        $mailable = new OverdueNotification($this->transaction);
        
        $mailable->assertSeeInHtml('OVERDUE ITEM');
        $mailable->assertSeeInHtml('Test Item');
        $mailable->assertSeeInHtml('Days Overdue');
    }

    /** @test */
    public function checkout_sends_email()
    {
        Mail::fake();

        $this->item->update(['status' => 'available']);
        $newTransaction = Transaction::create([
            'item_id' => $this->item->id,
            'user_id' => $this->user->id,
            'checkout_date' => now(),
            'due_date' => now()->addDays(14),
            'status' => 'active',
            'checked_out_by' => $this->admin->id,
            'late_fee' => 0,
            'late_fee_paid' => false,
        ]);
        $newTransaction->load(['item.category', 'user', 'checkedOutBy']);

        Mail::to($this->user->email)->send(new CheckoutConfirmation($newTransaction));

        Mail::assertSent(CheckoutConfirmation::class, function ($mail) use ($newTransaction) {
            return $mail->transaction->id === $newTransaction->id;
        });
    }
}
