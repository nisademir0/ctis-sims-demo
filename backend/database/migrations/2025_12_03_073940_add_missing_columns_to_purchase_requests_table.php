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
        Schema::table('purchase_requests', function (Blueprint $table) {
            // Add reviewed_by (replaces approved_by for better naming)
            $table->foreignId('reviewed_by')->nullable()->after('approved_by')->constrained('users');
            
            // Add cost tracking fields
            $table->decimal('approved_cost', 10, 2)->nullable()->after('estimated_cost');
            $table->decimal('actual_cost', 10, 2)->nullable()->after('approved_cost');
            
            // Add vendor tracking (simple string for now, can be FK later)
            $table->string('vendor')->nullable()->after('category');
            $table->unsignedBigInteger('vendor_id')->nullable()->after('vendor');
            
            // Add quantity tracking
            $table->integer('actual_quantity')->nullable()->after('quantity');
            
            // Add date tracking
            $table->timestamp('approved_date')->nullable()->after('needed_by_date');
            $table->timestamp('ordered_date')->nullable()->after('approved_date');
            $table->timestamp('received_date')->nullable()->after('ordered_date');
            $table->date('expected_delivery_date')->nullable()->after('received_date');
            
            // Add notes field
            $table->text('notes')->nullable()->after('rejection_reason');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_requests', function (Blueprint $table) {
            $table->dropForeign(['reviewed_by']);
            $table->dropColumn([
                'reviewed_by',
                'approved_cost',
                'actual_cost',
                'vendor',
                'vendor_id',
                'actual_quantity',
                'approved_date',
                'ordered_date',
                'received_date',
                'expected_delivery_date',
                'notes'
            ]);
        });
    }
};
