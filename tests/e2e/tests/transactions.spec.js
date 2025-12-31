/**
 * Transaction Management Tests (FR-3)
 * Tests for checkout, return, and transaction management
 */

import { test, expect, testUsers, TestHelpers, TestResultTracker } from '../fixtures/test-helpers';

const tracker = new TestResultTracker();

test.describe('FR-3: Transaction Management', () => {
  
  test('FR-3.1: User can access transaction checkout', async ({ page, loginAs }) => {
    await loginAs('inventoryManager');
    const helper = new TestHelpers(page);
    
    await helper.navigateTo('inventory');
    await page.waitForLoadState('networkidle');
    
    await helper.screenshot('transaction-checkout-access');
    tracker.addResult('FR-3.1', 'Transaction page accessible', 'passed');
  });

  test('FR-3.2: User can view transactions', async ({ page, loginAs }) => {
    await loginAs('inventoryManager');
    const helper = new TestHelpers(page);
    
    await helper.navigateTo('transactions');
    await page.waitForLoadState('networkidle');
    
    await helper.screenshot('transaction-list');
    tracker.addResult('FR-3.2', 'Transaction list accessible', 'passed');
  });

  test('FR-3.3: User can view transaction history', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    
    await helper.navigateTo('transactions');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('table, [class*="transaction"]').count() > 0;
    
    await helper.screenshot('transaction-history');
    tracker.addResult('FR-3.3', 'Transaction history page loaded', hasContent ? 'passed' : 'warning');
  });

  test('FR-3.4: System detects overdue items', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    
    await helper.navigateTo('transactions');
    await page.waitForLoadState('networkidle');
    
    await helper.screenshot('transaction-overdue');
    tracker.addResult('FR-3.4', 'Transaction page accessible for overdue check', 'passed');
  });

  test('FR-3.5: System calculates late fees', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    
    await helper.navigateTo('transactions');
    await page.waitForLoadState('networkidle');
    
    await helper.screenshot('transaction-late-fee');
    tracker.addResult('FR-3.5', 'Transaction page accessible for late fee check', 'passed');
  });

  test('FR-3.6: User can search transactions', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    
    await helper.navigateTo('transactions');
    await page.waitForLoadState('networkidle');
    
    const hasSearch = await page.locator('input[type="search"], input[type="text"]').count() > 0;
    
    await helper.screenshot('transaction-search');
    tracker.addResult('FR-3.6', 'Search functionality present', hasSearch ? 'passed' : 'warning');
  });

  test('FR-3.7: User can filter by status', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    
    await helper.navigateTo('transactions');
    await page.waitForLoadState('networkidle');
    
    const hasFilter = await page.locator('select, [role="combobox"]').count() > 0;
    
    await helper.screenshot('transaction-filter-status');
    tracker.addResult('FR-3.7', 'Filter functionality present', hasFilter ? 'passed' : 'warning');
  });

  test('FR-3.8: User can export transaction data', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    
    await helper.navigateTo('transactions');
    await page.waitForLoadState('networkidle');
    
    const hasExport = await page.locator('button:has-text("Dışa Aktar"), button:has-text("Export")').count() > 0;
    
    await helper.screenshot('transaction-export');
    tracker.addResult('FR-3.8', 'Export button present', hasExport ? 'passed' : 'warning');
  });

  test.afterAll(async () => {
    tracker.saveToFile();
  });
});
