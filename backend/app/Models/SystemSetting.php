<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SystemSetting extends Model
{
    protected $fillable = [
        'setting_key',
        'setting_value',
        'setting_type',
        'category',
        'description',
        'is_public'
    ];

    protected $casts = [
        'is_public' => 'boolean',
    ];

    /**
     * Get setting value with type casting and caching
     */
    public static function get(string $key, $default = null)
    {
        // Cache settings for 1 hour to reduce DB queries
        return Cache::remember("setting:{$key}", 3600, function () use ($key, $default) {
            $setting = self::where('setting_key', $key)->first();
            
            if (!$setting) {
                return $default;
            }

            return match($setting->setting_type) {
                'boolean' => filter_var($setting->setting_value, FILTER_VALIDATE_BOOLEAN),
                'integer' => (int) $setting->setting_value,
                'json' => json_decode($setting->setting_value, true),
                default => $setting->setting_value,
            };
        });
    }

    /**
     * Set setting value and clear cache
     */
    public static function set(string $key, $value): bool
    {
        $setting = self::where('setting_key', $key)->first();
        
        if ($setting) {
            $setting->setting_value = is_array($value) ? json_encode($value) : (string) $value;
            $setting->save();
            
            // Clear cache
            Cache::forget("setting:{$key}");
            Cache::forget("settings:category:{$setting->category}");
            
            return true;
        }
        
        return false;
    }

    /**
     * Get all settings by category with caching
     */
    public static function getByCategory(string $category): array
    {
        return Cache::remember("settings:category:{$category}", 3600, function () use ($category) {
            return self::where('category', $category)
                ->get()
                ->mapWithKeys(function ($setting) {
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
                    ]];
                })
                ->toArray();
        });
    }

    /**
     * Get all public settings (for frontend)
     */
    public static function getPublicSettings(): array
    {
        return Cache::remember('settings:public', 3600, function () {
            return self::where('is_public', true)
                ->get()
                ->mapWithKeys(function ($setting) {
                    $value = match($setting->setting_type) {
                        'boolean' => filter_var($setting->setting_value, FILTER_VALIDATE_BOOLEAN),
                        'integer' => (int) $setting->setting_value,
                        'json' => json_decode($setting->setting_value, true),
                        default => $setting->setting_value,
                    };
                    
                    return [$setting->setting_key => $value];
                })
                ->toArray();
        });
    }

    /**
     * Clear all settings cache
     */
    public static function clearCache(): void
    {
        $categories = self::distinct('category')->pluck('category');
        
        foreach ($categories as $category) {
            Cache::forget("settings:category:{$category}");
        }
        
        Cache::forget('settings:public');
        
        // Clear individual setting caches
        $keys = self::pluck('setting_key');
        foreach ($keys as $key) {
            Cache::forget("setting:{$key}");
        }
    }

    /**
     * Boot method to clear cache on model events
     */
    protected static function boot()
    {
        parent::boot();

        static::saved(function ($setting) {
            Cache::forget("setting:{$setting->setting_key}");
            Cache::forget("settings:category:{$setting->category}");
            Cache::forget('settings:public');
        });

        static::deleted(function ($setting) {
            Cache::forget("setting:{$setting->setting_key}");
            Cache::forget("settings:category:{$setting->category}");
            Cache::forget('settings:public');
        });
    }
}
