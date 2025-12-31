<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get all notifications for the authenticated user
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $perPage = $request->input('per_page', 20);
        $filter = $request->input('filter', 'all'); // all, unread, read

        // Use Laravel's built-in notification system
        if ($filter === 'unread') {
            $query = $user->unreadNotifications();
        } elseif ($filter === 'read') {
            $query = $user->readNotifications();
        } else {
            $query = $user->notifications();
        }

        $notifications = $query->paginate($perPage);

        // Format notifications
        $formattedNotifications = $notifications->map(function ($notification) {
            return [
                'id' => $notification->id,
                'type' => $notification->data['type'] ?? 'info',
                'title' => $notification->data['title'] ?? '',
                'message' => $notification->data['message'] ?? '',
                'action_url' => $notification->data['action_url'] ?? null,
                'action_text' => $notification->data['action_text'] ?? null,
                'is_read' => !is_null($notification->read_at),
                'read_at' => $notification->read_at,
                'created_at' => $notification->created_at,
            ];
        });

        return response()->json([
            'notifications' => $formattedNotifications,
            'pagination' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ],
            'unread_count' => $user->unreadNotifications()->count(),
        ]);
    }

    /**
     * Get unread notification count
     */
    public function unreadCount(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        return response()->json([
            'count' => $user->unreadNotifications()->count(),
        ]);
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $notification = $user->notifications()->findOrFail($id);
        $notification->markAsRead();

        return response()->json([
            'message' => 'Bildirim okundu olarak işaretlendi',
            'notification' => [
                'id' => $notification->id,
                'type' => $notification->data['type'] ?? 'info',
                'title' => $notification->data['title'] ?? '',
                'message' => $notification->data['message'] ?? '',
                'is_read' => true,
                'read_at' => $notification->read_at,
            ],
        ]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $unreadNotifications = $user->unreadNotifications;
        $count = $unreadNotifications->count();
        
        foreach ($unreadNotifications as $notification) {
            $notification->markAsRead();
        }

        return response()->json([
            'message' => "{$count} bildirim okundu olarak işaretlendi",
            'count' => $count,
        ]);
    }

    /**
     * Delete a notification
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $notification = $user->notifications()->findOrFail($id);
        $notification->delete();

        return response()->json([
            'message' => 'Bildirim başarıyla silindi',
        ]);
    }

    /**
     * Delete all read notifications
     */
    public function deleteAllRead(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $readNotifications = $user->readNotifications;
        $count = $readNotifications->count();
        
        foreach ($readNotifications as $notification) {
            $notification->delete();
        }

        return response()->json([
            'message' => "{$count} bildirim silindi",
            'count' => $count,
        ]);
    }
}
