<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Creates database views AFTER all table structure changes are complete.
     * This avoids SQLite "error in view" issues during table alterations.
     */
    public function up(): void
    {
        // Create view for chatbot and reporting
        // This runs AFTER all table structure changes to avoid migration conflicts
        DB::statement("
            CREATE OR REPLACE VIEW view_general_inventory AS
            SELECT 
                i.id,
                i.name AS item_name,
                c.category_name,
                i.location,
                i.status,
                u.name AS current_holder,
                v.vendor_name,
                i.warranty_expiry_date
            FROM items i
            LEFT JOIN item_categories c ON i.category_id = c.id
            LEFT JOIN users u ON i.current_holder_id = u.id
            LEFT JOIN vendors v ON i.vendor_id = v.id
            WHERE i.is_active = 1
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("DROP VIEW IF EXISTS view_general_inventory");
    }
};
