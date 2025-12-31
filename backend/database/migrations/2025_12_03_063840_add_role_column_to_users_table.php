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
        Schema::table('users', function (Blueprint $table) {
            // Add role column as an enum (simplified approach instead of using roles table)
            // Keep role_id nullable for backward compatibility if needed
            $table->enum('role', ['admin', 'inventory_manager', 'staff'])->default('staff')->after('role_id');
            
            // Make role_id nullable since we're now using direct role column
            $table->foreignId('role_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
            // Restore role_id to non-nullable if needed
        });
    }
};
