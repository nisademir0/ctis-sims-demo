<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class CleanupOldBackups extends Command
{
    protected $signature = 'db:cleanup-old-backups {--days=30 : Delete backups older than N days} {--keep=5 : Minimum number of backups to keep}';
    protected $description = 'Delete old database backups (keeps last 30 days, minimum 5 backups)';

    public function handle()
    {
        $daysToKeep = (int) $this->option('days');
        $minBackupsToKeep = (int) $this->option('keep');
        
        $this->info("🧹 Cleaning up old database backups...");
        $this->line("📅 Keeping backups from last {$daysToKeep} days");
        $this->line("🔒 Minimum backups to keep: {$minBackupsToKeep}");

        $backupPath = storage_path('app/backups');
        
        if (!is_dir($backupPath)) {
            $this->warn('⚠️  Backup directory does not exist');
            return 0;
        }

        // Get all backup files sorted by modification time (newest first)
        $files = glob($backupPath . '/backup_*.sql');
        
        if (empty($files)) {
            $this->info('ℹ️  No backup files found');
            return 0;
        }

        // Sort by modification time (newest first)
        usort($files, function($a, $b) {
            return filemtime($b) - filemtime($a);
        });

        $totalFiles = count($files);
        $this->line("📦 Found {$totalFiles} backup file(s)");

        $cutoffDate = Carbon::now()->subDays($daysToKeep);
        $deletedCount = 0;
        $deletedSize = 0;

        // Skip the first N files (minimum to keep)
        $filesToCheck = array_slice($files, $minBackupsToKeep);

        foreach ($filesToCheck as $file) {
            $fileTime = Carbon::createFromTimestamp(filemtime($file));
            
            if ($fileTime->lt($cutoffDate)) {
                $size = filesize($file);
                $filename = basename($file);
                
                if (unlink($file)) {
                    $deletedCount++;
                    $deletedSize += $size;
                    $this->line("🗑️  Deleted: {$filename} ({$this->formatBytes($size)}) - Age: {$fileTime->diffForHumans()}");
                } else {
                    $this->error("❌ Failed to delete: {$filename}");
                }
            }
        }

        $remainingCount = $totalFiles - $deletedCount;
        
        if ($deletedCount > 0) {
            $this->info("✅ Cleanup completed!");
            $this->line("🗑️  Deleted: {$deletedCount} file(s) ({$this->formatBytes($deletedSize)})");
            $this->line("📦 Remaining: {$remainingCount} file(s)");
        } else {
            $this->info("✅ No old backups to delete. All backups are recent or protected.");
            $this->line("📦 Total backups: {$remainingCount}");
        }

        return 0;
    }

    private function formatBytes($bytes)
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));
        return round($bytes, 2) . ' ' . $units[$pow];
    }
}
