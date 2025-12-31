<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\ChatbotController;

/*
|--------------------------------------------------------------------------
| DEMO API Routes - Limited Features
|--------------------------------------------------------------------------
| 
| This demo includes only 3 use cases:
| - UC1: Create inventory items (Manager only)
| - UC9: View role-based dashboard
| - UC17: Ask inventory questions via chatbot (read-only)
|
*/

// Public routes
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Authentication
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // UC9: View Role-Based Dashboard - Get items (role-based)
    Route::get('/items', [ItemController::class, 'index']);
    
    // UC9: Dashboard statistics
    Route::get('/items/stats', [ItemController::class, 'stats']);
    
    // UC1: Create inventory items (Manager only)
    Route::post('/items', [ItemController::class, 'store'])->middleware('role:Manager,Admin');
    
    // UC17: Ask Inventory Question via Chatbot (read-only queries)
    Route::post('/chat', [ChatbotController::class, 'query']);
    
    // Get predefined categories (for item creation)
    Route::get('/categories', function () {
        return response()->json(\App\Models\Category::all());
    });
    
    // Get users (for assigning staff to items)
    Route::get('/users', function () {
        return response()->json(\App\Models\User::select('id', 'name', 'email', 'role')->get());
    });
});
