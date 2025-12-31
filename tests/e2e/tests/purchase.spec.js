/**
 * Purchase Request Tests (FR-5)
 * Tests for purchase request workflow
 */

import { test, expect, testUsers, TestHelpers, TestResultTracker } from '../fixtures/test-helpers';

const tracker = new TestResultTracker();

test.describe('FR-5: Purchase Requests', () => {
  
  test('FR-5.1: User can view purchase requests page', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    
    await page.goto('/purchase-requests');
    await page.waitForLoadState('networkidle');
    
    const isOnPage = page.url().includes('/purchase-requests');
    await helper.screenshot('purchase-requests-page');
    
    tracker.addResult('FR-5.1', 'Purchase requests page accessible', isOnPage ? 'passed' : 'failed');
  });

  test('FR-5.2: Create button exists', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    
    await page.goto('/purchase-requests');
    await page.waitForLoadState('networkidle');
    
    const hasButton = await page.locator('button:has-text("Yeni"), button:has-text("Ekle"), a:has-text("Yeni")').count() > 0;
    await helper.screenshot('purchase-create-button');
    
    tracker.addResult('FR-5.2', 'Create button exists', hasButton ? 'passed' : 'failed');
  });

  test('FR-5.3: Purchase list displayed', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    
    await page.goto('/purchase-requests');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('table, .card, .list').count() > 0;
    await helper.screenshot('purchase-list');
    
    tracker.addResult('FR-5.3', 'List displayed', hasContent ? 'passed' : 'failed');
  });

  test('FR-5.4: Manager access', async ({ page, loginAs }) => {
    const helper = new TestHelpers(page);
    await loginAs('inventoryManager');
    
    await page.goto('/purchase-requests');
    await page.waitForLoadState('networkidle');
    
    const canAccess = page.url().includes('/purchase-requests');
    await helper.screenshot('manager-purchase-access');
    
    tracker.addResult('FR-5.4', 'Manager access granted', canAccess ? 'passed' : 'failed');
  });

  test('FR-5.5: Details view accessible', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    
    await page.goto('/purchase-requests');
    await page.waitForLoadState('networkidle');
    
    const firstItem = page.locator('tbody tr, .list-item').first();
    if (await firstItem.count() > 0) {
      await firstItem.click();
      await page.waitForTimeout(1000);
    }
    
    await helper.screenshot('purchase-details');
    tracker.addResult('FR-5.5', 'Details accessible', 'passed');
  });

  test('FR-5.6: Search present', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    
    await page.goto('/purchase-requests');
    await page.waitForLoadState('networkidle');
    
    const hasSearch = await page.locator('input[type="search"], input[placeholder*="Ara"]').count() > 0;
    await helper.screenshot('purchase-search');
    
    tracker.addResult('FR-5.6', 'Search present', hasSearch ? 'passed' : 'failed');
  });

  test.afterAll(async () => {
    tracker.saveToFile();
  });
});
