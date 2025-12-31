/**
 * Notification Tests (FR-7)
 * Tests for notification system
 */

import { test, expect, testUsers, TestHelpers, TestResultTracker } from '../fixtures/test-helpers';

const tracker = new TestResultTracker();

test.describe('FR-7: Notifications', () => {
  
  test('FR-7.1: Notification bell visible', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for notification bell icon
    const hasBell = await page.locator('[data-testid="notification-bell"], button:has(svg)').count() > 0;
    await helper.screenshot('notification-bell');
    
    tracker.addResult('FR-7.1', 'Notification bell visible', hasBell ? 'passed' : 'failed');
  });

  test('FR-7.2: Notifications page accessible', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    const isOnPage = page.url().includes('/notifications');
    await helper.screenshot('notifications-page');
    
    tracker.addResult('FR-7.2', 'Notifications page accessible', isOnPage ? 'passed' : 'failed');
  });

  test('FR-7.3: Notification list displayed', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('.notification, .list-item, table').count() > 0;
    await helper.screenshot('notification-list');
    
    tracker.addResult('FR-7.3', 'Notification list displayed', hasContent ? 'passed' : 'failed');
  });

  test('FR-7.4: Notification actions available', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    // Look for mark as read or delete buttons
    const hasActions = await page.locator('button:has-text("Okundu"), button:has-text("Sil"), button[aria-label]').count() > 0;
    await helper.screenshot('notification-actions');
    
    tracker.addResult('FR-7.4', 'Notification actions available', hasActions ? 'passed' : 'failed');
  });

  test.afterAll(async () => {
    tracker.saveToFile();
  });
});
