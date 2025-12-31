<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Purchase Request Model
 * 
 * CB-7: Purchase request system for inventory replenishment
 * Workflow: pending → approved/rejected → ordered → received
 */
class PurchaseRequest extends Model
{
    use HasFactory;
    protected $fillable = [
        'item_name',
        'description',
        'category',
        'quantity',
        'estimated_cost',
        'justification',
        'requested_by',
        'approved_by',
        'reviewed_by',
        'status',
        'priority',
        'rejection_reason',
        'needed_by_date',
        'approved_cost',
        'actual_cost',
        'vendor',
        'vendor_id',
        'actual_quantity',
        'approved_date',
        'ordered_date',
        'received_date',
        'expected_delivery_date',
        'notes'
    ];

    protected $casts = [
        'estimated_cost' => 'decimal:2',
        'approved_cost' => 'decimal:2',
        'actual_cost' => 'decimal:2',
        'needed_by_date' => 'date',
        'expected_delivery_date' => 'date',
        'approved_date' => 'datetime',
        'ordered_date' => 'datetime',
        'received_date' => 'datetime'
    ];

    /**
     * Relationships
     */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Scopes
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeOrdered($query)
    {
        return $query->where('status', 'ordered');
    }

    public function scopeReceived($query)
    {
        return $query->where('status', 'received');
    }

    /**
     * Check if request can be approved
     */
    public function canBeApproved(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if request can be ordered
     */
    public function canBeOrdered(): bool
    {
        return $this->status === 'approved';
    }

    /**
     * Check if request can be marked as received
     */
    public function canBeReceived(): bool
    {
        return $this->status === 'ordered';
    }
}
