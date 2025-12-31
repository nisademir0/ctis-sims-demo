/**
 * Non-Functional Requirements Tests (NFR)
 * Tests for UI/UX and performance requirements
 */

import { test, expect, testUsers, TestHelpers, TestResultTracker } from '../fixtures/test-helpers';

const tracker = new TestResultTracker();

test.describe('NFR: Non-Functional Requirements', () => {
  
  test('NFR-1: Dark mode toggle works', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    
    // Check initial theme
    const initialTheme = await page.getAttribute('html', 'class');
    
    // Toggle dark mode
    await helper.toggleDarkMode();
    
    // Wait for theme change
    await page.waitForTimeout(500);
    
    // Check theme changed
    const newTheme = await page.getAttribute('html', 'class');
    expect(newTheme).not.toBe(initialTheme);
    
    await helper.screenshot('nfr-dark-mode');
    tracker.addResult('NFR-1', 'Dark mode toggle works', 'passed');
  });

  test('NFR-2: All pages are in Turkish', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    
    // Navigate to each main page and check language
    const pages = ['dashboard', 'inventory', 'transactions', 'maintenance', 'reports'];
    
    for (const pageName of pages) {
      await helper.navigateTo(pageName);
      
      // Check for Turkish text (at least one Turkish character)
      const content = await page.textContent('body');
      expect(content).toMatch(/[çğıöşüÇĞİÖŞÜ]/);
    }
    
    await helper.screenshot('nfr-turkish-language');
    tracker.addResult('NFR-2', 'Turkish language support works', 'passed');
  });

  test('NFR-3: Mobile responsive design works', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const helper = new TestHelpers(page);
    
    // Login on mobile
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', testUsers.admin.email);
    await page.fill('[data-testid="password-input"]', testUsers.admin.password);
    await page.click('[data-testid="login-submit"]');
    
    // Wait for navigation
    await page.waitForURL('/', { timeout: 10000 });
    
    // Wait for loading to complete
    await page.waitForSelector('[data-testid="navbar-loading"]', { 
      state: 'hidden',
      timeout: 8000 
    }).catch(() => {});
    
    // Wait for user menu (optional, mobile may have different navbar)
    try {
      await page.waitForSelector('[data-testid="user-menu-button"]', { 
        state: 'visible',
        timeout: 10000 
      });
    } catch (e) {
      console.log('Warning: User menu button not found in mobile view, continuing...');
    }
    
    // Check mobile menu (with proper wait for responsive styles to apply)
    await page.waitForTimeout(1000); // Wait for responsive styles
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    await expect(mobileMenuButton).toBeVisible({ timeout: 5000 });
    
    await helper.screenshot('nfr-mobile-responsive');
    tracker.addResult('NFR-3', 'Mobile responsive design works', 'passed');
  });

  test('NFR-4: Page load time is acceptable', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    
    // Measure page load time
    const startTime = Date.now();
    await helper.navigateTo('inventory');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    await helper.screenshot('nfr-page-load');
    tracker.addResult('NFR-4', `Page load time: ${loadTime}ms`, 'passed');
  });

  test('NFR-5: Accessibility features present', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    
    await helper.navigateTo('inventory');
    
    // Check for accessibility attributes
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
    
    // Check for proper heading structure
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);
    
    // Check for alt text on images
    const images = await page.locator('img').count();
    if (images > 0) {
      const firstImage = page.locator('img').first();
      const altText = await firstImage.getAttribute('alt');
      expect(altText).not.toBeNull();
    }
    
    await helper.screenshot('nfr-accessibility');
    tracker.addResult('NFR-5', 'Accessibility features present', 'passed');
  });

  test.afterAll(async () => {
    tracker.saveToFile();
  });
});
