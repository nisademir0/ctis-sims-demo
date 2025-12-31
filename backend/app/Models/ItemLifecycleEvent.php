<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemLifecycleEvent extends Model
{
    protected $table = 'item_lifecycle_events';

    protected $fillable = [
        'item_id',
        'event_type',
        'event_date',
        'notes'
    ];

    protected $casts = [
        'event_date' => 'date',
    ];

    /**
     * Get the item that owns the lifecycle event
     */
    public function item()
    {
        return $this->belongsTo(Item::class, 'item_id');
    }

    /**
     * Scope to get events by type
     */
    public function scopeByType($query, $type)
    {
        return $query->where('event_type', $type);
    }

    /**
     * Scope to get recent events
     */
    public function scopeRecent($query, $limit = 10)
    {
        return $query->orderBy('event_date', 'desc')->limit($limit);
    }
}
