<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates reports table for report metadata storage.
     * SRS Section 5.2.8: Report generation and tracking.
     */
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255)->comment('Report name/title');
            $table->string('type', 100)->comment('Report type: inventory, transactions, overdue, maintenance');
            $table->text('description')->nullable()->comment('Report description');
            $table->json('parameters')->nullable()->comment('Report generation parameters (filters, date ranges, etc.)');
            $table->string('format', 20)->default('pdf')->comment('Export format: pdf, excel, csv');
            $table->string('file_path', 500)->nullable()->comment('Generated file storage path');
            $table->integer('file_size')->nullable()->comment('File size in bytes');
            $table->foreignId('generated_by')->constrained('users')->onDelete('cascade')->comment('User who generated the report');
            $table->timestamp('generated_at')->nullable()->comment('When the report was generated');
            $table->timestamp('expires_at')->nullable()->comment('When the report file expires and should be deleted');
            $table->enum('status', ['pending', 'generating', 'completed', 'failed'])->default('pending');
            $table->text('error_message')->nullable()->comment('Error message if generation failed');
            $table->timestamps();
            
            // Indexes
            $table->index('type');
            $table->index('generated_by');
            $table->index('status');
            $table->index('generated_at');
            $table->index('expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
