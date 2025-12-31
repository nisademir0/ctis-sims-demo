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
            // Email verification
            $table->timestamp('email_verified_at')->nullable()->after('email');
            
            // Profile information
            $table->string('phone')->nullable()->after('email_verified_at');
            $table->text('bio')->nullable()->after('phone');
            $table->string('avatar')->nullable()->after('bio');
            
            // Password reset
            $table->string('password_reset_token')->nullable()->after('password');
            $table->timestamp('password_reset_expires_at')->nullable()->after('password_reset_token');
            
            // Account security
            $table->timestamp('last_login_at')->nullable()->after('password_reset_expires_at');
            $table->string('last_login_ip')->nullable()->after('last_login_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'email_verified_at',
                'phone',
                'bio',
                'avatar',
                'password_reset_token',
                'password_reset_expires_at',
                'last_login_at',
                'last_login_ip',
            ]);
        });
    }
};
