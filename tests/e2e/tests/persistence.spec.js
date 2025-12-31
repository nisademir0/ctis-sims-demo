import { test, expect, testUsers } from '../fixtures/test-helpers';

test.describe('Persistence Tests', () => {
  // Login helper
  const login = async (page) => {
    // Clear any existing session
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', testUsers.admin.email);
    await page.fill('[data-testid="password-input"]', testUsers.admin.password);
    await page.click('[data-testid="login-submit"]');
    await page.waitForURL('/', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    // Wait for any welcome toast to disappear
    await page.waitForTimeout(2000);
  };

  test('dark mode persists after page refresh', async ({ page }) => {
    await login(page);
    
    // Verify we're on dashboard
    await expect(page).toHaveURL('/');
    
    // Check initial state (should be light mode)
    const htmlElement = page.locator('html');
    const initialDarkMode = await htmlElement.evaluate(el => el.classList.contains('dark'));
    
    // Toggle dark mode
    await page.click('[data-testid="dark-mode-toggle"]');
    await page.waitForTimeout(500); // Wait for transition
    
    // Verify dark mode is enabled
    const isDarkAfterToggle = await htmlElement.evaluate(el => el.classList.contains('dark'));
    expect(isDarkAfterToggle).toBe(!initialDarkMode);
    
    // Check localStorage
    const themeInStorage = await page.evaluate(() => localStorage.getItem('theme'));
    expect(themeInStorage).toBe(isDarkAfterToggle ? 'dark' : 'light');
    
    // Refresh page
    await page.reload();
    await page.waitForTimeout(500); // Wait for theme to apply
    
    // Verify dark mode persisted
    const isDarkAfterRefresh = await htmlElement.evaluate(el => el.classList.contains('dark'));
    expect(isDarkAfterRefresh).toBe(isDarkAfterToggle);
    
    // Toggle back to original state
    await page.click('[data-testid="dark-mode-toggle"]');
    await page.waitForTimeout(500);
  });

  test('language persists after page refresh', async ({ page }) => {
    await login(page);
    
    // Verify we're on dashboard
    await expect(page).toHaveURL('/');
    
    // Wait for navbar to be visible
    await page.waitForSelector('[data-testid="language-selector"]', { timeout: 10000 });
    
    // Get initial language from button text
    const langButton = page.locator('[data-testid="language-selector"]');
    const initialLang = await langButton.textContent();
    
    // Click language selector and wait for dropdown
    await langButton.click();
    await page.waitForTimeout(200);
    
    // Select opposite language
    if (initialLang.includes('TR')) {
      await page.click('button:has-text("English")');
    } else {
      await page.click('button:has-text("Türkçe")');
    }
    
    await page.waitForTimeout(500); // Wait for language change
    
    // Get new language
    const newLangButton = page.locator('[data-testid="language-selector"]');
    const newLang = await newLangButton.textContent();
    expect(newLang).not.toBe(initialLang);
    
    // Check localStorage
    const langInStorage = await page.evaluate(() => localStorage.getItem('language'));
    expect(langInStorage).toBeTruthy();
    expect(langInStorage).toBe(newLang.includes('EN') ? 'en' : 'tr');
    
    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="language-selector"]', { timeout: 10000 });
    
    // Verify language persisted
    const langAfterRefresh = page.locator('[data-testid="language-selector"]');
    const langTextAfterRefresh = await langAfterRefresh.textContent();
    expect(langTextAfterRefresh).toBe(newLang);
    
    // Verify localStorage still has correct value
    const langInStorageAfterRefresh = await page.evaluate(() => localStorage.getItem('language'));
    expect(langInStorageAfterRefresh).toBe(newLang.includes('EN') ? 'en' : 'tr');
  });

  test('both dark mode and language persist together', async ({ page }) => {
    await login(page);
    
    // Directly set both preferences via localStorage (simulating user interaction)
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('language', 'en');
    });
    
    // Reload to apply settings
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Let preferences load
    
    // Verify both applied from localStorage
    const htmlElement = page.locator('html');
    const isDark = await htmlElement.evaluate(el => el.classList.contains('dark'));
    expect(isDark).toBe(true);
    
    // Verify localStorage persisted
    const themeInStorage = await page.evaluate(() => localStorage.getItem('theme'));
    const langInStorage = await page.evaluate(() => localStorage.getItem('language'));
    expect(themeInStorage).toBe('dark');
    expect(langInStorage).toBe('en');
    
    // Refresh again to verify persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Verify both still persisted after second reload
    const isDarkAfterRefresh = await htmlElement.evaluate(el => el.classList.contains('dark'));
    const themeAfterRefresh = await page.evaluate(() => localStorage.getItem('theme'));
    const langAfterRefresh = await page.evaluate(() => localStorage.getItem('language'));
    
    expect(isDarkAfterRefresh).toBe(true);
    expect(themeAfterRefresh).toBe('dark');
    expect(langAfterRefresh).toBe('en');
  });
});
