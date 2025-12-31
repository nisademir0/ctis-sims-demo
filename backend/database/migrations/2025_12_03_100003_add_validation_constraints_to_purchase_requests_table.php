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
        $driver = DB::connection()->getDriverName();
        
        if ($driver === 'mysql' || $driver === 'pgsql') {
            // Add CHECK constraint for valid status values
            if (!$this->constraintExists('purchase_requests', 'check_purchase_status_valid')) {
                DB::statement('ALTER TABLE purchase_requests ADD CONSTRAINT check_purchase_status_valid 
                               CHECK (status IN ("pending", "approved", "rejected", "ordered", "received"))');
            }
            
            // Add CHECK constraint for valid priority values
            if (!$this->constraintExists('purchase_requests', 'check_purchase_priority_valid')) {
                DB::statement('ALTER TABLE purchase_requests ADD CONSTRAINT check_purchase_priority_valid 
                               CHECK (priority IN ("low", "medium", "high", "urgent"))');
            }
            
            // Add CHECK constraint to ensure quantity is positive
            if (!$this->constraintExists('purchase_requests', 'check_purchase_quantity_positive')) {
                DB::statement('ALTER TABLE purchase_requests ADD CONSTRAINT check_purchase_quantity_positive 
                               CHECK (quantity > 0)');
            }
            
            // Add CHECK constraint to ensure estimated_cost is non-negative
            if (!$this->constraintExists('purchase_requests', 'check_estimated_cost_non_negative')) {
                DB::statement('ALTER TABLE purchase_requests ADD CONSTRAINT check_estimated_cost_non_negative 
                               CHECK (estimated_cost >= 0)');
            }
        }
        
        // Add indexes for performance (note: some indexes may already exist from table creation)
        Schema::table('purchase_requests', function (Blueprint $table) {
            // Index on category for category-related queries (note: string column, not foreign key)
            if (!$this->indexExists('purchase_requests', 'purchase_requests_category_index')) {
                $table->index('category', 'purchase_requests_category_index');
            }
            
            // Index on needed_by_date for date-based queries
            if (!$this->indexExists('purchase_requests', 'purchase_requests_needed_by_date_index')) {
                $table->index('needed_by_date', 'purchase_requests_needed_by_date_index');
            }
            
            // Note: status, requested_by indexes already exist from table creation
            // We'll only add new ones that don't exist yet
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::connection()->getDriverName();
        
        if ($driver === 'mysql' || $driver === 'pgsql') {
            DB::statement('ALTER TABLE purchase_requests DROP CONSTRAINT IF EXISTS check_purchase_status_valid');
            DB::statement('ALTER TABLE purchase_requests DROP CONSTRAINT IF EXISTS check_purchase_priority_valid');
            DB::statement('ALTER TABLE purchase_requests DROP CONSTRAINT IF EXISTS check_purchase_quantity_positive');
            DB::statement('ALTER TABLE purchase_requests DROP CONSTRAINT IF EXISTS check_estimated_cost_non_negative');
        }
        
        Schema::table('purchase_requests', function (Blueprint $table) {
            if ($this->indexExists('purchase_requests', 'purchase_requests_category_index')) {
                $table->dropIndex('purchase_requests_category_index');
            }
            if ($this->indexExists('purchase_requests', 'purchase_requests_needed_by_date_index')) {
                $table->dropIndex('purchase_requests_needed_by_date_index');
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
