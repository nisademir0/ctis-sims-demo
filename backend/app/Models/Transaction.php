<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    protected $table = 'transactions';

    protected $fillable = [
        'item_id',
        'user_id',
        'checkout_date',
        'due_date',
        'return_date',
        'notes',
        'status',
        'late_fee',
        'late_fee_paid',
        'return_condition',
        'return_notes',
        'checked_out_by',
        'returned_to',
        'checkout_email_sent',
        'due_reminder_sent',
        'overdue_reminder_sent',
        'return_email_sent'
    ];

    protected $casts = [
        'checkout_date' => 'datetime',
        'due_date' => 'datetime',
        'return_date' => 'datetime',
        'late_fee' => 'decimal:2',
        'late_fee_paid' => 'boolean',
        'checkout_email_sent' => 'boolean',
        'due_reminder_sent' => 'boolean',
        'overdue_reminder_sent' => 'boolean',
        'return_email_sent' => 'boolean',
    ];

    /**
     * Get the item that was transacted
     */
    public function item()
    {
        return $this->belongsTo(Item::class, 'item_id');
    }

    /**
     * Get the user who borrowed the item
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the admin who checked out the item
     */
    public function checkedOutBy()
    {
        return $this->belongsTo(User::class, 'checked_out_by');
    }

    /**
     * Get the admin who received the return
     */
    public function returnedTo()
    {
        return $this->belongsTo(User::class, 'returned_to');
    }

    /**
     * Scope to get active transactions (status = active)
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope to get completed transactions (status = returned or late_return)
     */
    public function scopeCompleted($query)
    {
        return $query->whereIn('status', ['returned', 'late_return']);
    }

    /**
     * Scope to get overdue transactions
     */
    public function scopeOverdue($query)
    {
        return $query->where('status', 'active')
            ->where('due_date', '<', now());
    }

    /**
     * Check if transaction is overdue
     */
    public function isOverdue(): bool
    {
        return $this->status === 'active' 
            && $this->due_date 
            && $this->due_date->isPast();
    }

    /**
     * Calculate days overdue
     * For late returns, calculate using return_date
     * For active overdue, calculate using current date
     */
    public function daysOverdue(): int
    {
        // If returned late, calculate days between due_date and return_date
        if ($this->status === 'late_return' && $this->return_date && $this->due_date) {
            // Calculate from due_date to return_date (positive value)
            return (int) abs($this->due_date->diffInDays($this->return_date, false));
        }
        
        // For active overdue items, calculate from current time
        if (!$this->isOverdue()) {
            return 0;
        }
        return (int) abs($this->due_date->diffInDays(now(), false));
    }

    /**
     * Calculate late fee based on days overdue
     * Default: $1 per day
     */
    public function calculateLateFee(float $feePerDay = 1.0): float
    {
        return $this->daysOverdue() * $feePerDay;
    }

    /**
     * Mark as returned
     */
    public function markAsReturned(
        string $condition,
        ?string $notes = null,
        ?int $returnedToUserId = null
    ): void {
        $this->return_date = now();
        $this->return_condition = $condition;
        $this->return_notes = $notes;
        $this->returned_to = $returnedToUserId;
        
        // Determine status based on due date
        if ($this->due_date && now()->isAfter($this->due_date)) {
            $this->status = 'late_return';
            $this->late_fee = $this->calculateLateFee();
        } else {
            $this->status = 'returned';
        }
        
        $this->save();
    }
}
