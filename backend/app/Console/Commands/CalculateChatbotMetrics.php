<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ChatbotQuery;
use App\Models\ChatbotFeedback;
use App\Models\ChatbotAccuracyMetric;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class CalculateChatbotMetrics extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'chatbot:calculate-metrics 
                            {--date= : The date to calculate metrics for (YYYY-MM-DD). Defaults to yesterday.}
                            {--recalculate : Recalculate metrics even if they already exist}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Calculate daily chatbot accuracy metrics and store them in the database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $date = $this->option('date') 
            ? Carbon::parse($this->option('date'))->startOfDay()
            : Carbon::yesterday()->startOfDay();
        
        $recalculate = $this->option('recalculate');

        $this->info("Calculating chatbot metrics for: {$date->toDateString()}");

        // Check if metrics already exist
        $existingMetric = ChatbotAccuracyMetric::where('date', $date->toDateString())->first();
        
        if ($existingMetric && !$recalculate) {
            $this->warn("Metrics already exist for {$date->toDateString()}. Use --recalculate to override.");
            return Command::SUCCESS;
        }

        // Calculate metrics
        $startOfDay = $date->startOfDay();
        $endOfDay = $date->copy()->endOfDay();

        // Query statistics
        $totalQueries = ChatbotQuery::whereBetween('created_at', [$startOfDay, $endOfDay])->count();
        $successfulQueries = ChatbotQuery::whereBetween('created_at', [$startOfDay, $endOfDay])
            ->where('was_successful', true)
            ->count();
        $failedQueries = $totalQueries - $successfulQueries;
        
        $avgExecutionTime = ChatbotQuery::whereBetween('created_at', [$startOfDay, $endOfDay])
            ->avg('execution_time_ms') ?? 0;

        // Feedback statistics
        $feedbackQuery = ChatbotFeedback::whereHas('chatbotQuery', function ($query) use ($startOfDay, $endOfDay) {
            $query->whereBetween('created_at', [$startOfDay, $endOfDay]);
        });

        $helpfulCount = $feedbackQuery->clone()->where('was_helpful', true)->count();
        $unhelpfulCount = $feedbackQuery->clone()->where('was_helpful', false)->count();
        
        $avgAccuracyRating = $feedbackQuery->clone()
            ->whereNotNull('accuracy_rating')
            ->avg('accuracy_rating') ?? 0;

        // Store or update metrics
        $metricData = [
            'date' => $date->toDateString(),
            'total_queries' => $totalQueries,
            'successful_queries' => $successfulQueries,
            'failed_queries' => $failedQueries,
            'average_execution_time_ms' => round($avgExecutionTime, 2),
            'average_accuracy_rating' => round($avgAccuracyRating, 2),
            'helpful_count' => $helpfulCount,
            'unhelpful_count' => $unhelpfulCount,
        ];

        if ($existingMetric) {
            $existingMetric->update($metricData);
            $this->info("✅ Metrics updated for {$date->toDateString()}");
        } else {
            ChatbotAccuracyMetric::create($metricData);
            $this->info("✅ Metrics created for {$date->toDateString()}");
        }

        // Display summary
        $this->table(
            ['Metric', 'Value'],
            [
                ['Total Queries', $totalQueries],
                ['Successful Queries', $successfulQueries],
                ['Failed Queries', $failedQueries],
                ['Success Rate', $totalQueries > 0 ? round(($successfulQueries / $totalQueries) * 100, 2) . '%' : '0%'],
                ['Avg Execution Time', round($avgExecutionTime, 2) . ' ms'],
                ['Helpful Feedback', $helpfulCount],
                ['Unhelpful Feedback', $unhelpfulCount],
                ['Avg Accuracy Rating', round($avgAccuracyRating, 2) . '/5'],
            ]
        );

        return Command::SUCCESS;
    }
}
