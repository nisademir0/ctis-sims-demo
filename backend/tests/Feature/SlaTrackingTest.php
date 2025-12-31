<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\MaintenanceRequest;
use App\Models\Item;
use App\Services\SlaService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;

class SlaTrackingTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    /**
     * Test SLA is set on maintenance request creation
     */
    public function test_sla_is_set_on_maintenance_request_creation()
    {
        $admin = User::where('email', 'admin@ctis.edu.tr')->first();
        Sanctum::actingAs($admin);

        $item = Item::first();

        $response = $this->postJson('/api/maintenance-requests', [
            'item_id' => $item->id,
            'maintenance_type' => 'hardware_failure',
            'description' => 'Ekran bozuk',
            'issue_description' => 'Ekran bozuk',
            'priority' => 'high',
        ]);

        $response->assertStatus(201);
        
        $request = MaintenanceRequest::find($response->json('id'));
        
        $this->assertNotNull($request->sla_hours);
        $this->assertNotNull($request->sla_due_date);
        $this->assertEquals(4, $request->sla_hours); // High priority = 4 hours
    }

    /**
     * Test SLA hours are correct for each priority level
     */
    public function test_sla_hours_match_priority()
    {
        $slaService = new SlaService();
        $admin = User::where('email', 'admin@ctis.edu.tr')->first();
        $item = Item::first();

        $priorities = [
            'low' => 72,
            'medium' => 24,
            'high' => 4,
            'urgent' => 2,
        ];

        foreach ($priorities as $priority => $expectedHours) {
            $request = MaintenanceRequest::create([
                'item_id' => $item->id,
                'requested_by' => $admin->id,
                'maintenance_type' => 'hardware_failure',
                'description' => "Test $priority priority description",
                'issue_description' => "Test $priority priority",
                'priority' => $priority,
                'status' => 'pending',
            ]);

            $slaService->setSlaForRequest($request);

            $this->assertEquals($expectedHours, $request->sla_hours);
        }
    }

    /**
     * Test SLA due date is calculated correctly
     */
    public function test_sla_due_date_is_calculated_correctly()
    {
        $admin = User::where('email', 'admin@ctis.edu.tr')->first();
        Sanctum::actingAs($admin);

        $item = Item::first();

        $response = $this->postJson('/api/maintenance-requests', [
            'item_id' => $item->id,
            'maintenance_type' => 'hardware_failure',
            'description' => 'Urgent issue description',
            'issue_description' => 'Urgent issue',
            'priority' => 'urgent',
        ]);

        $request = MaintenanceRequest::find($response->json('id'));
        
        $expectedDueDate = now()->addHours(2); // Critical = 2 hours
        
        $this->assertTrue(
            $request->sla_due_date->diffInMinutes($expectedDueDate) < 1
        );
    }

    /**
     * Test first response tracking
     */
    public function test_first_response_is_tracked()
    {
        $admin = User::where('email', 'admin@ctis.edu.tr')->first();
        Sanctum::actingAs($admin);

        $request = MaintenanceRequest::create([
            'item_id' => Item::first()->id,
            'requested_by' => $admin->id,
            'maintenance_type' => 'hardware_failure',
            'description' => 'Test issue description',
            'issue_description' => 'Test issue',
            'priority' => 'high',
            'status' => 'pending',
        ]);

        $slaService = new SlaService();
        $slaService->setSlaForRequest($request);

        // Update status to in_progress (first response)
        $response = $this->putJson("/api/maintenance-requests/{$request->id}", [
            'status' => 'in_progress',
        ]);

        $response->assertStatus(200);
        $request->refresh();
        
        $this->assertNotNull($request->first_response_at);
    }

    /**
     * Test resolution tracking
     */
    public function test_resolution_is_tracked()
    {
        $admin = User::where('email', 'admin@ctis.edu.tr')->first();
        Sanctum::actingAs($admin);

        $request = MaintenanceRequest::create([
            'item_id' => Item::first()->id,
            'requested_by' => $admin->id,
            'maintenance_type' => 'hardware_failure',
            'description' => 'Test issue description',
            'issue_description' => 'Test issue',
            'priority' => 'medium',
            'status' => 'in_progress',
            'first_response_at' => now()->subHours(1),
        ]);

        $slaService = new SlaService();
        $slaService->setSlaForRequest($request);

        // Complete the request
        $response = $this->putJson("/api/maintenance-requests/{$request->id}", [
            'status' => 'completed',
        ]);

        $request->refresh();
        
        $this->assertNotNull($request->resolved_at);
    }

    /**
     * Test SLA breach detection
     */
    public function test_sla_breach_is_detected()
    {
        $slaService = new SlaService();
        $admin = User::where('email', 'admin@ctis.edu.tr')->first();

        $request = MaintenanceRequest::create([
            'item_id' => Item::first()->id,
            'requested_by' => $admin->id,
            'maintenance_type' => 'hardware_failure',
            'description' => 'Overdue issue description',
            'issue_description' => 'Overdue issue',
            'priority' => 'high',
            'status' => 'pending',
            'sla_hours' => 4,
            'sla_due_date' => now()->subHours(2), // Already overdue
        ]);

        $breaches = $slaService->checkSlaBreaches();

        $this->assertGreaterThan(0, $breaches);
        
        $request->refresh();
        $this->assertTrue($request->sla_breached);
        $this->assertNotNull($request->sla_breach_reason);
    }

    /**
     * Test SLA statistics calculation
     */
    public function test_sla_statistics_are_calculated()
    {
        $slaService = new SlaService();
        $admin = User::where('email', 'admin@ctis.edu.tr')->first();

        // Create some requests with different SLA statuses
        MaintenanceRequest::create([
            'item_id' => Item::first()->id,
            'requested_by' => $admin->id,
            'maintenance_type' => 'hardware_failure',
            'description' => 'Compliant request description',
            'issue_description' => 'Compliant request',
            'priority' => 'high',
            'status' => 'completed',
            'sla_hours' => 4,
            'sla_due_date' => now()->addHours(4),
            'resolved_at' => now()->addHours(3),
            'sla_breached' => false,
        ]);

        MaintenanceRequest::create([
            'item_id' => Item::skip(1)->first()->id,
            'requested_by' => $admin->id,
            'maintenance_type' => 'software_issue',
            'description' => 'Breached request description',
            'issue_description' => 'Breached request',
            'priority' => 'urgent',
            'status' => 'completed',
            'sla_hours' => 2,
            'sla_due_date' => now()->addHours(2),
            'resolved_at' => now()->addHours(5),
            'sla_breached' => true,
        ]);

        $stats = $slaService->getSlaStatistics();

        $this->assertArrayHasKey('total_requests', $stats);
        $this->assertArrayHasKey('sla_compliant', $stats);
        $this->assertArrayHasKey('sla_breached', $stats);
        $this->assertArrayHasKey('compliance_rate', $stats);
        $this->assertGreaterThan(0, $stats['total_requests']);
    }

    /**
     * Test time remaining calculation
     */
    public function test_time_remaining_is_calculated_correctly()
    {
        $slaService = new SlaService();
        $admin = User::where('email', 'admin@ctis.edu.tr')->first();

        $request = MaintenanceRequest::create([
            'item_id' => Item::first()->id,
            'requested_by' => $admin->id,
            'maintenance_type' => 'hardware_failure',
            'description' => 'Test issue description',
            'issue_description' => 'Test issue',
            'priority' => 'high',
            'status' => 'pending',
            'sla_hours' => 4,
            'sla_due_date' => now()->addHours(2),
        ]);

        $timeRemaining = $slaService->getTimeRemaining($request);

        $this->assertArrayHasKey('hours', $timeRemaining);
        $this->assertArrayHasKey('minutes', $timeRemaining);
        $this->assertArrayHasKey('is_overdue', $timeRemaining);
        $this->assertFalse($timeRemaining['is_overdue']);
        $this->assertGreaterThan(0, $timeRemaining['hours']);
    }
}
