<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\Transaction;
use App\Models\MaintenanceRequest;
use App\Models\PurchaseRequest;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * ReportController
 * 
 * Handles all reporting endpoints as per SRS Section 3.5 (FR-5)
 * Provides inventory, transaction, maintenance, and statistical reports
 */
class ReportController extends Controller
{
    /**
     * FR-5.1: Generate Inventory Summary Report
     * 
     * Provides comprehensive overview of inventory status, categories, and values
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function inventorySummary()
    {
        // Total items by status
        $statusCounts = Item::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status');

        // Total items by category
        $categoryBreakdown = Item::select('item_categories.category_name as category', DB::raw('count(items.id) as count'))
            ->join('item_categories', 'items.category_id', '=', 'item_categories.id')
            ->groupBy('item_categories.category_name')
            ->get();

        // Total items by condition
        $conditionCounts = Item::select('condition_status', DB::raw('count(*) as count'))
            ->groupBy('condition_status')
            ->get()
            ->pluck('count', 'condition_status');

        // Total items by acquisition method
        $acquisitionCounts = Item::select('acquisition_method', DB::raw('count(*) as count'))
            ->groupBy('acquisition_method')
            ->get()
            ->pluck('count', 'acquisition_method');

        // Financial summary
        $financialSummary = Item::select(
            DB::raw('SUM(purchase_value) as total_purchase_value'),
            DB::raw('SUM(current_value) as total_current_value'),
            DB::raw('AVG(purchase_value) as avg_purchase_value'),
            DB::raw('COUNT(CASE WHEN status = "available" THEN 1 END) as available_count'),
            DB::raw('COUNT(CASE WHEN status = "lent" THEN 1 END) as lent_count'),
            DB::raw('COUNT(CASE WHEN status = "maintenance" THEN 1 END) as maintenance_count'),
            DB::raw('COUNT(CASE WHEN status = "retired" THEN 1 END) as retired_count')
        )->first();

        // Items with expiring warranties (next 30 days)
        $expiringWarranties = Item::where('warranty_expiry_date', '>=', now())
            ->where('warranty_expiry_date', '<=', now()->addDays(30))
            ->count();

        // Items with expired warranties
        $expiredWarranties = Item::where('warranty_expiry_date', '<', now())
            ->whereNotNull('warranty_expiry_date')
            ->count();

        return response()->json([
            'report_type' => 'inventory_summary',
            'generated_at' => now()->toISOString(),
            'summary' => [
                'total_items' => Item::count(),
                'active_items' => Item::where('is_active', true)->count(),
                'inactive_items' => Item::where('is_active', false)->count(),
            ],
            'by_status' => $statusCounts,
            'by_category' => $categoryBreakdown,
            'by_condition' => $conditionCounts,
            'by_acquisition' => $acquisitionCounts,
            'financial' => [
                'total_purchase_value' => round((float)$financialSummary->total_purchase_value, 2),
                'total_current_value' => round((float)$financialSummary->total_current_value, 2),
                'total_depreciation' => round((float)$financialSummary->total_purchase_value - (float)$financialSummary->total_current_value, 2),
                'average_item_value' => round((float)$financialSummary->avg_purchase_value, 2),
            ],
            'status_breakdown' => [
                'available' => $financialSummary->available_count,
                'lent' => $financialSummary->lent_count,
                'maintenance' => $financialSummary->maintenance_count,
                'retired' => $financialSummary->retired_count,
            ],
            'warranty_status' => [
                'expiring_soon' => $expiringWarranties,
                'expired' => $expiredWarranties,
            ],
        ], 200);
    }

    /**
     * FR-5.2: Generate Transaction History Report
     * 
     * Provides detailed transaction history with optional filters
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function transactionHistory(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'nullable|in:active,returned,overdue',
            'user_id' => 'nullable|exists:users,id',
            'item_id' => 'nullable|exists:items,id',
            'limit' => 'nullable|integer|min:1|max:1000',
        ]);

        $query = Transaction::with(['item', 'user']);

        // Apply date filters
        if (isset($validated['start_date'])) {
            $query->where('checkout_date', '>=', $validated['start_date']);
        }
        if (isset($validated['end_date'])) {
            $query->where('checkout_date', '<=', $validated['end_date']);
        }

        // Apply status filter
        if (isset($validated['status'])) {
            switch ($validated['status']) {
                case 'active':
                    $query->whereNull('return_date');
                    break;
                case 'returned':
                    $query->whereNotNull('return_date');
                    break;
                case 'overdue':
                    $query->whereNull('return_date')
                          ->where('due_date', '<', now());
                    break;
            }
        }

        // Apply user/item filters
        if (isset($validated['user_id'])) {
            $query->where('user_id', $validated['user_id']);
        }
        if (isset($validated['item_id'])) {
            $query->where('item_id', $validated['item_id']);
        }

        $limit = $validated['limit'] ?? 100;
        $transactions = $query->orderBy('checkout_date', 'desc')->limit($limit)->get();

        // Statistics
        $totalTransactions = $query->count();
        $activeLoans = Transaction::whereNull('return_date')->count();
        $returnedItems = Transaction::whereNotNull('return_date')->count();
        $overdueItems = Transaction::whereNull('return_date')
            ->where('due_date', '<', now())
            ->count();

        return response()->json([
            'report_type' => 'transaction_history',
            'generated_at' => now()->toISOString(),
            'filters' => $validated,
            'statistics' => [
                'total_transactions' => $totalTransactions,
                'active_loans' => $activeLoans,
                'returned_items' => $returnedItems,
                'overdue_items' => $overdueItems,
            ],
            'transactions' => $transactions,
            'result_count' => $transactions->count(),
        ], 200);
    }

    /**
     * FR-5.3: Generate Overdue Items Report
     * 
     * Lists all items that are currently overdue for return
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function overdueItems()
    {
        $overdueTransactions = Transaction::with(['item', 'user'])
            ->whereNull('return_date')
            ->where('due_date', '<', now())
            ->orderBy('due_date', 'asc')
            ->get();

        // Calculate days overdue for each transaction
        $overdueDetails = $overdueTransactions->map(function ($transaction) {
            $daysOverdue = now()->diffInDays($transaction->due_date);
            
            return [
                'transaction_id' => $transaction->id,
                'item' => [
                    'id' => $transaction->item->id,
                    'name' => $transaction->item->name,
                    'inventory_number' => $transaction->item->inventory_number,
                ],
                'user' => [
                    'id' => $transaction->user->id,
                    'name' => $transaction->user->name,
                    'email' => $transaction->user->email,
                ],
                'checkout_date' => $transaction->checkout_date->toISOString(),
                'due_date' => $transaction->due_date->toISOString(),
                'days_overdue' => $daysOverdue,
                'severity' => $daysOverdue < 7 ? 'low' : ($daysOverdue < 14 ? 'medium' : 'high'),
            ];
        });

        // Group by severity
        $bySeverity = [
            'low' => $overdueDetails->where('severity', 'low')->count(),
            'medium' => $overdueDetails->where('severity', 'medium')->count(),
            'high' => $overdueDetails->where('severity', 'high')->count(),
        ];

        return response()->json([
            'report_type' => 'overdue_items',
            'generated_at' => now()->toISOString(),
            'summary' => [
                'total_overdue' => $overdueDetails->count(),
                'by_severity' => $bySeverity,
            ],
            'overdue_items' => $overdueDetails,
        ], 200);
    }

    /**
     * FR-5.4: Generate Maintenance Schedule Report
     * 
     * Provides overview of maintenance requests and schedules
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function maintenanceSchedule(Request $request)
    {
        $validated = $request->validate([
            'status' => 'nullable|in:pending,in_progress,completed,cancelled',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $query = MaintenanceRequest::with(['item', 'requester', 'assignee']);

        // Apply filters
        if (isset($validated['status'])) {
            $query->where('status', $validated['status']);
        }
        if (isset($validated['priority'])) {
            $query->where('priority', $validated['priority']);
        }
        if (isset($validated['start_date'])) {
            $query->where('created_at', '>=', $validated['start_date']);
        }
        if (isset($validated['end_date'])) {
            $query->where('created_at', '<=', $validated['end_date']);
        }

        $requests = $query->orderBy('priority', 'desc')
                          ->orderBy('created_at', 'desc')
                          ->get();

        // Statistics
        $stats = [
            'total_requests' => MaintenanceRequest::count(),
            'by_status' => MaintenanceRequest::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get()
                ->pluck('count', 'status'),
            'by_priority' => MaintenanceRequest::select('priority', DB::raw('count(*) as count'))
                ->groupBy('priority')
                ->get()
                ->pluck('count', 'priority'),
            'pending_requests' => MaintenanceRequest::where('status', 'pending')->count(),
            'in_progress_requests' => MaintenanceRequest::where('status', 'in_progress')->count(),
            'completed_today' => MaintenanceRequest::where('status', 'completed')
                ->whereDate('completed_date', today())
                ->count(),
            'avg_resolution_time' => MaintenanceRequest::whereNotNull('completed_date')
                ->selectRaw('AVG(TIMESTAMPDIFF(HOUR, created_at, completed_date)) as avg_hours')
                ->value('avg_hours'),
        ];

        return response()->json([
            'report_type' => 'maintenance_schedule',
            'generated_at' => now()->toISOString(),
            'filters' => $validated,
            'statistics' => $stats,
            'maintenance_requests' => $requests,
            'result_count' => $requests->count(),
        ], 200);
    }

    /**
     * Dashboard Statistics Summary
     * 
     * Provides quick overview statistics for dashboard
     * Role-based: Managers see system-wide stats, Staff see only their own stats
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function dashboardStats(Request $request)
    {
        $user = $request->user();
        
        // Load role relation to ensure it's available
        $user->load('role');
        
        // Yönetim hesapları (Admin & Inventory Manager) - Sistem geneli istatistikler
        if ($user->hasRole('Admin') || $user->hasRole('Inventory Manager')) {
            return response()->json([
                'inventory' => [
                    'total_items' => Item::count(),
                    'available' => Item::where('status', 'available')->count(),
                    'lent' => Item::where('status', 'lent')->count(),
                    'maintenance' => Item::where('status', 'maintenance')->count(),
                ],
                'transactions' => [
                    'active_loans' => Transaction::whereNull('return_date')->count(),
                    'overdue' => Transaction::whereNull('return_date')
                        ->where('due_date', '<', now())
                        ->count(),
                    'returned_today' => Transaction::whereDate('return_date', today())->count(),
                ],
                'maintenance' => [
                    'pending' => MaintenanceRequest::where('status', 'pending')->count(),
                    'in_progress' => MaintenanceRequest::where('status', 'in_progress')->count(),
                    'high_priority' => MaintenanceRequest::where('priority', 'high')
                        ->orWhere('priority', 'urgent')
                        ->whereIn('status', ['pending', 'in_progress'])
                        ->count(),
                ],
                'generated_at' => now()->toISOString(),
            ], 200);
        }
        
        // Staff kullanıcıları - Sadece kendi istatistikleri
        return response()->json([
            'my_loans' => [
                'active' => Transaction::where('user_id', $user->id)
                    ->whereNull('return_date')
                    ->count(),
                'overdue' => Transaction::where('user_id', $user->id)
                    ->whereNull('return_date')
                    ->where('due_date', '<', now())
                    ->count(),
                'total' => Transaction::where('user_id', $user->id)->count(),
            ],
            'my_requests' => [
                'purchase' => PurchaseRequest::where('requested_by', $user->id)
                    ->whereIn('status', ['pending', 'approved', 'ordered'])
                    ->count(),
                'maintenance' => MaintenanceRequest::where('requested_by', $user->id)
                    ->whereIn('status', ['pending', 'in_progress'])
                    ->count(),
            ],
            'generated_at' => now()->toISOString(),
        ], 200);
    }
}
