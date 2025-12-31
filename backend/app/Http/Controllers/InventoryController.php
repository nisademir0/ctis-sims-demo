<?php

namespace App\Http\Controllers;

use App\Http\Requests\Inventory\IndexItemRequest;
use App\Http\Requests\Inventory\StoreItemRequest;
use App\Http\Requests\Inventory\UpdateItemRequest;
use App\Models\Item;
use App\Models\Category;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\AiService;

class InventoryController extends Controller
{
    protected AiService $aiService;

    public function __construct(AiService $aiService)
    {
        $this->aiService = $aiService;
    }
    
    // Dashboard Listesi (SRS UC9 & FReq 4.1)
    public function index(IndexItemRequest $request)
    {
        // Validation handled by IndexItemRequest
        $validated = $request->validated();

        $user = $request->user()->load('role');
        
        // Eager Loading (Performans için ilişkileri peşin çekiyoruz)
        $query = Item::with(['category', 'vendor', 'holder']);

        // Eğer kullanıcı 'Staff' ise SADECE kendine zimmetli eşyaları görsün
        if ($user->role && $user->role->role_name === 'Staff') {
            $query->where('current_holder_id', $user->id);
        }

        // Filtreleme (Arama Çubuğu için - FReq 5.1)
        if (!empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('inventory_number', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%");
            });
        }

        // Status filter
        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        // Category filter
        if (!empty($validated['category_id'])) {
            $query->where('category_id', $validated['category_id']);
        }

