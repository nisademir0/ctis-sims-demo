/**
 * Test Fixtures and Helpers
 * Reusable utilities for E2E tests
 */

import { test as base, expect } from '@playwright/test';

// Test users based on seeded data
export const testUsers = {
  admin: {
    email: 'admin@ctis.edu.tr',
    password: 'password',
    role: 'Admin',
    name: 'Sistem Yöneticisi'
  },
  inventoryManager: {
    email: 'serkan@ctis.edu.tr',
    password: 'password',
    role: 'Inventory Manager',
    name: 'Serkan Genç'
  },
  staff: {
    email: 'leyla@ctis.edu.tr',
    password: 'password',
    role: 'Staff',
    name: 'Leyla Yılmaz'
  }
};

// Extended test with authentication helpers
export const test = base.extend({
  // Auto-login as admin with fresh context per test
  authenticatedPage: async ({ browser }, use) => {
    // Create a fresh context for each test using authenticatedPage
    const context = await browser.newContext({
      locale: 'tr-TR',
      timezoneId: 'Europe/Istanbul',
    });
    const page = await context.newPage();
    
    try {
      // Significant delay to prevent rate limiting
      await page.waitForTimeout(800);
      
      await page.goto('/login');
      await page.waitForLoadState('load');
      
      await page.fill('[data-testid="email-input"]', testUsers.admin.email);
      await page.fill('[data-testid="password-input"]', testUsers.admin.password);
      await page.click('[data-testid="login-submit"]');
      
      // Wait for navigation to complete (increased timeout)
      await page.waitForURL('/', { timeout: 45000 });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      
      // Give extra time for token to be saved to localStorage and React state updates
      await page.waitForTimeout(2500);
      
      // Verify token is stored in localStorage
      const token = await page.evaluate(() => localStorage.getItem('token'));
      if (!token) {
        throw new Error('Authentication failed: No token stored');
      }
      
      await use(page);
    } finally {
      // Clean up context after test
      await context.close();
    }
  },

  // Login as specific user (returns function to login with fresh context)
  loginAs: async ({ browser }, use) => {
    const loginAs = async (userType) => {
      const context = await browser.newContext({
        locale: 'tr-TR',
        timezoneId: 'Europe/Istanbul',
      });
      const page = await context.newPage();
      
      // Small delay to prevent rate limiting
      await page.waitForTimeout(200);
      
      const user = testUsers[userType];
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', user.email);
      await page.fill('[data-testid="password-input"]', user.password);
      await page.click('[data-testid="login-submit"]');
      
      // Wait for successful navigation (increased timeouts)
      await page.waitForURL('/', { timeout: 45000 });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      
      // Give extra time for React state updates
      await page.waitForTimeout(2000);
      
      // Verify token
      const token = await page.evaluate(() => localStorage.getItem('token'));
      if (!token) {
        throw new Error(`Authentication failed for ${userType}: No token stored`);
      }
      
      await page.waitForTimeout(1500);
      
      return { page, context };
    };
    
    await use(loginAs);
  },
});

// Custom assertions
export { expect };

// Helper functions
export class TestHelpers {
  constructor(page) {
    this.page = page;
  }

