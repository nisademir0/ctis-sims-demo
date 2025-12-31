<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use App\Models\SystemSetting;

class AiModelController extends Controller
{
    /**
     * Get list of available LM Studio models
     */
    public function listModels()
    {
        try {
            // Cache for 5 minutes
            $models = Cache::remember('lm_studio_models', 300, function () {
                $response = Http::timeout(10)
                    ->get(config('services.ai.url') . '/models/list');
                
                if ($response->successful()) {
                    return $response->json();
                }
                
                return ['success' => false, 'models' => [], 'error' => 'Failed to connect'];
            });
            
            return response()->json($models);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'models' => [],
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Test LM Studio connection
     */
    public function testConnection()
    {
        try {
            $response = Http::timeout(5)
                ->get(config('services.ai.url') . '/models/test');
            
            if ($response->successful()) {
                return response()->json($response->json());
            }
            
            return response()->json([
                'connected' => false,
                'error' => 'Connection failed'
            ], 503);
            
        } catch (\Exception $e) {
            return response()->json([
                'connected' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get current AI model configuration
     */
    public function getConfig()
    {
        $config = [
            'primary_model' => SystemSetting::get('ai.primary_model', 'llama-3.2-8b-instruct'),
            'secondary_model' => SystemSetting::get('ai.secondary_model', 'qwen-2.5-3b'),
            'temperature' => SystemSetting::get('ai.temperature', 0.1),
            'max_tokens' => SystemSetting::get('ai.max_tokens', 500),
            'enabled' => SystemSetting::get('ai.enabled', true),
        ];
        
        return response()->json($config);
    }
    
    /**
     * Update AI model configuration
     */
    public function updateConfig(Request $request)
    {
        $request->validate([
            'primary_model' => 'sometimes|string|max:100',
            'secondary_model' => 'sometimes|string|max:100',
            'temperature' => 'sometimes|numeric|min:0|max:1',
            'max_tokens' => 'sometimes|integer|min:50|max:2000',
        ]);
        
        foreach ($request->only(['primary_model', 'secondary_model', 'temperature', 'max_tokens']) as $key => $value) {
            SystemSetting::set("ai.{$key}", $value);
        }
        
        // Clear model cache
        Cache::forget('lm_studio_models');
        
        return response()->json([
            'message' => 'AI configuration updated successfully',
            'config' => $this->getConfig()->getData()
        ]);
    }
    
    /**
     * Refresh model list cache
     */
    public function refreshModels()
    {
        Cache::forget('lm_studio_models');
        return $this->listModels();
    }
}
