<?php

namespace App\Http\Controllers;

use App\Http\Requests\MaintenanceRequest\AssignMaintenanceRequestRequest;
use App\Http\Requests\MaintenanceRequest\StoreMaintenanceRequestRequest;
use App\Http\Requests\MaintenanceRequest\UpdateMaintenanceRequestRequest;
use App\Http\Requests\MaintenanceRequest\CompleteMaintenanceRequestRequest;
use App\Http\Requests\MaintenanceRequest\CancelMaintenanceRequestRequest;
use App\Models\MaintenanceRequest;
use App\Models\Item;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Maintenance Request Controller
 * 
 * Handles CRUD operations for maintenance requests
 * CB-8: Damaged returns auto-create maintenance requests
 * CB-10: Maintenance types: hardware_failure, software_issue, routine_cleaning, consumable_replacement
 */
class MaintenanceRequestController extends Controller
{
    /**
     * Get all maintenance requests with filters
     * Role-based: Staff only sees their own requests, Managers see all
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = MaintenanceRequest::with(['item', 'requester', 'assignee', 'transaction']);

        // ROLE-BASED FILTERING
        // Staff kullanıcıları sadece kendi oluşturduğu veya kendisine atanan talepleri görsün
        if ($user->hasRole('Staff')) {
            $query->where(function($q) use ($user) {
                $q->where('requested_by', $user->id)
                  ->orWhere('assigned_to', $user->id);
            });
        }
        // Admin ve Inventory Manager tüm talepleri görür (filtreleme yok)

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by priority
        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        // Filter by maintenance type
        if ($request->has('maintenance_type')) {
            $query->where('maintenance_type', $request->maintenance_type);
        }

        // Filter by assigned user
        if ($request->has('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        // Sort by priority and created date
        $query->orderByRaw("CASE priority 
            WHEN 'urgent' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            WHEN 'low' THEN 4 
            END")
            ->orderBy('created_at', 'desc');

        // Support custom per_page parameter (default 20)
        $perPage = $request->input('per_page', 20);
        $requests = $query->paginate($perPage);

        return response()->json($requests);
    }

    /**
     * Get a single maintenance request
     */
    public function show($id)
    {
        $request = MaintenanceRequest::with(['item', 'requester', 'assignee', 'transaction'])
            ->findOrFail($id);

        return response()->json($request);
    }

    /**
     * Create a new maintenance request
     */
    public function store(StoreMaintenanceRequestRequest $request)
    {
        // Validation handled by StoreMaintenanceRequestRequest
        $validated = $request->validated();

        $maintenanceRequest = MaintenanceRequest::create([
            'item_id' => $validated['item_id'],
            'requested_by' => Auth::id(),
            'transaction_id' => $validated['transaction_id'] ?? null,
            'maintenance_type' => $validated['maintenance_type'],
            'priority' => $validated['priority'],
            'status' => 'pending',
            'description' => $request->description,
            'scheduled_date' => $request->scheduled_date
        ]);

        // Set SLA for the request
        $slaService = app(\App\Services\SlaService::class);
        $maintenanceRequest = $slaService->setSlaForRequest($maintenanceRequest);
        $maintenanceRequest->refresh();

        // Update item status to maintenance if urgent
        if ($validated['priority'] === 'urgent' || $validated['priority'] === 'critical') {
            $item = Item::find($validated['item_id']);
            if ($item) {
                $item->update(['status' => 'maintenance']);
            }
        }

        $maintenanceRequest->load(['item', 'requester']);
        
        return response()->json([
            'id' => $maintenanceRequest->id,
            'success' => true,
            'message' => 'Bakım talebi başarıyla oluşturuldu',
            'data' => $maintenanceRequest
        ], 201);
    }

