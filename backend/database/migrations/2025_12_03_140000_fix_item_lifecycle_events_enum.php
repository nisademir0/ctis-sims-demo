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
        // Fix the event_type enum to include all necessary lifecycle events
        DB::statement("ALTER TABLE item_lifecycle_events 
            MODIFY COLUMN event_type ENUM(
                'created',
                'updated', 
                'deleted',
                'Purchase',
                'Donation',
                'Scrapped',
                'Maintenance',
                'Lost',
                'checked_out',
                'returned',
                'maintenance_scheduled',
                'maintenance_completed',
                'retired'
            ) NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore original enum values
        DB::statement("ALTER TABLE item_lifecycle_events 
            MODIFY COLUMN event_type ENUM(
                'Purchase',
                'Donation',
                'Scrapped',
                'Maintenance',
                'Lost'
            ) NOT NULL");
    }
};
