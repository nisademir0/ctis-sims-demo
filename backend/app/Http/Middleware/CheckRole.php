<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Role-Based Access Control Middleware
 * 
 * Enforces role permissions based on business rules:
 * - Admin: System configuration, user management, backups
 * - Inventory Manager: Full inventory control, lending/returning, request approval
 * - Staff: Read-only inventory, submit requests, use chatbot
 */
class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  ...$roles  Allowed roles (e.g., 'admin', 'inventory_manager')
     * @return mixed
     */
    public function handle(Request $request, Closure $next, ...$roles)
    {
        // Check if user is authenticated
        if (!$request->user()) {
            return response()->json([
                'message' => 'Kimlik doğrulaması gerekli.'
            ], 401);
        }

        $user = $request->user();

        // Check if user has any of the required roles using hasRole() helper
        $hasRequiredRole = false;
        foreach ($roles as $role) {
            // Convert route parameter to proper role name format
            // 'admin' -> 'Admin', 'inventory_manager' -> 'Inventory Manager'
            $roleName = ucwords(str_replace('_', ' ', $role));
            
            if ($user->hasRole($roleName)) {
                $hasRequiredRole = true;
                break;
            }
        }

        if (!$hasRequiredRole) {
            return response()->json([
                'message' => 'Bu işlem için yetkiniz yok.',
                'required_roles' => $roles,
                'your_role' => $user->role->role_name ?? 'Unknown'
            ], 403);
        }

        return $next($request);
    }
}
