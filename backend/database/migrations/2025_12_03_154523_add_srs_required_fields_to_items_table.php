<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds SRS-required fields to items table:
     * - Warranty tracking (warranty_period_months)
     * - Condition status (new/used/refurbished/damaged)
     * - Acquisition method (purchase/donation/transfer/lease)
     * - Financial tracking (purchase_value, current_value, depreciation_method)
     */
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            // SRS Section 3.2.1: Warranty tracking
            $table->integer('warranty_period_months')->nullable()
                ->after('warranty_expiry_date')
                ->comment('Warranty duration in months');
            
            // SRS Section 3.2.1: Condition tracking
            $table->enum('condition_status', ['new', 'used', 'refurbished', 'damaged'])
                ->default('new')
                ->after('status')
                ->comment('Physical condition of the item');
            
            // SRS Section 3.2.1: Acquisition tracking
            $table->enum('acquisition_method', ['purchase', 'donation', 'transfer', 'lease'])
                ->default('purchase')
                ->after('condition_status')
                ->comment('How the item was acquired');
            
            // SRS Section 3.2.4: Depreciation tracking
            $table->decimal('purchase_value', 10, 2)->nullable()
                ->after('acquisition_method')
                ->comment('Original purchase price');
                
            $table->decimal('current_value', 10, 2)->nullable()
                ->after('purchase_value')
                ->comment('Current depreciated value');
                
            $table->string('depreciation_method', 50)->nullable()
                ->after('current_value')
                ->comment('Depreciation calculation method (straight-line, declining-balance, etc.)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn([
                'warranty_period_months',
                'condition_status',
                'acquisition_method',
                'purchase_value',
                'current_value',
                'depreciation_method'
            ]);
        });
    }
};
