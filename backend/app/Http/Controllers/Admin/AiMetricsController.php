<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ChatbotQuery;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AiMetricsController extends Controller
{
    /**
     * Get AI performance metrics
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $days = $request->get('days', 7); // Default last 7 days
        $startDate = Carbon::now()->subDays($days);

        // Overall metrics
        $totalQueries = ChatbotQuery::where('created_at', '>=', $startDate)->count();
        $successfulQueries = ChatbotQuery::where('created_at', '>=', $startDate)
            ->where('was_successful', true)
            ->count();
        $failedQueries = $totalQueries - $successfulQueries;
        $successRate = $totalQueries > 0 ? round(($successfulQueries / $totalQueries) * 100, 2) : 0;

        // Average execution time
        $avgExecutionTime = ChatbotQuery::where('created_at', '>=', $startDate)
            ->where('was_successful', true)
            ->avg('execution_time_ms');
        $avgExecutionTime = round($avgExecutionTime ?? 0, 2);

        // Queries exceeding 3 second threshold (NFR-1.2)
        $slowQueries = ChatbotQuery::where('created_at', '>=', $startDate)
            ->where('execution_time_ms', '>', 3000)
            ->count();
        $slowQueryPercentage = $totalQueries > 0 ? round(($slowQueries / $totalQueries) * 100, 2) : 0;

        // Daily breakdown
        $dailyStats = ChatbotQuery::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as total_queries'),
                DB::raw('SUM(CASE WHEN was_successful = 1 THEN 1 ELSE 0 END) as successful_queries'),
                DB::raw('AVG(CASE WHEN was_successful = 1 THEN execution_time_ms ELSE NULL END) as avg_execution_time')
            )
            ->where('created_at', '>=', $startDate)
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get()
            ->map(function ($stat) {
                return [
                    'date' => $stat->date,
                    'total_queries' => (int) $stat->total_queries,
                    'successful_queries' => (int) $stat->successful_queries,
                    'success_rate' => $stat->total_queries > 0 
                        ? round(($stat->successful_queries / $stat->total_queries) * 100, 2) 
                        : 0,
                    'avg_execution_time' => round($stat->avg_execution_time ?? 0, 2),
                ];
            });

        // Slowest queries (top 10)
        $slowestQueries = ChatbotQuery::select('id', 'original_query', 'execution_time_ms', 'result_count', 'created_at')
            ->where('created_at', '>=', $startDate)
            ->where('was_successful', true)
            ->orderBy('execution_time_ms', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($query) {
                return [
                    'id' => $query->id,
                    'query' => $query->original_query,
                    'execution_time_ms' => $query->execution_time_ms,
                    'result_count' => $query->result_count,
                    'created_at' => $query->created_at->toISOString(),
                ];
            });

        // Query type distribution
        $queryTypeDistribution = ChatbotQuery::select('query_type', DB::raw('COUNT(*) as count'))
            ->where('created_at', '>=', $startDate)
            ->groupBy('query_type')
            ->get()
            ->map(function ($item) {
                return [
                    'type' => $item->query_type,
                    'count' => (int) $item->count,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'period' => [
                    'start_date' => $startDate->toDateString(),
                    'end_date' => Carbon::now()->toDateString(),
                    'days' => $days,
                ],
                'overview' => [
                    'total_queries' => $totalQueries,
                    'successful_queries' => $successfulQueries,
                    'failed_queries' => $failedQueries,
                    'success_rate' => $successRate,
                    'avg_execution_time_ms' => $avgExecutionTime,
                    'slow_queries_count' => $slowQueries,
                    'slow_query_percentage' => $slowQueryPercentage,
                ],
                'daily_stats' => $dailyStats,
                'slowest_queries' => $slowestQueries,
                'query_type_distribution' => $queryTypeDistribution,
            ],
        ], 200);
    }

    /**
     * Get real-time AI service health
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function health(Request $request)
    {
        // Get queries from last hour
        $lastHour = Carbon::now()->subHour();
        
        $recentQueries = ChatbotQuery::where('created_at', '>=', $lastHour)->count();
        $recentSuccessful = ChatbotQuery::where('created_at', '>=', $lastHour)
            ->where('was_successful', true)
            ->count();
        $recentAvgTime = ChatbotQuery::where('created_at', '>=', $lastHour)
            ->where('was_successful', true)
            ->avg('execution_time_ms');

        $health = 'healthy';
        if ($recentQueries > 0) {
            $recentSuccessRate = ($recentSuccessful / $recentQueries) * 100;
            if ($recentSuccessRate < 50) {
                $health = 'critical';
            } elseif ($recentSuccessRate < 80) {
                $health = 'warning';
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'status' => $health,
                'last_hour' => [
                    'total_queries' => $recentQueries,
                    'successful_queries' => $recentSuccessful,
                    'avg_execution_time_ms' => round($recentAvgTime ?? 0, 2),
                ],
                'timestamp' => Carbon::now()->toISOString(),
            ],
        ], 200);
    }
}
