<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ChatbotAccuracyMetric extends Model
{
    use HasFactory;

    protected $fillable = [
        'metric_date',
        'total_queries',
        'successful_queries',
        'failed_queries',
        'average_execution_time_ms',
        'average_accuracy_rating',
        'helpful_count',
        'unhelpful_count',
    ];

    protected $casts = [
        'metric_date' => 'date',
        'total_queries' => 'integer',
        'successful_queries' => 'integer',
        'failed_queries' => 'integer',
        'average_execution_time_ms' => 'float',
        'average_accuracy_rating' => 'float',
        'helpful_count' => 'integer',
        'unhelpful_count' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Append accessor attributes
     */
    protected $appends = ['avg_response_time_ms'];

    /**
     * Get success rate as percentage
     */
    public function getSuccessRateAttribute()
    {
        if ($this->total_queries === 0) {
            return 0;
        }
        return round(($this->successful_queries / $this->total_queries) * 100, 2);
    }

    /**
     * Get helpfulness rate as percentage
     */
    public function getHelpfulnessRateAttribute()
    {
        $total_feedback = $this->helpful_count + $this->unhelpful_count;
        if ($total_feedback === 0) {
            return 0;
        }
        return round(($this->helpful_count / $total_feedback) * 100, 2);
    }

    /**
     * Scope for metrics within a date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('metric_date', [$startDate, $endDate]);
    }

    /**
     * Get avg_response_time_ms accessor (frontend compatibility)
     */
    public function getAvgResponseTimeMsAttribute()
    {
        return $this->average_execution_time_ms;
    }
}
