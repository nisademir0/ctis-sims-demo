<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * AI Service Integration
 * Handles communication with the AI microservice
 */
class AiService
{
    protected string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = config('services.ai.url', 'http://ai-service:5000');
    }

    /**
     * Query the AI service
     */
    public function query(string $query): array
    {
        try {
            $response = Http::timeout(30)->post("{$this->baseUrl}/ask", [
                'query' => $query,
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('AI Service query failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [
                'error' => true,
                'message' => 'AI service unavailable',
            ];
        } catch (\Exception $e) {
            Log::error('AI Service exception', [
                'message' => $e->getMessage(),
            ]);

            return [
                'error' => true,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Clear AI cache (e.g., after data changes)
     */
    public function clearCache(): bool
    {
        try {
            $response = Http::timeout(5)->post("{$this->baseUrl}/cache/clear");
            return $response->successful();
        } catch (\Exception $e) {
            Log::warning('Failed to clear AI cache', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Invalidate cache entries matching a pattern
     * Useful for targeted cache invalidation
     */
    public function invalidateCache(string $pattern): bool
    {
        try {
            $response = Http::timeout(5)->post("{$this->baseUrl}/cache/invalidate", [
                'pattern' => $pattern,
            ]);
            return $response->successful();
        } catch (\Exception $e) {
            Log::warning('Failed to invalidate AI cache', [
                'pattern' => $pattern,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Get cache statistics
     */
    public function getCacheStats(): ?array
    {
        try {
            $response = Http::timeout(5)->get("{$this->baseUrl}/cache/stats");
            return $response->successful() ? $response->json() : null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Health check
     */
    public function health(): array
    {
        try {
            $response = Http::timeout(5)->get("{$this->baseUrl}/health");
            return $response->successful() ? $response->json() : ['status' => 'unhealthy'];
        } catch (\Exception $e) {
            return ['status' => 'unreachable', 'error' => $e->getMessage()];
        }
    }
}
