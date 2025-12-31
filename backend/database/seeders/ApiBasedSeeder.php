<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;

/**
 * API-Based Seeder for Derivative Tables
 * 
 * This seeder tests business logic by making real API calls
 * to create transactions, maintenance requests, and purchase requests.
 * 
 * Benefits:
 * - Tests actual API endpoints and business logic
 * - Automatically populates activity_logs through API calls
 * - Validates authentication and authorization flow
 * - Tests email notifications (if enabled)
 * 
 * Usage: php artisan db:seed --class=ApiBasedSeeder
 */
class ApiBasedSeeder extends Seeder
{
    private $baseUrl = 'http://backend:8002/api';
    private $adminToken = null;
    private $managerToken = null;

    public function run(): void
    {
        echo "\n🔧 Starting API-Based Seeding...\n";

        // Step 1: Login as admin to get token
        $this->loginAsAdmin();

        // Step 2: Get available items and users
        $items = $this->getAvailableItems();
        $users = $this->getAllUsers();

        if (empty($items) || empty($users)) {
            echo "❌ Cannot seed: No items or users found. Run DatabaseSeeder first.\n";
            return;
        }

        // Step 3: Create transactions via API (tests checkout/return logic)
        $this->seedTransactions($items, $users);

        // Step 4: Create maintenance requests via API
        $this->seedMaintenanceRequests($items, $users);

        // Step 5: Create purchase requests via API
        $this->seedPurchaseRequests($users);

        echo "\n✅ API-Based Seeding completed!\n";
        echo "   Check activity_logs table - it should be populated automatically.\n";
        echo "   Check emails (if configured) - notifications should have been sent.\n";
    }

    /**
     * Login as admin and get authentication token
     */
    private function loginAsAdmin(): void
    {
        echo "\n🔐 Logging in as admin...\n";

        $response = Http::post($this->baseUrl . '/login', [
            'email' => 'admin@ctis.edu.tr',
            'password' => 'password123',
        ]);

        if ($response->successful()) {
            $this->adminToken = $response->json()['token'];
            echo "✅ Admin login successful\n";
        } else {
            echo "❌ Admin login failed: {$response->body()}\n";
            throw new \Exception("Cannot proceed without admin token");
        }
    }

    /**
     * Get available items from API
     */
    private function getAvailableItems(): array
    {
        $response = Http::withToken($this->adminToken)
            ->get($this->baseUrl . '/items', ['status' => 'available', 'per_page' => 50]);

        if ($response->successful()) {
            $data = $response->json();
            $items = $data['data'] ?? [];
            echo "✅ Found " . count($items) . " available items\n";
            return $items;
        }

        echo "❌ Failed to fetch items\n";
        return [];
    }

    /**
     * Get all users from API
     */
    private function getAllUsers(): array
    {
        $response = Http::withToken($this->adminToken)
            ->get($this->baseUrl . '/users/list');

        if ($response->successful()) {
            $users = $response->json();
            echo "✅ Found " . count($users) . " users\n";
            return $users;
        }

        echo "❌ Failed to fetch users\n";
        return [];
    }

    /**
     * Seed transactions via checkout API
     */
    private function seedTransactions(array $items, array $users): void
    {
        echo "\n📦 Creating transactions via API...\n";

        $staffUsers = array_filter($users, fn($u) => $u['role']['role_name'] === 'Staff');
        $checkoutCount = 0;
        $returnCount = 0;

        // Create 20 checkouts
        for ($i = 0; $i < min(20, count($items), count($staffUsers)); $i++) {
            $item = $items[$i];
            $user = $staffUsers[array_rand($staffUsers)];

            $dueDate = Carbon::now()->addDays(rand(7, 30))->format('Y-m-d');

            $response = Http::withToken($this->adminToken)
                ->post($this->baseUrl . '/transactions/checkout', [
                    'item_id' => $item['id'],
                    'user_id' => $user['id'],
                    'due_date' => $dueDate,
                    'notes' => 'Seeded via API - Test checkout ' . ($i + 1),
                ]);

            if ($response->successful()) {
                $checkoutCount++;
                $transactionId = $response->json()['data']['id'];

                // Return some items (50% chance)
                if (rand(0, 1) === 1) {
                    sleep(1); // Simulate time passing

                    $returnResponse = Http::withToken($this->adminToken)
                        ->post($this->baseUrl . "/transactions/{$transactionId}/return", [
                            'return_condition' => rand(0, 10) > 8 ? 'damaged' : 'good',
                            'return_notes' => 'Seeded return via API',
                        ]);

                    if ($returnResponse->successful()) {
                        $returnCount++;
                    }
                }
            } else {
                echo "⚠️  Checkout failed for item {$item['id']}: {$response->body()}\n";
            }
        }

        echo "✅ Created {$checkoutCount} checkouts and {$returnCount} returns\n";
    }

