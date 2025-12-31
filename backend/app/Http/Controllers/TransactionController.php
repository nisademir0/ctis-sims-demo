<?php

namespace App\Http\Controllers;

use App\Http\Requests\Transaction\IndexTransactionRequest;
use App\Http\Requests\Transaction\CheckoutItemRequest;
use App\Http\Requests\Transaction\ReturnItemRequest;
use App\Services\TransactionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Models\Transaction;
use App\Models\Item;
use App\Models\ItemLifecycleEvent;
use App\Models\MaintenanceRequest;
use Carbon\Carbon;

class TransactionController extends Controller
{
    protected TransactionService $transactionService;

    public function __construct(TransactionService $transactionService)
    {
        $this->transactionService = $transactionService;
    }
    
    /**
     * SRS FR-3.1: Check out item to user
     * 
     * @param CheckoutItemRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkout(CheckoutItemRequest $request)
    {
        try {
            $validated = $request->validated();
            
            // Support both 'due_date' and 'expected_return_date' for compatibility
            $dueDateInput = $validated['due_date'] ?? $validated['expected_return_date'] ?? null;
            $dueDate = $dueDateInput 
                ? Carbon::parse($dueDateInput) 
                : Carbon::now()->addDays(14); // Default: 2 weeks
            
            $transaction = $this->transactionService->checkOutItem(
                itemId: $validated['item_id'],
                userId: $validated['user_id'],
                dueDate: $dueDate,
                notes: $validated['notes'] ?? null
            );

            return response()->json([
                'message' => 'Item checked out successfully',
                'data' => $transaction,
                'due_date' => $dueDate->format('Y-m-d H:i:s'),
            ], 201);

        } catch (\Exception $e) {
            Log::error('Checkout failed', [
                'error' => $e->getMessage(),
                'item_id' => $request->input('item_id'),
                'user_id' => $request->input('user_id')
            ]);
            
            return response()->json([
                'error' => 'Checkout failed',
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * SRS FR-3.2: Return (check in) item
     * 
     * @param ReturnItemRequest $request
     * @param int $transactionId
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkin(ReturnItemRequest $request, $transactionId)
    {
        try {
            $validated = $request->validated();
            
            // Get condition from request (maps to our new enum)
            $condition = $validated['return_condition'] ?? 'good';
            $notes = $validated['return_notes'] ?? $validated['condition_notes'] ?? null;
            
            // Use service to handle return
            $transaction = $this->transactionService->returnItem(
                transactionId: $transactionId,
                condition: $condition,
                notes: $notes
            );
            
            // Auto-create maintenance request if damaged
            $maintenanceRequest = null;
            if (in_array($condition, ['poor', 'damaged'])) {
                $maintenanceRequest = MaintenanceRequest::create([
                    'item_id' => $transaction->item_id,
                    'requested_by' => Auth::id(),
                    'maintenance_type' => $validated['maintenance_type'] ?? 'hardware_failure',
                    'priority' => $validated['maintenance_priority'] ?? 'high',
                    'status' => 'pending',
                    'description' => $validated['damage_description'] 
                        ?? "Item returned in {$condition} condition. Requires inspection."
                ]);
                
                Log::info('Maintenance request auto-created for damaged return', [
                    'transaction_id' => $transaction->id,
                    'item_id' => $transaction->item_id,
                    'maintenance_request_id' => $maintenanceRequest->id
                ]);
            }

            return response()->json([
                'message' => $transaction->status === 'late_return' 
                    ? 'Item returned late. Late fee applied.'
                    : 'Item returned successfully',
                'data' => $transaction,
                'was_overdue' => $transaction->status === 'late_return',
                'days_overdue' => $transaction->daysOverdue(),
                'late_fee' => $transaction->late_fee,
                'maintenance_request' => $maintenanceRequest ? $maintenanceRequest->load('item') : null
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Transaction not found',
                'message' => 'No active transaction found with this ID.'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Return failed', [
                'error' => $e->getMessage(),
                'transaction_id' => $transactionId
            ]);
            
            return response()->json([
                'error' => 'Return failed',
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * SRS FR-3.3: Get transaction history
     * 
     * @param IndexTransactionRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(IndexTransactionRequest $request)
    {
        try {
            $validated = $request->validated();
            $user = $request->user();
            
            // Build filters
            $filters = [
                'status' => $validated['status'] ?? null,
                'date_from' => $validated['date_from'] ?? null,
                'date_to' => $validated['date_to'] ?? null,
                'search' => $validated['search'] ?? null,
                'per_page' => $validated['per_page'] ?? 20,
            ];
            
            // Role-based filtering
            if ($user->role->role_name === 'Staff') {
                // Staff users only see their own transactions
                $transactions = $this->transactionService->getTransactionHistory($user->id, $filters);
            } else {
                // Admin/Manager can specify user or see all
                $filters['user_id'] = $validated['user_id'] ?? null;
                $transactions = $this->transactionService->getAllTransactions($filters);
            }
            
            // Add computed fields to items
            $items = collect($transactions->items())->map(function ($transaction) {
                $transaction->is_overdue = $transaction->isOverdue();
                $transaction->days_overdue = $transaction->daysOverdue();
                return $transaction;
            });

            return response()->json([
                'data' => $items->toArray(),
                'meta' => [
                    'current_page' => $transactions->currentPage(),
                    'last_page' => $transactions->lastPage(),
                    'per_page' => $transactions->perPage(),
                    'total' => $transactions->total(),
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Transaction index failed', ['error' => $e->getMessage()]);
            return response()->json([
                'error' => 'Failed to fetch transactions',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * SRS FR-3.5: Get overdue items
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function overdue()
    {
        try {
            $overdueTransactions = $this->transactionService->getOverdueTransactions();

            // Calculate severity and add metadata
            $overdueTransactions = $overdueTransactions->map(function($transaction) {
                $daysOverdue = $transaction->daysOverdue();
            
            // Determine severity level
            $severity = 'medium';
            if ($daysOverdue > 30) {
                $severity = 'critical';
            } elseif ($daysOverdue > 14) {
                $severity = 'high';
            }
            
            return [
                'transaction' => $transaction,
                'days_overdue' => $daysOverdue,
                'severity' => $severity,
                'overdue_weeks' => ceil($daysOverdue / 7)
            ];
        });

            return response()->json([
                'overdue_count' => $overdueTransactions->count(),
                'transactions' => $overdueTransactions,
                'severity_breakdown' => [
                    'critical' => $overdueTransactions->where('severity', 'critical')->count(),
                    'high' => $overdueTransactions->where('severity', 'high')->count(),
                    'medium' => $overdueTransactions->where('severity', 'medium')->count()
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Overdue transactions failed', ['error' => $e->getMessage()]);
            return response()->json([
                'error' => 'Failed to fetch overdue transactions',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get current active loans for authenticated user
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function myLoans(Request $request)
    {
        $user = $request->user();

        $activeLoans = Transaction::with('item.category')
            ->where('user_id', $user->id)
            ->whereNull('return_date')
            ->get();

        // Add due date info
        $activeLoans = $activeLoans->map(function($loan) {
            $loan->is_overdue = false;
            $loan->days_until_due = 0;
            
            if ($loan->due_date) {
                $loan->days_until_due = now()->diffInDays($loan->due_date, false);
                $loan->is_overdue = $loan->days_until_due < 0;
            }
            
            return $loan;
        });

        return response()->json([
            'active_loans' => $activeLoans,
            'total_items' => $activeLoans->count(),
            'overdue_items' => $activeLoans->where('is_overdue', true)->count()
        ]);
    }

    /**
     * Get transaction statistics (for dashboard)
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function stats()
    {
        $stats = [
            'active_loans' => Transaction::whereNull('return_date')->count(),
            'overdue_items' => Transaction::whereNull('return_date')
                ->where('due_date', '<', now())
                ->count(),
            'total_transactions_today' => Transaction::whereDate('checkout_date', today())->count(),
            'total_returns_today' => Transaction::whereDate('return_date', today())->count(),
            'total_transactions_this_month' => Transaction::whereMonth('checkout_date', now()->month)
                ->whereYear('checkout_date', now()->year)
                ->count()
        ];

        return response()->json($stats);
    }

    /**
     * Extend transaction due date
     * SRS FR-3.6: Extend loan period
     * 
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function extend(Request $request, $id)
    {
        $validated = $request->validate([
            'new_due_date' => 'required|date|after:today',
            'reason' => 'nullable|string|max:500'
        ], [
            'new_due_date.required' => 'Yeni bitiş tarihi zorunludur',
            'new_due_date.date' => 'Geçerli bir tarih giriniz',
            'new_due_date.after' => 'Yeni bitiş tarihi bugünden sonra olmalıdır'
        ]);

        try {
            $transaction = Transaction::with('item', 'user')->findOrFail($id);

            // Check if transaction is active
            if ($transaction->status !== 'active') {
                return response()->json([
                    'message' => 'Sadece aktif işlemler uzatılabilir'
                ], 400);
            }

            // Check authorization
            $user = $request->user()->load('role');
            $isAdmin = $user->role && in_array($user->role->role_name, ['Admin', 'Inventory Manager']);
            $isOwner = $transaction->user_id === $user->id;
            $canExtend = $isAdmin || $isOwner;

            if (!$canExtend) {
                return response()->json([
                    'message' => 'Bu işlemi uzatma yetkiniz yok'
                ], 403);
            }

            // Update due date
            $oldDueDate = $transaction->due_date;
            $transaction->due_date = $validated['new_due_date'];
            
            // Add note if provided
            if (isset($validated['reason'])) {
                $transaction->notes = ($transaction->notes ?? '') . "\n[" . now()->format('Y-m-d H:i') . "] Süre uzatıldı: " . $validated['reason'];
            }

            $transaction->save();

            Log::info('Transaction extended', [
                'transaction_id' => $id,
                'old_due_date' => $oldDueDate,
                'new_due_date' => $validated['new_due_date'],
                'extended_by' => $user->id,
                'reason' => $validated['reason'] ?? null
            ]);

            return response()->json([
                'success' => true,
                'message' => 'İşlem süresi başarıyla uzatıldı',
                'data' => $transaction->fresh()->load('item', 'user')
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'İşlem bulunamadı'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Transaction extend failed', [
                'error' => $e->getMessage(),
                'transaction_id' => $id
            ]);
            return response()->json([
                'message' => 'İşlem uzatılırken bir hata oluştu'
            ], 500);
        }
    }

    /**
     * Cancel transaction
     * SRS FR-3.7: Cancel loan
     * 
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function cancel(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'required|string|min:10|max:500'
        ], [
            'reason.required' => 'İptal nedeni zorunludur',
            'reason.min' => 'İptal nedeni en az 10 karakter olmalıdır',
            'reason.max' => 'İptal nedeni en fazla 500 karakter olmalıdır'
        ]);

        DB::beginTransaction();
        try {
            $transaction = Transaction::with('item', 'user')->findOrFail($id);

            // Check if transaction is active
            if ($transaction->status !== 'active') {
                return response()->json([
                    'message' => 'Sadece aktif işlemler iptal edilebilir'
                ], 400);
            }

            // Check authorization
            $user = $request->user()->load('role');
            $isAdmin = $user->role && in_array($user->role->role_name, ['Admin', 'Inventory Manager']);
            $isOwner = $transaction->user_id === $user->id;
            $canCancel = $isAdmin || $isOwner;

            if (!$canCancel) {
                return response()->json([
                    'message' => 'Bu işlemi iptal etme yetkiniz yok'
                ], 403);
            }

            // Update transaction status
            $transaction->status = 'cancelled';
            $transaction->return_date = now();
            $transaction->notes = ($transaction->notes ?? '') . "\n[" . now()->format('Y-m-d H:i') . "] İptal edildi: " . $validated['reason'];
            $transaction->save();

            // Return item to inventory
            $item = $transaction->item;
            $item->status = 'available';
            $item->current_holder_id = null;
            $item->save();

            Log::info('Transaction cancelled', [
                'transaction_id' => $id,
                'item_id' => $item->id,
                'cancelled_by' => $user->id,
                'reason' => $validated['reason']
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'İşlem başarıyla iptal edildi',
                'data' => $transaction->fresh()->load('item', 'user')
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'İşlem bulunamadı'
            ], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Transaction cancel failed', [
                'error' => $e->getMessage(),
                'transaction_id' => $id
            ]);
            return response()->json([
                'message' => 'İşlem iptal edilirken bir hata oluştu'
            ], 500);
        }
    }
}
