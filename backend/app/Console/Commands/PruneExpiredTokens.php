<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * Clean up expired Sanctum tokens
 * 
 * This command deletes tokens that are older than 30 days.
 * Run this via scheduler or manually: php artisan tokens:prune
 */
class PruneExpiredTokens extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tokens:prune {--days=30 : Number of days after which tokens are considered expired}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete expired Sanctum tokens older than specified days (default: 30)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $days = $this->option('days');
        
        $this->info("🧹 Cleaning up tokens older than {$days} days...");
        
        $deletedCount = PersonalAccessToken::where('created_at', '<', now()->subDays($days))
            ->delete();
        
        if ($deletedCount > 0) {
            $this->info("✅ Deleted {$deletedCount} expired token(s)");
        } else {
            $this->info("✅ No expired tokens found");
        }
        
        // Show current token stats
        $totalTokens = PersonalAccessToken::count();
        $uniqueUsers = PersonalAccessToken::distinct('tokenable_id')->count('tokenable_id');
        
        $this->info("📊 Current stats:");
        $this->line("   Total active tokens: {$totalTokens}");
        $this->line("   Unique users with tokens: {$uniqueUsers}");
        
        return Command::SUCCESS;
    }
}
