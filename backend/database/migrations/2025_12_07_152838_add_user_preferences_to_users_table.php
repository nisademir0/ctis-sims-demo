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
        Schema::table('users', function (Blueprint $table) {
            // User preferences stored as JSON for flexibility
            $table->json('preferences')->nullable()->after('email_verified_at');
            
            // Default preferences structure:
            // {
            //   "theme": "light|dark|auto",
            //   "language": "tr|en",
            //   "notifications": {
            //     "email": true,
            //     "maintenance_requests": true,
            //     "purchase_requests": true,
            //     "overdue_items": true,
            //     "system": true
            //   },
            //   "dashboard": {
            //     "widgets": ["inventory", "transactions", "requests"],
            //     "items_per_page": 25
            //   }
            // }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('preferences');
        });
    }
};
