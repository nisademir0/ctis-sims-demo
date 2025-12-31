<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Notifications\SystemNotification;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;

class NotificationSystemTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    /**
     * Test getting all notifications for authenticated user
     */
    public function test_user_can_get_their_notifications()
    {
        $user = User::where('email', 'admin@ctis.edu.tr')->first();
        Sanctum::actingAs($user);

        // Send notification using Laravel system
        $user->notify(new SystemNotification('success', 'Test Notification', 'This is a test'));

        $response = $this->getJson('/api/notifications');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'notifications' => [
                    '*' => ['id', 'type', 'title', 'message', 'is_read', 'created_at']
                ],
                'pagination',
                'unread_count'
            ]);
    }

    /**
     * Test getting unread notification count
     */
    public function test_user_can_get_unread_count()
    {
        $user = User::where('email', 'admin@ctis.edu.tr')->first();
        Sanctum::actingAs($user);

        // Clear existing notifications
        $user->notifications()->delete();

        // Send unread notifications
        $user->notify(new SystemNotification('info', 'Unread 1', 'Message 1'));
        $user->notify(new SystemNotification('info', 'Unread 2', 'Message 2'));

        $response = $this->getJson('/api/notifications/unread-count');

        $response->assertStatus(200)
            ->assertJson(['count' => 2]);
    }

    /**
     * Test marking notification as read
     */
    public function test_user_can_mark_notification_as_read()
    {
        $user = User::where('email', 'admin@ctis.edu.tr')->first();
        Sanctum::actingAs($user);

        $user->notify(new SystemNotification('info', 'Test', 'Test message'));
        $notification = $user->notifications()->first();

        $response = $this->postJson("/api/notifications/{$notification->id}/read");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Bildirim okundu olarak işaretlendi']);

        $this->assertNotNull($notification->fresh()->read_at);
    }

    /**
     * Test marking all notifications as read
     */
    public function test_user_can_mark_all_notifications_as_read()
    {
        $user = User::where('email', 'admin@ctis.edu.tr')->first();
        Sanctum::actingAs($user);

        // Clear existing notifications
        $user->notifications()->delete();

        // Send 5 unread notifications
        for ($i = 0; $i < 5; $i++) {
            $user->notify(new SystemNotification('info', "Test $i", "Message $i"));
        }

        $response = $this->postJson('/api/notifications/mark-all-read');

        $response->assertStatus(200)
            ->assertJsonPath('count', 5);

        $unreadCount = $user->unreadNotifications()->count();
        $this->assertEquals(0, $unreadCount);
    }

    /**
     * Test deleting a notification
     */
    public function test_user_can_delete_notification()
    {
        $user = User::where('email', 'admin@ctis.edu.tr')->first();
        Sanctum::actingAs($user);

        $user->notify(new SystemNotification('info', 'Test', 'To be deleted'));
        $notification = $user->notifications()->first();

        $response = $this->deleteJson("/api/notifications/{$notification->id}");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Bildirim başarıyla silindi']);

        $this->assertNull($user->notifications()->find($notification->id));
    }

    /**
     * Test user cannot access other user's notifications
     */
    public function test_user_cannot_access_other_users_notifications()
    {
        $user1 = User::where('email', 'admin@ctis.edu.tr')->first();
        $user2 = User::where('email', 'serkan@ctis.edu.tr')->first();

        $user2->notify(new SystemNotification('info', 'Private', 'User 2 only'));
        $notification = $user2->notifications()->first();

        Sanctum::actingAs($user1);

        $response = $this->postJson("/api/notifications/{$notification->id}/read");

        $response->assertStatus(404);
    }

    /**
     * Test notification filtering by status
     */
    public function test_user_can_filter_notifications()
    {
        $user = User::where('email', 'admin@ctis.edu.tr')->first();
        Sanctum::actingAs($user);

        // Clear existing notifications
        $user->notifications()->delete();

        // Send and mark read notification first
        $user->notify(new SystemNotification('info', 'Read', 'Read message'));
        $user->unreadNotifications()->first()->markAsRead();

        // Send unread notification
        $user->notify(new SystemNotification('info', 'Unread', 'Unread message'));

        // Filter unread
        $response = $this->getJson('/api/notifications?filter=unread');
        $response->assertStatus(200);
        $notifications = $response->json('notifications');
        $this->assertCount(1, $notifications);
        $this->assertEquals('Unread', $notifications[0]['title']);

        // Filter read
        $response = $this->getJson('/api/notifications?filter=read');
        $response->assertStatus(200);
        $notifications = $response->json('notifications');
        $this->assertCount(1, $notifications);
        $this->assertEquals('Read', $notifications[0]['title']);
    }

    /**
     * Test unauthenticated user cannot access notifications
     */
    public function test_unauthenticated_user_cannot_access_notifications()
    {
        $response = $this->getJson('/api/notifications');
        $response->assertStatus(401);
    }
}
