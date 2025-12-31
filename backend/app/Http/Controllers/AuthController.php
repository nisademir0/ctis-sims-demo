<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Auth\Events\Verified;
use App\Models\User;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\VerifyEmailRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Requests\Auth\ChangePasswordRequest;

class AuthController extends Controller
{
    // ============================================================================
    // AUTHENTICATION - Login/Logout
    // ============================================================================
    
    /**
     * Login user and return token (SRS FR-1.1)
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($credentials)) {
            $user = User::with('role')->find(Auth::id());
            
            // Update last login information using DB to avoid refresh issues
            DB::table('users')
                ->where('id', $user->id)
                ->update([
                    'last_login_at' => now(),
                    'last_login_ip' => $request->ip(),
                ]);
            
            // Token oluştur (Sanctum)
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Giriş başarılı',
                'token' => $token,
                'user' => $user,
                'role' => $user->role->role_name ?? null, // Frontend yönlendirmesi için (Admin/Staff dashboard ayrımı)
                'email_verified' => $user->hasVerifiedEmail(),
            ]);
        }

        return response()->json(['message' => 'Hatalı e-posta veya şifre.'], 401);
    }

    /**
     * Logout user (SRS FR-1.2)
     * Also cleans up old tokens for the user (keeps only last 3 active tokens)
     */
    public function logout(Request $request)
    {
        $user = $request->user();
        
        // Delete current token
        $currentToken = $user->currentAccessToken();
        if ($currentToken && method_exists($currentToken, 'delete')) {
            $currentToken->delete();
        }
        
        // Clean up old tokens - keep only last 3 tokens per user
        $tokens = $user->tokens()->orderBy('created_at', 'desc')->get();
        if ($tokens->count() > 3) {
            $tokensToDelete = $tokens->skip(3);
            foreach ($tokensToDelete as $token) {
                $token->delete();
            }
        }
        
        return response()->json([
            'message' => 'Çıkış yapıldı',
            'tokens_cleaned' => $tokens->count() > 3 ? $tokens->count() - 3 : 0
        ]);
    }

    /**
     * Get authenticated user information (SRS FR-1.3)
     */
    public function user(Request $request)
    {
        return response()->json([
            'user' => $request->user()->load('role'),
            'email_verified' => $request->user()->hasVerifiedEmail(),
        ]);
    }

    // ============================================================================
    // EMAIL VERIFICATION
    // ============================================================================
    
