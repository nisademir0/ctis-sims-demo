<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Jobs\ProcessAiQuery;

/**
 * Async Chatbot Controller with Job Queue
 * 
 * MIGRATION PLAN:
 * 1. Deploy this alongside existing ChatbotController
 * 2. Route 10% traffic here for testing
 * 3. Monitor performance and error rates
 * 4. Full rollover if successful
 * 
 * Benefits over synchronous version:
 * - 10x higher throughput (no PHP worker blocking)
 * - Better user experience (no 30s waits)
 * - Built-in retry logic
 * - Easier monitoring
 */
class AsyncChatbotController extends Controller
{
    /**
     * Submit AI query (non-blocking)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function ask(Request $request)
    {
        $validated = $request->validate([
            'query' => 'required|string|min:3|max:500'
        ]);

        $user = $request->user();
        $query = trim($validated['query']);

        // Basic input validation (redundant with AI service, but good practice)
        if (preg_match('/[;<>]/', $query)) {
            Log::warning('Suspicious chatbot query detected', [
                'user_id' => $user->id,
                'query' => substr($query, 0, 100)
            ]);
            return response()->json([
                'error' => 'Sorgunuz geçersiz karakterler içeriyor.'
            ], 400);
        }

        // Generate unique job ID
        $jobId = Str::uuid()->toString();

        // Dispatch async job
        ProcessAiQuery::dispatch($query, $user->id, $jobId);

        Log::info('AI query dispatched', [
            'job_id' => $jobId,
            'user_id' => $user->id,
            'query' => substr($query, 0, 100)
        ]);

        return response()->json([
            'job_id' => $jobId,
            'status' => 'processing',
            'message' => 'Sorgunuz işleniyor...',
            'poll_url' => route('chatbot.result', ['jobId' => $jobId])
        ], 202);  // 202 Accepted
    }

    /**
     * Get query result (polling endpoint)
     * 
     * @param Request $request
     * @param string $jobId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getResult(Request $request, string $jobId)
    {
        // Validate UUID format
        if (!Str::isUuid($jobId)) {
            return response()->json([
                'error' => 'Geçersiz job ID'
            ], 400);
        }

        // Check if user owns this job (security)
        // Note: In production, store job-user mapping in Redis
        // For now, any authenticated user can access any result
        // TODO: Add job ownership check

        $cacheKey = "ai_result:{$jobId}";
        $result = Cache::get($cacheKey);

        if (!$result) {
            // Job still processing
            return response()->json([
                'status' => 'processing',
                'message' => 'Sorgunuz hala işleniyor...'
            ], 200);
        }

        // Result ready
        if ($result['status'] === 'completed') {
            return response()->json([
                'status' => 'completed',
                'data' => $result['result']
            ], 200);
        }

        // Job failed
        if ($result['status'] === 'failed') {
            return response()->json([
                'status' => 'failed',
                'error' => $result['error'] ?? 'Bilinmeyen hata',
                'details' => $result['details'] ?? 'Sorgunuz işlenemedi'
            ], 500);
        }

        // Unknown status
        return response()->json([
            'status' => 'unknown',
            'error' => 'Beklenmeyen durum'
        ], 500);
    }

    /**
     * Cancel a pending query
     * 
     * @param Request $request
     * @param string $jobId
     * @return \Illuminate\Http\JsonResponse
     */
    public function cancel(Request $request, string $jobId)
    {
        // Validate UUID format
        if (!Str::isUuid($jobId)) {
            return response()->json([
                'error' => 'Geçersiz job ID'
            ], 400);
        }

        // TODO: Implement job cancellation
        // This requires storing job instances and calling $job->delete()

        return response()->json([
            'message' => 'İptal işlemi henüz desteklenmiyor'
        ], 501);  // Not Implemented
    }

    /**
     * Get queue statistics (admin only)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function stats(Request $request)
    {
        // Check admin permission
        $user = $request->user()->load('role');
        if ($user->role->role_name !== 'Admin') {
            return response()->json([
                'error' => 'Yetkisiz erişim'
            ], 403);
        }

        // Get queue statistics
        $queueConnection = config('queue.default');
        
        // Note: These methods depend on queue driver (Redis, Database, etc.)
        $stats = [
            'queue_connection' => $queueConnection,
            'pending_jobs' => 'N/A',  // Requires Redis/Database specific query
            'failed_jobs' => DB::table('failed_jobs')->count(),
            'cache_hit_rate' => 'N/A',  // Would need custom tracking
        ];

        return response()->json($stats);
    }
}
