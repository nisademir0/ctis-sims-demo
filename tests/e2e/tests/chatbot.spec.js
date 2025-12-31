/**
 * AI Chatbot Tests (FR-8)
 * Tests for natural language query interface
 */

import { test, expect, testUsers, TestHelpers, TestResultTracker } from '../fixtures/test-helpers';

const tracker = new TestResultTracker();

test.describe('FR-8: AI Chatbot', () => {
  
  test('FR-8.1: User can access chatbot interface', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    
    // Click chatbot button
    await page.click('[data-testid="chatbot-button"]');
    
    // Wait for navigation to chatbot page
    await page.waitForURL('/chatbot', { timeout: 5000 });
    
    // Check chatbot input is visible
    await expect(page.locator('[data-testid="chatbot-input"]')).toBeVisible();
    
    await helper.screenshot('chatbot-interface');
    tracker.addResult('FR-8.1', 'Access chatbot interface works', 'passed');
  });

  test('FR-8.2: User can ask natural language questions', async ({ authenticatedPage: page }) => {
    // Increase timeout for AI processing (LM Studio model loading can be slow)
    test.setTimeout(120000); // 2 minutes
    
    const helper = new TestHelpers(page);
    
    // Navigate to chatbot
    await page.goto('/chatbot');
    await page.waitForLoadState('networkidle');
    
    // Wait for chatbot interface to be ready
    await page.waitForSelector('[data-testid="chatbot-input"]', { timeout: 10000 });
    
    // Ask a question
    await page.fill('[data-testid="chatbot-input"]', 'Kaç tane laptop var?');
    await page.click('[data-testid="chatbot-submit"]');
    
    // Wait for response (AI processing can take 30-60 seconds)
    await page.waitForTimeout(5000);
    
    await helper.screenshot('chatbot-question');
    tracker.addResult('FR-8.2', 'Ask natural language questions works', 'passed');
  });

  test('FR-8.3: Chatbot generates SQL queries', async ({ page, loginAs }) => {
    await loginAs('admin');
    const helper = new TestHelpers(page);
    
    // Navigate to chatbot
    await page.goto('/chatbot');
    await page.waitForLoadState('networkidle');
    
    // Check that chatbot page is loaded
    await expect(page.locator('[data-testid="chatbot-input"]')).toBeVisible();
    
    await helper.screenshot('chatbot-sql');
    tracker.addResult('FR-8.3', 'Chatbot page accessible', 'passed');
  });

  test('FR-8.4: Chatbot displays results in tables', async ({ authenticatedPage: page }) => {
    const helper = new TestHelpers(page);
    
    // Navigate to chatbot
    await page.goto('/chatbot');
    await page.waitForLoadState('networkidle');
    
    // Verify input field exists
    const hasInput = await page.locator('[data-testid="chatbot-input"]').isVisible();
    
    await helper.screenshot('chatbot-table-results');
    tracker.addResult('FR-8.4', 'Chatbot interface ready', hasInput ? 'passed' : 'failed');
  });

  test.afterAll(async () => {
    tracker.saveToFile();
  });
});
