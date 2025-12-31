<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Purchase Request System - Staff can submit, Managers can approve/reject
     * CB-5: Email notifications on status change
     */
    public function up(): void
    {
        Schema::create('purchase_requests', function (Blueprint $table) {
            $table->id();
            
            // User relationships
            $table->foreignId('requested_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            
            // Item details
            $table->string('item_name');
            $table->text('description');
            $table->string('category')->nullable();
            $table->integer('quantity')->default(1);
            $table->decimal('estimated_cost', 10, 2)->nullable();
            
            // Priority and status
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->enum('status', [
                'pending',
                'approved',
                'rejected',
                'ordered',
                'received'
            ])->default('pending');
            
            // Justification and feedback
            $table->text('justification'); // Why is this needed?
            $table->text('rejection_reason')->nullable();
            $table->date('needed_by_date')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index('requested_by');
            $table->index('status');
            $table->index('approved_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_requests');
    }
};
