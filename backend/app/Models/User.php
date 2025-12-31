<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'phone',
        'bio',
        'avatar',
        'email_verified_at',
        'preferences',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'password_reset_token',
        'password_reset_expires_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'password_reset_expires_at' => 'datetime',
            'last_login_at' => 'datetime',
            'preferences' => 'array',
        ];
    }
    
    /**
     * Get default user preferences
     */
    public static function getDefaultPreferences(): array
    {
        return [
            'theme' => 'light',
            'language' => 'tr',
            'notifications' => [
                'email' => true,
                'maintenance_requests' => true,
                'purchase_requests' => true,
                'overdue_items' => true,
                'system' => true,
            ],
            'dashboard' => [
                'widgets' => ['inventory', 'transactions', 'requests'],
                'items_per_page' => 25,
            ],
        ];
    }
    
    /**
     * Get user preferences with defaults
     */
    public function getPreferencesAttribute($value)
    {
        $preferences = $value ? json_decode($value, true) : [];
        return array_replace_recursive(self::getDefaultPreferences(), $preferences ?: []);
    }

    /**
     * Get the role that owns the user.
     */
    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    /**
     * Check if user has one of the specified roles.
     * Accepts both database format (Admin) and code format (admin).
     *
     * @param string|array $roles
     * @return bool
     */
    public function hasRole($roles): bool
    {
        // Ensure the role relationship is loaded
        if (!$this->relationLoaded('role')) {
            $this->load('role');
        }

        // If role is still null or not an object, return false
        if (!$this->role || !is_object($this->role)) {
            return false;
        }

        // Ensure role has role_name property
        if (!isset($this->role->role_name)) {
            return false;
        }

        $roles = is_array($roles) ? $roles : [$roles];
        $userRole = $this->role->role_name;

        // Map database role names to code format
        $roleMap = [
            'Admin' => 'admin',
            'Inventory Manager' => 'inventory_manager',
            'Lab Staff' => 'lab_staff',
            'Student' => 'student',
            'Staff' => 'staff',
        ];

        $normalizedUserRole = $roleMap[$userRole] ?? strtolower(str_replace(' ', '_', $userRole));

        // Check against both formats
        foreach ($roles as $role) {
            $normalizedRole = $roleMap[$role] ?? strtolower(str_replace(' ', '_', $role));
            // Case-insensitive comparison
            if (strcasecmp($normalizedUserRole, $normalizedRole) === 0 || 
                strcasecmp($userRole, $role) === 0) {
                return true;
            }
        }

        return false;
    }
}
