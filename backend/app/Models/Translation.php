<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Translation extends Model
{
    protected $fillable = [
        'locale',
        'namespace',
        'key',
        'value',
        'description'
    ];

    /**
     * Get all translations for a specific locale
     */
    public static function getByLocale(string $locale): array
    {
        return Cache::remember("translations.{$locale}", 3600, function () use ($locale) {
            $translations = self::where('locale', $locale)->get();
            
            $result = [];
            foreach ($translations as $translation) {
                if (!isset($result[$translation->namespace])) {
                    $result[$translation->namespace] = [];
                }
                $result[$translation->namespace][$translation->key] = $translation->value;
            }
            
            return $result;
        });
    }

    /**
     * Get translations for a specific locale and namespace
     */
    public static function getByNamespace(string $locale, string $namespace): array
    {
        return Cache::remember("translations.{$locale}.{$namespace}", 3600, function () use ($locale, $namespace) {
            return self::where('locale', $locale)
                ->where('namespace', $namespace)
                ->pluck('value', 'key')
                ->toArray();
        });
    }

    /**
     * Update or create a translation
     */
    public static function updateTranslation(string $locale, string $namespace, string $key, string $value): self
    {
        $translation = self::updateOrCreate(
            [
                'locale' => $locale,
                'namespace' => $namespace,
                'key' => $key
            ],
            [
                'value' => $value
            ]
        );

        // Clear cache
        Cache::forget("translations.{$locale}");
        Cache::forget("translations.{$locale}.{$namespace}");

        return $translation;
    }

    /**
     * Clear all translation cache
     */
    public static function clearCache(): void
    {
        Cache::flush();
    }
}
