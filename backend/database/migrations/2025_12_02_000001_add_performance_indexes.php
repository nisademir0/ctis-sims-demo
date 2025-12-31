<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add indexes for frequently queried columns
        Schema::table('items', function (Blueprint $table) {
            $table->index('status');
            $table->index('is_active');
            $table->index(['status', 'is_active']); // Composite index for common queries
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->index('return_date');
            $table->index(['item_id', 'return_date']); // For finding active transactions
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->index('timestamp');
            $table->index(['user_id', 'timestamp']); // For user activity history
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropIndex(['items_status_index']);
            $table->dropIndex(['items_is_active_index']);
            $table->dropIndex(['items_status_is_active_index']);
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex(['transactions_return_date_index']);
            $table->dropIndex(['transactions_item_id_return_date_index']);
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex(['activity_logs_timestamp_index']);
            $table->dropIndex(['activity_logs_user_id_timestamp_index']);
        });
    }
};
