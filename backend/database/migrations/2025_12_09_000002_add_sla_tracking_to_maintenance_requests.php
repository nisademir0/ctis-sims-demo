<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('maintenance_requests', function (Blueprint $table) {
            // SLA tracking fields (just add new columns, don't change enum)
            $table->integer('sla_hours')->nullable()->after('priority'); // SLA response time in hours
            $table->timestamp('sla_due_date')->nullable()->after('sla_hours');
            $table->timestamp('first_response_at')->nullable()->after('sla_due_date');
            $table->timestamp('resolution_target')->nullable()->after('first_response_at');
            $table->timestamp('resolved_at')->nullable()->after('resolution_target');
            $table->boolean('sla_breached')->default(false)->after('resolved_at');
            $table->text('sla_breach_reason')->nullable()->after('sla_breached');
            
            // Add indexes for performance
            $table->index('sla_due_date');
            $table->index(['status', 'sla_breached']);
        });
    }

    public function down(): void
    {
        Schema::table('maintenance_requests', function (Blueprint $table) {
            $table->dropColumn([
                'sla_hours',
                'sla_due_date',
                'first_response_at',
                'resolution_target',
                'resolved_at',
                'sla_breached',
                'sla_breach_reason'
            ]);
        });
    }
};