        // Add pagination for better performance
        $perPage = $validated['per_page'] ?? 50;
        return response()->json($query->latest()->paginate($perPage));
    }

    // Yeni Eşya Ekleme (Sadece Manager/Admin - SRS UC1)
    public function store(StoreItemRequest $request)
    {
        // Validation and authorization handled by StoreItemRequest
        $validated = $request->validated();
        $user = $request->user()->load('role');

        try {
            // Start transaction for data integrity
            DB::beginTransaction();

            $item = Item::create($validated);

            // Log the creation in lifecycle events
            if (class_exists('App\Models\ItemLifecycleEvent')) {
                \App\Models\ItemLifecycleEvent::create([
                    'item_id' => $item->id,
                    'event_type' => 'created',
                    'event_date' => now(),
                    'notes' => "Item created by {$user->name}"
                ]);
            }

            DB::commit();

            // Invalidate AI cache for inventory-related queries
            $this->aiService->invalidateCache('item');
            $this->aiService->invalidateCache('inventory');
            $this->aiService->invalidateCache($item->category->category_name ?? '');

            return response()->json([
                'message' => 'Eşya başarıyla eklendi',
                'item' => $item->load(['category', 'vendor', 'holder'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Item creation failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'data' => $validated
            ]);
            return response()->json([
                'message' => 'Eşya eklenirken bir hata oluştu',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Show single item details with all relationships
     * SRS FR-2.4: View item details
     */
    public function show(Request $request, $id)
    {
        try {
            $item = Item::with([
                'category',
                'vendor',
                'holder' => function($query) {
                    $query->select('id', 'name', 'email');
                },
                'transactions' => function($query) {
                    $query->orderBy('checkout_date', 'desc')
                          ->limit(10)
                          ->with('user:id,name,email');
                }
            ])->findOrFail($id);

            // Check if user has permission to view this item
            $user = $request->user()->load('role');
            
            // Staff can only view their own items
            if ($user->role && $user->role->role_name === 'Staff') {
                if ($item->current_holder_id !== $user->id) {
                    return response()->json([
                        'message' => 'Bu eşyayı görüntüleme yetkiniz yok'
                    ], 403);
                }
            }

            return response()->json([
                'success' => true,
                'data' => $item
            ]);
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Eşya bulunamadı'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Item show failed', [
                'error' => $e->getMessage(),
                'item_id' => $id,
                'user_id' => $request->user()->id
            ]);
            return response()->json([
                'message' => 'Eşya detayları yüklenirken bir hata oluştu'
            ], 500);
        }
    }
    
    // Dashboard İstatistikleri (Toplam Eşya, Boşta, Zimmetli vb.)
    public function stats(Request $request) {
        $user = $request->user()->load('role');
        
        if ($user->role && $user->role->role_name === 'Staff') {
             return response()->json([
                 'my_items' => Item::where('current_holder_id', $user->id)->count()
             ]);
        }

        return response()->json([
            'total_items' => Item::count(),
            'available_items' => Item::where('status', 'available')->count(),
            'lent_items' => Item::where('status', 'lent')->count(),
            'maintenance_items' => Item::where('status', 'maintenance')->count(),
        ]);
    }

    // Kategori Listesi (Dropdown için)
    public function categories()
    {
        $categories = Category::all()->map(function ($category) {
            return [
                'id' => $category->id,
                'category_name' => $category->category_name,
                'description' => $category->description,
                'schema_definition' => $category->schema_definition,
                'created_at' => $category->created_at,
                'updated_at' => $category->updated_at,
            ];
        });
        
        return response()->json(['data' => $categories]);
    }

    // Kullanıcı Listesi (Eşya atamak için)
    public function users()
    {
        return response()->json(User::select('id', 'name')->get());
    }
    
    /**
     * SRS FR-2.3: Soft delete item (decommission)
     * Items are marked inactive and soft-deleted for audit trail
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user()->load('role');
        
        // Only Admin/Manager can delete items
        if ($user->role && $user->role->role_name === 'Staff') {
            return response()->json([
                'error' => 'Yetkisiz işlem',
                'message' => 'Bu işlem için yetkiniz bulunmamaktadır.'
            ], 403);
        }

        try {
            $item = Item::findOrFail($id);
            
            // Check if item is currently lent
            if ($item->status === 'lent') {
                return response()->json([
                    'error' => 'Item currently lent',
                    'message' => 'Cannot decommission an item that is currently lent. Please return it first.'
                ], 400);
            }

            DB::beginTransaction();
            
            // Mark as inactive
            $item->is_active = false;
            $item->save();
            
            // Soft delete (SRS audit requirement)
            $item->delete();
            
            // Log lifecycle event
            if (class_exists('App\Models\ItemLifecycleEvent')) {
                \App\Models\ItemLifecycleEvent::create([
                    'item_id' => $id,
                    'event_type' => 'retired',
                    'event_date' => now(),
                    'notes' => "Item decommissioned by {$user->name}"
                ]);
            }
            
            DB::commit();
            
            // Invalidate AI cache for inventory-related queries
            $this->aiService->invalidateCache('item');
            $this->aiService->invalidateCache('inventory');
            
            return response()->json([
                'message' => 'Item successfully decommissioned',
                'note' => 'Item marked inactive and archived for audit purposes'
            ]);
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Item not found',
                'message' => 'The requested item does not exist.'
            ], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Item deletion failed', [
                'error' => $e->getMessage(),
                'item_id' => $id,
                'user_id' => $user->id
            ]);
            
            return response()->json([
                'error' => 'Decommission failed',
                'message' => 'An error occurred while decommissioning the item.'
            ], 500);
        }
    }

    /**
     * Bulk update item status
     * POST /api/items/bulk-update-status
     */
    public function bulkUpdateStatus(Request $request)
    {
        $validated = $request->validate([
            'item_ids' => 'required|array|min:1',
            'item_ids.*' => 'required|integer|exists:items,id',
            'status' => 'required|in:available,lent,maintenance,retired',
        ]);

        $user = $request->user();
        
        try {
            DB::beginTransaction();

            $itemIds = $validated['item_ids'];
            $newStatus = $validated['status'];

            // Check if items can be updated (not lent to someone)
            if ($newStatus === 'available') {
                $lentItems = Item::whereIn('id', $itemIds)
                    ->where('status', 'lent')
                    ->whereNotNull('current_holder_id')
                    ->count();
                
                if ($lentItems > 0) {
                    return response()->json([
                        'error' => 'Cannot update status',
                        'message' => 'Some items are currently lent and cannot be marked as available. Please return them first.'
                    ], 422);
                }
            }

            // Update items
            $updated = Item::whereIn('id', $itemIds)->update([
                'status' => $newStatus,
                'updated_at' => now(),
            ]);

            // Log lifecycle events for each item
            foreach ($itemIds as $itemId) {
                if (class_exists('App\Models\ItemLifecycleEvent')) {
                    \App\Models\ItemLifecycleEvent::create([
                        'item_id' => $itemId,
                        'event_type' => 'Maintenance',
                        'event_date' => now(),
                        'notes' => "Bulk status update to '{$newStatus}' by {$user->name}"
                    ]);
                }
            }

            DB::commit();

            // Invalidate AI cache
            $this->aiService->invalidateCache('item');
            $this->aiService->invalidateCache('inventory');

            return response()->json([
                'message' => 'Items updated successfully',
                'updated_count' => $updated,
                'new_status' => $newStatus,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk status update failed', [
                'error' => $e->getMessage(),
                'item_ids' => $itemIds ?? [],
                'user_id' => $user->id
            ]);
            
            return response()->json([
                'error' => 'Bulk update failed',
                'message' => 'An error occurred while updating items.'
            ], 500);
        }
    }

    /**
     * Bulk update item category
     * POST /api/items/bulk-update-category
     */
    public function bulkUpdateCategory(Request $request)
    {
        $validated = $request->validate([
            'item_ids' => 'required|array|min:1',
            'item_ids.*' => 'required|integer|exists:items,id',
            'category_id' => 'required|integer|exists:categories,id',
        ]);

        $user = $request->user();
        
        try {
            DB::beginTransaction();

            $itemIds = $validated['item_ids'];
            $categoryId = $validated['category_id'];

            // Get category name for logging
            $category = Category::findOrFail($categoryId);

            // Update items
            $updated = Item::whereIn('id', $itemIds)->update([
                'category_id' => $categoryId,
                'updated_at' => now(),
            ]);

            // Log lifecycle events for each item
            foreach ($itemIds as $itemId) {
                if (class_exists('App\Models\ItemLifecycleEvent')) {
                    \App\Models\ItemLifecycleEvent::create([
                        'item_id' => $itemId,
                        'event_type' => 'Maintenance',
                        'event_date' => now(),
                        'notes' => "Bulk category update to '{$category->name}' by {$user->name}"
                    ]);
                }
            }

            DB::commit();

            // Invalidate AI cache
            $this->aiService->invalidateCache('item');
            $this->aiService->invalidateCache('inventory');

            return response()->json([
                'message' => 'Item categories updated successfully',
                'updated_count' => $updated,
                'new_category' => [
                    'id' => $category->id,
                    'name' => $category->name,
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk category update failed', [
                'error' => $e->getMessage(),
                'item_ids' => $itemIds ?? [],
                'category_id' => $categoryId ?? null,
                'user_id' => $user->id
            ]);
            
            return response()->json([
                'error' => 'Bulk update failed',
                'message' => 'An error occurred while updating item categories.'
            ], 500);
        }
    }

    /**
     * Bulk delete items (soft delete)
     * POST /api/items/bulk-delete
     */
    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'item_ids' => 'required|array|min:1',
            'item_ids.*' => 'required|integer|exists:items,id',
        ]);

        $user = $request->user();
        
        try {
            DB::beginTransaction();

            $itemIds = $validated['item_ids'];

            // Check if any items are currently lent
            $lentItems = Item::whereIn('id', $itemIds)
                ->where('status', 'lent')
                ->whereNotNull('current_holder_id')
                ->count();
            
            if ($lentItems > 0) {
                return response()->json([
                    'error' => 'Cannot delete items',
                    'message' => 'Some items are currently lent and cannot be deleted. Please return them first.'
                ], 422);
            }

            // Soft delete items
            $deleted = Item::whereIn('id', $itemIds)->update([
                'status' => 'retired',
                'deleted_at' => now(),
                'updated_at' => now(),
            ]);

            // Log lifecycle events for each item
            foreach ($itemIds as $itemId) {
                if (class_exists('App\Models\ItemLifecycleEvent')) {
                    \App\Models\ItemLifecycleEvent::create([
                        'item_id' => $itemId,
                        'event_type' => 'retired',
                        'event_date' => now(),
                        'notes' => "Bulk deletion by {$user->name}"
                    ]);
                }
            }

            DB::commit();

            // Invalidate AI cache
            $this->aiService->invalidateCache('item');
            $this->aiService->invalidateCache('inventory');

            return response()->json([
                'message' => 'Items deleted successfully',
                'deleted_count' => $deleted,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk delete failed', [
                'error' => $e->getMessage(),
                'item_ids' => $itemIds ?? [],
                'user_id' => $user->id
            ]);
            
            return response()->json([
                'error' => 'Bulk delete failed',
                'message' => 'An error occurred while deleting items.'
            ], 500);
        }
    }

    /**
     * Export inventory items to CSV format
     */
    public function export(Request $request)
    {
        try {
            $format = $request->get('format', 'csv'); // csv, json, excel
            
            $query = Item::with(['category', 'vendor', 'currentHolder'])
                ->where('is_active', true);

            // Apply filters
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }
            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('inventory_number', 'like', "%{$search}%")
                      ->orWhere('name', 'like', "%{$search}%");
                });
            }

            $items = $query->get();

            // Handle different export formats
            if ($format === 'json') {
                return $this->exportJson($items);
            } elseif ($format === 'excel') {
                return $this->exportExcel($items);
            } else {
                return $this->exportCsv($items);
            }

        } catch (\Exception $e) {
            Log::error('Export failed', ['error' => $e->getMessage()]);
            return response()->json([
                'error' => 'Export failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    private function exportCsv($items)
    {
        $filename = 'inventory_export_' . date('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function() use ($items) {
            $file = fopen('php://output', 'w');
            
            // CSV Headers
            fputcsv($file, [
                'Inventory Number',
                'Name',
                'Category',
                'Vendor',
                'Location',
                'Status',
                'Condition',
                'Current Holder',
                'Purchase Value',
                'Warranty Expiry',
                'Created At'
            ]);

            // Data Rows
            foreach ($items as $item) {
                fputcsv($file, [
                    $item->inventory_number,
                    $item->name,
                    $item->category->category_name ?? 'N/A',
                    $item->vendor->vendor_name ?? 'N/A',
                    $item->location,
                    $item->status,
                    $item->condition_status ?? 'N/A',
                    $item->currentHolder->name ?? 'N/A',
                    $item->purchase_value ?? '0.00',
                    $item->warranty_expiry_date ?? 'N/A',
                    $item->created_at->format('Y-m-d')
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    private function exportJson($items)
    {
        $filename = 'inventory_export_' . date('Y-m-d_His') . '.json';
        
        $data = $items->map(function($item) {
            return [
                'inventory_number' => $item->inventory_number,
                'name' => $item->name,
                'category' => $item->category->category_name ?? 'N/A',
                'vendor' => $item->vendor->vendor_name ?? 'N/A',
                'location' => $item->location,
                'status' => $item->status,
                'condition' => $item->condition_status ?? 'N/A',
                'current_holder' => $item->currentHolder->name ?? 'N/A',
                'purchase_value' => $item->purchase_value ?? 0,
                'warranty_expiry' => $item->warranty_expiry_date,
                'created_at' => $item->created_at->format('Y-m-d')
            ];
        });

        return response()->json($data)
            ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
    }

    private function exportExcel($items)
    {
        // Excel export - same as CSV but with .xls extension
        // For true Excel support, use PhpSpreadsheet package
        $filename = 'inventory_export_' . date('Y-m-d_His') . '.xls';
        $headers = [
            'Content-Type' => 'application/vnd.ms-excel',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function() use ($items) {
            $file = fopen('php://output', 'w');
            
            // Excel Headers (tab-separated)
            fputcsv($file, [
                'Inventory Number',
                'Name',
                'Category',
                'Vendor',
                'Location',
                'Status',
                'Condition',
                'Current Holder',
                'Purchase Value',
                'Warranty Expiry',
                'Created At'
            ], "\t");

            // Data Rows
            foreach ($items as $item) {
                fputcsv($file, [
                    $item->inventory_number,
                    $item->name,
                    $item->category->category_name ?? 'N/A',
                    $item->vendor->vendor_name ?? 'N/A',
                    $item->location,
                    $item->status,
                    $item->condition_status ?? 'N/A',
                    $item->currentHolder->name ?? 'N/A',
                    $item->purchase_value ?? '0.00',
                    $item->warranty_expiry_date ?? 'N/A',
                    $item->created_at->format('Y-m-d')
                ], "\t");
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}