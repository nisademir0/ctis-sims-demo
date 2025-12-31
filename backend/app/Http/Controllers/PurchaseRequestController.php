<?php

namespace App\Http\Controllers;

use App\Http\Requests\PurchaseRequest\IndexPurchaseRequestRequest;
use App\Http\Requests\PurchaseRequest\StorePurchaseRequestRequest;
use App\Http\Requests\PurchaseRequest\UpdatePurchaseRequestRequest;
use App\Http\Requests\PurchaseRequest\ApprovePurchaseRequestRequest;
use App\Http\Requests\PurchaseRequest\RejectPurchaseRequestRequest;
use App\Http\Requests\PurchaseRequest\MarkAsOrderedRequest;
use App\Http\Requests\PurchaseRequest\MarkAsReceivedRequest;
use App\Http\Requests\PurchaseRequest\UpdatePurchaseStatusRequest;
use App\Models\PurchaseRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Purchase Request Controller
 * 
 * Handles purchase request workflow
 * CB-7: All roles can submit, Admin + Manager can approve/reject
 * Workflow: pending → approved/rejected → ordered → received
 */
class PurchaseRequestController extends Controller
{
    /**
     * Get all purchase requests with filters
     * Role-based: Staff only sees their own requests, Managers see all
     */
    public function index(IndexPurchaseRequestRequest $request)
    {
        $validated = $request->validated();
        $user = $request->user();
        $query = PurchaseRequest::with(['requester', 'approver']);

        // ROLE-BASED FILTERING
        // Staff kullanıcıları sadece kendi oluşturduğu talepleri görsün
        if ($user->hasRole('Staff')) {
            $query->where('requested_by', $user->id);
        }
        // Admin ve Inventory Manager tüm talepleri görür (filtreleme yok)

        // Filter by status
        if (isset($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        // Filter by priority
        if (isset($validated['priority'])) {
            $query->where('priority', $validated['priority']);
        }

        // Sort by priority and created date
        $query->orderByRaw("CASE priority 
            WHEN 'urgent' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            WHEN 'low' THEN 4 
            END")
            ->orderBy('created_at', 'desc');

        $requests = $query->paginate(20);

        return response()->json($requests);
    }

    /**
     * Get a single purchase request
     */
    public function show($id)
    {
        $request = PurchaseRequest::with(['requester', 'approver'])
            ->findOrFail($id);

        return response()->json($request);
    }

    /**
     * Create a new purchase request (all roles can submit)
     */
    public function store(StorePurchaseRequestRequest $request)
    {
        $validated = $request->validated();

        $purchaseRequest = PurchaseRequest::create([
            'item_name' => $validated['item_name'],
            'description' => $validated['description'],
            'category' => $validated['category'] ?? null,
            'quantity' => $validated['quantity'],
            'estimated_cost' => $validated['estimated_cost'] ?? null,
            'justification' => $validated['justification'],
            'requested_by' => Auth::id(),
            'status' => 'pending',
            'priority' => $validated['priority'],
            'needed_by_date' => $validated['needed_by_date'] ?? null
        ]);

        // TODO: Send email notification to managers

        return response()->json([
            'success' => true,
            'message' => 'Satın alma talebi başarıyla oluşturuldu. Yöneticiler tarafından incelenecektir.',
            'data' => $purchaseRequest->load(['requester'])
        ], 201);
    }

    /**
     * Update a purchase request (only requester or admin/manager)
     */
    public function update(UpdatePurchaseRequestRequest $request, $id)
    {
        $purchaseRequest = PurchaseRequest::findOrFail($id);

        // Only the requester can update if status is pending
        if ($purchaseRequest->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Sadece beklemedeki talepler düzenlenebilir'
            ], 422);
        }

        $validated = $request->validated();
        $purchaseRequest->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Satın alma talebi güncellendi',
            'data' => $purchaseRequest->load(['requester'])
        ]);
    }

    /**
     * Approve a purchase request (Admin + Manager only)
     */
    public function approve(ApprovePurchaseRequestRequest $request, $id)
    {
        $validated = $request->validated();
        $purchaseRequest = PurchaseRequest::findOrFail($id);

        if (!$purchaseRequest->canBeApproved()) {
            return response()->json([
                'success' => false,
                'message' => 'Bu talep onaylanamaz. Durum: ' . $purchaseRequest->status
            ], 422);
        }

        // Use approved_cost from request or default to estimated_cost
        $approvedCost = $validated['approved_cost'] ?? $purchaseRequest->estimated_cost;

        $oldStatus = $purchaseRequest->status;
        
        $purchaseRequest->update([
            'status' => 'approved',
            'approved_by' => Auth::id(),
            'reviewed_by' => Auth::id(),
            'approved_cost' => $approvedCost,
            'approved_date' => now(),
            'notes' => $validated['notes'] ?? null
        ]);

        // Send email notification to requester
        $requester = $purchaseRequest->requester;
        if ($requester) {
            $requester->notify(new \App\Notifications\PurchaseRequestStatusChanged(
                $purchaseRequest,
                $oldStatus,
                'approved'
            ));
        }

        return response()->json([
            'success' => true,
            'message' => 'Satın alma talebi onaylandı ve bildirim gönderildi',
            'data' => $purchaseRequest->load(['requester', 'approver'])
        ]);
    }

    /**
     * Reject a purchase request (Admin + Manager only)
     */
    public function reject(RejectPurchaseRequestRequest $request, $id)
    {
        $validated = $request->validated();
        $purchaseRequest = PurchaseRequest::findOrFail($id);

        if (!$purchaseRequest->canBeApproved()) {
            return response()->json([
                'success' => false,
                'message' => 'Bu talep reddedilemez. Durum: ' . $purchaseRequest->status
            ], 422);
        }

        $oldStatus = $purchaseRequest->status;

        $purchaseRequest->update([
            'status' => 'rejected',
            'reviewed_by' => Auth::id(),
            'rejection_reason' => $validated['rejection_reason']
        ]);

        // Send email notification to requester
        $requester = $purchaseRequest->requester;
        if ($requester) {
            $requester->notify(new \App\Notifications\PurchaseRequestStatusChanged(
                $purchaseRequest,
                $oldStatus,
                'rejected'
            ));
        }

        return response()->json([
            'success' => true,
            'message' => 'Satın alma talebi reddedildi ve bildirim gönderildi',
            'data' => $purchaseRequest->load(['requester', 'approver'])
        ]);
    }

    /**
     * Mark as ordered (Admin + Manager only)
     */
    public function markAsOrdered(MarkAsOrderedRequest $request, $id)
    {
        $validated = $request->validated();
        $purchaseRequest = PurchaseRequest::findOrFail($id);

        if (!$purchaseRequest->canBeOrdered()) {
            return response()->json([
                'success' => false,
                'message' => 'Bu talep sipariş edilemez. Durum: ' . $purchaseRequest->status
            ], 422);
        }

        $oldStatus = $purchaseRequest->status;

        $purchaseRequest->update([
            'status' => 'ordered',
            'vendor' => $validated['vendor'] ?? null,
            'vendor_id' => $validated['vendor_id'] ?? null,
            'actual_cost' => $validated['actual_cost'] ?? null,
            'expected_delivery_date' => $validated['expected_delivery_date'] ?? null,
            'ordered_date' => now(),
            'notes' => $validated['notes'] ?? null
        ]);

        // Send notification to requester
        $requester = $purchaseRequest->requester;
        if ($requester) {
            $requester->notify(new \App\Notifications\PurchaseRequestStatusChanged(
                $purchaseRequest,
                $oldStatus,
                'ordered'
            ));
        }

        return response()->json([
            'success' => true,
            'message' => 'Satın alma talebi sipariş edildi ve bildirim gönderildi',
            'data' => $purchaseRequest->load(['requester', 'approver'])
        ]);
    }

    /**
     * Mark as received and create items (Admin + Manager only)
     */
    public function markAsReceived(MarkAsReceivedRequest $request, $id)
    {
        $validated = $request->validated();
        $purchaseRequest = PurchaseRequest::findOrFail($id);

        if (!$purchaseRequest->canBeReceived()) {
            return response()->json([
                'success' => false,
                'message' => 'Bu talep teslim alınamaz. Durum: ' . $purchaseRequest->status
            ], 422);
        }

        $actualCost = $validated['actual_cost'] ?? $purchaseRequest->actual_cost ?? $purchaseRequest->estimated_cost;
        $oldStatus = $purchaseRequest->status;

        $purchaseRequest->update([
            'status' => 'received',
            'actual_cost' => $actualCost,
            'actual_quantity' => $validated['actual_quantity'],
            'received_date' => now(),
            'notes' => $validated['notes'] ?? null
        ]);

        // Send notification to requester
        $requester = $purchaseRequest->requester;
        if ($requester) {
            $requester->notify(new \App\Notifications\PurchaseRequestStatusChanged(
                $purchaseRequest,
                $oldStatus,
                'received'
            ));
        }

        // TODO: Optionally auto-create items in inventory
        // This could be a separate endpoint or feature

        return response()->json([
            'success' => true,
            'message' => 'Satın alma talebi teslim alındı ve bildirim gönderildi',
            'data' => $purchaseRequest->load(['requester', 'approver'])
        ]);
    }

    /**
     * Cancel a purchase request (requester or admin/manager)
     */
    public function cancel($id)
    {
        $purchaseRequest = PurchaseRequest::findOrFail($id);

        // Only pending or approved requests can be cancelled
        if (!in_array($purchaseRequest->status, ['pending', 'approved'])) {
            return response()->json([
                'success' => false,
                'message' => 'Bu durumda olan talepler iptal edilemez'
            ], 422);
        }

        // Check permission
        if ($purchaseRequest->requested_by !== Auth::id() && 
            !in_array(Auth::user()->role, ['admin', 'inventory_manager'])) {
            return response()->json([
                'success' => false,
                'message' => 'Bu talebi iptal etme yetkiniz yok'
            ], 403);
        }

        $purchaseRequest->update([
            'status' => 'cancelled',
            'rejection_reason' => 'Talep iptal edildi'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Satın alma talebi iptal edildi'
        ]);
    }

    /**
     * Delete a purchase request (soft delete)
     */
    public function destroy($id)
    {
        $purchaseRequest = PurchaseRequest::findOrFail($id);

        // Check permission (only requester or admin/manager)
        if ($purchaseRequest->requested_by !== Auth::id() && 
            !in_array(Auth::user()->role, ['admin', 'inventory_manager'])) {
            return response()->json([
                'success' => false,
                'message' => 'Bu talebi silme yetkiniz yok'
            ], 403);
        }

        // Soft delete by marking as cancelled
        $purchaseRequest->update([
            'status' => 'cancelled',
            'rejection_reason' => 'Silindi'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Satın alma talebi silindi'
        ]);
    }

    /**
     * Get purchase request statistics
     */
    public function statistics()
    {
        $stats = [
            'total' => PurchaseRequest::count(),
            'by_status' => [
                'pending' => PurchaseRequest::pending()->count(),
                'approved' => PurchaseRequest::approved()->count(),
                'rejected' => PurchaseRequest::rejected()->count(),
                'ordered' => PurchaseRequest::ordered()->count(),
                'received' => PurchaseRequest::received()->count()
            ],
            'by_priority' => [
                'urgent' => PurchaseRequest::where('priority', 'urgent')->count(),
                'high' => PurchaseRequest::where('priority', 'high')->count(),
                'medium' => PurchaseRequest::where('priority', 'medium')->count(),
                'low' => PurchaseRequest::where('priority', 'low')->count()
            ],
            'total_estimated_cost' => PurchaseRequest::pending()->sum('estimated_cost') ?? 0,
            'total_approved_cost' => PurchaseRequest::approved()->sum('approved_cost') ?? 0,
            'total_spent' => PurchaseRequest::received()->sum('actual_cost') ?? 0
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}
