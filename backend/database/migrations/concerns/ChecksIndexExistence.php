<?php

namespace Database\Migrations\Concerns;

use Illuminate\Support\Facades\DB;

trait ChecksIndexExistence
{
    /**
     * Check if an index exists on a table (works across all DB drivers).
     */
    protected function indexExists(string $table, string $index): bool
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
    protected function constraintExists(string $table, string $constraint): bool
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
}
