<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ChatbotQuery extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'original_query',
        'translated_query',
        'generated_sql',
        'sql_executed',
        'query_type',
        'execution_time_ms',
        'result_count',
        'was_successful',
        'used_fallback',
        'fallback_response_id',
        'error_message',
        'model_used',
    ];

    protected $casts = [
        'sql_executed' => 'boolean',
        'execution_time_ms' => 'integer',
        'result_count' => 'integer',
        'was_successful' => 'boolean',
        'used_fallback' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Attributes to append to the model's array form
     */
    protected $appends = [
        'query_text',
        'response_text',
        'response_time_ms',
        'is_fallback',
        'confidence',
    ];

    /**
     * Get the user that made the query
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the feedback for this query
     */
    public function feedback()
    {
        return $this->hasOne(ChatbotFeedback::class);
    }

    /**
     * Scope for successful queries
     */
    public function scopeSuccessful($query)
    {
        return $query->where('was_successful', true);
    }

    /**
     * Scope for failed queries
     */
    public function scopeFailed($query)
    {
        return $query->where('was_successful', false);
    }

    /**
     * Scope for queries within a date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * Scope for queries by type
     */
    public function scopeByType($query, $type)
    {
        return $query->where('query_type', $type);
    }

    /**
     * Get query_text accessor (frontend compatibility)
     */
    public function getQueryTextAttribute()
    {
        return $this->original_query;
    }

    /**
     * Get response_text accessor (placeholder for now)
     */
    public function getResponseTextAttribute()
    {
        if ($this->was_successful) {
            return "Sorgunuz başarıyla işlendi. {$this->result_count} sonuç bulundu.";
        }
        return $this->error_message ?? 'Yanıt alınamadı.';
    }

    /**
     * Get response_time_ms accessor (frontend compatibility)
     */
    public function getResponseTimeMsAttribute()
    {
        return $this->execution_time_ms;
    }

    /**
     * Get is_fallback accessor
     */
    public function getIsFallbackAttribute()
    {
        return (bool) $this->used_fallback;
    }

    /**
     * Get confidence accessor
     */
    public function getConfidenceAttribute()
    {
        // Calculate confidence based on success and execution time
        if (!$this->was_successful) {
            return 0;
        }
        
        // Higher confidence for faster queries with results
        if ($this->result_count > 0 && $this->execution_time_ms < 1000) {
            return 0.9;
        } elseif ($this->result_count > 0) {
            return 0.75;
        } elseif ($this->execution_time_ms < 1000) {
            return 0.6;
        }
        
        return 0.5;
    }
}
