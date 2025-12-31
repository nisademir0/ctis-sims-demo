<?php

namespace App\Console\Commands;

use App\Services\SlaService;
use Illuminate\Console\Command;

class CheckSlaBreaches extends Command
{
    protected $signature = 'sla:check';
    protected $description = 'Check for SLA breaches in maintenance requests';

    public function handle()
    {
        $slaService = app(SlaService::class);
        
        $this->info('Checking for SLA breaches...');
        
        $breachedCount = $slaService->checkSlaBreaches();
        
        if ($breachedCount > 0) {
            $this->warn("Found {$breachedCount} SLA breaches");
        } else {
            $this->info('No SLA breaches found');
        }
        
        $stats = $slaService->getSlaStatistics();
        $this->info("SLA Compliance Rate: {$stats['compliance_rate']}%");
        $this->info("Breached Requests: {$stats['breached_count']} / {$stats['total_requests']}");
        
        return 0;
    }
}
