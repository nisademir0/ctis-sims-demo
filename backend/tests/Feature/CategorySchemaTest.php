<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Role;
use App\Models\Category;
use App\Models\Item;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;

class CategorySchemaTest extends TestCase
{
    use DatabaseTransactions;

    protected $admin;
    protected $category;

    protected function setUp(): void
    {
        parent::setUp();

        // Get or create roles
        $adminRole = Role::firstOrCreate(['role_name' => 'Admin']);
        Role::firstOrCreate(['role_name' => 'Inventory Manager']);
        Role::firstOrCreate(['role_name' => 'Staff']);
        
        // Create admin user
        $this->admin = User::factory()->create(['role_id' => $adminRole->id]);

        // Create category with schema
        $this->category = Category::create([
            'category_name' => 'Test Computers',
            'description' => 'Test computer category',
            'schema_definition' => [
                'fields' => [
                    [
                        'name' => 'cpu',
                        'type' => 'string',
                        'label' => 'Processor',
                        'required' => true,
                        'placeholder' => 'e.g., Intel i7'
                    ],
                    [
                        'name' => 'ram',
                        'type' => 'string',
                        'label' => 'RAM',
                        'required' => true,
                        'placeholder' => 'e.g., 16GB'
                    ],
                    [
                        'name' => 'storage',
                        'type' => 'string',
                        'label' => 'Storage',
                        'required' => false,
                        'placeholder' => 'e.g., 512GB SSD'
                    ]
                ]
            ]
        ]);
    }

    /** @test */
    public function category_has_schema_definition()
    {
        $this->assertNotNull($this->category->schema_definition);
        $this->assertIsArray($this->category->schema_definition);
        $this->assertArrayHasKey('fields', $this->category->schema_definition);
    }

    /** @test */
    public function category_can_get_schema_fields()
    {
        $fields = $this->category->getSchemaFields();
        
        $this->assertIsArray($fields);
        $this->assertCount(3, $fields);
        $this->assertEquals('cpu', $fields[0]['name']);
        $this->assertEquals('Processor', $fields[0]['label']);
    }

    /** @test */
    public function category_validates_required_specifications()
    {
        $errors = $this->category->validateSpecifications([]);
        
        $this->assertNotEmpty($errors);
        $this->assertContains("Field 'Processor' is required", $errors);
        $this->assertContains("Field 'RAM' is required", $errors);
    }

    /** @test */
    public function category_passes_validation_with_all_required_fields()
    {
        $errors = $this->category->validateSpecifications([
            'cpu' => 'Intel i7-12700',
            'ram' => '16GB DDR4'
        ]);
        
        $this->assertEmpty($errors);
    }

    /** @test */
    public function categories_endpoint_returns_schema_definition()
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/categories');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         '*' => [
                             'id',
                             'category_name',
                             'description',
                             'schema_definition',
                             'created_at',
                             'updated_at'
                         ]
                     ]
                 ]);

        $category = collect($response->json('data'))->firstWhere('id', $this->category->id);
        $this->assertNotNull($category);
        $this->assertArrayHasKey('fields', $category['schema_definition']);
    }

    /** @test */
    public function item_creation_with_category_schema_is_flexible()
    {
        Sanctum::actingAs($this->admin);
        
        $vendor = Vendor::create(['vendor_name' => 'Test Vendor']);

        // Specifications are optional - items can be created without specs even with schema
        // This is intentional to allow gradual data entry
        $response = $this->postJson('/api/items', [
            'inventory_number' => 'TEST-001',
            'name' => 'Test Computer',
            'category_id' => $this->category->id,
            'vendor_id' => $vendor->id,
            'location' => 'Lab A',
            'status' => 'available',
            'specifications' => [] // Empty specifications allowed
        ]);

        $response->assertStatus(201);
        
        $item = Item::where('inventory_number', 'TEST-001')->first();
        $this->assertNotNull($item);
    }

    /** @test */
    public function item_creation_succeeds_with_valid_specifications()
    {
        Sanctum::actingAs($this->admin);
        
        $vendor = Vendor::create(['vendor_name' => 'Test Vendor']);

        $response = $this->postJson('/api/items', [
            'inventory_number' => 'TEST-002',
            'name' => 'Test Computer',
            'category_id' => $this->category->id,
            'vendor_id' => $vendor->id,
            'location' => 'Lab A',
            'status' => 'available',
            'specifications' => [
                'cpu' => 'Intel i7-12700',
                'ram' => '16GB DDR4',
                'storage' => '512GB SSD'
            ]
        ]);

        $response->assertStatus(201);
        
        $item = Item::where('inventory_number', 'TEST-002')->first();
        $this->assertNotNull($item);
        $this->assertEquals('Intel i7-12700', $item->specifications['cpu']);
    }

    /** @test */
    public function category_without_schema_does_not_validate()
    {
        Sanctum::actingAs($this->admin);
        
        // Create category without schema
        $categoryNoSchema = Category::create([
            'category_name' => 'No Schema Category'
        ]);
        
        $vendor = Vendor::create(['vendor_name' => 'Test Vendor']);

        // Should succeed without specification validation
        $response = $this->postJson('/api/items', [
            'inventory_number' => 'TEST-003',
            'name' => 'Test Item',
            'category_id' => $categoryNoSchema->id,
            'vendor_id' => $vendor->id,
            'location' => 'Lab B',
            'status' => 'available',
            'specifications' => [] // Empty is OK for categories without schema
        ]);

        $response->assertStatus(201);
    }
}
