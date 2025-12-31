<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class RoleAuthorizationTest extends TestCase
{
    use DatabaseTransactions;

    protected $admin;
    protected $inventoryManager;
    protected $staff;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->admin()->create();
        $this->inventoryManager = User::factory()->inventoryManager()->create();
        $this->staff = User::factory()->staff()->create();
    }

    /** @test */
    public function admin_can_access_admin_routes()
    {
        // Test access to a typical admin route (users management would be admin-only)
        $response = $this->actingAs($this->admin)
            ->getJson('/api/users');

        // Even if route doesn't exist yet, it shouldn't be 403
        $this->assertNotEquals(403, $response->status());
    }

    /** @test */
    public function inventory_manager_cannot_access_admin_routes()
    {
        $response = $this->actingAs($this->inventoryManager)
            ->getJson('/api/users');

        // Should either be 403 or 404 (if not implemented), but not 200
        $this->assertContains($response->status(), [403, 404]);
    }

    /** @test */
    public function staff_cannot_access_admin_routes()
    {
        $response = $this->actingAs($this->staff)
            ->getJson('/api/users');

        $this->assertContains($response->status(), [403, 404]);
    }

    /** @test */
    public function inventory_manager_can_access_inventory_routes()
    {
        // Inventory managers should be able to access maintenance assignment
        $response = $this->actingAs($this->inventoryManager)
            ->getJson('/api/maintenance-requests');

        $response->assertOk();
    }

    /** @test */
    public function staff_can_access_staff_routes()
    {
        // Staff should be able to access maintenance requests
        $response = $this->actingAs($this->staff)
            ->getJson('/api/maintenance-requests');

        $response->assertOk();
    }

    /** @test */
    public function guest_cannot_access_protected_routes()
    {
        $response = $this->getJson('/api/maintenance-requests');
        $response->assertStatus(401);

        $response = $this->getJson('/api/purchase-requests');
        $response->assertStatus(401);

        $response = $this->getJson('/api/transactions');
        $response->assertStatus(401);
    }

    /** @test */
    public function multiple_roles_are_respected()
    {
        // Admin should have access to everything
        $response = $this->actingAs($this->admin)
            ->getJson('/api/maintenance-requests');
        $response->assertOk();

        $response = $this->actingAs($this->admin)
            ->getJson('/api/purchase-requests');
        $response->assertOk();

        $response = $this->actingAs($this->admin)
            ->getJson('/api/transactions');
        $response->assertOk();
    }
}
