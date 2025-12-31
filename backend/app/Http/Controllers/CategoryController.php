<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class CategoryController extends Controller
{
    /**
     * Display a listing of categories.
     */
    public function index()
    {
        $categories = Category::withCount('items')
            ->orderBy('category_name')
            ->get()
            ->map(function ($category) {
                return [
                    'id' => $category->id,
                    'category_name' => $category->category_name,
                    'description' => $category->description,
                    'schema_definition' => $category->schema_definition,
                    'items_count' => $category->items_count,
                    'created_at' => $category->created_at,
                    'updated_at' => $category->updated_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }

    /**
     * Store a newly created category.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'category_name' => 'required|string|max:100|unique:item_categories,category_name',
            'description' => 'nullable|string|max:500',
            'schema_definition' => 'nullable|json',
        ], [
            'category_name.required' => 'Kategori adı zorunludur',
            'category_name.unique' => 'Bu kategori adı zaten kullanılıyor',
            'category_name.max' => 'Kategori adı en fazla 100 karakter olabilir',
            'description.max' => 'Açıklama en fazla 500 karakter olabilir',
            'schema_definition.json' => 'Şema tanımı geçerli bir JSON formatında olmalıdır',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Validate schema structure if provided
            if ($request->has('schema_definition') && $request->schema_definition) {
                $schema = json_decode($request->schema_definition, true);
                
                if (!is_array($schema) || !isset($schema['fields'])) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Şema tanımı "fields" anahtarı içermelidir'
                    ], 422);
                }

                // Validate each field in schema
                foreach ($schema['fields'] as $field) {
                    if (!isset($field['name']) || !isset($field['type'])) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Her şema alanı "name" ve "type" özelliklerine sahip olmalıdır'
                        ], 422);
                    }
                }
            }

            $category = Category::create([
                'category_name' => $request->category_name,
                'description' => $request->description,
                'schema_definition' => $request->schema_definition,
            ]);

            Log::info('Category created', [
                'category_id' => $category->id,
                'category_name' => $category->category_name,
                'created_by' => $request->user()->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Kategori başarıyla oluşturuldu',
                'data' => $category
            ], 201);

        } catch (\Exception $e) {
            Log::error('Category creation failed', [
                'error' => $e->getMessage(),
                'category_name' => $request->category_name
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Kategori oluşturulurken bir hata oluştu'
            ], 500);
        }
    }

    /**
     * Display the specified category.
     */
    public function show($id)
    {
        $category = Category::withCount('items')->find($id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Kategori bulunamadı'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $category->id,
                'category_name' => $category->category_name,
                'description' => $category->description,
                'schema_definition' => $category->schema_definition,
                'items_count' => $category->items_count,
                'created_at' => $category->created_at,
                'updated_at' => $category->updated_at,
            ]
        ]);
    }

    /**
     * Update the specified category.
     */
    public function update(Request $request, $id)
    {
        $category = Category::find($id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Kategori bulunamadı'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'category_name' => 'required|string|max:100|unique:item_categories,category_name,' . $id,
            'description' => 'nullable|string|max:500',
            'schema_definition' => 'nullable|json',
        ], [
            'category_name.required' => 'Kategori adı zorunludur',
            'category_name.unique' => 'Bu kategori adı zaten kullanılıyor',
            'category_name.max' => 'Kategori adı en fazla 100 karakter olabilir',
            'description.max' => 'Açıklama en fazla 500 karakter olabilir',
            'schema_definition.json' => 'Şema tanımı geçerli bir JSON formatında olmalıdır',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Validate schema structure if provided
            if ($request->has('schema_definition') && $request->schema_definition) {
                $schema = json_decode($request->schema_definition, true);
                
                if (!is_array($schema) || !isset($schema['fields'])) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Şema tanımı "fields" anahtarı içermelidir'
                    ], 422);
                }

                foreach ($schema['fields'] as $field) {
                    if (!isset($field['name']) || !isset($field['type'])) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Her şema alanı "name" ve "type" özelliklerine sahip olmalıdır'
                        ], 422);
                    }
                }
            }

            $category->update([
                'category_name' => $request->category_name,
                'description' => $request->description,
                'schema_definition' => $request->schema_definition,
            ]);

            Log::info('Category updated', [
                'category_id' => $category->id,
                'category_name' => $category->category_name,
                'updated_by' => $request->user()->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Kategori başarıyla güncellendi',
                'data' => $category->fresh()
            ]);

        } catch (\Exception $e) {
            Log::error('Category update failed', [
                'error' => $e->getMessage(),
                'category_id' => $id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Kategori güncellenirken bir hata oluştu'
            ], 500);
        }
    }

    /**
     * Remove the specified category.
     */
    public function destroy($id)
    {
        $category = Category::withCount('items')->find($id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Kategori bulunamadı'
            ], 404);
        }

        // Prevent deletion if category has items
        if ($category->items_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Bu kategoriye ait ürünler bulunduğu için silinemez'
            ], 400);
        }

        try {
            $categoryName = $category->category_name;
            $category->delete();

            Log::info('Category deleted', [
                'category_id' => $id,
                'category_name' => $categoryName
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Kategori başarıyla silindi'
            ]);

        } catch (\Exception $e) {
            Log::error('Category deletion failed', [
                'error' => $e->getMessage(),
                'category_id' => $id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Kategori silinirken bir hata oluştu'
            ], 500);
        }
    }

    /**
     * Get schema fields for a category (for item form rendering)
     */
    public function getSchema($id)
    {
        $category = Category::find($id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Kategori bulunamadı'
            ], 404);
        }

        $fields = $category->getSchemaFields();

        return response()->json([
            'success' => true,
            'data' => [
                'category_name' => $category->category_name,
                'fields' => $fields
            ]
        ]);
    }
}
