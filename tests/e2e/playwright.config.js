import { defineConfig, devices } from '@playwright/test';

/**
 * CTIS-SIMS E2E Test Configuration
 * Comprehensive frontend testing based on SRS requirements
 */
export default defineConfig({
  testDir: './tests',
  
  // Test execution settings
  fullyParallel: false, // Disable parallel to prevent race conditions
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Retry failed tests once
  workers: 1, // Single worker to prevent login timeouts
  timeout: 60000, // Global test timeout: 60 seconds
  
  // Reporting
  outputDir: 'test-artifacts',
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'junit-results.xml' }],
    ['list'],
  ],
  
  use: {
    // Base URL
    baseURL: 'http://localhost:5174',
    
    // API URL for backend
    apiURL: 'http://localhost:8002/api',
    
    // Custom User-Agent to bypass rate limiting in backend
    userAgent: 'Mozilla/5.0 (compatible; Playwright/1.40.0; +https://playwright.dev) E2E-Test-Runner',
    
    // Screenshot & video
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    
    // Timeouts (increased for stability)
    actionTimeout: 15000,
    navigationTimeout: 30000,
    
    // Locale
    locale: 'tr-TR',
    timezoneId: 'Europe/Istanbul',
  },

  // Test projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    // // Mobile testing
    // {
    //   name: 'mobile-chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'mobile-safari',
    //   use: { ...devices['iPhone 13'] },
    // },
  ],

  // No webServer - we expect services to be running
});
