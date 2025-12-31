<?php

namespace App\Console\Commands;

use App\Models\ScheduledReport;
use App\Services\ReportService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class RunScheduledReports extends Command
{
    protected $signature = 'reports:run';
    protected $description = 'Run scheduled reports that are due';

    public function handle()
    {
        $this->info('Checking for due reports...');
        
        $dueReports = ScheduledReport::due()->get();
        
        if ($dueReports->isEmpty()) {
            $this->info('No reports due at this time');
            return 0;
        }
        
        $this->info("Found {$dueReports->count()} report(s) to run");
        
        foreach ($dueReports as $report) {
            try {
                $this->info("Running: {$report->name}");
                $this->runReport($report);
                $this->info("✓ Completed: {$report->name}");
            } catch (\Exception $e) {
                $this->error("✗ Failed: {$report->name} - {$e->getMessage()}");
                Log::error('Scheduled report failed', [
                    'report_id' => $report->id,
                    'report_name' => $report->name,
                    'error' => $e->getMessage(),
                ]);
            }
        }
        
        return 0;
    }

    protected function runReport(ScheduledReport $report)
    {
        $reportService = app(ReportService::class);
        
        // Generate report data based on type
        $data = $reportService->generateReportData($report->report_type, $report->filters ?? []);
        
        // Format data according to format preference
        $file = $reportService->formatReport($data, $report->format, $report->report_type);
        
        // Send email to recipients
        foreach ($report->recipients as $email) {
            Mail::raw(
                "Your scheduled report '{$report->name}' is attached.",
                function ($message) use ($email, $report, $file) {
                    $message->to($email)
                        ->subject("Scheduled Report: {$report->name}")
                        ->attach($file);
                }
            );
        }
        
        // Update last run and next run times
        $report->update([
            'last_run_at' => now(),
            'next_run_at' => $report->calculateNextRun(),
        ]);
        
        // Clean up temp file
        if (file_exists($file)) {
            unlink($file);
        }
    }
}
