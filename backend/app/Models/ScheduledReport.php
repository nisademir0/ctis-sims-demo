<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class ScheduledReport extends Model
{
    protected $fillable = [
        'created_by',
        'name',
        'report_type',
        'frequency',
        'filters',
        'format',
        'recipients',
        'scheduled_time',
        'day_of_week',
        'day_of_month',
        'last_run_at',
        'next_run_at',
        'is_active',
    ];

    protected $casts = [
        'filters' => 'array',
        'recipients' => 'array',
        'last_run_at' => 'datetime',
        'next_run_at' => 'datetime',
        'is_active' => 'boolean',
        'scheduled_time' => 'datetime',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Calculate next run time based on frequency
     */
    public function calculateNextRun(): Carbon
    {
        $now = Carbon::now();
        $time = Carbon::parse($this->scheduled_time);

        switch ($this->frequency) {
            case 'daily':
                $next = Carbon::today()->setTime($time->hour, $time->minute);
                if ($next->isPast()) {
                    $next->addDay();
                }
                break;

            case 'weekly':
                $dayOfWeek = $this->day_of_week ?? 1; // Default to Monday
                $next = Carbon::now()->next($dayOfWeek)->setTime($time->hour, $time->minute);
                break;

            case 'monthly':
                $dayOfMonth = $this->day_of_month ?? 1;
                $next = Carbon::now()->day($dayOfMonth)->setTime($time->hour, $time->minute);
                if ($next->isPast()) {
                    $next->addMonth();
                }
                break;

            default:
                $next = Carbon::now()->addWeek();
        }

        return $next;
    }

    /**
     * Scope for due reports
     */
    public function scopeDue($query)
    {
        return $query->where('is_active', true)
            ->where('next_run_at', '<=', Carbon::now());
    }
}
