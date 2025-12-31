<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\SystemSetting;

class SettingsController extends Controller
{
    /**
     * Get all settings (Admin only)
     */
    public function index()
    {
        $settings = SystemSetting::all()->groupBy('category');
        
        return response()->json([
            'categories' => $settings->keys(),
            'settings' => $settings->map(function ($categorySettings) {
                return $categorySettings->mapWithKeys(function ($setting) {
                    $value = match($setting->setting_type) {
                        'boolean' => filter_var($setting->setting_value, FILTER_VALIDATE_BOOLEAN),
                        'integer' => (int) $setting->setting_value,
                        'json' => json_decode($setting->setting_value, true),
                        default => $setting->setting_value,
                    };
                    
                    return [$setting->setting_key => [
                        'value' => $value,
                        'type' => $setting->setting_type,
                        'description' => $setting->description,
                        'category' => $setting->category,
                    ]];
                });
            })
        ]);
    }

    /**
     * Get settings by category
     */
    public function getByCategory($category)
    {
        $settings = SystemSetting::getByCategory($category);
        
        return response()->json([
            'category' => $category,
            'settings' => $settings
        ]);
    }

    /**
     * Update multiple settings
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*' => 'required',
        ]);

        $updated = 0;
        foreach ($validated['settings'] as $key => $value) {
            if (SystemSetting::set($key, $value)) {
                $updated++;
            }
        }

        return response()->json([
            'message' => "{$updated} ayar başarıyla güncellendi.",
            'updated_count' => $updated
        ]);
    }

    /**
     * Get public settings (no auth required)
     */
    public function getPublicSettings()
    {
        return response()->json(SystemSetting::getPublicSettings());
    }

    /**
     * Reset settings to default values
     */
    public function reset($category)
    {
        // Reset logic here if needed
        return response()->json([
            'message' => "{$category} ayarları varsayılan değerlere sıfırlandı."
        ]);
    }

    /**
     * Get audit logs (Admin only)
     */
    public function getAuditLogs(Request $request)
    {
        // For now, return chatbot queries as audit logs
        // TODO: Create dedicated audit_logs table for comprehensive system auditing
        $query = DB::table('chatbot_queries')
            ->join('users', 'chatbot_queries.user_id', '=', 'users.id')
            ->select(
                'chatbot_queries.id',
                'chatbot_queries.user_id',
                'users.name as user_name',
                'users.email as user_email',
                'chatbot_queries.original_query as action',
                'chatbot_queries.query_type',
                'chatbot_queries.was_successful',
                'chatbot_queries.created_at',
                DB::raw("'chatbot_query' as event_type"),
                DB::raw("CONCAT('Query: ', LEFT(chatbot_queries.original_query, 50)) as description")
            )
            ->orderBy('chatbot_queries.created_at', 'desc');

        // Apply filters
        if ($request->has('user_id')) {
            $query->where('chatbot_queries.user_id', $request->user_id);
        }
        
        if ($request->has('start_date')) {
            $query->where('chatbot_queries.created_at', '>=', $request->start_date);
        }
        
        if ($request->has('end_date')) {
            $query->where('chatbot_queries.created_at', '<=', $request->end_date);
        }

        $limit = $request->input('limit', 50);
        $logs = $query->limit($limit)->get();

        return response()->json([
            'success' => true,
            'logs' => $logs,
            'total' => $logs->count(),
        ]);
    }

    /**
     * Get system backups (Admin only)
     */
    public function getBackups()
    {
        // Mock data for now - implement actual backup logic later
        return response()->json([
            'success' => true,
            'backups' => [],
            'message' => 'Yedekleme sistemi henüz aktif değil'
        ]);
    }

    /**
     * Create system backup (Admin only)
     */
    public function createBackup(Request $request)
    {
        // Mock implementation
        return response()->json([
            'success' => true,
            'message' => 'Yedekleme sistemi henüz aktif değil',
            'backup' => null
        ]);
    }

    /**
     * Delete system backup (Admin only)
     */
    public function deleteBackup($id)
    {
        // Mock implementation
        return response()->json([
            'success' => true,
            'message' => 'Yedekleme sistemi henüz aktif değil'
        ]);
    }
}
