<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Log;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule overdue transaction check daily at 9:00 AM
Schedule::command('transactions:check-overdue')
    ->dailyAt('09:00')
    ->timezone('Europe/Istanbul')
    ->onSuccess(function () {
        Log::info('Overdue transactions check completed successfully');
    })
    ->onFailure(function () {
        Log::error('Overdue transactions check failed');
    });

// Schedule automatic database backup daily at 2:00 AM
Schedule::command('db:backup --auto')
    ->dailyAt('02:00')
    ->timezone('Europe/Istanbul')
    ->onSuccess(function () {
        Log::info('✅ Automatic database backup completed successfully');
    })
    ->onFailure(function () {
        Log::error('❌ Automatic database backup failed');
    });

// Clean old backups daily at 2:30 AM (keep last 30 days, minimum 5 backups)
Schedule::command('db:cleanup-old-backups')
    ->dailyAt('02:30')
    ->timezone('Europe/Istanbul')
    ->onSuccess(function () {
        Log::info('✅ Old backups cleanup completed successfully');
    })
    ->onFailure(function () {
        Log::error('❌ Old backups cleanup failed');
    });
