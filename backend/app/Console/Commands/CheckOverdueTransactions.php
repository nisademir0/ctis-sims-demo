<?php

namespace App\Console\Commands;

use App\Services\TransactionService;
use Illuminate\Console\Command;

class CheckOverdueTransactions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'transactions:check-overdue';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for overdue transactions and send reminder emails';

    /**
     * Execute the console command.
     */
    public function handle(TransactionService $transactionService)
    {
        $this->info('Checking for overdue transactions...');
        
        $result = $transactionService->updateOverdueStatus();
        
        $this->info("✓ Processed overdue transactions:");
        $this->line("  - Transactions updated: {$result['transactions_updated']}");
        $this->line("  - Emails sent: {$result['emails_sent']}");
        
        if ($result['emails_failed'] > 0) {
            $this->warn("  - Emails failed: {$result['emails_failed']}");
        }
        
        $this->newLine();
        $this->info('Done!');
        
        return Command::SUCCESS;
    }
}
