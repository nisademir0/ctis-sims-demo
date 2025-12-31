import { test } from '@playwright/test';

test('debug form submission', async ({ page }) => {
  // Listen to console logs
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
  // Login
  await page.goto('http://localhost:5174/login');
  await page.fill('[data-testid="email-input"]', 'serkan@ctis.edu.tr');
  await page.fill('[data-testid="password-input"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  
  // Go to add item
  await page.goto('http://localhost:5174/inventory/new');
  await page.waitForTimeout(2000);
  
  // Fill form
  await page.fill('[data-testid="name-input"]', 'Test Item Debug');
  await page.fill('input[name="inventory_number"]', 'TEST-999');
  
  // Wait for categories
  await page.waitForFunction(() => {
    const select = document.querySelector('select[name="category_id"]');
    return select && select.options.length > 1;
  });
  
  await page.selectOption('select[name="category_id"]', { index: 1 });
  const categoryValue = await page.inputValue('select[name="category_id"]');
  console.log('Selected category value:', categoryValue, 'type:', typeof categoryValue);
  
  await page.fill('input[name="location"]', 'Lab-101');
  
  // Check if staff select exists and select it
  const staffSelect = page.locator('select[name="current_holder_id"]');
  const staffVisible = await staffSelect.isVisible();
  console.log('Staff select visible:', staffVisible);
  if (staffVisible) {
    await staffSelect.selectOption({ index: 1 });
    const staffValue = await page.inputValue('select[name="current_holder_id"]');
    console.log('Selected staff ID:', staffValue);
  }
  
  // Check form state before submit
  const formValues = await page.evaluate(() => {
    const form = document.querySelector('form');
    const data = new FormData(form);
    return Object.fromEntries(data.entries());
  });
  console.log('Form values before submit:', formValues);
  
  console.log('=== CLICKING SUBMIT BUTTON ===');
  await page.click('[data-testid="submit-button"]');
  
  // Wait to see what happens
  await page.waitForTimeout(5000);
  console.log('Final URL:', page.url());
});