    /**
     * Seed maintenance requests via API
     */
    private function seedMaintenanceRequests(array $items, array $users): void
    {
        echo "\n🔧 Creating maintenance requests via API...\n";

        $staffUsers = array_filter($users, fn($u) => $u['role']['role_name'] === 'Staff');
        $managerUsers = array_filter($users, fn($u) => $u['role']['role_name'] === 'Inventory Manager');
        $createdCount = 0;

        // Create 15 maintenance requests
        for ($i = 0; $i < min(15, count($items)); $i++) {
            $item = $items[array_rand($items)];
            $reporter = $staffUsers[array_rand($staffUsers)];

            $issues = [
                'Screen flickering and display issues',
                'Battery not charging properly',
                'Keyboard keys not responding',
                'Wi-Fi connection dropping frequently',
                'Overheating during normal use',
                'Physical damage to case/screen',
                'Software errors and crashes',
                'Slow performance needs optimization',
            ];

            $response = Http::withToken($this->adminToken)
                ->post($this->baseUrl . '/maintenance-requests', [
                    'item_id' => $item['id'],
                    'reported_by' => $reporter['id'],
                    'issue_description' => $issues[array_rand($issues)],
                    'priority' => ['low', 'medium', 'high'][array_rand(['low', 'medium', 'high'])],
                ]);

            if ($response->successful()) {
                $createdCount++;
                $requestId = $response->json()['data']['id'];

                // Assign some requests (60% chance)
                if (rand(0, 10) > 4 && !empty($managerUsers)) {
                    $assignee = $managerUsers[array_rand($managerUsers)];

                    $assignResponse = Http::withToken($this->adminToken)
                        ->post($this->baseUrl . "/maintenance-requests/{$requestId}/assign", [
                            'assigned_to' => $assignee['id'],
                        ]);

                    // Complete some assigned requests (40% chance)
                    if ($assignResponse->successful() && rand(0, 10) > 6) {
                        sleep(1);

                        Http::withToken($this->adminToken)
                            ->post($this->baseUrl . "/maintenance-requests/{$requestId}/complete", [
                                'completion_notes' => 'Seeded completion via API - Issue resolved',
                            ]);
                    }
                }
            }
        }

        echo "✅ Created {$createdCount} maintenance requests\n";
    }

    /**
     * Seed purchase requests via API
     */
    private function seedPurchaseRequests(array $users): void
    {
        echo "\n🛒 Creating purchase requests via API...\n";

        $staffUsers = array_filter($users, fn($u) => $u['role']['role_name'] === 'Staff');
        $createdCount = 0;

        $itemNames = [
            'Dell UltraSharp 27" Monitor',
            'Logitech MX Master 3 Mouse',
            'Keychron K2 Mechanical Keyboard',
            'HP LaserJet Pro Printer',
            'Anker USB-C Hub 7-in-1',
            'Seagate 2TB External SSD',
            'Blue Yeti USB Microphone',
            'Logitech C920 Webcam',
            'APC UPS Battery Backup 1500VA',
            'TP-Link Gigabit Switch 8-Port',
        ];

        // Create 12 purchase requests
        for ($i = 0; $i < min(12, count($staffUsers)); $i++) {
            $requester = $staffUsers[array_rand($staffUsers)];
            $itemName = $itemNames[array_rand($itemNames)];

            $response = Http::withToken($this->adminToken)
                ->post($this->baseUrl . '/purchase-requests', [
                    'item_name' => $itemName,
                    'quantity' => rand(1, 5),
                    'estimated_cost' => rand(200, 2000),
                    'justification' => "Seeded via API - Needed for department lab upgrade and student projects",
                    'requested_by' => $requester['id'],
                    'priority' => ['low', 'medium', 'high'][array_rand(['low', 'medium', 'high'])],
                ]);

            if ($response->successful()) {
                $createdCount++;
                $requestId = $response->json()['data']['id'];

                // Approve/reject some requests (50% chance)
                if (rand(0, 1) === 1) {
                    sleep(1);

                    $action = rand(0, 10) > 3 ? 'approve' : 'reject';

                    Http::withToken($this->adminToken)
                        ->post($this->baseUrl . "/purchase-requests/{$requestId}/{$action}", [
                            'notes' => $action === 'approve' 
                                ? 'Seeded approval - Budget available' 
                                : 'Seeded rejection - Budget constraints',
                        ]);
                }
            }
        }

        echo "✅ Created {$createdCount} purchase requests\n";
    }
}
