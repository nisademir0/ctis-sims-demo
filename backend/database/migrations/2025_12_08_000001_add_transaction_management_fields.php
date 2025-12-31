<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds fields required for Transaction Management (FR-3.x)
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            // Transaction status tracking
            $table->enum('status', [
                'active',      // Currently checked out
                'returned',    // Returned on time
                'overdue',     // Past due date, not returned
                'late_return', // Returned but was late
                'cancelled'    // Transaction cancelled
            ])->default('active')->after('return_date');
            
            // Late fee tracking
            $table->decimal('late_fee', 10, 2)->default(0)->after('status');
            $table->boolean('late_fee_paid')->default(false)->after('late_fee');
            
            // Item condition on return
            $table->enum('return_condition', [
                'excellent',
                'good',
                'fair',
                'poor',
                'damaged'
            ])->nullable()->after('late_fee_paid');
            
            // Extended notes for return
            $table->text('return_notes')->nullable()->after('return_condition');
            
            // Admin who processed check-out/return
            $table->foreignId('checked_out_by')->nullable()->constrained('users')->after('user_id');
            $table->foreignId('returned_to')->nullable()->constrained('users')->after('checked_out_by');
            
            // Email notification tracking
            $table->boolean('checkout_email_sent')->default(false)->after('return_notes');
            $table->boolean('due_reminder_sent')->default(false)->after('checkout_email_sent');
            $table->boolean('overdue_reminder_sent')->default(false)->after('due_reminder_sent');
            $table->boolean('return_email_sent')->default(false)->after('overdue_reminder_sent');
            
            // Add indexes for new fields
            $table->index('status');
            $table->index(['status', 'due_date']); // For overdue queries
            $table->index('checked_out_by');
            $table->index('returned_to');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            // Drop indexes first
            $table->dropIndex(['transactions_status_index']);
            $table->dropIndex(['transactions_status_due_date_index']);
            $table->dropIndex(['transactions_checked_out_by_index']);
            $table->dropIndex(['transactions_returned_to_index']);
            
            // Drop foreign keys
            $table->dropForeign(['checked_out_by']);
            $table->dropForeign(['returned_to']);
            
            // Drop columns
            $table->dropColumn([
                'status',
                'late_fee',
                'late_fee_paid',
                'return_condition',
                'return_notes',
                'checked_out_by',
                'returned_to',
                'checkout_email_sent',
                'due_reminder_sent',
                'overdue_reminder_sent',
                'return_email_sent'
            ]);
        });
    }
};