    /**
     * Send email verification notification (SRS FR-1.4)
     */
    public function sendVerificationEmail(Request $request)
    {
        $user = $request->user();
        
        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'E-posta adresi zaten doğrulanmış.',
            ], 400);
        }
        
        $user->sendEmailVerificationNotification();
        
        return response()->json([
            'message' => 'Doğrulama e-postası gönderildi.',
        ]);
    }

    /**
     * Verify email address (SRS FR-1.5)
     */
    public function verifyEmail(VerifyEmailRequest $request)
    {
        $user = $request->user();
        
        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'E-posta adresi zaten doğrulanmış.',
            ]);
        }
        
        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }
        
        return response()->json([
            'message' => 'E-posta adresi başarıyla doğrulandı.',
        ]);
    }

    // ============================================================================
    // PASSWORD RESET
    // ============================================================================
    
    /**
     * Send password reset link (SRS FR-1.6)
     */
    public function forgotPassword(ForgotPasswordRequest $request)
    {
        $user = User::where('email', $request->email)->first();
        
        // Generate password reset token
        $token = Str::random(60);
        
        // Store token in database
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            [
                'token' => Hash::make($token),
                'created_at' => now(),
            ]
        );
        
        // In production, you would send an email here
        // For now, we'll return the token (remove this in production!)
        return response()->json([
            'message' => 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.',
            'token' => $token, // Only for development - remove in production!
        ]);
    }

    /**
     * Reset password with token (SRS FR-1.7)
     */
    public function resetPassword(ResetPasswordRequest $request)
    {
        // Find token in database
        $passwordReset = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();
        
        if (!$passwordReset) {
            return response()->json([
                'message' => 'Geçersiz şifre sıfırlama kodu.',
            ], 400);
        }
        
        // Check if token matches
        if (!Hash::check($request->token, $passwordReset->token)) {
            return response()->json([
                'message' => 'Geçersiz şifre sıfırlama kodu.',
            ], 400);
        }
        
        // Check if token is expired (1 hour)
        if (now()->diffInMinutes($passwordReset->created_at) > 60) {
            return response()->json([
                'message' => 'Şifre sıfırlama kodu süresi dolmuş.',
            ], 400);
        }
        
        // Update user password
        $user = User::where('email', $request->email)->first();
        $user->update([
            'password' => $request->password,
        ]);
        
        // Delete used token
        DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->delete();
        
        return response()->json([
            'message' => 'Şifreniz başarıyla sıfırlandı.',
        ]);
    }

    // ============================================================================
    // PROFILE MANAGEMENT
    // ============================================================================
    
    /**
     * Get user profile (SRS FR-1.8)
     */
    public function getProfile(Request $request)
    {
        $user = $request->user()->load('role');
        
        // Add avatar_url if avatar exists
        $profileData = $user->toArray();
        if ($user->avatar) {
            $profileData['avatar_url'] = asset('storage/' . $user->avatar);
        }
        
        return response()->json([
            'profile' => $profileData
        ]);
    }

    /**
     * Update user profile (SRS FR-1.9)
     */
    public function updateProfile(UpdateProfileRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();
        
        // Handle avatar upload
        if ($request->hasFile('avatar')) {
            // Delete old avatar if exists
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            
            // Store new avatar
            $avatarPath = $request->file('avatar')->store('avatars', 'public');
            $data['avatar'] = $avatarPath;
        }
        
        // If email changed, reset verification
        if (isset($data['email']) && $data['email'] !== $user->email) {
            $data['email_verified_at'] = null;
        }
        
        $user->update($data);
        
        return response()->json([
            'message' => 'Profil başarıyla güncellendi.',
            'user' => $user->fresh()->load('role'),
        ]);
    }

    /**
     * Change user password (SRS FR-1.10)
     */
    public function changePassword(ChangePasswordRequest $request)
    {
        $user = $request->user();
        
        // Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Mevcut şifre yanlış.',
                'errors' => [
                    'current_password' => ['Mevcut şifre yanlış.']
                ],
            ], 422);
        }
        
        // Update password
        $user->update([
            'password' => $request->new_password,
        ]);
        
        return response()->json([
            'message' => 'Şifreniz başarıyla değiştirildi.',
        ]);
    }

    /**
     * Delete user avatar (SRS FR-1.11)
     */
    public function deleteAvatar(Request $request)
    {
        $user = $request->user();
        
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
            $user->update(['avatar' => null]);
        }
        
        return response()->json([
            'message' => 'Avatar başarıyla silindi.',
        ]);
    }

    // ============================================================================
    // USER MANAGEMENT (Admin Only)
    // ============================================================================

    /**
     * Get all users (Admin only)
     */
    public function getAllUsers(Request $request)
    {
        $users = User::with('role')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'users' => $users,
        ]);
    }

    /**
     * Create new user (Admin only)
     */
    public function createUser(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'role_id' => 'required|exists:roles,id',
            'phone' => 'nullable|string|max:255',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id' => $validated['role_id'],
            'phone' => $validated['phone'] ?? null,
            'is_active' => true,
        ]);

        $user->load('role');

        return response()->json([
            'success' => true,
            'message' => 'Kullanıcı başarıyla oluşturuldu',
            'user' => $user,
        ], 201);
    }

    /**
     * Update user (Admin only)
     */
    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $id,
            'password' => 'nullable|string|min:8|confirmed',
            'role_id' => 'sometimes|required|exists:roles,id',
            'phone' => 'nullable|string|max:255',
            'is_active' => 'sometimes|boolean',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);
        $user->load('role');

        return response()->json([
            'success' => true,
            'message' => 'Kullanıcı başarıyla güncellendi',
            'user' => $user,
        ]);
    }

    /**
     * Delete user (Admin only)
     */
    public function deleteUser($id)
    {
        // Prevent deleting yourself
        if (Auth::id() == $id) {
            return response()->json([
                'success' => false,
                'message' => 'Kendi hesabınızı silemezsiniz',
            ], 422);
        }

        $user = User::findOrFail($id);
        
        // Check if user has active transactions
        if ($user->transactions()->whereNull('returned_at')->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Aktif işlemi olan kullanıcı silinemez',
            ], 422);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kullanıcı başarıyla silindi',
        ]);
    }
    
    // ============================================================================
    // USER PREFERENCES
    // ============================================================================

    /**
     * Get user preferences
     */
    public function getPreferences(Request $request)
    {
        $user = $request->user();
        
        return response()->json([
            'success' => true,
            'preferences' => $user->preferences,
        ]);
    }

    /**
     * Update user preferences
     */
    public function updatePreferences(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'theme' => 'sometimes|in:light,dark,auto',
            'language' => 'sometimes|in:tr,en',
            'notifications' => 'sometimes|array',
            'notifications.email' => 'sometimes|boolean',
            'notifications.maintenance_requests' => 'sometimes|boolean',
            'notifications.purchase_requests' => 'sometimes|boolean',
            'notifications.overdue_items' => 'sometimes|boolean',
            'notifications.system' => 'sometimes|boolean',
            'dashboard' => 'sometimes|array',
            'dashboard.widgets' => 'sometimes|array',
            'dashboard.items_per_page' => 'sometimes|integer|min:10|max:100',
        ]);

        // Merge with existing preferences
        $currentPreferences = $user->preferences;
        $newPreferences = array_replace_recursive($currentPreferences, $validated);
        
        $user->update(['preferences' => $newPreferences]);

        return response()->json([
            'success' => true,
            'message' => 'Tercihler başarıyla güncellendi',
            'preferences' => $user->fresh()->preferences,
        ]);
    }

    /**
     * Reset user preferences to default
     */
    public function resetPreferences(Request $request)
    {
        $user = $request->user();
        $user->update(['preferences' => User::getDefaultPreferences()]);

        return response()->json([
            'success' => true,
            'message' => 'Tercihler sıfırlandı',
            'preferences' => $user->fresh()->preferences,
        ]);
    }
}