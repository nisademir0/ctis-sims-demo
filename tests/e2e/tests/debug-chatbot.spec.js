import { test, expect } from '@playwright/test';

const testUsers = {
  inventoryManager: {
    email: 'serkan@ctis.edu.tr',
    password: 'password'
  }
};

test('Debug chatbot table rendering', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
  // Login
  await page.goto('http://localhost:5174/login');
  await page.fill('[data-testid="email-input"]', testUsers.inventoryManager.email);
  await page.fill('[data-testid="password-input"]', testUsers.inventoryManager.password);
  await page.click('[data-testid="login-submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  console.log('✓ Logged in');
  
  // Navigate to chatbot
  await page.click('text=AI Asistan');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  console.log('✓ Chatbot page opened');
  
  // Send query (use specific query that works)
  const query = 'Kaç tane Dell P2422H monitör var?';
  const chatInput = page.locator('input[type="text"], textarea').first();
  await chatInput.fill(query);
  await chatInput.press('Enter');
  
  console.log('✓ Query sent:', query);
  
  // Wait for response (longer timeout)
  await page.waitForTimeout(15000);
  
  console.log('--- Waiting complete, checking response ---');
  
  console.log('--- Checking for table element ---');
  const tableCount = await page.locator('table').count();
  console.log('Table count:', tableCount);
  
  if (tableCount > 0) {
    const tableText = await page.locator('table').first().textContent();
    console.log('Table content preview:', tableText.substring(0, 200));
  } else {
    console.log('❌ No table found');
    
    // Check what we have instead
    const responseDiv = await page.locator('div.animate-fadeIn').last().textContent();
    console.log('Response div content:', responseDiv.substring(0, 200));
    
    // Check all message divs
    const allMessages = await page.locator('div.animate-fadeIn').count();
    console.log('Total message divs:', allMessages);
  }
  
  console.log('Final URL:', page.url());
});
