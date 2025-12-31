<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Translation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class TranslationController extends Controller
{
    /**
     * Get all translations for a locale
     */
    public function index(Request $request): JsonResponse
    {
        $locale = $request->get('locale', 'tr');
        
        $translations = Translation::getByLocale($locale);
        
        return response()->json([
            'locale' => $locale,
            'translations' => $translations
        ]);
    }

    /**
     * Get translations by namespace
     */
    public function byNamespace(Request $request, string $locale, string $namespace): JsonResponse
    {
        $translations = Translation::getByNamespace($locale, $namespace);
        
        return response()->json([
            'locale' => $locale,
            'namespace' => $namespace,
            'translations' => $translations
        ]);
    }

    /**
     * Update a translation (Admin only)
     */
    public function update(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'locale' => 'required|string|max:10',
            'namespace' => 'required|string|max:100',
            'key' => 'required|string|max:255',
            'value' => 'required|string',
            'description' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $translation = Translation::updateTranslation(
            $request->locale,
            $request->namespace,
            $request->key,
            $request->value
        );

        if ($request->has('description')) {
            $translation->description = $request->description;
            $translation->save();
        }

        return response()->json([
            'message' => 'Translation updated successfully',
            'translation' => $translation
        ]);
    }

    /**
     * Bulk update translations
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'locale' => 'required|string|max:10',
            'translations' => 'required|array'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $locale = $request->locale;
        $translations = $request->translations;
        $updated = 0;

        foreach ($translations as $namespace => $keys) {
            if (is_array($keys)) {
                foreach ($keys as $key => $value) {
                    Translation::updateTranslation($locale, $namespace, $key, $value);
                    $updated++;
                }
            }
        }

        return response()->json([
            'message' => "Updated {$updated} translations successfully",
            'updated_count' => $updated
        ]);
    }

    /**
     * Delete a translation (Admin only)
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $translation = Translation::findOrFail($id);
        $translation->delete();

        Translation::clearCache();

        return response()->json([
            'message' => 'Translation deleted successfully'
        ]);
    }

    /**
     * Clear translation cache
     */
    public function clearCache(): JsonResponse
    {
        Translation::clearCache();

        return response()->json([
            'message' => 'Translation cache cleared successfully'
        ]);
    }
}
