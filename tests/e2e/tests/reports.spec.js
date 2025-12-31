/**
 * Reporting Tests (FR-6)
 * Tests for report generation and export
 */

import { test, expect, testUsers, TestHelpers, TestResultTracker } from '../fixtures/test-helpers';

const tracker = new TestResultTracker();

test.describe('FR-6: Reporting', () => {
  
  test('FR-6.1: Reports page accessible', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    
    const isOnPage = page.url().includes('/reports');
    await helper.screenshot('reports-page');
    
    tracker.addResult('FR-6.1', 'Reports page accessible', isOnPage ? 'passed' : 'failed');
  });

  test('FR-6.2: Report types available', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    
    // Look for report cards or buttons
    const hasReports = await page.locator('.card, button, a').count() > 0;
    await helper.screenshot('report-types');
    
    tracker.addResult('FR-6.2', 'Report types available', hasReports ? 'passed' : 'failed');
  });

  test('FR-6.3: Inventory report accessible', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    
    await page.goto('/reports/inventory');
    await page.waitForLoadState('networkidle');
    
    const isOnPage = page.url().includes('/reports');
    await helper.screenshot('inventory-report');
    
    tracker.addResult('FR-6.3', 'Inventory report accessible', isOnPage ? 'passed' : 'failed');
  });

  test('FR-6.4: Transaction report accessible', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    
    await page.goto('/reports/transactions');
    await page.waitForLoadState('networkidle');
    
    const isOnPage = page.url().includes('/reports');
    await helper.screenshot('transaction-report');
    
    tracker.addResult('FR-6.4', 'Transaction report accessible', isOnPage ? 'passed' : 'failed');
  });

  test('FR-6.5: Maintenance report accessible', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    
    await page.goto('/reports/maintenance');
    await page.waitForLoadState('networkidle');
    
    const isOnPage = page.url().includes('/reports');
    await helper.screenshot('maintenance-report');
    
    tracker.addResult('FR-6.5', 'Maintenance report accessible', isOnPage ? 'passed' : 'failed');
  });

  test('FR-6.6: Date filters present', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    
    await page.goto('/reports/transactions');
    await page.waitForLoadState('networkidle');
    
    const hasDateFilter = await page.locator('input[type="date"]').count() > 0;
    await helper.screenshot('date-filters');
    
    tracker.addResult('FR-6.6', 'Date filters present', hasDateFilter ? 'passed' : 'failed');
  });

  test('FR-6.7: Export functionality present', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    
    await page.goto('/reports/inventory');
    await page.waitForLoadState('networkidle');
    
    const hasExport = await page.locator('button:has-text("İndir"), button:has-text("Export"), button:has-text("CSV"), button:has-text("Excel")').count() > 0;
    await helper.screenshot('export-button');
    
    tracker.addResult('FR-6.7', 'Export functionality present', hasExport ? 'passed' : 'failed');
  });

  test.afterAll(async () => {
    tracker.saveToFile();
  });
});
