<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class BackupController extends Controller
{
    private $backupPath = 'backups/';

    /**
     * Get all backups
     */
    public function index()
    {
        $backups = collect(Storage::disk('local')->files($this->backupPath))
            ->filter(fn($file) => str_ends_with($file, '.sql'))
            ->map(function ($file) {
                $filename = basename($file);
                $size = Storage::disk('local')->size($file);
                
                return [
                    'id' => md5($filename),
                    'filename' => $filename,
                    'path' => $file,
                    'size' => $this->formatBytes($size),
                    'size_bytes' => $size,
                    'created_at' => Carbon::createFromTimestamp(Storage::disk('local')->lastModified($file)),
                    'created_by' => $this->parseCreatorFromFilename($filename),
                    'type' => str_contains($filename, '_auto') ? 'auto' : 'manual',
                    'status' => 'completed',
                    'records_count' => $this->estimateRecordCount($file),
                ];
            })
            ->sortByDesc('created_at')
            ->values()
            ->all();

        return response()->json([
            'success' => true,
            'backups' => $backups,
        ]);
    }

    /**
     * Create a new backup
     * Creates backup in backend storage AND copies to MySQL container for production deployment
     */
    public function store(Request $request)
    {
        try {
            $timestamp = now()->format('Y_m_d_H_i_s');
            $filename = "backup_{$timestamp}.sql";
            $backupPath = storage_path("app/{$this->backupPath}");
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

            // Create backup using mysqldump from backend container
            $command = sprintf(
                'mysqldump -h %s -P %s -u %s -p%s --skip-ssl --no-tablespaces --single-transaction %s > %s 2>&1',
                escapeshellarg($host),
                escapeshellarg($port),
                escapeshellarg($username),
                escapeshellarg($password),
                escapeshellarg($database),
                escapeshellarg($filepath)
            );

            exec($command, $output, $returnVar);

            if ($returnVar !== 0) {
                Log::error('Backup failed', [
                    'command' => $command,
                    'output' => $output
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Backup oluşturulurken hata: ' . implode("\n", $output),
                ], 500);
            }

            // Verify backup file
            if (!file_exists($filepath) || filesize($filepath) < 100) {
                return response()->json([
                    'success' => false,
                    'message' => 'Backup dosyası oluşturulamadı veya boş',
                ], 500);
            }

            $filesize = filesize($filepath);
            $sizeFormatted = $this->formatBytes($filesize);

            return response()->json([
                'success' => true,
                'message' => 'Yedek başarıyla oluşturuldu',
                'backup' => [
                    'filename' => $filename,
                    'size' => $sizeFormatted,
                    'size_bytes' => $filesize,
                    'created_at' => now(),
                    'location' => 'Backend Storage',
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Backup error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Backup hatası: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Format bytes to human readable format
     */
    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, $precision) . $units[$pow];
    }

    /**
     * Restore from backup
     */
    public function restore(Request $request, $id)
    {
        try {
            // Find backup file by ID (md5 of filename)
            $backupFile = collect(Storage::disk('local')->files($this->backupPath))
                ->first(fn($file) => md5(basename($file)) === $id);

            if (!$backupFile) {
                return response()->json([
                    'success' => false,
                    'message' => 'Yedek dosyası bulunamadı',
                ], 404);
            }

            $filepath = storage_path("app/{$backupFile}");

            // Get database credentials
            $database = config('database.connections.mysql.database');
            $username = config('database.connections.mysql.username');
            $password = config('database.connections.mysql.password');
            $host = config('database.connections.mysql.host');
            $port = config('database.connections.mysql.port', 3306);

            // Restore using mysql command
            $command = sprintf(
                'mysql -h %s -P %s -u %s -p%s --skip-ssl %s < %s 2>&1',
                escapeshellarg($host),
                escapeshellarg($port),
                escapeshellarg($username),
                escapeshellarg($password),
                escapeshellarg($database),
                escapeshellarg($filepath)
            );

            exec($command, $output, $returnVar);

            if ($returnVar !== 0) {
                Log::error('Restore failed', ['output' => $output]);
                return response()->json([
                    'success' => false,
                    'message' => 'Geri yükleme hatası: ' . implode("\n", $output),
                ], 500);
            }

            return response()->json([
                'success' => true,
                'message' => 'Veritabanı başarıyla geri yüklendi',
            ]);

        } catch (\Exception $e) {
            Log::error('Restore error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Geri yükleme hatası: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Download backup file
     */
    public function download($id)
    {
        $backupFile = collect(Storage::disk('local')->files($this->backupPath))
            ->first(fn($file) => md5(basename($file)) === $id);

        if (!$backupFile) {
            return response()->json([
                'success' => false,
                'message' => 'Yedek dosyası bulunamadı',
            ], 404);
        }

        return Storage::disk('local')->download($backupFile);
    }

    /**
     * Delete backup
     */
    public function destroy($id)
    {
        $backupFile = collect(Storage::disk('local')->files($this->backupPath))
            ->first(fn($file) => md5(basename($file)) === $id);

        if (!$backupFile) {
            return response()->json([
                'success' => false,
                'message' => 'Yedek dosyası bulunamadı',
            ], 404);
        }

        Storage::disk('local')->delete($backupFile);

        return response()->json([
            'success' => true,
            'message' => 'Yedek başarıyla silindi',
        ]);
    }

    /**
     * Get latest backup filename
     */
    public function latest()
    {
        $latest = collect(Storage::disk('local')->files($this->backupPath))
            ->filter(fn($file) => str_ends_with($file, '.sql'))
            ->sortByDesc(fn($file) => Storage::disk('local')->lastModified($file))
            ->first();

        if (!$latest) {
            return response()->json([
                'success' => false,
                'message' => 'Yedek dosyası bulunamadı',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'filename' => basename($latest),
            'path' => $latest,
            'size' => Storage::disk('local')->size($latest),
            'created_at' => Carbon::createFromTimestamp(Storage::disk('local')->lastModified($latest)),
        ]);
    }

    /**
     * Parse creator from filename
     */
    private function parseCreatorFromFilename($filename)
    {
        return str_contains($filename, '_auto') ? 'System (Auto)' : 'Admin User';
    }

    /**
     * Estimate record count from file size (rough estimation)
     */
    private function estimateRecordCount($filepath)
    {
        $size = Storage::disk('local')->size($filepath);
        // Rough estimate: ~1KB per record
        return (int) ($size / 1024);
    }
}
