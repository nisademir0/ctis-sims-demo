<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Add rate limiting for API endpoints
        $middleware->throttleApi();
        
        // Add Sanctum middleware for stateful domains
        $middleware->statefulApi();
        
        // Configure authentication to return JSON for API requests
        $middleware->redirectGuestsTo(function ($request) {
            // For API routes, don't redirect - will be handled by exception handler
            return $request->is('api/*') ? null : route('login');
        });
        
        // Register custom middleware aliases
        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
            'chatbot.access' => \App\Http\Middleware\CheckChatbotAccess::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Configure API authentication to return JSON instead of redirect
        $exceptions->shouldRenderJsonWhen(function ($request) {
            return $request->is('api/*') || $request->expectsJson();
        });
        
        // Handle authentication exceptions for API routes
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'message' => 'Unauthenticated.'
                ], 401);
            }
        });
    })->create();
