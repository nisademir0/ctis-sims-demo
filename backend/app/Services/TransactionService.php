<?php

namespace App\Services;

use App\Models\Transaction;
use App\Models\Item;
use App\Models\User;
use App\Mail\CheckoutConfirmation;
use App\Mail\ReturnConfirmation;
use App\Mail\OverdueNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Exception;

class TransactionService
{
    /**
     * Check out an item to a user
     * 
     * @param int $itemId Item to check out
     * @param int $userId User borrowing the item
     * @param Carbon $dueDate When item should be returned
     * @param string|null $notes Optional notes
     * @return Transaction
     * @throws Exception
     */
    public function checkOutItem(
        int $itemId,
        int $userId,
        Carbon $dueDate,
        ?string $notes = null
    ): Transaction {
        DB::beginTransaction();
        
        try {
            // 1. Validate item exists and is available
            $item = Item::findOrFail($itemId);
            
            if ($item->status !== 'available') {
                throw new Exception("Item is not available for checkout. Current status: {$item->status}");
            }
            
            // 2. Validate user exists
            $user = User::findOrFail($userId);
            
            // 3. Check if user has any overdue items
            $overdueCount = Transaction::where('user_id', $userId)
                ->where('status', 'overdue')
                ->count();
                
            if ($overdueCount > 0) {
                throw new Exception("User has {$overdueCount} overdue item(s). Please return them first.");
            }
            
            // 4. Check if user has unpaid late fees
            $unpaidFees = Transaction::where('user_id', $userId)
                ->where('late_fee', '>', 0)
                ->where('late_fee_paid', false)
                ->sum('late_fee');
                
            if ($unpaidFees > 0) {
                throw new Exception("User has unpaid late fees: $" . number_format($unpaidFees, 2));
            }
            
            // 5. Validate due date is in the future
            if ($dueDate->isPast()) {
                throw new Exception("Due date must be in the future");
            }
            
            // 6. Create transaction
            $transaction = Transaction::create([
                'item_id' => $itemId,
                'user_id' => $userId,
                'checkout_date' => now(),
                'due_date' => $dueDate,
                'notes' => $notes,
                'status' => 'active',
                'checked_out_by' => Auth::id(),
                'late_fee' => 0,
                'late_fee_paid' => false,
            ]);
            
            // 7. Update item status
            $item->update([
                'status' => 'lent',
                'current_holder_id' => $userId,
            ]);
            
            // 8. Log lifecycle event
            $item->lifecycleEvents()->create([
                'event_type' => 'Maintenance', // Using existing enum, ideally add 'CheckOut'
                'event_date' => now(),
                'notes' => "Checked out to {$user->name} until " . $dueDate->format('Y-m-d'),
            ]);
            
            DB::commit();
            
            // 9. Load relationships for response
            $transaction->load(['item', 'user', 'checkedOutBy']);
            
            // 10. Send checkout confirmation email
            try {
                Mail::to($user->email)->send(new CheckoutConfirmation($transaction));
                $transaction->update(['checkout_email_sent' => true]);
            } catch (Exception $e) {
                // Log email error but don't fail the transaction
                Log::error('Failed to send checkout confirmation email', [
                    'transaction_id' => $transaction->id,
                    'error' => $e->getMessage()
                ]);
            }
            
            // 11. Create in-app notification
            try {
                $notificationService = app(NotificationService::class);
                $notificationService->notifyCheckout($transaction);
            } catch (Exception $e) {
                Log::error('Failed to create checkout notification', [
                    'transaction_id' => $transaction->id,
                    'error' => $e->getMessage()
                ]);
            }
            
            return $transaction;
            
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
    
    /**
     * Return an item
     * 
     * @param int $transactionId Transaction to complete
     * @param string $condition Condition of returned item
     * @param string|null $notes Optional return notes
     * @return Transaction
     * @throws Exception
     */
    public function returnItem(
        int $transactionId,
        string $condition,
        ?string $notes = null
    ): Transaction {
        DB::beginTransaction();
        
        try {
            // 1. Find and validate transaction
            $transaction = Transaction::with(['item', 'user'])->findOrFail($transactionId);
            
            if ($transaction->status !== 'active' && $transaction->status !== 'overdue') {
                throw new Exception("Transaction is not active. Current status: {$transaction->status}");
            }
            
            // 2. Validate condition enum
            $validConditions = ['excellent', 'good', 'fair', 'poor', 'damaged'];
            if (!in_array($condition, $validConditions)) {
                throw new Exception("Invalid condition. Must be one of: " . implode(', ', $validConditions));
            }
            
            // 3. Mark transaction as returned
            $transaction->markAsReturned(
                condition: $condition,
                notes: $notes,
                returnedToUserId: Auth::id()
            );
            
            // 4. Update item status
            $item = $transaction->item;
            
            // If damaged, set to maintenance, otherwise available
            $newStatus = in_array($condition, ['poor', 'damaged']) ? 'maintenance' : 'available';
            
            $item->update([
                'status' => $newStatus,
                'current_holder_id' => null,
            ]);
            
            // 5. Log lifecycle event
            $statusNote = $transaction->status === 'late_return' 
                ? " (LATE - Fee: $" . number_format($transaction->late_fee, 2) . ")"
                : " (On time)";
                
            $item->lifecycleEvents()->create([
                'event_type' => 'Maintenance', // Using existing enum
                'event_date' => now(),
                'notes' => "Returned by {$transaction->user->name}. Condition: {$condition}" . $statusNote,
            ]);
            
            DB::commit();
            
            // 6. Reload relationships
            $transaction->refresh();
            $transaction->load(['item', 'user', 'returnedTo']);
            
            // 7. Send return confirmation email
            try {
                Mail::to($transaction->user->email)->send(new ReturnConfirmation($transaction));
                $transaction->update(['return_email_sent' => true]);
            } catch (Exception $e) {
                // Log email error but don't fail the transaction
                Log::error('Failed to send return confirmation email', [
                    'transaction_id' => $transaction->id,
                    'error' => $e->getMessage()
                ]);
            }
            
            // 8. Create in-app notification
            try {
                $notificationService = app(NotificationService::class);
                $notificationService->notifyReturn($transaction);
            } catch (Exception $e) {
                Log::error('Failed to create return notification', [
                    'transaction_id' => $transaction->id,
                    'error' => $e->getMessage()
                ]);
            }
            
            return $transaction;
            
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
    
    /**
     * Get active transactions for a user
     * 
     * @param int|null $userId User ID (null = current user)
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getActiveTransactions(?int $userId = null)
    {
        $userId = $userId ?? Auth::id();
        
        return Transaction::with(['item.category', 'item.vendor'])
            ->where('user_id', $userId)
            ->where('status', 'active')
            ->orderBy('due_date', 'asc')
            ->get();
    }
    
    /**
     * Get transaction history for a user
     * 
     * @param int|null $userId User ID (null = current user)
     * @param array $filters Optional filters (status, date_from, date_to)
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function getTransactionHistory(?int $userId = null, array $filters = [])
    {
        $userId = $userId ?? Auth::id();
        
        $query = Transaction::with(['item.category', 'checkedOutBy', 'returnedTo'])
            ->where('user_id', $userId);
        
        // Apply filters
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        
        if (isset($filters['date_from'])) {
            $query->where('checkout_date', '>=', $filters['date_from']);
        }
        
        if (isset($filters['date_to'])) {
            $query->where('checkout_date', '<=', $filters['date_to']);
        }
        
        return $query->orderBy('checkout_date', 'desc')
            ->paginate($filters['per_page'] ?? 15);
    }
    
    /**
     * Get all transactions (admin view)
     * 
     * @param array $filters
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function getAllTransactions(array $filters = [])
    {
        $query = Transaction::with(['item', 'user', 'checkedOutBy', 'returnedTo']);
        
        // Filter by status
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        
        // Filter by user
        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }
        
        // Filter by date range
        if (isset($filters['date_from'])) {
            $query->where('checkout_date', '>=', $filters['date_from']);
        }
        
        if (isset($filters['date_to'])) {
            $query->where('checkout_date', '<=', $filters['date_to']);
        }
        
        // Search by item name or user name
        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->whereHas('item', function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%");
            })->orWhereHas('user', function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%");
            });
        }
        
        return $query->orderBy('checkout_date', 'desc')
            ->paginate($filters['per_page'] ?? 20);
    }
    
    /**
     * Get overdue transactions
     * 
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getOverdueTransactions()
    {
        return Transaction::with(['item', 'user'])
            ->overdue()
            ->orderBy('due_date', 'asc')
            ->get();
    }
    
    /**
     * Update transaction status to overdue and send notifications (called by cron job)
     * 
     * @return array Statistics about processed transactions
     */
    public function updateOverdueStatus(): array
    {
        $overdueTransactions = Transaction::with(['user', 'item'])
            ->where('status', 'active')
            ->where('due_date', '<', now())
            ->where('overdue_reminder_sent', false) // Only send email once
            ->get();
        
        $updated = 0;
        $emailsSent = 0;
        $emailsFailed = 0;
        
        foreach ($overdueTransactions as $transaction) {
            // Update status to overdue
            $transaction->update(['status' => 'overdue']);
            $updated++;
            
            // Send overdue notification email
            try {
                Mail::to($transaction->user->email)->send(new OverdueNotification($transaction));
                $transaction->update(['overdue_reminder_sent' => true]);
                $emailsSent++;
            } catch (Exception $e) {
                Log::error('Failed to send overdue notification email', [
                    'transaction_id' => $transaction->id,
                    'user_id' => $transaction->user_id,
                    'error' => $e->getMessage()
                ]);
                $emailsFailed++;
            }
        }
        
        return [
            'transactions_updated' => $updated,
            'emails_sent' => $emailsSent,
            'emails_failed' => $emailsFailed,
        ];
    }
    
    /**
     * Calculate late fee for a transaction
     * 
     * @param int $transactionId
     * @param float $feePerDay Fee per day (default: $1)
     * @return float
     */
    public function calculateLateFee(int $transactionId, float $feePerDay = 1.0): float
    {
        $transaction = Transaction::findOrFail($transactionId);
        return $transaction->calculateLateFee($feePerDay);
    }
    
    /**
     * Mark late fee as paid
     * 
     * @param int $transactionId
     * @return Transaction
     */
    public function markLateFeeAsPaid(int $transactionId): Transaction
    {
        $transaction = Transaction::findOrFail($transactionId);
        $transaction->update(['late_fee_paid' => true]);
        return $transaction->fresh();
    }
    
    /**
     * Cancel a transaction (before item is picked up)
     * 
     * @param int $transactionId
     * @return Transaction
     * @throws Exception
     */
    public function cancelTransaction(int $transactionId): Transaction
    {
        DB::beginTransaction();
        
        try {
            $transaction = Transaction::with('item')->findOrFail($transactionId);
            
            if ($transaction->status !== 'active') {
                throw new Exception("Can only cancel active transactions");
            }
            
            // Update transaction
            $transaction->update(['status' => 'cancelled']);
            
            // Free up the item
            $transaction->item->update([
                'status' => 'available',
                'current_holder_id' => null,
            ]);
            
            DB::commit();
            
            return $transaction->fresh();
            
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
    
    /**
     * Extend due date for a transaction
     * 
     * @param int $transactionId
     * @param Carbon $newDueDate
     * @return Transaction
     * @throws Exception
     */
    public function extendDueDate(int $transactionId, Carbon $newDueDate): Transaction
    {
        $transaction = Transaction::findOrFail($transactionId);
        
        if (!in_array($transaction->status, ['active', 'overdue'])) {
            throw new Exception("Can only extend active or overdue transactions");
        }
        
        if ($newDueDate->isPast()) {
            throw new Exception("New due date must be in the future");
        }
        
        if ($newDueDate->isBefore($transaction->due_date)) {
            throw new Exception("New due date must be after current due date");
        }
        
        $transaction->update([
            'due_date' => $newDueDate,
            'status' => 'active', // Reset from overdue if extended
        ]);
        
        return $transaction->fresh();
    }
}
