<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Http\Request;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Check if running in testing environment
        $isTesting = app()->environment('testing');
        $request = request();
        $userAgent = $request ? ($request->userAgent() ?? '') : '';
        
        // Detect E2E testing by User-Agent or X-Test-Mode header
        $isE2ETesting = str_contains($userAgent, 'Playwright') 
                     || str_contains($userAgent, 'E2E-Test-Runner')
                     || $request?->header('X-Test-Mode') === 'e2e';
        
        // Define rate limiters for API routes
        RateLimiter::for('api', function (Request $request) use ($isE2ETesting) {
            // Disable rate limiting for E2E tests
            if ($isE2ETesting) {
                return Limit::none();
            }
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Rate limiter for login attempts (more restrictive in production)
        RateLimiter::for('login', function (Request $request) use ($isE2ETesting) {
            // Disable rate limiting for E2E tests to prevent 429 errors
            if ($isE2ETesting) {
                return Limit::none();
            }
            // In production: 10 attempts per minute
            return Limit::perMinute(10)->by($request->ip());
        });

        // Rate limiter for AI/chatbot queries (very restrictive due to cost)
        RateLimiter::for('ai', function (Request $request) use ($isE2ETesting) {
            // More relaxed for E2E tests but still limited to prevent API abuse
            if ($isE2ETesting) {
                return Limit::perMinute(100)->by($request->user()?->id ?: $request->ip());
            }
            return Limit::perMinute(20)->by($request->user()?->id ?: $request->ip());
        });
    }
}