  /**
   * Take screenshot with Turkish filename support
   */
  async screenshot(name) {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${timestamp}.png`,
      fullPage: true 
    });
  }

  /**
   * Wait for API response
   */
  async waitForApiResponse(urlPattern, method = 'GET') {
    return await this.page.waitForResponse(
      response => response.url().includes(urlPattern) && response.request().method() === method
    );
  }

  /**
   * Check for Turkish error messages
   */
  async expectTurkishError(errorText) {
    await expect(this.page.locator(`text=${errorText}`)).toBeVisible();
  }

  /**
   * Fill form with data
   */
  async fillForm(formData) {
    for (const [name, value] of Object.entries(formData)) {
      await this.page.fill(`[name="${name}"]`, value);
    }
  }

  /**
   * Check dark mode toggle
   */
  async toggleDarkMode() {
    await this.page.click('[data-testid="dark-mode-toggle"]');
    await this.page.waitForTimeout(300); // Animation time
  }

  /**
   * Check if element has dark mode class
   */
  async isDarkMode() {
    const html = this.page.locator('html');
    const classList = await html.getAttribute('class');
    return classList.includes('dark');
  }

  /**
   * Change language
   */
  async changeLanguage(lang) {
    await this.page.click('[data-testid="language-selector"]');
    await this.page.click(`[data-lang="${lang}"]`);
    await this.page.waitForTimeout(300);
  }

  /**
   * Export data (CSV/Excel)
   */
  async exportData(format = 'csv') {
    const downloadPromise = this.page.waitForEvent('download');
    await this.page.click(`button:has-text("Export ${format.toUpperCase()}")`);
    const download = await downloadPromise;
    return download;
  }

  /**
   * Check notification (react-hot-toast)
   */
  async expectNotification(message, type = 'success') {
    // react-hot-toast uses different structure - look for the message in any visible toast
    const notification = this.page.locator(`[role="status"]:has-text("${message}")`);
    await expect(notification).toBeVisible({ timeout: 5000 });
  }

  /**
   * Navigate to page
   */
  async navigateTo(pageName) {
    const routes = {
      'dashboard': '/',
      'inventory': '/inventory',
      'transactions': '/transactions',
      'maintenance': '/maintenance-requests',
      'purchase-requests': '/purchase-requests',
      'reports': '/reports',
      'settings': '/settings',
      'profile': '/settings',
    };
    
    await this.page.goto(routes[pageName]);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check table data
   */
  async getTableData(tableSelector = 'table') {
    const rows = await this.page.locator(`${tableSelector} tbody tr`).all();
    const data = [];
    
    for (const row of rows) {
      const cells = await row.locator('td').allTextContents();
      data.push(cells);
    }
    
    return data;
  }

  /**
   * Search in table
   */
  async searchInTable(query) {
    await this.page.fill('input[placeholder*="Ara"]', query);
    await this.page.waitForTimeout(500); // Debounce time
  }

  /**
   * Filter table
   */
  async applyFilter(filterName, value) {
    await this.page.click(`[data-filter="${filterName}"]`);
    await this.page.click(`[data-value="${value}"]`);
    await this.page.waitForTimeout(300);
  }

  /**
   * Paginate
   */
  async goToPage(pageNumber) {
    await this.page.click(`[data-page="${pageNumber}"]`);
    await this.page.waitForLoadState('networkidle');
  }
}

// SRS Requirement mapper
export const SRSRequirements = {
  // FR-1: Authentication & User Management
  'FR-1.1': 'User Login',
  'FR-1.2': 'Role-based Access Control',
  'FR-1.3': 'User Registration (Admin only)',
  'FR-1.4': 'Email Verification',
  'FR-1.5': 'Email Resend',
  'FR-1.6': 'Password Reset Request',
  'FR-1.7': 'Password Reset',
  'FR-1.8': 'View Profile',
  'FR-1.9': 'Update Profile',
  'FR-1.10': 'Change Password',
  'FR-1.11': 'Avatar Upload',
  'FR-1.12': 'Avatar Delete',
  'FR-1.13': 'Session Management',
  'FR-1.14': 'Last Login Tracking',

  // FR-2: Inventory Management
  'FR-2.1': 'View Inventory',
  'FR-2.2': 'Search Inventory',
  'FR-2.3': 'Filter by Category',
  'FR-2.4': 'Filter by Status',
  'FR-2.5': 'Add New Item',
  'FR-2.6': 'Edit Item',
  'FR-2.7': 'Delete Item',
  'FR-2.8': 'View Item Details',
  'FR-2.9': 'Track Item Location',
  'FR-2.10': 'QR Code Generation',

  // FR-3: Transaction Management
  'FR-3.1': 'Create Transaction',
  'FR-3.2': 'Item Checkout',
  'FR-3.3': 'Item Return',
  'FR-3.4': 'Overdue Detection',
  'FR-3.5': 'Late Fee Calculation',
  'FR-3.6': 'Transaction History',
  'FR-3.7': 'Active Transactions',
  'FR-3.8': 'Return Condition Assessment',

  // FR-4: Maintenance Management
  'FR-4.1': 'Create Maintenance Request',
  'FR-4.2': 'Assign Maintenance',
  'FR-4.3': 'Update Maintenance Status',
  'FR-4.4': 'Complete Maintenance',
  'FR-4.5': 'Maintenance History',
  'FR-4.6': 'Priority Management',
  'FR-4.7': 'Cost Tracking',
  'FR-4.8': 'SLA Tracking',

  // FR-5: Purchase Request Management
  'FR-5.1': 'Create Purchase Request',
  'FR-5.2': 'Approve Purchase Request',
  'FR-5.3': 'Reject Purchase Request',
  'FR-5.4': 'Mark as Ordered',
  'FR-5.5': 'Mark as Received',
  'FR-5.6': 'Purchase Request Status',

  // FR-6: Reporting
  'FR-6.1': 'Inventory Report',
  'FR-6.2': 'Transaction Report',
  'FR-6.3': 'Maintenance Report',
  'FR-6.4': 'User Activity Report',
  'FR-6.5': 'Export to CSV',
  'FR-6.6': 'Export to Excel',
  'FR-6.7': 'Date Range Filtering',

  // FR-7: Notifications
  'FR-7.1': 'View Notifications',
  'FR-7.2': 'Mark as Read',
  'FR-7.3': 'Delete Notification',
  'FR-7.4': 'Real-time Updates',

  // FR-8: AI Chatbot
  'FR-8.1': 'Natural Language Query',
  'FR-8.2': 'SQL Generation',
  'FR-8.3': 'Query Results Display',
  'FR-8.4': 'Chat History',

  // NFR: Non-Functional Requirements
  'NFR-1': 'Response Time < 2s',
  'NFR-2': 'Turkish Language Support',
  'NFR-3': 'Dark Mode Support',
  'NFR-4': 'Mobile Responsiveness',
  'NFR-5': 'Accessibility (WCAG 2.1)',
};

/**
 * Test result tracker for report generation
 */
export class TestResultTracker {
  constructor() {
    this.results = [];
  }

  addResult(requirement, testName, status, screenshot = null, notes = '') {
    this.results.push({
      requirement,
      requirementName: SRSRequirements[requirement] || requirement,
      testName,
      status,
      screenshot,
      notes,
      timestamp: new Date().toISOString(),
    });
  }

  getResults() {
    return this.results;
  }

  saveToFile() {
    const fs = require('fs');
    const path = require('path');
    
    const reportPath = path.join(__dirname, '..', 'test-results', 'srs-coverage.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    return reportPath;
  }
}
