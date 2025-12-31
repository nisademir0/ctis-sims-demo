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
        // Add indexes to items table for better query performance
        // Skip if indexes already exist (using raw SQL to check)
        try {
            Schema::table('items', function (Blueprint $table) {
                if (!$this->indexExists('items', 'idx_items_status')) {
                    $table->index('status', 'idx_items_status');
                }
                if (!$this->indexExists('items', 'idx_items_category')) {
                    $table->index('category_id', 'idx_items_category');
                }
                if (!$this->indexExists('items', 'idx_items_vendor')) {
                    $table->index('vendor_id', 'idx_items_vendor');
                }
                if (!$this->indexExists('items', 'idx_items_holder')) {
                    $table->index('current_holder_id', 'idx_items_holder');
                }
                if (!$this->indexExists('items', 'idx_items_inventory_num')) {
                    $table->index('inventory_number', 'idx_items_inventory_num');
                }
                if (!$this->indexExists('items', 'idx_items_status_active')) {
                    $table->index(['status', 'is_active'], 'idx_items_status_active');
                }
            });
        } catch (\Exception $e) {
            // Index might already exist, continue
        }

        // Add indexes to transactions table
        try {
            Schema::table('transactions', function (Blueprint $table) {
                if (!$this->indexExists('transactions', 'idx_transactions_item')) {
                    $table->index('item_id', 'idx_transactions_item');
                }
                if (!$this->indexExists('transactions', 'idx_transactions_user')) {
                    $table->index('user_id', 'idx_transactions_user');
                }
                if (!$this->indexExists('transactions', 'idx_transactions_checkout')) {
                    $table->index('checkout_date', 'idx_transactions_checkout');
                }
                if (!$this->indexExists('transactions', 'idx_transactions_return')) {
                    $table->index('return_date', 'idx_transactions_return');
                }
                if (!$this->indexExists('transactions', 'idx_transactions_active')) {
                    $table->index(['item_id', 'return_date'], 'idx_transactions_active');
                }
            });
        } catch (\Exception $e) {
            // Index might already exist, continue
        }

        // Add indexes to activity_logs table
        try {
            Schema::table('activity_logs', function (Blueprint $table) {
                if (!$this->indexExists('activity_logs', 'idx_logs_user')) {
                    $table->index('user_id', 'idx_logs_user');
                }
                if (!$this->indexExists('activity_logs', 'idx_logs_timestamp')) {
                    $table->index('timestamp', 'idx_logs_timestamp');
                }
                if (!$this->indexExists('activity_logs', 'idx_logs_user_time')) {
                    $table->index(['user_id', 'timestamp'], 'idx_logs_user_time');
                }
            });
        } catch (\Exception $e) {
            // Index might already exist, continue
        }

        // Add indexes to item_lifecycle_events table if it exists
        if (Schema::hasTable('item_lifecycle_events')) {
            try {
                Schema::table('item_lifecycle_events', function (Blueprint $table) {
                    if (!$this->indexExists('item_lifecycle_events', 'idx_lifecycle_item')) {
                        $table->index('item_id', 'idx_lifecycle_item');
                    }
                    if (!$this->indexExists('item_lifecycle_events', 'idx_lifecycle_type')) {
                        $table->index('event_type', 'idx_lifecycle_type');
                    }
                    if (!$this->indexExists('item_lifecycle_events', 'idx_lifecycle_date')) {
                        $table->index('event_date', 'idx_lifecycle_date');
                    }
                });
            } catch (\Exception $e) {
                // Index might already exist, continue
            }
        }
    }
    
    /**
     * Check if an index exists on a table
     */
    private function indexExists(string $table, string $indexName): bool
    {
        $indexes = DB::select("SHOW INDEX FROM {$table} WHERE Key_name = ?", [$indexName]);
        return count($indexes) > 0;
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop indexes from items table
        Schema::table('items', function (Blueprint $table) {
            $table->dropIndex('idx_items_status');
            $table->dropIndex('idx_items_category');
            $table->dropIndex('idx_items_vendor');
            $table->dropIndex('idx_items_holder');
            $table->dropIndex('idx_items_inventory_num');
            $table->dropIndex('idx_items_status_active');
        });

        // Drop indexes from transactions table
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex('idx_transactions_item');
            $table->dropIndex('idx_transactions_user');
            $table->dropIndex('idx_transactions_checkout');
            $table->dropIndex('idx_transactions_return');
            $table->dropIndex('idx_transactions_active');
        });

        // Drop indexes from activity_logs table
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex('idx_logs_user');
            $table->dropIndex('idx_logs_timestamp');
            $table->dropIndex('idx_logs_user_time');
        });

        // Drop indexes from item_lifecycle_events table if it exists
        if (Schema::hasTable('item_lifecycle_events')) {
            Schema::table('item_lifecycle_events', function (Blueprint $table) {
                $table->dropIndex('idx_lifecycle_item');
                $table->dropIndex('idx_lifecycle_type');
                $table->dropIndex('idx_lifecycle_date');
            });
        }
    }
};
