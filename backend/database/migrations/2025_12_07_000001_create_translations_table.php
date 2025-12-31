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
        Schema::create('translations', function (Blueprint $table) {
            $table->id();
            $table->string('locale', 10)->index(); // tr, en
            $table->string('namespace', 100)->index(); // common, inventory, transactions, etc.
            $table->string('key', 255)->index(); // loading, save, itemName, etc.
            $table->text('value'); // Actual translation text
            $table->text('description')->nullable(); // Optional description for translators
            $table->timestamps();
            
            // Ensure unique combination of locale, namespace, and key
            $table->unique(['locale', 'namespace', 'key'], 'translations_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('translations');
    }
};
