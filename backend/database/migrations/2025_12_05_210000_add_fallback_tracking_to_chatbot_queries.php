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
        Schema::table('chatbot_queries', function (Blueprint $table) {
            $table->boolean('used_fallback')->default(false)->after('was_successful');
            $table->foreignId('fallback_response_id')->nullable()->after('used_fallback');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chatbot_queries', function (Blueprint $table) {
            $table->dropColumn(['used_fallback', 'fallback_response_id']);
        });
    }
};
