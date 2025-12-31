<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class DatabaseBackup extends Command
{
    protected $signature = 'db:backup {--auto : Mark backup as automatic}';
    protected $description = 'Create a database backup';

    public function handle()
    {
        $this->info('Creating database backup...');

        $timestamp = now()->format('Y_m_d_H_i_s');
        $autoSuffix = $this->option('auto') ? '_auto' : '';
        $filename = "backup_{$timestamp}{$autoSuffix}.sql";
        $backupPath = storage_path("app/backups");
        $filepath = "{$backupPath}/{$filename}";

        // Ensure directory exists
        if (!file_exists($backupPath)) {
            mkdir($backupPath, 0755, true);
        }

        // Get database credentials
        $database = config('database.connections.mysql.database');
        $username = config('database.connections.mysql.username');
        $password = config('database.connections.mysql.password');
        $host = config('database.connections.mysql.host');
        $port = config('database.connections.mysql.port', 3306);

        // Create backup using mysqldump
        $command = sprintf(
            'mysqldump -h %s -P %s -u %s -p%s --skip-ssl --no-tablespaces %s > %s 2>&1',
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            escapeshellarg($password),
            escapeshellarg($database),
            escapeshellarg($filepath)
        );

        exec($command, $output, $returnVar);

        if ($returnVar !== 0) {
            $this->error('Backup failed: ' . implode("\n", $output));
            return 1;
        }

        // Verify backup file
        if (!file_exists($filepath) || filesize($filepath) < 100) {
            $this->error('Backup file was not created or is empty');
            return 1;
        }

        $size = filesize($filepath);
        $sizeFormatted = $this->formatBytes($size);

        $this->info("✅ Backup created successfully!");
        $this->line("📁 File: {$filename}");
        $this->line("📊 Size: {$sizeFormatted}");
        $this->line("📍 Path: {$filepath}");

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
