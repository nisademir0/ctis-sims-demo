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
        // Note: The transactions table schema in this project uses:
        // - checkout_date, due_date, return_date (datetime fields)
        // - No quantity_borrowed/quantity_returned (single item per transaction)
        // We'll add validation constraints and indexes for the existing fields
        
        // Add indexes for performance
        Schema::table('transactions', function (Blueprint $table) {
            // Composite index for user queries
            if (!$this->indexExists('transactions', 'transactions_user_id_index')) {
                $table->index('user_id', 'transactions_user_id_index');
            }
            
            // Composite index for item queries
            if (!$this->indexExists('transactions', 'transactions_item_id_index')) {
                $table->index('item_id', 'transactions_item_id_index');
            }
            
            // Index on due_date for overdue checks
            if (!$this->indexExists('transactions', 'transactions_due_date_index')) {
                $table->index('due_date', 'transactions_due_date_index');
            }
            
            // Index on checkout_date for reporting
            if (!$this->indexExists('transactions', 'transactions_checkout_date_index')) {
                $table->index('checkout_date', 'transactions_checkout_date_index');
            }
            
            // Index on return_date for analytics (NULL for active transactions)
            if (!$this->indexExists('transactions', 'transactions_return_date_index')) {
                $table->index('return_date', 'transactions_return_date_index');
            }
            
            // Composite index for active transactions (return_date IS NULL)
            if (!$this->indexExists('transactions', 'transactions_user_active_index')) {
                $table->index(['user_id', 'return_date'], 'transactions_user_active_index');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            if ($this->indexExists('transactions', 'transactions_user_id_index')) {
                $table->dropIndex('transactions_user_id_index');
            }
            if ($this->indexExists('transactions', 'transactions_item_id_index')) {
                $table->dropIndex('transactions_item_id_index');
            }
            if ($this->indexExists('transactions', 'transactions_due_date_index')) {
                $table->dropIndex('transactions_due_date_index');
            }
            if ($this->indexExists('transactions', 'transactions_checkout_date_index')) {
                $table->dropIndex('transactions_checkout_date_index');
            }
            if ($this->indexExists('transactions', 'transactions_return_date_index')) {
                $table->dropIndex('transactions_return_date_index');
            }
            if ($this->indexExists('transactions', 'transactions_user_active_index')) {
                $table->dropIndex('transactions_user_active_index');
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
};
