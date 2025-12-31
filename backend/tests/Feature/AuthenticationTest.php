<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;
use App\Models\User;
use App\Models\Role;

class AuthenticationTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Get or create roles
        Role::firstOrCreate(['role_name' => 'Admin']);
        Role::firstOrCreate(['role_name' => 'Inventory Manager']);
        Role::firstOrCreate(['role_name' => 'Staff']);
        
        Storage::fake('public');
    }

    // ============================================================================
    // LOGIN TESTS
    // ============================================================================

    /** @test */
    public function user_can_login_with_valid_credentials()
    {
        $role = Role::where('role_name', 'Staff')->first();
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => 'Password123',
            'role_id' => $role->id,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'Password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'token',
                'user',
                'role',
                'email_verified',
            ]);
    }

    /** @test */
    public function user_cannot_login_with_invalid_credentials()
    {
        $role = Role::where('role_name', 'Staff')->first();
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => 'Password123',
            'role_id' => $role->id,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'WrongPassword',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Hatalı e-posta veya şifre.',
            ]);
    }

    /** @test */
    public function login_updates_last_login_information()
    {
        $role = Role::where('role_name', 'Staff')->first();
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => 'Password123',
            'role_id' => $role->id,
        ]);

        $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'Password123',
        ]);

        $user->refresh();
        $this->assertNotNull($user->last_login_at);
        $this->assertNotNull($user->last_login_ip);
    }

    // ============================================================================
    // EMAIL VERIFICATION TESTS
    // ============================================================================

    /** @test */
    public function authenticated_user_can_request_verification_email()
    {
        Mail::fake();
        
        $role = Role::where('role_name', 'Staff')->first();
        $user = User::factory()->unverified()->create([
            'role_id' => $role->id,
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/email/verification-notification');

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Doğrulama e-postası gönderildi.',
            ]);
    }

    /** @test */
    public function user_cannot_request_verification_if_already_verified()
    {
        $role = Role::where('role_name', 'Staff')->first();
        $user = User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/email/verification-notification');

        $response->assertStatus(400)
            ->assertJson([
                'message' => 'E-posta adresi zaten doğrulanmış.',
            ]);
    }

    /** @test */
    public function user_can_verify_email()
    {
        $role = Role::where('role_name', 'Staff')->first();
        $user = User::factory()->unverified()->create([
            'role_id' => $role->id,
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/email/verify');

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'E-posta adresi başarıyla doğrulandı.',
            ]);

        $user->refresh();
        $this->assertNotNull($user->email_verified_at);
    }

    // ============================================================================
    // PASSWORD RESET TESTS
    // ============================================================================

    /** @test */
    public function user_can_request_password_reset()
    {
        $role = Role::where('role_name', 'Staff')->first();
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'role_id' => $role->id,
        ]);

        $response = $this->postJson('/api/forgot-password', [
            'email' => 'test@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'token',
            ]);

        $this->assertDatabaseHas('password_reset_tokens', [
            'email' => 'test@example.com',
        ]);
    }

    /** @test */
    public function user_cannot_request_password_reset_with_invalid_email()
    {
        $response = $this->postJson('/api/forgot-password', [
            'email' => 'nonexistent@example.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function user_can_reset_password_with_valid_token()
    {
        $role = Role::where('role_name', 'Staff')->first();
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'role_id' => $role->id,
        ]);

        // Request password reset
        $forgotResponse = $this->postJson('/api/forgot-password', [
            'email' => 'test@example.com',
        ]);

        $token = $forgotResponse->json('token');

        // Reset password
        $response = $this->postJson('/api/reset-password', [
            'email' => 'test@example.com',
            'token' => $token,
            'password' => 'NewPassword123',
            'password_confirmation' => 'NewPassword123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Şifreniz başarıyla sıfırlandı.',
            ]);

        // Verify new password works
        $user->refresh();
        $this->assertTrue(Hash::check('NewPassword123', $user->password));
    }

    /** @test */
    public function user_cannot_reset_password_with_invalid_token()
    {
        $role = Role::where('role_name', 'Staff')->first();
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'role_id' => $role->id,
        ]);

        $response = $this->postJson('/api/reset-password', [
            'email' => 'test@example.com',
            'token' => 'invalid-token',
            'password' => 'NewPassword123',
            'password_confirmation' => 'NewPassword123',
        ]);

        $response->assertStatus(400)
            ->assertJson([
                'message' => 'Geçersiz şifre sıfırlama kodu.',
            ]);
    }

    // ============================================================================
    // PROFILE MANAGEMENT TESTS
    // ============================================================================

    /** @test */
    public function user_can_view_their_profile()
    {
        $role = Role::where('role_name', 'Staff')->first();
        $user = User::factory()->create([
            'role_id' => $role->id,
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/profile');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'profile' => [
                    'id',
                    'name',
                    'email',
                    'phone',
                    'bio',
                    'avatar',
                    'role',
                ],
            ]);
    }

    /** @test */
    public function user_can_update_their_profile()
    {
        $role = Role::where('role_name', 'Staff')->first();
        $user = User::factory()->create([
            'role_id' => $role->id,
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/profile', [
                'name' => 'Updated Name',
                'phone' => '+90 555 123 4567',
                'bio' => 'This is my bio',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Profil başarıyla güncellendi.',
            ]);

        $user->refresh();
        $this->assertEquals('Updated Name', $user->name);
        $this->assertEquals('+90 555 123 4567', $user->phone);
        $this->assertEquals('This is my bio', $user->bio);
    }

    /** @test */
    public function user_can_upload_avatar()
    {
        Storage::fake('public');
        
        $role = Role::where('role_name', 'Staff')->first();
        $user = User::factory()->create([
            'role_id' => $role->id,
        ]);

        $file = UploadedFile::fake()->create('avatar.jpg', 100, 'image/jpeg');

        $response = $this->actingAs($user)
            ->postJson('/api/profile', [
                'avatar' => $file,
            ]);

        $response->assertStatus(200);

        $user->refresh();
        $this->assertNotNull($user->avatar);
        $this->assertTrue(Storage::disk('public')->exists($user->avatar));
    }

    /** @test */
    public function user_can_delete_avatar()
    {
        $role = Role::where('role_name', 'Staff')->first();
        $path = 'avatars/test-avatar.jpg';

        $user = User::factory()->create([
            'role_id' => $role->id,
            'avatar' => $path,
        ]);

        $response = $this->actingAs($user)
            ->deleteJson('/api/avatar');

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Avatar başarıyla silindi.',
            ]);

        $user->refresh();
        $this->assertNull($user->avatar);
    }

    // ============================================================================
    // PASSWORD CHANGE TESTS
    // ============================================================================

    /** @test */
    public function user_can_change_password_with_valid_current_password()
    {
        $role = Role::where('role_name', 'Staff')->first();
        $user = User::factory()->create([
            'password' => 'OldPassword123',
            'role_id' => $role->id,
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/change-password', [
                'current_password' => 'OldPassword123',
                'new_password' => 'NewPassword123',
                'new_password_confirmation' => 'NewPassword123',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Şifreniz başarıyla değiştirildi.',
            ]);

        $user->refresh();
        $this->assertTrue(Hash::check('NewPassword123', $user->password));
    }

    /** @test */
    public function user_cannot_change_password_with_invalid_current_password()
    {
        $role = Role::where('role_name', 'Staff')->first();
        $user = User::factory()->create([
            'password' => 'OldPassword123',
            'role_id' => $role->id,
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/change-password', [
                'current_password' => 'WrongPassword',
                'new_password' => 'NewPassword123',
                'new_password_confirmation' => 'NewPassword123',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Mevcut şifre yanlış.',
            ]);
    }

    /** @test */
    public function password_change_validates_password_strength()
    {
        $role = Role::where('role_name', 'Staff')->first();
        $user = User::factory()->create([
            'password' => 'OldPassword123',
            'role_id' => $role->id,
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/change-password', [
                'current_password' => 'OldPassword123',
                'new_password' => 'weak',
                'new_password_confirmation' => 'weak',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['new_password']);
    }

    /** @test */
    public function user_cannot_use_same_password_when_changing()
    {
        $role = Role::where('role_name', 'Staff')->first();
        $user = User::factory()->create([
            'password' => 'Password123',
            'role_id' => $role->id,
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/change-password', [
                'current_password' => 'Password123',
                'new_password' => 'Password123',
                'new_password_confirmation' => 'Password123',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['new_password']);
    }

    // ============================================================================
    // LOGOUT TEST
    // ============================================================================

    /** @test */
    public function user_can_logout()
    {
        $role = Role::where('role_name', 'Staff')->first();
        $user = User::factory()->create([
            'role_id' => $role->id,
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/logout');

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Çıkış yapıldı',
            ]);
    }
}
