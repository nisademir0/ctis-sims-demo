<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $table = 'item_categories';

    protected $fillable = [
        'category_name',
        'schema_definition',
        'description'
    ];

    protected $casts = [
        'schema_definition' => 'array',
    ];

    public function items()
    {
        return $this->hasMany(Item::class, 'category_id');
    }

    /**
     * Get the JSON schema for this category
     */
    public function getSchemaFields()
    {
        return $this->schema_definition['fields'] ?? [];
    }

    /**
     * Validate item specifications against category schema
     */
    public function validateSpecifications(array $specifications): array
    {
        $errors = [];
        $schemaFields = $this->getSchemaFields();
        
        foreach ($schemaFields as $field) {
            if (isset($field['required']) && $field['required']) {
                if (!isset($specifications[$field['name']]) || empty($specifications[$field['name']])) {
                    $errors[] = "Field '{$field['label']}' is required";
                }
            }
        }
        
        return $errors;
    }
}
