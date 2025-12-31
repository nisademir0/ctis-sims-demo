<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Item;
use App\Models\Role;
use App\Models\Transaction;
use App\Models\Category;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;

class TransactionExtendCancelTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;
    protected User $staff;
    protected Item $item;
    protected Transaction $transaction;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['role_name' => 'Admin']);
        $staffRole = Role::firstOrCreate(['role_name' => 'Staff']);

        $this->admin = User::factory()->create(['role_id' => $adminRole->id]);
        $this->staff = User::factory()->create(['role_id' => $staffRole->id]);

        $category = Category::firstOrCreate(['category_name' => 'Test Category']);
        $this->item = Item::create([
            'inventory_number' => 'TEST-001',
            'name' => 'Test Item',
            'category_id' => $category->id,
            'location' => 'Test Location',
            'status' => 'lent',
            'current_holder_id' => $this->staff->id
        ]);

        $this->transaction = Transaction::create([
            'item_id' => $this->item->id,
            'user_id' => $this->staff->id,
            'checkout_date' => now(),
            'due_date' => now()->addDays(7),
            'status' => 'active'
        ]);
    }

    /** @test */
    public function admin_can_extend_transaction()
    {
        Sanctum::actingAs($this->admin);

        $newDueDate = now()->addDays(14)->format('Y-m-d');

        $response = $this->postJson("/api/transactions/{$this->transaction->id}/extend", [
            'new_due_date' => $newDueDate,
            'reason' => 'Project extension requested'
        ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'message' => 'İşlem süresi başarıyla uzatıldı'
                 ]);

        $this->assertDatabaseHas('transactions', [
            'id' => $this->transaction->id,
            'due_date' => $newDueDate
        ]);
    }

    /** @test */
    public function user_can_extend_their_own_transaction()
    {
        Sanctum::actingAs($this->staff);

        $newDueDate = now()->addDays(10)->format('Y-m-d');

        $response = $this->postJson("/api/transactions/{$this->transaction->id}/extend", [
            'new_due_date' => $newDueDate,
            'reason' => 'Need more time'
        ]);

        $response->assertStatus(200);
    }

    /** @test */
    public function user_cannot_extend_others_transaction()
    {
        $otherUser = User::factory()->create([
            'role_id' => Role::where('role_name', 'Staff')->first()->id
        ]);

        Sanctum::actingAs($otherUser);

        $response = $this->postJson("/api/transactions/{$this->transaction->id}/extend", [
            'new_due_date' => now()->addDays(10)->format('Y-m-d'),
            'reason' => 'Test'
        ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function extend_validates_future_date()
    {
        Sanctum::actingAs($this->admin);

        $response = $this->postJson("/api/transactions/{$this->transaction->id}/extend", [
            'new_due_date' => now()->subDays(1)->format('Y-m-d'),
            'reason' => 'Test'
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors('new_due_date');
    }

    /** @test */
    public function extend_requires_new_due_date()
    {
        Sanctum::actingAs($this->admin);

        $response = $this->postJson("/api/transactions/{$this->transaction->id}/extend", [
            'reason' => 'Test'
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors('new_due_date');
    }

    /** @test */
    public function cannot_extend_returned_transaction()
    {
        $this->transaction->update([
            'status' => 'returned',
            'return_date' => now()
        ]);

        Sanctum::actingAs($this->admin);

        $response = $this->postJson("/api/transactions/{$this->transaction->id}/extend", [
            'new_due_date' => now()->addDays(10)->format('Y-m-d')
        ]);

        $response->assertStatus(400)
                 ->assertJson([
                     'message' => 'Sadece aktif işlemler uzatılabilir'
                 ]);
    }

    /** @test */
    public function admin_can_cancel_transaction()
    {
        Sanctum::actingAs($this->admin);

        $response = $this->postJson("/api/transactions/{$this->transaction->id}/cancel", [
            'reason' => 'Item needed for emergency maintenance'
        ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'message' => 'İşlem başarıyla iptal edildi'
                 ]);

        $this->assertDatabaseHas('transactions', [
            'id' => $this->transaction->id,
            'status' => 'cancelled'
        ]);

        // Item should be returned to inventory
        $this->assertDatabaseHas('items', [
            'id' => $this->item->id,
            'status' => 'available',
            'current_holder_id' => null
        ]);
    }

    /** @test */
    public function user_can_cancel_their_own_transaction()
    {
        Sanctum::actingAs($this->staff);

        $response = $this->postJson("/api/transactions/{$this->transaction->id}/cancel", [
            'reason' => 'No longer needed, returning early'
        ]);

        $response->assertStatus(200);
    }

    /** @test */
    public function user_cannot_cancel_others_transaction()
    {
        $otherUser = User::factory()->create([
            'role_id' => Role::where('role_name', 'Staff')->first()->id
        ]);

        Sanctum::actingAs($otherUser);

        $response = $this->postJson("/api/transactions/{$this->transaction->id}/cancel", [
            'reason' => 'Test cancellation reason'
        ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function cancel_requires_reason()
    {
        Sanctum::actingAs($this->admin);

        $response = $this->postJson("/api/transactions/{$this->transaction->id}/cancel", []);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors('reason');
    }

    /** @test */
    public function cancel_reason_must_be_at_least_10_characters()
    {
        Sanctum::actingAs($this->admin);

        $response = $this->postJson("/api/transactions/{$this->transaction->id}/cancel", [
            'reason' => 'Short'
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors('reason');
    }

    /** @test */
    public function cannot_cancel_already_returned_transaction()
    {
        $this->transaction->update([
            'status' => 'returned',
            'return_date' => now()
        ]);

        Sanctum::actingAs($this->admin);

        $response = $this->postJson("/api/transactions/{$this->transaction->id}/cancel", [
            'reason' => 'Test cancellation reason'
        ]);

        $response->assertStatus(400)
                 ->assertJson([
                     'message' => 'Sadece aktif işlemler iptal edilebilir'
                 ]);
    }

    /** @test */
    public function returns_404_for_nonexistent_transaction()
    {
        Sanctum::actingAs($this->admin);

        $response = $this->postJson('/api/transactions/99999/extend', [
            'new_due_date' => now()->addDays(10)->format('Y-m-d')
        ]);

        $response->assertStatus(404);

        $response = $this->postJson('/api/transactions/99999/cancel', [
            'reason' => 'Test cancellation reason'
        ]);

        $response->assertStatus(404);
    }
}
