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
            if (!$this->constraintExists('maintenance_requests', 'check_maintenance_status_valid')) {
                DB::statement('ALTER TABLE maintenance_requests ADD CONSTRAINT check_maintenance_status_valid 
                               CHECK (status IN ("pending", "in_progress", "completed", "cancelled"))');
            }
            
            // Add CHECK constraint for valid priority values
            if (!$this->constraintExists('maintenance_requests', 'check_maintenance_priority_valid')) {
                DB::statement('ALTER TABLE maintenance_requests ADD CONSTRAINT check_maintenance_priority_valid 
                               CHECK (priority IN ("low", "medium", "high", "urgent"))');
            }
        }
        
        // Add indexes for performance
        Schema::table('maintenance_requests', function (Blueprint $table) {
            // Index on item_id for item-related queries
            if (!$this->indexExists('maintenance_requests', 'maintenance_requests_item_id_index')) {
                $table->index('item_id', 'maintenance_requests_item_id_index');
            }
            
            // Index on status for filtering
            if (!$this->indexExists('maintenance_requests', 'maintenance_requests_status_index')) {
                $table->index('status', 'maintenance_requests_status_index');
            }
            
            // Index on priority for sorting
            if (!$this->indexExists('maintenance_requests', 'maintenance_requests_priority_index')) {
                $table->index('priority', 'maintenance_requests_priority_index');
            }
            
            // Index on requested_by for user queries
            if (!$this->indexExists('maintenance_requests', 'maintenance_requests_requested_by_index')) {
                $table->index('requested_by', 'maintenance_requests_requested_by_index');
            }
            
            // Index on assigned_to for technician queries
            if (!$this->indexExists('maintenance_requests', 'maintenance_requests_assigned_to_index')) {
                $table->index('assigned_to', 'maintenance_requests_assigned_to_index');
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
            DB::statement('ALTER TABLE maintenance_requests DROP CONSTRAINT IF EXISTS check_maintenance_status_valid');
            DB::statement('ALTER TABLE maintenance_requests DROP CONSTRAINT IF EXISTS check_maintenance_priority_valid');
        }
        
        Schema::table('maintenance_requests', function (Blueprint $table) {
            if ($this->indexExists('maintenance_requests', 'maintenance_requests_item_id_index')) {
                $table->dropIndex('maintenance_requests_item_id_index');
            }
            if ($this->indexExists('maintenance_requests', 'maintenance_requests_status_index')) {
                $table->dropIndex('maintenance_requests_status_index');
            }
            if ($this->indexExists('maintenance_requests', 'maintenance_requests_priority_index')) {
                $table->dropIndex('maintenance_requests_priority_index');
            }
            if ($this->indexExists('maintenance_requests', 'maintenance_requests_requested_by_index')) {
                $table->dropIndex('maintenance_requests_requested_by_index');
            }
            if ($this->indexExists('maintenance_requests', 'maintenance_requests_assigned_to_index')) {
                $table->dropIndex('maintenance_requests_assigned_to_index');
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
