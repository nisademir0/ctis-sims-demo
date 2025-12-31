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
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('setting_key', 100)->unique();
            $table->text('setting_value');
            $table->enum('setting_type', ['boolean', 'string', 'integer', 'json'])->default('string');
            $table->string('category', 50)->default('general');
            $table->text('description')->nullable();
            $table->boolean('is_public')->default(false);
            $table->timestamps();
            
            $table->index('category');
            $table->index('setting_key');
        });

        // Seed initial settings
        DB::table('system_settings')->insert([
            // AI/Chatbot Settings
            [
                'setting_key' => 'chatbot.enabled',
                'setting_value' => 'true',
                'setting_type' => 'boolean',
                'category' => 'ai',
                'description' => 'Enable/disable AI chatbot globally',
                'is_public' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'setting_key' => 'chatbot.staff_access',
                'setting_value' => 'false',
                'setting_type' => 'boolean',
                'category' => 'ai',
                'description' => 'Allow staff to access AI chatbot',
                'is_public' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'setting_key' => 'chatbot.manager_access',
                'setting_value' => 'true',
                'setting_type' => 'boolean',
                'category' => 'ai',
                'description' => 'Allow managers to access AI chatbot',
                'is_public' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'setting_key' => 'chatbot.admin_access',
                'setting_value' => 'true',
                'setting_type' => 'boolean',
                'category' => 'ai',
                'description' => 'Allow admins to access AI chatbot',
                'is_public' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'setting_key' => 'chatbot.max_queries_per_day',
                'setting_value' => '50',
                'setting_type' => 'integer',
                'category' => 'ai',
                'description' => 'Max queries per user per day',
                'is_public' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'setting_key' => 'chatbot.log_all_queries',
                'setting_value' => 'true',
                'setting_type' => 'boolean',
                'category' => 'ai',
                'description' => 'Log all chatbot queries for audit',
                'is_public' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
