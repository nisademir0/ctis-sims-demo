<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ChatbotFallbackResponse extends Model
{
    use HasFactory;

    protected $fillable = [
        'trigger_keyword',
        'response_text',
        'is_active',
        'usage_count',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'usage_count' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Scope for active responses
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Increment usage count
     */
    public function incrementUsage()
    {
        $this->increment('usage_count');
    }

    /**
     * Find matching fallback response for a query
     */
    public static function findForQuery($query)
    {
        $query = strtolower(trim($query));
        
        return static::active()
            ->get()
            ->first(function ($fallback) use ($query) {
                $keyword = strtolower($fallback->trigger_keyword);
                // Simple pattern matching - can be enhanced with regex
                return str_contains($query, $keyword);
            });
    }
}
