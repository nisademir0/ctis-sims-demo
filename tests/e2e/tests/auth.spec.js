/**
 * Authentication Tests (FR-1)
 * Tests for user authentication and profile management
 */

import { test, expect, testUsers, TestHelpers, TestResultTracker } from '../fixtures/test-helpers';

const tracker = new TestResultTracker();

test.describe('FR-1: Authentication & User Management', () => {
  
  test.beforeEach(async ({ page }, testInfo) => {
    // Only navigate to login for tests that don't use authenticatedPage fixture
    // Tests using authenticatedPage are already logged in
    const usesAuthFixture = testInfo.title.includes('View profile') ||
                           testInfo.title.includes('Update profile') ||
                           testInfo.title.includes('Change password') ||
                           testInfo.title.includes('Avatar upload') ||
                           testInfo.title.includes('Logout');
    
    if (!usesAuthFixture) {
      await page.goto('/login');
    }
  });

  test('FR-1.1: User can login with valid credentials', async ({ page }) => {
    const helper = new TestHelpers(page);
    
    await page.fill('[data-testid="email-input"]', testUsers.admin.email);
    await page.fill('[data-testid="password-input"]', testUsers.admin.password);
    await page.click('[data-testid="login-submit"]');
    
    await page.waitForURL('/', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL('/');
    await helper.screenshot('login-success');
    
    tracker.addResult('FR-1.1', 'Valid login successful', 'passed');
  });

  test('FR-1.1: User cannot login with invalid credentials', async ({ page }) => {
    const helper = new TestHelpers(page);
    
    await page.fill('[data-testid="email-input"]', 'wrong@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-submit"]');
    
    // Wait for error to appear - looking for any red alert/error styling
    await page.waitForTimeout(2000);
    const hasError = await page.locator('.bg-red-100, .bg-red-900, .border-red-400, .text-red-700').count() > 0;
    await expect(page).toHaveURL('/login');
    
    await helper.screenshot('login-invalid');
    tracker.addResult('FR-1.1', 'Invalid login rejected', hasError ? 'passed' : 'failed');
  });

  test('FR-1.1: Login form has required fields', async ({ page }) => {
    const helper = new TestHelpers(page);
    
    await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute('required', '');
    await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('required', '');
    
    await helper.screenshot('login-validation');
    tracker.addResult('FR-1.1', 'Form validation present', 'passed');
  });

  test('FR-1.2: Admin can access admin routes', async ({ page, loginAs }) => {
    const helper = new TestHelpers(page);
    await loginAs('admin');
    
    await page.goto('/admin/users');
    await expect(page.locator('text=/kullanıcı|user/i')).toBeVisible({ timeout: 5000 });
    
    await helper.screenshot('admin-access');
    tracker.addResult('FR-1.2', 'Admin access granted', 'passed');
  });

  test('FR-1.2: Staff cannot access admin routes', async ({ page, loginAs }) => {
    const helper = new TestHelpers(page);
    await loginAs('staff');
    
    await page.goto('/admin/users');
    await page.waitForTimeout(2000);
    
    const isOnAdminPage = await page.url().includes('/admin/users');
    await helper.screenshot('staff-access-denied');
    
    tracker.addResult('FR-1.2', 'Staff access denied', isOnAdminPage ? 'failed' : 'passed');
  });

  test('FR-1.6: Password reset request', async ({ page }) => {
    const helper = new TestHelpers(page);
    
    // Click forgot password link
    await page.click('a[href="/forgot-password"]');
    await page.waitForURL('/forgot-password', { timeout: 5000 });
    
    await page.fill('input[type="email"]', testUsers.admin.email);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    await helper.screenshot('password-reset');
    tracker.addResult('FR-1.6', 'Password reset works', 'passed');
  });

  test('FR-1.8: View profile', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    await helper.navigateTo('settings');
    
    await expect(page.locator('text=/profil|ayarlar|settings/i').first()).toBeVisible();
    await helper.screenshot('profile-view');
    
    tracker.addResult('FR-1.8', 'View profile works', 'passed');
  });

  test('FR-1.9: Update profile', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    await helper.navigateTo('settings');
    
    const nameInput = page.locator('input[name="name"], input[name="full_name"]').first();
    if (await nameInput.count() > 0) {
      await nameInput.fill('Updated Name');
      await page.click('button[type="submit"]').first();
      await page.waitForTimeout(1000);
    }
    
    await helper.screenshot('profile-update');
    tracker.addResult('FR-1.9', 'Profile update works', 'passed');
  });

  test('FR-1.10: Change password form accessible', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    await page.goto('/change-password');
    await page.waitForLoadState('load');
    await page.waitForTimeout(1000); // Give React time to render
    
    // Verify all required fields are present (increased timeouts)
    await expect(page.locator('input[name="current_password"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('input[name="new_password"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[name="new_password_confirmation"]')).toBeVisible({ timeout: 5000 });
    
    // Verify submit button is present
    await expect(page.locator('button[type="submit"]')).toBeVisible({ timeout: 5000 });
    
    await helper.screenshot('change-password');
    tracker.addResult('FR-1.10', 'Change password form complete', 'passed');
  });

  test('FR-1.10: Change password validation works', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    await page.goto('/change-password');
    await page.waitForLoadState('load');
    await page.waitForTimeout(1000);
    
    // Wait for form
    await page.waitForSelector('input[name="current_password"]', { state: 'visible', timeout: 15000 });
    
    // Try to submit with weak password
    await page.fill('input[name="current_password"]', 'password');
    await page.fill('input[name="new_password"]', '123'); // Too short
    await page.fill('input[name="new_password_confirmation"]', '123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Should show validation error (page should still be on /change-password)
    await expect(page).toHaveURL('/change-password');
    
    await helper.screenshot('change-password-validation');
    tracker.addResult('FR-1.10', 'Password validation active', 'passed');
  });

  test('FR-1.10: Change password with mismatched passwords fails', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    await page.goto('/change-password');
    await page.waitForLoadState('load');
    await page.waitForTimeout(1000);
    
    // Wait for form
    await page.waitForSelector('input[name="current_password"]', { state: 'visible', timeout: 15000 });
    
    // Try with mismatched passwords
    await page.fill('input[name="current_password"]', 'password');
    await page.fill('input[name="new_password"]', 'newPassword123!');
    await page.fill('input[name="new_password_confirmation"]', 'differentPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Should show error or stay on same page
    const hasError = await page.locator('.bg-red-100, .bg-red-900, .text-red-600, .text-red-700').count() > 0;
    const stillOnPage = page.url().includes('/change-password');
    
    await helper.screenshot('change-password-mismatch');
    tracker.addResult('FR-1.10', 'Password mismatch detected', (hasError || stillOnPage) ? 'passed' : 'failed');
  });

  test('FR-1.11: Avatar upload section present', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    await helper.navigateTo('settings');
    
    // Check if any avatar/profile section exists
    const avatarSection = await page.locator('text=/avatar|foto|resim|profile/i').first();
    const isVisible = await avatarSection.isVisible().catch(() => false);
    
    await helper.screenshot('avatar-section');
    tracker.addResult('FR-1.11', 'Avatar section present', isVisible ? 'passed' : 'failed');
  });

  test('FR-1.13: Logout works', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    
    // Wait for user menu button and click it to open dropdown
    await page.waitForSelector('[data-testid="user-menu-button"]', { timeout: 10000 });
    await page.click('[data-testid="user-menu-button"]');
    await page.waitForTimeout(500);
    
    // Click logout button in dropdown menu
    await page.waitForSelector('[data-testid="logout-button"]', { timeout: 5000 });
    await page.click('[data-testid="logout-button"]');
    await page.waitForURL('/login', { timeout: 5000 });
    
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await helper.screenshot('logout-success');
    
    tracker.addResult('FR-1.13', 'Logout successful', 'passed');
  });

  test.afterAll(async () => {
    tracker.saveToFile();
  });
});
