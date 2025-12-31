<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Translation;
use Illuminate\Support\Facades\File;

class TranslationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Define translation file paths - adjust for Docker environment
        $frontendPath = '/app/frontend/src/i18n/locales';
        
        // If not in Docker, use relative path
        if (!is_dir($frontendPath)) {
            $frontendPath = dirname(base_path(), 2) . '/frontend/src/i18n/locales';
        }
        
        $translationFiles = [
            'tr' => $frontendPath . '/tr.json',
            'en' => $frontendPath . '/en.json',
        ];

        foreach ($translationFiles as $locale => $filePath) {
            if (!File::exists($filePath)) {
                $this->command->warn("Translation file not found: {$filePath}");
                continue;
            }

            $this->command->info("Loading {$locale} translations from {$filePath}");

            $content = File::get($filePath);
            $translations = json_decode($content, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                $this->command->error("Invalid JSON in {$filePath}: " . json_last_error_msg());
                continue;
            }

            $this->seedTranslations($locale, $translations);
        }

        $this->command->info('Translations seeded successfully!');
    }

    /**
     * Recursively seed translations
     */
    private function seedTranslations(string $locale, array $translations, string $namespace = ''): void
    {
        foreach ($translations as $key => $value) {
            $currentNamespace = $namespace ? "{$namespace}.{$key}" : $key;

            if (is_array($value)) {
                // If value is array, recursively process
                $this->seedTranslations($locale, $value, $currentNamespace);
            } else {
                // Extract namespace and key
                $parts = explode('.', $currentNamespace);
                $translationKey = array_pop($parts);
                $translationNamespace = implode('.', $parts);

                // Insert or update translation
                Translation::updateOrCreate(
                    [
                        'locale' => $locale,
                        'namespace' => $translationNamespace,
                        'key' => $translationKey
                    ],
                    [
                        'value' => $value
                    ]
                );
            }
        }
    }
}
