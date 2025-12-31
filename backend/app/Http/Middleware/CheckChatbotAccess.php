<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\SystemSetting;
use App\Models\ChatbotQuery;

class CheckChatbotAccess
{
    /**
     * Handle an incoming request.
     * Check if user has permission to access chatbot based on role and system settings
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if chatbot is globally enabled
        if (!SystemSetting::get('chatbot.enabled', true)) {
            return response()->json([
                'error' => 'Chatbot Devre Dışı',
                'message' => 'AI Chatbot şu anda sistem yöneticisi tarafından devre dışı bırakıldı.'
            ], 503);
        }

        $user = $request->user();
        if (!$user) {
            return response()->json([
                'error' => 'Yetkisiz Erişim',
                'message' => 'Lütfen giriş yapın.'
            ], 401);
        }

        $role = $user->role->role_name ?? 'Staff';

        // Check role-based access (normalize role names to lowercase for matching)
        $hasAccess = match(true) {
            stripos($role, 'admin') !== false => SystemSetting::get('chatbot.admin_access', true),
            stripos($role, 'manager') !== false => SystemSetting::get('chatbot.manager_access', true),
            stripos($role, 'staff') !== false => SystemSetting::get('chatbot.staff_access', false),
            default => false,
        };

        if (!$hasAccess) {
            return response()->json([
                'error' => 'Erişim Reddedildi',
                'message' => "AI Chatbot {$role} kullanıcıları için aktif değil. Lütfen sistem yöneticisi ile iletişime geçin."
            ], 403);
        }

        // Check daily query limit
        $maxQueries = SystemSetting::get('chatbot.max_queries_per_day', 50);
        $todayQueries = ChatbotQuery::where('user_id', $user->id)
            ->whereDate('created_at', today())
            ->count();

        if ($todayQueries >= $maxQueries) {
            return response()->json([
                'error' => 'Günlük Limit Aşıldı',
                'message' => "Günlük sorgu limitine ulaştınız ({$maxQueries}). Yarın tekrar deneyin.",
                'queries_used' => $todayQueries,
                'max_queries' => $maxQueries
            ], 429);
        }

        // Add remaining queries to request for logging
        $request->attributes->set('queries_remaining', $maxQueries - $todayQueries);

        return $next($request);
    }
}
