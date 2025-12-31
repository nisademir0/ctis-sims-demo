<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Item extends Model
{
    use HasFactory, SoftDeletes;
    
    protected $table = 'items';

    protected $fillable = [
        'inventory_number',
        'name',
        'category_id',
        'vendor_id',
        'location',
        'status',
        'condition_status',        // SRS FR-2.9
        'acquisition_method',      // SRS FR-2.8
        'specifications',
        'current_holder_id',
        'is_active',
        'purchase_date',
        'purchase_value',          // SRS FR-2.10
        'current_value',           // SRS FR-2.10
        'warranty_expiry_date',
        'warranty_period_months',  // SRS FR-2.7
        'depreciation_method'      // SRS FR-2.10
    ];

    protected $casts = [
        'specifications' => 'array',
        'is_active' => 'boolean',
        'purchase_date' => 'date',
        'warranty_expiry_date' => 'date',
        'purchase_value' => 'decimal:2',
        'current_value' => 'decimal:2',
        'deleted_at' => 'datetime'
    ];

    /**
     * Get the category that owns the item
     */
    public function category() 
    { 
        return $this->belongsTo(Category::class, 'category_id'); 
    }

    /**
     * Get the current holder of the item
     */
    public function holder() 
    { 
        return $this->belongsTo(User::class, 'current_holder_id'); 
    }

    /**
     * Get the vendor that supplied the item
     */
    public function vendor() 
    { 
        return $this->belongsTo(Vendor::class, 'vendor_id'); 
    }

    /**
     * Get all transactions for this item
     */
    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'item_id');
    }

    /**
     * Get lifecycle events for this item
     */
    public function lifecycleEvents()
    {
        return $this->hasMany(ItemLifecycleEvent::class, 'item_id');
    }

    /**
     * Scope to get only active items
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }
}