    /**
     * Update a maintenance request
     */
    public function update(UpdateMaintenanceRequestRequest $request, $id)
    {
        $maintenanceRequest = MaintenanceRequest::findOrFail($id);

        // Validation handled by UpdateMaintenanceRequestRequest
        $validated = $request->validated();

        $oldStatus = $maintenanceRequest->status;
        $maintenanceRequest->update($validated);
        
        // Refresh to get updated fields from database
        $maintenanceRequest->refresh();

        // Track SLA milestones
        $slaService = app(\App\Services\SlaService::class);
        
        // Record first response if status changed from pending
        if ($oldStatus === 'pending' && $maintenanceRequest->status !== 'pending') {
            $slaService->recordFirstResponse($maintenanceRequest);
        }
        
        // Record resolution if status changed to completed
        if ($maintenanceRequest->status === 'completed' && $oldStatus !== 'completed') {
            $slaService->recordResolution($maintenanceRequest);
        }

        // Refresh again to get SLA tracking fields
        $maintenanceRequest->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Bakım talebi güncellendi',
            'data' => $maintenanceRequest->load(['item', 'requester', 'assignee'])
        ]);
    }

    /**
     * Assign maintenance request to a user
     */
    public function assign(AssignMaintenanceRequestRequest $request, $id)
    {
        // Validation and authorization handled by AssignMaintenanceRequestRequest
        $validated = $request->validated();

        $maintenanceRequest = MaintenanceRequest::findOrFail($id);

        // Only pending or in_progress requests can be assigned
        if (!in_array($maintenanceRequest->status, ['pending', 'in_progress'])) {
            return response()->json([
                'success' => false,
                'message' => 'Bu durumda olan bakım talepleri atanamaz'
            ], 422);
        }

        $maintenanceRequest->update([
            'assigned_to' => $validated['assigned_to'],
            'status' => 'in_progress'
        ]);

        // Send notification to assigned staff
        $assignedUser = User::find($validated['assigned_to']);
        if ($assignedUser) {
            $assignedUser->notify(new \App\Notifications\MaintenanceRequestAssigned(
                $maintenanceRequest,
                Auth::user()
            ));
        }

        return response()->json([
            'success' => true,
            'message' => 'Bakım talebi atandı ve bildirim gönderildi',
            'data' => $maintenanceRequest->load(['item', 'requester', 'assignee'])
        ]);
    }

    /**
     * Mark maintenance request as completed
     */
    public function complete(CompleteMaintenanceRequestRequest $request, $id)
    {
        // Validation handled by CompleteMaintenanceRequestRequest
        $validated = $request->validated();

        $maintenanceRequest = MaintenanceRequest::findOrFail($id);

        // Only in_progress requests can be completed
        if ($maintenanceRequest->status !== 'in_progress') {
            return response()->json([
                'success' => false,
                'message' => 'Sadece devam eden bakım talepleri tamamlanabilir'
            ], 422);
        }

        // Check if user is the assignee (unless admin/inventory_manager)
        $user = $request->user();
        $isAuthorized = ($maintenanceRequest->assigned_to === $user->id) || 
                       $user->hasRole('Admin') || 
                       $user->hasRole('Inventory Manager');
        
        if (!$isAuthorized) {
            return response()->json([
                'success' => false,
                'message' => 'Bu bakım talebini tamamlama yetkiniz yok'
            ], 403);
        }

        $maintenanceRequest->update([
            'status' => 'completed',
            'resolution_notes' => $validated['resolution_notes'],
            'cost' => $validated['cost'] ?? null,
            'completed_date' => now()
        ]);

        // Update item status back to available
        $item = Item::find($maintenanceRequest->item_id);
        if ($item && $item->status === 'maintenance') {
            $item->update(['status' => 'available']);
        }

        // Send notification to requester
        $requester = $maintenanceRequest->requester;
        if ($requester) {
            $requester->notify(new \App\Notifications\MaintenanceRequestCompleted($maintenanceRequest));
        }

        return response()->json([
            'success' => true,
            'message' => 'Bakım talebi tamamlandı, cihaz kullanıma hazır ve bildirim gönderildi',
            'data' => $maintenanceRequest->load(['item', 'requester', 'assignee'])
        ]);
    }

    /**
     * Cancel a maintenance request
     */
    public function cancel(CancelMaintenanceRequestRequest $request, $id)
    {
        $validated = $request->validated();
        $maintenanceRequest = MaintenanceRequest::findOrFail($id);

        // Only pending or in_progress requests can be cancelled
        if (!in_array($maintenanceRequest->status, ['pending', 'in_progress'])) {
            return response()->json([
                'success' => false,
                'message' => 'Bu durumda olan bakım talepleri iptal edilemez'
            ], 422);
        }

        $maintenanceRequest->update([
            'status' => 'cancelled',
            'resolution_notes' => $validated['resolution_notes']
        ]);

        // Update item status back to available if it was in maintenance
        $item = Item::find($maintenanceRequest->item_id);
        if ($item && $item->status === 'maintenance') {
            $item->update(['status' => 'available']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Bakım talebi iptal edildi',
            'data' => $maintenanceRequest->load(['item', 'requester', 'assignee'])
        ]);
    }

    /**
     * Delete a maintenance request (soft delete - mark as cancelled)
     */
    public function destroy($id)
    {
        $maintenanceRequest = MaintenanceRequest::findOrFail($id);

        // Instead of deleting, mark as cancelled (CB-9: soft delete policy)
        $maintenanceRequest->update([
            'status' => 'cancelled',
            'resolution_notes' => 'Silindi'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Bakım talebi silindi'
        ]);
    }

    /**
     * Get maintenance statistics
     */
    public function statistics()
    {
        $slaService = app(\App\Services\SlaService::class);
        
        $stats = [
            'total' => MaintenanceRequest::count(),
            'by_status' => [
                'pending' => MaintenanceRequest::where('status', 'pending')->count(),
                'in_progress' => MaintenanceRequest::where('status', 'in_progress')->count(),
                'completed' => MaintenanceRequest::where('status', 'completed')->count(),
                'cancelled' => MaintenanceRequest::where('status', 'cancelled')->count(),
            ],
            'by_type' => [
                'hardware_failure' => MaintenanceRequest::where('maintenance_type', 'hardware_failure')->count(),
                'software_issue' => MaintenanceRequest::where('maintenance_type', 'software_issue')->count(),
                'routine_cleaning' => MaintenanceRequest::where('maintenance_type', 'routine_cleaning')->count(),
                'consumable_replacement' => MaintenanceRequest::where('maintenance_type', 'consumable_replacement')->count()
            ],
            'by_priority' => [
                'urgent' => MaintenanceRequest::where('priority', 'urgent')->count(),
                'high' => MaintenanceRequest::where('priority', 'high')->count(),
                'medium' => MaintenanceRequest::where('priority', 'medium')->count(),
                'low' => MaintenanceRequest::where('priority', 'low')->count()
            ],
            'average_cost' => MaintenanceRequest::where('status', 'completed')
                ->whereNotNull('cost')
                ->avg('cost') ?? 0,
            'total_cost' => MaintenanceRequest::where('status', 'completed')
                ->sum('cost') ?? 0,
            'sla' => $slaService->getSlaStatistics(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}

