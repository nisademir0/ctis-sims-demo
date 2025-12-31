import { test, expect } from '@playwright/test';

test('simple test', async ({ page }) => {
  await page.goto('http://localhost:5174');
  await expect(page).toHaveTitle(/CTIS/i);
});
