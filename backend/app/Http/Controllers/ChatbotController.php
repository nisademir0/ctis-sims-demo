<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\AiLog;
use App\Models\ChatbotQuery;
use App\Models\ChatbotFeedback;
use App\Models\ChatbotAccuracyMetric;
use App\Models\ChatbotFallbackResponse;
use Carbon\Carbon;

class ChatbotController extends Controller
{
    /**
     * Process a chatbot query with enhanced tracking and fallback handling
     */
    public function ask(Request $request)
    {
        $validated = $request->validate([
            'query' => 'required|string|min:3|max:1000'
        ]);

        $user = $request->user();
        $query = trim($validated['query']);

        // Sanitize input - prevent potential injection attempts
        if (preg_match('/[;<>]/', $query)) {
            Log::warning('Suspicious chatbot query detected', [
                'user_id' => $user->id,
                'query' => $query
            ]);
            return response()->json([
                'error' => 'Sorgunuz geçersiz karakterler içeriyor.'
            ], 400);
        }

        // Detect query type for analytics
        $queryType = $this->detectQueryType($query);

        // Docker ağı üzerinden Python servisine erişim (http://ai-service:8001)
        $aiServiceUrl = env('AI_SERVICE_URL', 'http://ai-service:8001');

        try {
            $startTime = microtime(true);
            
            $response = Http::timeout(60)->post("$aiServiceUrl/ask", [
                'query' => $query
            ]);

            $duration = round((microtime(true) - $startTime) * 1000, 2); // ms

            if ($response->successful()) {
                $result = $response->json();
                
                Log::info('ChatbotController: AI Service Response', [
                    'has_results' => isset($result['results']),
                    'result_count' => $result['result_count'] ?? 0,
                    'results_type' => gettype($result['results'] ?? null),
                    'results_count' => is_array($result['results'] ?? null) ? count($result['results']) : 'not-array'
                ]);
                
                // Format results into a human-readable response
                $formattedResponse = $this->formatQueryResults($result);
                
                // Store query details for analytics
                $chatbotQuery = ChatbotQuery::create([
                    'user_id' => $user->id,
                    'original_query' => $query,
                    'translated_query' => $result['translated_query'] ?? null,
                    'generated_sql' => $result['sql'] ?? null,
                    'sql_executed' => isset($result['sql']) && !empty($result['sql']),
                    'query_type' => $queryType,
                    'execution_time_ms' => $duration,
                    'result_count' => $result['result_count'] ?? 0,
                    'was_successful' => true,
                    'model_used' => $result['model'] ?? 'unknown',
                ]);

                // Log successful query (legacy logging) - Keep it short
                AiLog::create([
                    'user_id' => $user->id,
                    'action_description' => "Chatbot: '{$query}' | {$duration}ms | {$result['result_count']} results",
                    'timestamp' => now()
                ]);

                // Add formatted response and metadata
                $result['response'] = $formattedResponse;
                $result['query_id'] = $chatbotQuery->id;
                
                // Add structured table data for frontend rendering
                $result['tables'] = [];
                if (!empty($result['results']) && is_array($result['results'])) {
                    Log::info('ChatbotController: Creating tables array', [
                        'results_count' => count($result['results']),
                        'first_result' => $result['results'][0] ?? null
                    ]);
                    $result['tables'][] = [
                        'headers' => !empty($result['results'][0]) ? array_keys($result['results'][0]) : [],
                        'rows' => $result['results'],
                        'total_count' => $result['result_count'] ?? count($result['results']),
                        'column_types' => $this->detectColumnTypes($result['results'])
                    ];
                } else {
                    Log::warning('ChatbotController: No results to create table', [
                        'has_results' => isset($result['results']),
                        'is_array' => is_array($result['results'] ?? null),
                        'result_keys' => array_keys($result)
                    ]);
                }
                
                $result['query_metadata'] = [
                    'duration_ms' => $duration,
                    'timestamp' => now()->toIso8601String(),
                    'query_type' => $queryType,
                    'sql_query' => $result['sql'] ?? null,
                    'result_count' => $result['result_count'] ?? 0,
                    'has_tables' => !empty($result['tables'])
                ];

                return response()->json($result);
            }

            // AI Service returned error - try fallback response
            $fallbackResponse = ChatbotFallbackResponse::findForQuery($query);
            
            if ($fallbackResponse) {
                $fallbackResponse->incrementUsage();
                
                // Store failed query with fallback
                $chatbotQuery = ChatbotQuery::create([
                    'user_id' => $user->id,
                    'original_query' => $query,
                    'query_type' => $queryType,
                    'execution_time_ms' => $duration,
                    'was_successful' => false,
                    'used_fallback' => true,
                    'fallback_response_id' => $fallbackResponse->id,
                    'error_message' => 'Fallback response used: ' . $response->status(),
                ]);

                return response()->json([
                    'fallback' => true,
                    'message' => $fallbackResponse->response_text,
                    'query_id' => $chatbotQuery->id,
                    'query_metadata' => [
                        'duration_ms' => $duration,
                        'timestamp' => now()->toIso8601String(),
                        'query_type' => $queryType
                    ]
                ]);
            }

            // No fallback available - return error
            ChatbotQuery::create([
                'user_id' => $user->id,
                'original_query' => $query,
                'query_type' => $queryType,
                'execution_time_ms' => $duration,
                'was_successful' => false,
                'error_message' => 'AI Service Error (Status: ' . $response->status() . ')',
            ]);

            Log::error('AI Service returned error', [
                'user_id' => $user->id,
                'query' => $query,
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            AiLog::create([
                'user_id' => $user->id,
                'action_description' => "Chatbot Failed: AI Service Error ({$response->status()}) | {$duration}ms",
                'timestamp' => now()
            ]);

            return response()->json([
                'error' => 'AI Servisi hata verdi.',
                'details' => 'Sorgunuz işlenemedi. Lütfen tekrar deneyin.'
            ], 500);

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            // Try fallback response
            $fallbackResponse = ChatbotFallbackResponse::findForQuery($query);
            
            if ($fallbackResponse) {
                $fallbackResponse->incrementUsage();
                
                $chatbotQuery = ChatbotQuery::create([
                    'user_id' => $user->id,
                    'original_query' => $query,
                    'query_type' => $queryType,
                    'was_successful' => false,
                    'used_fallback' => true,
                    'fallback_response_id' => $fallbackResponse->id,
                    'error_message' => 'Connection error - fallback used',
                ]);

                return response()->json([
                    'fallback' => true,
                    'message' => $fallbackResponse->response_text,
                    'query_id' => $chatbotQuery->id,
                ]);
            }

            // Connection-specific error with no fallback
            ChatbotQuery::create([
                'user_id' => $user->id,
                'original_query' => $query,
                'query_type' => $queryType,
                'was_successful' => false,
                'used_fallback' => false,
                'error_message' => 'Connection failed: ' . $e->getMessage(),
            ]);

            Log::error('AI Service connection failed', [
                'user_id' => $user->id,
                'query' => $query,
                'error' => $e->getMessage()
            ]);

            AiLog::create([
                'user_id' => $user->id,
                'action_description' => "Chatbot: Connection Failed - Timeout/Unavailable",
                'timestamp' => now()
            ]);

            return response()->json([
                'error' => 'AI Servisine bağlanılamadı.',
                'message' => 'Servis şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.'
            ], 503);

        } catch (\Exception $e) {
            // Try fallback response for general exceptions too
            $fallbackResponse = ChatbotFallbackResponse::findForQuery($query);
            
            if ($fallbackResponse) {
                $fallbackResponse->incrementUsage();
                
                $chatbotQuery = ChatbotQuery::create([
                    'user_id' => $user->id,
                    'original_query' => $query,
                    'query_type' => $queryType,
                    'was_successful' => false,
                    'used_fallback' => true,
                    'fallback_response_id' => $fallbackResponse->id,
                    'error_message' => 'Exception - fallback used: ' . substr($e->getMessage(), 0, 200),
                ]);

                return response()->json([
                    'fallback' => true,
                    'message' => $fallbackResponse->response_text,
                    'query_id' => $chatbotQuery->id,
                ]);
            }
            
            // General exception with no fallback
            ChatbotQuery::create([
                'user_id' => $user->id,
                'original_query' => $query,
                'query_type' => $queryType,
                'was_successful' => false,
                'used_fallback' => false,
                'error_message' => $e->getMessage(),
            ]);

            Log::error('Chatbot query exception', [
                'user_id' => $user->id,
                'query' => $query,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Truncate error message to prevent recursive errors
            $errorMsg = substr($e->getMessage(), 0, 200);
            AiLog::create([
                'user_id' => $user->id,
                'action_description' => "Chatbot Exception: {$errorMsg}",
                'timestamp' => now()
            ]);

            return response()->json([
                'error' => 'Beklenmeyen bir hata oluştu.',
                'message' => 'Lütfen tekrar deneyin veya sistem yöneticisine başvurun.'
            ], 500);
        }
    }

    /**
     * Submit feedback for a chatbot response
     */
    public function submitFeedback(Request $request)
    {
        $validated = $request->validate([
            'query_id' => 'required|exists:chatbot_queries,id',
            'rating' => 'required|in:helpful,not_helpful,partially_helpful',
            'comment' => 'nullable|string|max:1000',
        ]);

        $user = $request->user();

        // Check if user already submitted feedback for this query
        $existingFeedback = ChatbotFeedback::where('chatbot_query_id', $validated['query_id'])
            ->where('user_id', $user->id)
            ->first();

        if ($existingFeedback) {
            // Update existing feedback
            $existingFeedback->update([
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
            ]);

            return response()->json([
                'message' => 'Geri bildiriminiz güncellendi.',
                'feedback' => $existingFeedback
            ]);
        }

        // Create new feedback
        $feedback = ChatbotFeedback::create([
            'chatbot_query_id' => $validated['query_id'],
            'user_id' => $user->id,
            'rating' => $validated['rating'],
            'comment' => $validated['comment'] ?? null,
        ]);

        return response()->json([
            'message' => 'Geri bildiriminiz kaydedildi. Teşekkür ederiz!',
            'feedback' => $feedback
        ], 201);
    }

    /**
     * Get chatbot analytics and metrics
     */
    public function analytics(Request $request)
    {
        try {
            $validated = $request->validate([
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'period' => 'nullable|in:day,week,month,year',
            ]);

            $user = $request->user();

            // Only admins can see all analytics
            if (!$user->hasRole('Admin')) {
                return response()->json([
                    'error' => 'Bu işlem için yetkiniz bulunmamaktadır.'
                ], 403);
            }

            $startDate = $validated['start_date'] ?? Carbon::now()->subDays(30)->startOfDay();
            $endDate = $validated['end_date'] ?? Carbon::now()->endOfDay();

            // Get metrics from database (with fallback for empty tables)
            $metrics = ChatbotAccuracyMetric::dateRange($startDate, $endDate)
                ->orderBy('metric_date', 'desc')
                ->get();

            // Calculate aggregate statistics (with null safety)
            $totalQueries = ChatbotQuery::dateRange($startDate, $endDate)->count();
            $successfulQueries = ChatbotQuery::dateRange($startDate, $endDate)->successful()->count();
            $failedQueries = ChatbotQuery::dateRange($startDate, $endDate)->failed()->count();
            
            $avgExecutionTime = ChatbotQuery::dateRange($startDate, $endDate)
                ->avg('execution_time_ms') ?? 0;
            
            $feedbackCount = ChatbotFeedback::whereHas('chatbotQuery', function ($query) use ($startDate, $endDate) {
                $query->dateRange($startDate, $endDate);
            })->count();
            
            $helpfulCount = ChatbotFeedback::whereHas('chatbotQuery', function ($query) use ($startDate, $endDate) {
                $query->dateRange($startDate, $endDate);
            })->helpful()->count();

            $notHelpfulCount = ChatbotFeedback::whereHas('chatbotQuery', function ($query) use ($startDate, $endDate) {
                $query->dateRange($startDate, $endDate);
            })->unhelpful()->count();

            $partiallyHelpfulCount = ChatbotFeedback::whereHas('chatbotQuery', function ($query) use ($startDate, $endDate) {
                $query->dateRange($startDate, $endDate);
            })->where('rating', 'partially_helpful')->count();

            // Query type distribution
            $queryTypeDistribution = ChatbotQuery::dateRange($startDate, $endDate)
                ->select('query_type', DB::raw('count(*) as count'))
                ->groupBy('query_type')
                ->get();

            // Fallback usage statistics
            $fallbackCount = ChatbotQuery::dateRange($startDate, $endDate)
                ->where('used_fallback', true)
                ->count();
            
            // Most common queries
            $commonQueries = ChatbotQuery::dateRange($startDate, $endDate)
                ->select('original_query', DB::raw('count(*) as count'))
                ->groupBy('original_query')
                ->orderBy('count', 'desc')
                ->limit(10)
                ->get();

            return response()->json([
                'start_date' => $startDate,
                'end_date' => $endDate,
                'total_queries' => $totalQueries,
                'successful_queries' => $successfulQueries,
                'failed_queries' => $failedQueries,
                'success_rate' => $totalQueries > 0 ? round(($successfulQueries / $totalQueries) * 100, 2) : 0,
                'average_execution_time_ms' => round($avgExecutionTime, 2),
                'avg_response_time_ms' => round($avgExecutionTime, 2), // Frontend compatibility
                'fallback_count' => $fallbackCount,
                'fallback_rate' => $totalQueries > 0 ? round(($fallbackCount / $totalQueries) * 100, 2) : 0,
                'total_feedback' => $feedbackCount,
                'helpful_feedback' => $helpfulCount,
                'not_helpful_feedback' => $notHelpfulCount,
                'partially_helpful_feedback' => $partiallyHelpfulCount,
                'helpfulness_rate' => $feedbackCount > 0 ? round(($helpfulCount / $feedbackCount) * 100, 2) : 0,
                'daily_metrics' => $metrics,
                'query_type_distribution' => $queryTypeDistribution,
                'common_queries' => $commonQueries,
            ]);
        } catch (\Exception $e) {
            // Log error for debugging
            Log::error('Analytics error: ' . $e->getMessage(), [
                'exception' => $e,
                'user_id' => $request->user()->id ?? null,
            ]);

            return response()->json([
                'error' => 'Analytics verileri yüklenirken bir hata oluştu.',
                'message' => config('app.debug') ? $e->getMessage() : 'Lütfen daha sonra tekrar deneyin.',
            ], 500);
        }
    }

    /**
     * Get user's query history
     */
    public function history(Request $request)
    {
        $validated = $request->validate([
            'limit' => 'nullable|integer|min:1|max:100',
            'offset' => 'nullable|integer|min:0',
        ]);

        $user = $request->user();
        $limit = $validated['limit'] ?? 20;
        $offset = $validated['offset'] ?? 0;

        $queries = ChatbotQuery::where('user_id', $user->id)
            ->with('feedback')
            ->orderBy('created_at', 'desc')
            ->skip($offset)
            ->take($limit)
            ->get();

        $total = ChatbotQuery::where('user_id', $user->id)->count();

        return response()->json([
            'data' => $queries,
            'meta' => [
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset,
                'current_page' => floor($offset / $limit) + 1,
                'last_page' => ceil($total / $limit),
            ],
        ]);
    }

    /**
     * Get all users' query history (Admin only)
     */
    public function allHistory(Request $request)
    {
        $user = $request->user();

        // Only admins can see all history
        if (!$user->hasRole('Admin')) {
            return response()->json([
                'error' => 'Bu işlem için yetkiniz bulunmamaktadır.'
            ], 403);
        }

        $validated = $request->validate([
            'limit' => 'nullable|integer|min:1|max:100',
            'offset' => 'nullable|integer|min:0',
            'user_id' => 'nullable|integer|exists:users,id',
            'query_type' => 'nullable|in:general,time_based,statistical,simple,complex,unknown',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $limit = $validated['limit'] ?? 50;
        $offset = $validated['offset'] ?? 0;

        $query = ChatbotQuery::with(['user', 'feedback'])
            ->orderBy('created_at', 'desc');

        // Apply filters
        if (isset($validated['user_id'])) {
            $query->where('user_id', $validated['user_id']);
        }

        if (isset($validated['query_type'])) {
            $query->where('query_type', $validated['query_type']);
        }

        if (isset($validated['start_date'])) {
            $query->where('created_at', '>=', $validated['start_date']);
        }

        if (isset($validated['end_date'])) {
            $query->where('created_at', '<=', $validated['end_date']);
        }

        $total = $query->count();
        $queries = $query->skip($offset)->take($limit)->get();

        // Transform data for frontend
        $transformedQueries = $queries->map(function ($q) {
            return [
                'id' => $q->id,
                'user_id' => $q->user_id,
                'user_name' => $q->user->name ?? 'Unknown',
                'user_email' => $q->user->email ?? 'unknown@example.com',
                'query' => $q->original_query,
                'translated_query' => $q->translated_query,
                'query_type' => $q->query_type,
                'sql' => $q->generated_sql,
                'result_count' => $q->result_count,
                'execution_time_ms' => $q->execution_time_ms,
                'was_successful' => (bool) $q->was_successful,
                'used_fallback' => (bool) $q->used_fallback,
                'model_used' => $q->model_used,
                'feedback' => $q->feedback ? [
                    'rating' => $q->feedback->rating,
                    'comment' => $q->feedback->comment,
                ] : null,
                'created_at' => $q->created_at->toISOString(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $transformedQueries,
            'meta' => [
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset,
                'current_page' => floor($offset / $limit) + 1,
                'last_page' => ceil($total / $limit),
            ],
        ]);
    }

    /**
     * Detect query type for analytics
     */
    private function detectQueryType($query)
    {
        $query = strtolower($query);
        
        // Time-based queries
        if (preg_match('/(bugün|dün|bu hafta|geçen hafta|bu ay|geçen ay|today|yesterday|week|month)/i', $query)) {
            return 'time_based';
        }
        
        // Statistical queries
        if (preg_match('/(kaç|toplam|sayı|ortalama|count|total|average|sum)/i', $query)) {
            return 'statistical';
        }
        
        // Location queries
        if (preg_match('/(nerede|konum|yer|where|location)/i', $query)) {
            return 'location';
        }
        
        // Status queries
        if (preg_match('/(durum|status|boşta|kullanımda|available|in use)/i', $query)) {
            return 'status';
        }
        
        // User/assignment queries
        if (preg_match('/(kimin|kimde|atanmış|zimmetli|assigned|holder)/i', $query)) {
            return 'assignment';
        }
        
        return 'general';
    }

    /**
     * Detect column types for smart filtering
     */
    private function detectColumnTypes($results)
    {
        if (empty($results) || !is_array($results)) {
            return [];
        }

        $columnTypes = [];
        $firstRow = $results[0];

        foreach ($firstRow as $column => $value) {
            // Collect unique values for categorical detection
            $uniqueValues = array_unique(array_column($results, $column));
            $nonNullValues = array_filter($uniqueValues, fn($v) => $v !== null && $v !== '');
            
            // Detect type based on value patterns
            $type = 'text'; // default
            
            // Check numeric FIRST (before date) to prevent ID columns being detected as dates
            // Carbon parser is very flexible and might parse "1", "2", "3" as dates
            if ($this->isNumericColumn($nonNullValues)) {
                $type = 'number';
            }
            // Check if it's a date/datetime (only if not numeric)
            elseif ($this->isDateColumn($nonNullValues)) {
                $type = 'date';
            }
            // Check if it's categorical (low cardinality)
            elseif (count($nonNullValues) <= 20 && count($results) > 10) {
                $type = 'categorical';
            }
            
            $columnTypes[$column] = [
                'type' => $type,
                'unique_values' => $type === 'categorical' ? array_values($nonNullValues) : null
            ];
        }

        return $columnTypes;
    }

    /**
     * Check if column contains date values
     */
    private function isDateColumn($values)
    {
        if (empty($values)) return false;
        
        $dateCount = 0;
        $sampleSize = min(10, count($values));
        
        foreach (array_slice($values, 0, $sampleSize) as $value) {
            if (!$value) continue;
            
            // Skip pure numeric values (integers) to avoid ID columns
            if (is_numeric($value) && !str_contains($value, '-') && !str_contains($value, '/') && !str_contains($value, ':')) {
                continue;
            }
            
            // Value should look like a date string (contain separators)
            $stringValue = (string) $value;
            $hasDateSeparators = str_contains($stringValue, '-') || 
                                 str_contains($stringValue, '/') || 
                                 str_contains($stringValue, ':') ||
                                 str_contains($stringValue, ' ');
            
            if (!$hasDateSeparators) {
                continue;
            }
            
            // Try to parse as date
            try {
                $parsed = \Carbon\Carbon::parse($value);
                if ($parsed->year >= 1900 && $parsed->year <= 2100) {
                    $dateCount++;
                }
            } catch (\Exception $e) {
                continue;
            }
        }
        
        // If 80%+ of samples are valid dates
        return $dateCount >= ($sampleSize * 0.8);
    }

    /**
     * Check if column contains numeric values
     */
    private function isNumericColumn($values)
    {
        if (empty($values)) return false;
        
        $numericCount = 0;
        $sampleSize = min(10, count($values));
        
        foreach (array_slice($values, 0, $sampleSize) as $value) {
            if ($value === null || $value === '') continue;
            if (is_numeric($value)) {
                $numericCount++;
            }
        }
        
        // If 80%+ of samples are numeric
        return $numericCount >= ($sampleSize * 0.8);
    }

    /**
     * Format query results into human-readable response
     */
    private function formatQueryResults($result)
    {
        // If there are no results, return a default message
        if (empty($result['results']) || $result['result_count'] === 0) {
            return "Sorgunuz için sonuç bulunamadı.";
        }

        $results = $result['results'];
        $resultCount = $result['result_count'];

        // Handle single aggregate result (COUNT, SUM, AVG, etc.)
        if ($resultCount === 1 && isset($results[0])) {
            $firstResult = $results[0];
            
            // Check for common aggregate functions
            foreach ($firstResult as $key => $value) {
                if (stripos($key, 'COUNT') !== false) {
                    return "Toplam **{$value}** adet bulundu.";
                }
                if (stripos($key, 'SUM') !== false) {
                    return "Toplam: **{$value}**";
                }
                if (stripos($key, 'AVG') !== false) {
                    return "Ortalama: **{$value}**";
                }
            }
        }

        // Return simple text response - frontend will render table from structured data
        $response = "Sorgunuz için **{$resultCount} sonuç** bulundu.";
        
        return $response;
    }
}