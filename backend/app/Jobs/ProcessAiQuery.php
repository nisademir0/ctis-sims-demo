<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\Models\AiLog;

/**
 * Async AI Query Processing Job
 * 
 * Benefits:
 * - Non-blocking: PHP workers don't wait for slow AI responses
 * - Scalable: Can handle 10x more concurrent users
 * - Resilient: Built-in retry mechanism
 * - Observable: Easy to monitor queue depth
 * 
 * Usage:
 *   ProcessAiQuery::dispatch($query, $userId, $jobId);
 */
class ProcessAiQuery implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Maximum attempts before giving up
     */
    public $tries = 3;

    /**
     * Timeout for this job (seconds)
     */
    public $timeout = 90;

    /**
     * Delay between retries (seconds)
     */
    public $backoff = [5, 15, 30];

    /**
     * Job data
     */
    public function __construct(
        public string $query,
        public int $userId,
        public string $jobId
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $startTime = microtime(true);
        $aiServiceUrl = env('AI_SERVICE_URL', 'http://ai-service:8001');

        Log::info("Processing AI query job", [
            'job_id' => $this->jobId,
            'user_id' => $this->userId,
            'query' => $this->query,
            'attempt' => $this->attempts()
        ]);

        try {
            // Call AI service
            $response = Http::timeout(60)
                ->retry(2, 100)  // 2 retries with 100ms delay
                ->post("{$aiServiceUrl}/ask", [
                    'query' => $this->query
                ]);

            $duration = round((microtime(true) - $startTime) * 1000, 2);

            if ($response->successful()) {
                $result = $response->json();
                
                // Add metadata
                $result['query_metadata'] = [
                    'duration_ms' => $duration,
                    'timestamp' => now()->toIso8601String(),
                    'job_id' => $this->jobId,
                    'attempt' => $this->attempts()
                ];

                // Store result in cache (10 minute TTL)
                Cache::put(
                    "ai_result:{$this->jobId}",
                    [
                        'status' => 'completed',
                        'result' => $result
                    ],
                    now()->addMinutes(10)
                );

                // Log success
                AiLog::create([
                    'user_id' => $this->userId,
                    'action_description' => "AI Query Success: '{$this->query}' | SQL: " . 
                        ($result['sql'] ?? 'N/A') . " | Duration: {$duration}ms | Results: " . 
                        ($result['result_count'] ?? 0),
                    'timestamp' => now()
                ]);

                Log::info("AI query completed successfully", [
                    'job_id' => $this->jobId,
                    'duration_ms' => $duration,
                    'result_count' => $result['result_count'] ?? 0
                ]);

            } else {
                // AI service returned error
                $this->handleFailure(
                    "AI Service Error (Status: {$response->status()})",
                    $response->body(),
                    $duration
                );
            }

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            // Connection failure - retry if attempts left
            $this->handleFailure(
                'AI Service Connection Failed',
                $e->getMessage(),
                null,
                true  // Should retry
            );

        } catch (\Exception $e) {
            // Unexpected error
            $this->handleFailure(
                'Unexpected Error',
                $e->getMessage(),
                null,
                false  // Don't retry on unexpected errors
            );
        }
    }

    /**
     * Handle job failure
     */
    private function handleFailure(
        string $errorType,
        string $errorDetails,
        ?float $duration,
        bool $shouldRetry = false
    ): void {
        Log::error("AI query job failed", [
            'job_id' => $this->jobId,
            'user_id' => $this->userId,
            'error_type' => $errorType,
            'error_details' => $errorDetails,
            'attempt' => $this->attempts(),
            'will_retry' => $shouldRetry && $this->attempts() < $this->tries
        ]);

        // If no retries left, store error in cache
        if (!$shouldRetry || $this->attempts() >= $this->tries) {
            Cache::put(
                "ai_result:{$this->jobId}",
                [
                    'status' => 'failed',
                    'error' => $errorType,
                    'details' => 'Sorgunuz işlenirken bir hata oluştu. Lütfen tekrar deneyin.',
                    'attempt' => $this->attempts()
                ],
                now()->addMinutes(10)
            );

            // Log to database
            AiLog::create([
                'user_id' => $this->userId,
                'action_description' => "AI Query Failed: '{$this->query}' | Error: {$errorType} | Duration: " . 
                    ($duration ? "{$duration}ms" : 'N/A'),
                'timestamp' => now()
            ]);
        }

        // Re-throw to trigger retry mechanism
        if ($shouldRetry) {
            throw new \Exception($errorType . ': ' . $errorDetails);
        }
    }

    /**
     * Handle job failure after all retries exhausted
     */
    public function failed(\Throwable $exception): void
    {
        Log::critical("AI query job failed permanently", [
            'job_id' => $this->jobId,
            'user_id' => $this->userId,
            'query' => $this->query,
            'exception' => $exception->getMessage(),
            'attempts' => $this->attempts()
        ]);

        // Ensure error is stored in cache
        Cache::put(
            "ai_result:{$this->jobId}",
            [
                'status' => 'failed',
                'error' => 'Sorgunuz işlenemedi',
                'details' => 'AI servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
                'attempts' => $this->attempts()
            ],
            now()->addMinutes(10)
        );

        // Final failure log
        AiLog::create([
            'user_id' => $this->userId,
            'action_description' => "AI Query PERMANENT FAILURE: '{$this->query}' | Attempts: {$this->attempts()}",
            'timestamp' => now()
        ]);
    }
}
