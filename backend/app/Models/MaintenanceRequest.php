<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Maintenance Request Model
 * 
 * CB-8: Damaged returns automatically create maintenance requests
 * CB-10: Maintenance types: hardware_failure, software_issue, routine_cleaning, consumable_replacement
 */
class MaintenanceRequest extends Model
{
    use HasFactory;
    protected $fillable = [
        'item_id',
        'requested_by',
        'assigned_to',
        'transaction_id',
        'maintenance_type',
        'priority',
        'status',
        'description',
        'resolution_notes',
        'cost',
        'scheduled_date',
        'completed_date',
        // SLA tracking fields
        'sla_hours',
        'sla_due_date',
        'resolution_target',
        'first_response_at',
        'resolved_at',
        'sla_breached',
        'sla_breach_reason',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'completed_date' => 'date',
        'cost' => 'decimal:2',
        'sla_due_date' => 'datetime',
        'resolution_target' => 'datetime',
        'first_response_at' => 'datetime',
        'resolved_at' => 'datetime',
        'sla_breached' => 'boolean',
    ];

    /**
     * Relationships
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }
}
