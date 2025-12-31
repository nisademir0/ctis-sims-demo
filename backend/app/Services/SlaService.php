<?php

namespace App\Services;

use App\Models\MaintenanceRequest;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class SlaService
{
    // SLA response times in hours based on priority
    const SLA_RESPONSE_TIMES = [
        'urgent' => 2,     // 2 hours
        'high' => 4,       // 4 hours
        'medium' => 24,    // 24 hours (1 day)
        'low' => 72,       // 72 hours (3 days)
    ];

    // SLA resolution times in hours based on priority
    const SLA_RESOLUTION_TIMES = [
        'urgent' => 8,     // 8 hours
        'high' => 24,      // 24 hours (1 day)
        'medium' => 72,    // 72 hours (3 days)
        'low' => 168,      // 168 hours (7 days)
    ];

    /**
     * Calculate and set SLA due date when maintenance request is created
     */
    public function setSlaForRequest(MaintenanceRequest $request): MaintenanceRequest
    {
        $priority = $request->priority;
        $slaHours = self::SLA_RESPONSE_TIMES[$priority] ?? self::SLA_RESPONSE_TIMES['medium'];
        
        $request->sla_hours = $slaHours;
        $request->sla_due_date = Carbon::now()->addHours($slaHours);
        $request->resolution_target = Carbon::now()->addHours(self::SLA_RESOLUTION_TIMES[$priority] ?? 72);
        $request->save();
        
        return $request;
    }

    /**
     * Mark first response when status changes from pending
     */
    public function recordFirstResponse(MaintenanceRequest $request): void
    {
        if (!$request->first_response_at && $request->status !== 'pending') {
            $request->update([
                'first_response_at' => Carbon::now(),
            ]);

            // Check if SLA was breached
            if (Carbon::now()->gt($request->sla_due_date)) {
                $this->markSlaBreached($request, 'First response exceeded SLA target');
            }
        }
    }

    /**
     * Mark request as resolved and check resolution SLA
     */
    public function recordResolution(MaintenanceRequest $request): void
    {
        if ($request->status === 'completed' && !$request->resolved_at) {
            $resolvedAt = Carbon::now();
            
            $request->update([
                'resolved_at' => $resolvedAt,
            ]);

            // Check if resolution SLA was breached
            if ($request->resolution_target && $resolvedAt->gt($request->resolution_target)) {
                $this->markSlaBreached($request, 'Resolution exceeded SLA target');
            }
        }
    }

    /**
     * Mark SLA as breached with reason
     */
    public function markSlaBreached(MaintenanceRequest $request, string $reason): void
    {
        if (!$request->sla_breached) {
            $request->update([
                'sla_breached' => true,
                'sla_breach_reason' => $reason,
            ]);

            Log::warning('SLA breached for maintenance request', [
                'request_id' => $request->id,
                'priority' => $request->priority,
                'reason' => $reason,
                'sla_due_date' => $request->sla_due_date,
                'current_time' => Carbon::now(),
            ]);
        }
    }

    /**
     * Check all pending/in-progress requests for SLA breaches
     */
    public function checkSlaBreaches(): int
    {
        $breachedCount = 0;

        // Check pending requests with overdue first response
        $pendingRequests = MaintenanceRequest::where('status', 'pending')
            ->where('sla_breached', false)
            ->whereNotNull('sla_due_date')
            ->where('sla_due_date', '<', Carbon::now())
            ->get();

        foreach ($pendingRequests as $request) {
            $this->markSlaBreached($request, 'First response SLA exceeded');
            $breachedCount++;
        }

        // Check in-progress requests with overdue resolution
        $inProgressRequests = MaintenanceRequest::where('status', 'in_progress')
            ->where('sla_breached', false)
            ->whereNotNull('resolution_target')
            ->where('resolution_target', '<', Carbon::now())
            ->get();

        foreach ($inProgressRequests as $request) {
            $this->markSlaBreached($request, 'Resolution SLA exceeded');
            $breachedCount++;
        }

        return $breachedCount;
    }

    /**
     * Get SLA statistics
     */
    public function getSlaStatistics(): array
    {
        $totalRequests = MaintenanceRequest::count();
        $breachedRequests = MaintenanceRequest::where('sla_breached', true)->count();
        $pendingAtRisk = MaintenanceRequest::where('status', 'pending')
            ->whereNotNull('sla_due_date')
            ->where('sla_due_date', '<', Carbon::now()->addHours(2))
            ->where('sla_due_date', '>', Carbon::now())
            ->count();

        $averageResponseTime = MaintenanceRequest::whereNotNull('first_response_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(HOUR, created_at, first_response_at)) as avg_hours')
            ->first()
            ->avg_hours;

        $averageResolutionTime = MaintenanceRequest::whereNotNull('resolved_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at)) as avg_hours')
            ->first()
            ->avg_hours;

        $compliantRequests = $totalRequests - $breachedRequests;
        
        return [
            'total_requests' => $totalRequests,
            'sla_compliant' => $compliantRequests,
            'sla_breached' => $breachedRequests,
            'breached_count' => $breachedRequests,
            'breach_rate' => $totalRequests > 0 ? round(($breachedRequests / $totalRequests) * 100, 2) : 0,
            'at_risk_count' => $pendingAtRisk,
            'average_response_hours' => round($averageResponseTime ?? 0, 2),
            'average_resolution_hours' => round($averageResolutionTime ?? 0, 2),
            'compliance_rate' => $totalRequests > 0 ? round((($totalRequests - $breachedRequests) / $totalRequests) * 100, 2) : 100,
        ];
    }

    /**
     * Get time remaining until SLA breach
     */
    public function getTimeRemaining(MaintenanceRequest $request): ?array
    {
        if (!$request->sla_due_date) {
            return null;
        }

        $now = Carbon::now();
        $dueDate = Carbon::parse($request->sla_due_date);

        if ($now->gt($dueDate)) {
            $diff = $now->diff($dueDate);
            return [
                'status' => 'breached',
                'hours' => -($diff->days * 24 + $diff->h),
                'minutes' => -$diff->i,
                'is_overdue' => true,
                'formatted' => 'Overdue by ' . $diff->days . 'd ' . $diff->h . 'h ' . $diff->i . 'm',
            ];
        }

        $diff = $dueDate->diff($now);
        $totalHours = $diff->days * 24 + $diff->h;

        return [
            'status' => $totalHours <= 2 ? 'critical' : ($totalHours <= 4 ? 'warning' : 'normal'),
            'hours' => $totalHours,
            'minutes' => $diff->i,
            'is_overdue' => false,
            'formatted' => $diff->days . 'd ' . $diff->h . 'h ' . $diff->i . 'm remaining',
        ];
    }
}
