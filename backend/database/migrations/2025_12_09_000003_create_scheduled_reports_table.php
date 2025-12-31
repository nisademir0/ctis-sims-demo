<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scheduled_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->string('name');
            $table->string('report_type'); // inventory, transactions, maintenance, purchase
            $table->enum('frequency', ['daily', 'weekly', 'monthly'])->default('weekly');
            $table->json('filters')->nullable(); // Store report filters
            $table->string('format')->default('csv'); // csv, pdf, excel
            $table->json('recipients'); // Array of email addresses
            $table->time('scheduled_time')->default('09:00:00');
            $table->integer('day_of_week')->nullable(); // 0-6 for weekly reports
            $table->integer('day_of_month')->nullable(); // 1-31 for monthly reports
            $table->timestamp('last_run_at')->nullable();
            $table->timestamp('next_run_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index(['is_active', 'next_run_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scheduled_reports');
    }
};
