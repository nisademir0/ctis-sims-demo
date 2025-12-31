<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * CB-10: Maintenance Types: Hardware Failure, Software Issue, Routine Cleaning, Consumable Replacement
     */
    public function up(): void
    {
        Schema::create('maintenance_requests', function (Blueprint $table) {
            $table->id();
            
            // Foreign keys
            $table->foreignId('item_id')->constrained('items')->onDelete('cascade');
            $table->foreignId('requested_by')->constrained('users');
            $table->foreignId('assigned_to')->nullable()->constrained('users');
            $table->foreignId('transaction_id')->nullable()->constrained('transactions'); // Link to damaged return
            
            // Maintenance details (CB-10)
            $table->enum('maintenance_type', [
                'hardware_failure',
                'software_issue',
                'routine_cleaning',
                'consumable_replacement'
            ]);
            
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending');
            
            // Description and notes
            $table->text('description');
            $table->text('resolution_notes')->nullable();
            $table->decimal('cost', 10, 2)->nullable(); // Optional cost tracking
            
            // Dates
            $table->date('scheduled_date')->nullable();
            $table->date('completed_date')->nullable();
            
            $table->timestamps();
            
            // Indexes for performance
            $table->index('item_id');
            $table->index('status');
            $table->index('requested_by');
            $table->index('assigned_to');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maintenance_requests');
    }
};
