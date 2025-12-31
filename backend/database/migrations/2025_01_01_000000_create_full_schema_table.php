<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Roles & Users [cite: 591, 592]
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('role_name')->unique(); // Admin, Manager, Staff
            $table->timestamps();
        });

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->foreignId('role_id')->constrained('roles'); 
            $table->rememberToken();
            $table->timestamps();
        });

        // 2. Categories & Vendors [cite: 594, 595]
        Schema::create('item_categories', function (Blueprint $table) {
            $table->id();
            $table->string('category_name')->unique();
            $table->timestamps();
        });

        Schema::create('vendors', function (Blueprint $table) {
            $table->id();
            $table->string('vendor_name');
            $table->text('contact_info')->nullable();
            $table->timestamps();
        });

        // 3. Items (Central Table) [cite: 593]
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->string('inventory_number')->unique(); 
            $table->string('name');
            $table->foreignId('category_id')->constrained('item_categories');
            $table->foreignId('vendor_id')->nullable()->constrained('vendors');
            $table->string('location');
            // Status ENUM [cite: 593]
            $table->enum('status', ['available', 'lent', 'maintenance', 'retired', 'donated'])->default('available');
            $table->json('specifications')->nullable(); // [cite: 576]
            $table->foreignId('current_holder_id')->nullable()->constrained('users');
            $table->boolean('is_active')->default(true);
            $table->date('purchase_date')->nullable();
            $table->date('warranty_expiry_date')->nullable();
            $table->timestamps();
        });

        // 4. Transactions (Loans) [cite: 596]
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('items');
            $table->foreignId('user_id')->constrained('users'); // Borrower
            $table->dateTime('checkout_date');
            $table->dateTime('due_date')->nullable();
            $table->dateTime('return_date')->nullable(); // NULL = Still checked out
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 5. Item Lifecycle Events [cite: 598]
        Schema::create('item_lifecycle_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('items');
            $table->enum('event_type', ['Purchase', 'Donation', 'Scrapped', 'Maintenance', 'Lost']);
            $table->date('event_date');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 6. Activity Log [cite: 600]
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users');
            $table->string('action_description');
            $table->timestamp('timestamp')->useCurrent();
        });

        // --- VIEWS ---
        // NOTE: View creation moved to migration 2025_12_11_115540_create_database_views_final.php
        // This prevents SQLite "error in view" issues during table alterations in later migrations.
        // Views are created AFTER all table structure changes are complete.
    }

    public function down(): void
    {
        DB::statement("DROP VIEW IF EXISTS view_general_inventory");
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('item_lifecycle_events');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('items');
        Schema::dropIfExists('vendors');
        Schema::dropIfExists('item_categories');
        Schema::dropIfExists('users');
        Schema::dropIfExists('roles');
    }
};