<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Note: The items table in this schema doesn't have quantity/available_quantity columns
        // Inventory tracking is done via transactions table
        // We'll add validation constraints for the existing fields
        
        $driver = DB::connection()->getDriverName();
        
        if ($driver === 'mysql' || $driver === 'pgsql') {
            // Check if constraint already exists before adding
            if (!$this->constraintExists('items', 'check_items_status_valid')) {
                DB::statement('ALTER TABLE items ADD CONSTRAINT check_items_status_valid 
                               CHECK (status IN ("available", "lent", "maintenance", "retired", "donated"))');
            }
        }
        
        // Add indexes for performance (works across all DB drivers)
        Schema::table('items', function (Blueprint $table) {
            // Add index on inventory_number for faster lookups (if not already unique)
            // (Already unique from migration, but index helps with lookups)
            
            // Add index on category_id for faster filtering
            if (!$this->indexExists('items', 'items_category_id_index')) {
                $table->index('category_id', 'items_category_id_index');
            }
            
            // Add index on status for faster filtering
            if (!$this->indexExists('items', 'items_status_index')) {
                $table->index('status', 'items_status_index');
            }
            
            // Add index on vendor_id for vendor queries
            if (!$this->indexExists('items', 'items_vendor_id_index')) {
                $table->index('vendor_id', 'items_vendor_id_index');
            }
            
            // Add index on current_holder_id for tracking borrowed items
            if (!$this->indexExists('items', 'items_current_holder_id_index')) {
                $table->index('current_holder_id', 'items_current_holder_id_index');
            }
            
            // Add index on location for location-based queries
            if (!$this->indexExists('items', 'items_location_index')) {
                $table->index('location', 'items_location_index');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::connection()->getDriverName();
        
        if ($driver === 'mysql' || $driver === 'pgsql') {
            DB::statement('ALTER TABLE items DROP CONSTRAINT IF EXISTS check_items_status_valid');
        }
        
        Schema::table('items', function (Blueprint $table) {
            if ($this->indexExists('items', 'items_category_id_index')) {
                $table->dropIndex('items_category_id_index');
            }
            if ($this->indexExists('items', 'items_status_index')) {
                $table->dropIndex('items_status_index');
            }
            if ($this->indexExists('items', 'items_vendor_id_index')) {
                $table->dropIndex('items_vendor_id_index');
            }
            if ($this->indexExists('items', 'items_current_holder_id_index')) {
                $table->dropIndex('items_current_holder_id_index');
            }
            if ($this->indexExists('items', 'items_location_index')) {
                $table->dropIndex('items_location_index');
            }
        });
    }

    /**
     * Check if an index exists (works across all DB drivers).
     */
    private function indexExists(string $table, string $index): bool
    {
        $driver = DB::connection()->getDriverName();
        
        try {
            switch ($driver) {
                case 'mysql':
                    $indexes = DB::select("SHOW INDEX FROM {$table} WHERE Key_name = ?", [$index]);
                    return !empty($indexes);
                    
                case 'pgsql':
                    $indexes = DB::select(
                        "SELECT indexname FROM pg_indexes WHERE tablename = ? AND indexname = ?",
                        [$table, $index]
                    );
                    return !empty($indexes);
                    
                case 'sqlite':
                    $indexes = DB::select("PRAGMA index_list({$table})");
                    foreach ($indexes as $idx) {
                        if ($idx->name === $index) {
                            return true;
                        }
                    }
                    return false;
                    
                default:
                    return false;
            }
        } catch (\Exception $e) {
            return false;
        }
    }
    
    /**
     * Check if a constraint exists on a table.
     */
    private function constraintExists(string $table, string $constraint): bool
    {
        $driver = DB::connection()->getDriverName();
        
        try {
            switch ($driver) {
                case 'mysql':
                    $constraints = DB::select(
                        "SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS 
                         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?",
                        [DB::getDatabaseName(), $table, $constraint]
                    );
                    return !empty($constraints);
                    
                case 'pgsql':
                    $constraints = DB::select(
                        "SELECT constraint_name FROM information_schema.table_constraints 
                         WHERE table_name = ? AND constraint_name = ?",
                        [$table, $constraint]
                    );
                    return !empty($constraints);
                    
                case 'sqlite':
                    // SQLite doesn't have a direct way to check constraints
                    // We need to parse the table schema
                    $schema = DB::select("SELECT sql FROM sqlite_master WHERE type='table' AND name=?", [$table]);
                    if (!empty($schema)) {
                        return str_contains($schema[0]->sql, $constraint);
                    }
                    return false;
                    
                default:
                    return false;
            }
        } catch (\Exception $e) {
            return false;
        }
    }
};
