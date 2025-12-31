# CTIS-SIMS First Increment Prototype - Test Scenarios
## Pseudo-Code Documentation for QA Team

**Version:** 1.0  
**Date:** December 11, 2025  
**Scope:** UC1, UC9, UC17 (20% Prototype)  
**Test Framework:** Playwright

---

## Test Coverage Matrix

| Test Scenario | Use Case | Priority | Status |
|--------------|----------|----------|--------|
| Scenario 1   | UC9      | CRITICAL | ✅ Ready |
| Scenario 2   | UC1      | CRITICAL | ✅ Ready |
| Scenario 3   | UC9      | HIGH     | ✅ Ready |
| Scenario 4   | UC17     | HIGH     | ✅ Ready |

---

## SCENARIO 1: Role-Based Authentication and Navigation (UC9)

### **Test Case 1.1: Manager Login → Dashboard with Add Button**

**Objective:** Verify Inventory Manager sees full dashboard with create permissions

**Preconditions:**
- System is running (frontend + backend)
- Database has seeded manager user: serkan@ctis.edu.tr

**Test Steps:**

```
STEP 1: Open Browser
  → Navigate to: http://localhost:5174/login
  → Wait for page load
  → VERIFY: Login form is visible
  → SCREENSHOT: "login-page-manager"

STEP 2: Enter Manager Credentials
  → Locate element: [data-testid="email-input"]
  → Type: "serkan@ctis.edu.tr"
  → Locate element: [data-testid="password-input"]
  → Type: "password"
  → SCREENSHOT: "manager-credentials-entered"

STEP 3: Submit Login Form
  → Click element: [data-testid="login-submit"]
  → Wait for navigation (timeout: 15s)

EXPECTED RESULT A: Redirect to Dashboard
  → Current URL should be: "/"
  → Page title contains: "Envanter" OR "Dashboard"
  → SCREENSHOT: "manager-dashboard-loaded"

EXPECTED RESULT B: Inventory List Visible
  → Verify element exists: <table>
  → Table should have rows with inventory data
  → Columns visible: "Ürün Adı", "Kategori", "Konum", "Durum"

EXPECTED RESULT C: "Add Item" Button MUST Exist
  → Locate element: [data-testid="add-item-button"]
  → Verify: Button is visible
  → Button text contains: "Yeni" OR "Ekle" OR "Add"
  → SCREENSHOT: "manager-has-add-button"

EXPECTED RESULT D: Table Has Data
  → Count rows in <tbody>
  → Row count should be > 0
  → VERIFY: At least 1 item displayed
  → SCREENSHOT: "manager-inventory-table"
```

**Expected Behavior:**
- ✅ Manager redirected to `/` (Dashboard)
- ✅ "Add Item" button visible
- ✅ Full inventory table displayed

**Failure Conditions:**
- ❌ Redirect to wrong page
- ❌ "Add Item" button missing
- ❌ Empty table or error message

---

### **Test Case 1.2: Staff Login → Read-Only View WITHOUT Add Button**

**Objective:** Verify Staff user has restricted, read-only access

**Preconditions:**
- Database has seeded staff user: leyla@ctis.edu.tr

**Test Steps:**

```
STEP 1: Open Browser
  → Navigate to: http://localhost:5174/login
  → Wait for page load

STEP 2: Enter Staff Credentials
  → Locate element: [data-testid="email-input"]
  → Type: "leyla@ctis.edu.tr"
  → Locate element: [data-testid="password-input"]
  → Type: "password"
  → SCREENSHOT: "staff-credentials-entered"

STEP 3: Submit Login Form
  → Click element: [data-testid="login-submit"]
  → Wait for navigation (timeout: 15s)

EXPECTED RESULT A: Redirect to Dashboard or My Account
  → Current URL should be: "/" OR "/my-account"
  → SCREENSHOT: "staff-page-loaded"

EXPECTED RESULT B: NO "Add Item" Button
  → Search for element: [data-testid="add-item-button"]
  → VERIFY: Button does NOT exist OR is hidden
  → SCREENSHOT: "staff-no-add-button"

EXPECTED RESULT C: Limited View - "My Equipment"
  → Page title contains: "Ekipmanlarım" OR "My Equipment"
  → Table shows only items assigned to this staff
  → Items should have: Name, Category, Assignment Date

EXPECTED RESULT D: NO Action Buttons Anywhere
  → Search for buttons with text: "Düzenle", "Edit"
  → Count should be: 0
  → Search for buttons with text: "Sil", "Delete"
  → Count should be: 0
  → SCREENSHOT: "staff-readonly-view"
```

**Expected Behavior:**
- ✅ Staff sees only assigned items
- ✅ NO create/edit/delete buttons
- ✅ Read-only table view

**Failure Conditions:**
- ❌ "Add Item" button visible for staff
- ❌ Edit/Delete buttons present
- ❌ Can access admin routes

---

### **Test Case 1.3: Verify Role-Based Menu Visibility**

**Objective:** Different roles see different navigation menus

**Test Steps:**

```
PART A: Manager Menu
  → Login as: serkan@ctis.edu.tr
  → Locate element: <nav> (navigation sidebar/header)
  → Get all menu items: <nav> a, <nav> button
  → VERIFY items include:
    - "Envanter"
    - "Yapay Zeka Asistanı"
    - "Raporlar" (maybe)
  → SCREENSHOT: "manager-menu-items"

PART B: Staff Menu
  → Logout from manager account
  → Login as: leyla@ctis.edu.tr
  → Locate element: <nav>
  → Get all menu items
  → VERIFY: Limited menu
  → Should NOT see: "Admin", "Kategori Yönetimi", etc.
  → SCREENSHOT: "staff-menu-items"
```

**Expected Behavior:**
- ✅ Manager has more menu options
- ✅ Staff menu is restricted
- ✅ No unauthorized links visible

---

## SCENARIO 2: Inventory Manager Add Item Flow (UC1)

### **Test Case 2.1: View Existing Inventory List**

**Objective:** Verify manager can see current inventory before adding

**Test Steps:**

```
PRECONDITION: Login as Inventory Manager
  → Email: serkan@ctis.edu.tr
  → Password: password

STEP 1: Navigate to Inventory Page
  → Click menu item: "Envanter"
  → Wait for page load
  → SCREENSHOT: "inventory-list-page"

EXPECTED RESULT: Inventory Table Displayed
  → Verify element exists: <table>
  → Table has <thead> with columns:
    - "Envanter Numarası" / "Inventory Number"
    - "Ürün Adı" / "Item Name"
    - "Kategori" / "Category"
    - "Konum" / "Location"
    - "Durum" / "Status"
  → Table has <tbody> with data rows
  → Row count > 0
  → SCREENSHOT: "inventory-table-with-data"
```

**Expected Behavior:**
- ✅ Table displays all inventory items
- ✅ Columns are properly labeled
- ✅ Data is readable and formatted

---

### **Test Case 2.2: Add New Inventory Item - Complete Flow**

**Objective:** End-to-end test of creating new inventory item

**Test Steps:**

```
PRECONDITION: On Inventory List Page as Manager

STEP 1: Count Existing Items (Baseline)
  → Count rows in <tbody>
  → Store count as: initialRowCount
  → Console log: "Initial count: {initialRowCount}"

STEP 2: Click "Add Item" Button
  → Click element: [data-testid="add-item-button"]
  → Wait for navigation OR modal open
  → SCREENSHOT: "add-item-form-opened"

EXPECTED: Form Opens with Required Fields
  → Page title contains: "Yeni" OR "Ekle" OR "Add"
  → Form fields visible:
    - Item Name (text input)
    - Category (dropdown)
    - Location (text input)
    - Staff Assignment (dropdown, optional)
  → SCREENSHOT: "empty-form-displayed"

STEP 3A: Fill Item Name (REQUIRED)
  → Locate element: input[name="name"] OR [data-testid="item-name-input"]
  → Generate unique name: "Test Dell Monitor {timestamp}"
  → Type the name
  → SCREENSHOT: "item-name-filled"

STEP 3B: Select Category (REQUIRED - Dropdown Only)
  → Locate element: select[name="category_id"]
  → IMPORTANT: NO manual text entry allowed!
  → Select option at index 1 (first real category)
  → Get selected value: selectedCategoryId
  → Console log: "Selected category: {selectedCategoryId}"
  → SCREENSHOT: "category-selected"

STEP 3C: Fill Inventory Number (if exists)
  → Locate element: input[name="inventory_number"]
  → If field exists:
    → Type: "TEST-{timestamp}"
  → SCREENSHOT: "inventory-number-filled"

STEP 3D: Fill Location (REQUIRED)
  → Locate element: input[name="location"]
  → Type: "Lab-101"
  → SCREENSHOT: "location-filled"

STEP 3E: Select Staff (Optional)
  → Locate element: select[name="current_holder_id"]
  → If field exists:
    → Select option at index 1
    → Get selected value: selectedStaffId
    → Console log: "Assigned to staff: {selectedStaffId}"
  → SCREENSHOT: "staff-assigned"

STEP 3F: Select Vendor (if exists)
  → Locate element: select[name="vendor_id"]
  → If field exists:
    → Select option at index 1
  → SCREENSHOT: "form-completely-filled"

STEP 4: Submit Form
  → Click element: [data-testid="submit-button"] OR button[type="submit"]
  → Wait for response (timeout: 10s)

EXPECTED RESULT A: Success Notification
  → Verify toast/alert appears
  → Element: .toast OR [role="alert"]
  → Message contains: "başarı" OR "success"
  → SCREENSHOT: "submit-success-notification"

EXPECTED RESULT B: Redirect to Inventory List
  → Wait for URL change to: /inventory
  → Page loads inventory table
  → SCREENSHOT: "redirected-to-inventory-list"

STEP 5: Verify New Item in List (REFRESH VERIFY)
  → Count rows in <tbody>
  → Store count as: finalRowCount
  → Console log: "Final count: {finalRowCount}"
  
  → VERIFY: finalRowCount == initialRowCount + 1
  → VERIFY: Table contains cell with text: "{testItemName}"
  → Scroll to new item if needed
  → SCREENSHOT: "new-item-in-table"
```

**Expected Behavior:**
- ✅ Form opens with all fields
- ✅ Category is dropdown (not text input)
- ✅ Form submits successfully
- ✅ Success notification appears
- ✅ Redirects to list page
- ✅ New item appears in table immediately

**Failure Conditions:**
- ❌ Form validation errors
- ❌ Submit fails with error
- ❌ New item not visible in list
- ❌ Row count doesn't increase

---

### **Test Case 2.3: Add Item - Validation Errors**

**Objective:** Verify form validates required fields

**Test Steps:**

```
PRECONDITION: On Add Item Form

STEP 1: Leave All Fields Empty
  → Do NOT fill any form fields
  → SCREENSHOT: "empty-form-ready"

STEP 2: Attempt to Submit
  → Click: [data-testid="submit-button"]
  → Wait 2 seconds

EXPECTED RESULT A: Form Does NOT Submit
  → Current URL still contains: "/new" OR "/add"
  → Still on form page

EXPECTED RESULT B: Validation Errors Displayed
  → Locate elements: .error OR .text-red-600 OR [role="alert"]
  → At least 1 error message visible
  → Error messages mention: "required" OR "zorunlu"
  → SCREENSHOT: "validation-errors-displayed"

EXPECTED RESULT C: Fields Highlighted
  → Required fields have red border OR error styling
  → Console log: Error messages found
```

**Expected Behavior:**
- ✅ Form blocks submission
- ✅ Error messages appear
- ✅ User remains on form page

---

### **Test Case 2.4: Verify NO Edit/Delete in Prototype**

**Objective:** Confirm edit/delete features are disabled

**Test Steps:**

```
PRECONDITION: On Inventory List Page as Manager

STEP 1: Search for Edit Buttons
  → Locate all: [data-testid*="edit-button"]
  → Count should be: 0
  → VERIFY: No "Düzenle" buttons in table rows

STEP 2: Search for Delete Buttons
  → Locate all: [data-testid*="delete-button"]
  → Count should be: 0
  → VERIFY: No "Sil" buttons in table rows

STEP 3: Check Action Column
  → If table has "Actions" column
  → VERIFY: Column is empty OR has only "View" button
  → SCREENSHOT: "no-edit-delete-buttons"

Console log: "✓ Prototype constraint verified: No Edit/Delete"
```

**Expected Behavior:**
- ✅ Zero edit buttons found
- ✅ Zero delete buttons found
- ✅ Prototype restriction enforced

---

## SCENARIO 3: Staff Read-Only View (UC9)

### **Test Case 3.1: View "My Equipment" Table**

**Objective:** Staff sees only their assigned items

**Test Steps:**

```
PRECONDITION: Login as Staff
  → Email: leyla@ctis.edu.tr
  → Password: password

STEP 1: View Dashboard
  → After login, on dashboard page
  → SCREENSHOT: "staff-dashboard-initial"

EXPECTED: "My Equipment" Section Visible
  → Page shows: "Ekipmanlarım" OR "My Equipment"
  → Table element exists: <table>
  → SCREENSHOT: "staff-equipment-table"

STEP 2: Verify Table Content
  → Count rows in table
  → Rows should show items like:
    - "Laptop" (category: Computer)
    - "Tablet" (category: Electronics)
  → Each row has: Name, Category, Assignment Date
  → Console log: "Staff has {rowCount} assigned items"

EXPECTED: Only Assigned Items (Filtered)
  → Items belong to staff user (current_holder_id = staff user id)
  → Should NOT see all inventory
  → Items should be: status = "lent" AND holder = "Leyla Yılmaz"
```

**Expected Behavior:**
- ✅ Table shows staff's items only
- ✅ No unrelated items visible
- ✅ Data is accurate and current

---

### **Test Case 3.2: Verify NO Action Buttons (Read-Only)**

**Objective:** Staff cannot modify any data

**Test Steps:**

```
PRECONDITION: On Staff Dashboard

STEP 1: Scan Page for Action Buttons
  → Search for buttons with text:
    - "Ekle" / "Add"
    - "Düzenle" / "Edit"
    - "Sil" / "Delete"
  → SCREENSHOT: "staff-page-full-view"

EXPECTED RESULT A: NO Add Buttons
  → Count of buttons containing "Ekle": 0
  → Verify: [data-testid="add-item-button"] does NOT exist

EXPECTED RESULT B: NO Edit Buttons
  → Count of buttons containing "Düzenle": 0
  → Count of icons: <PencilIcon>: 0

EXPECTED RESULT C: NO Delete Buttons
  → Count of buttons containing "Sil": 0
  → Count of icons: <TrashIcon>: 0
  → SCREENSHOT: "staff-no-action-buttons"

Console log: "✓ Staff read-only access verified"
```

**Expected Behavior:**
- ✅ No action buttons anywhere on page
- ✅ Read-only constraint enforced
- ✅ Staff cannot modify database

---

### **Test Case 3.3: Staff Cannot Access Admin Routes**

**Objective:** Staff is blocked from privileged pages

**Test Steps:**

```
PRECONDITION: Logged in as Staff

TEST: Try Direct Navigation to Restricted Routes
  → List of routes to test:
    1. /admin/users
    2. /admin/categories
    3. /admin/vendors
    4. /inventory/new

FOR EACH route:
  STEP 1: Navigate Directly
    → page.goto("{route}")
    → Wait for page load
    → SCREENSHOT: "staff-blocked-from-{route}"
  
  STEP 2: Check Result
    OPTION A: Redirected Away
      → Current URL ≠ {route}
      → Redirected to: "/" OR "/unauthorized"
    
    OPTION B: Access Denied Page
      → Page content contains: "Yetki" OR "Access Denied"
      → Error message displayed
  
  Console log: "Staff blocked from {route}"
```

**Expected Behavior:**
- ✅ Staff cannot access admin routes
- ✅ Either redirected or shown error
- ✅ No sensitive data exposed

---

## SCENARIO 4: Chatbot SQL Query Execution (UC17)

### **Test Case 4.1: Open Chatbot Panel**

**Objective:** Access chatbot interface

**Test Steps:**

```
PRECONDITION: Login as Manager
  → Email: serkan@ctis.edu.tr

STEP 1: Navigate to AI Assistant
  → Click menu item containing: "Yapay Zeka" OR "AI" OR "Asistan"
  → Wait for page load
  → SCREENSHOT: "chatbot-panel-opened"

EXPECTED: Chatbot Interface Visible
  → Page title contains: "AI" OR "Asistan"
  → Input field exists: <input type="text"> OR <textarea>
  → Input is focused (ready to type)
  → SCREENSHOT: "chatbot-input-visible"
```

**Expected Behavior:**
- ✅ Chatbot page opens
- ✅ Input field ready for queries
- ✅ Clean interface (no errors)

---

### **Test Case 4.2: Execute Query - List Dell Monitors**

**Objective:** Chatbot returns TABLE result, NOT conversation

**Test Steps:**

```
PRECONDITION: On Chatbot Page

STEP 1: Type Structured Query
  → Locate input: <input> OR <textarea>
  → Type: "Tüm Dell monitörleri listele"
  → SCREENSHOT: "query-entered"

STEP 2: Submit Query
  → Press: Enter key
  → OR click: "Send" button
  → Wait 3 seconds for AI response
  → SCREENSHOT: "query-submitted"

EXPECTED RESULT 1: NO Conversational Text
  → Locate response area: last message bubble
  → Get response text
  → VERIFY text does NOT contain:
    - "Merhaba"
    - "Nasılsın"
    - "Size yardımcı olabilirim"
  → VERIFY: No friendly greetings
  → Console log: "Response type: Tabular (no conversation)"

EXPECTED RESULT 2: Tabular Data Returned
  → Check if <table> element exists in response
  → OR check if text contains table markers: "|" or "─"
  → VERIFY: Data is in rows and columns format
  → SCREENSHOT: "query-result-table"

EXPECTED RESULT 3: Data Contains Dell Monitors
  → Response should list items with:
    - Name containing "Dell"
    - Category: "Monitor" OR "Elektronik"
  → If no Dell monitors exist, should return empty table
  → NOT return: "No results found" as conversational text
```

**Expected Behavior:**
- ✅ Query executes immediately
- ✅ Returns structured table
- ✅ NO conversational response
- ✅ Data matches query criteria

**Failure Conditions:**
- ❌ Response contains greetings/chat
- ❌ No table returned
- ❌ Error message displayed

---

### **Test Case 4.3: Execute Query - Count Projectors**

**Objective:** Numerical query returns number, not text

**Test Steps:**

```
PRECONDITION: On Chatbot Page

STEP 1: Type Numerical Query
  → Locate input field
  → Type: "Kaç tane projeksiyon var?"
  → Press: Enter
  → Wait 3 seconds
  → SCREENSHOT: "count-query-result"

EXPECTED RESULT: Numerical Answer
  → Locate response area: last message
  → Get response text
  → VERIFY: Text contains number (regex: \d+)
  → Example formats:
    - "5" (plain number)
    - "Toplam: 5" (with label)
    - Table with COUNT column showing number
  → VERIFY: Not a sentence like "There are 5 projectors"
  → SCREENSHOT: "numerical-result"

Console log: "Chatbot result: {responseText}"
```

**Expected Behavior:**
- ✅ Returns count as number
- ✅ May be in table format
- ✅ No verbose explanation

---

### **Test Case 4.4: Multiple Queries - No Conversation State**

**Objective:** Each query is independent (no context maintained)

**Test Steps:**

```
PRECONDITION: On Chatbot Page

QUERIES TO TEST:
  1. "Bilgisayar sayısı"
  2. "Lab-101 lokasyonundaki cihazlar"
  3. "En son eklenen 5 ürün"

FOR EACH query:
  STEP 1: Submit Query
    → Type query in input
    → Press Enter
    → Wait 3 seconds
    → SCREENSHOT: "query-{index}-result"
  
  STEP 2: Verify Independent Response
    → Response should answer ONLY current query
    → Should NOT reference previous queries
    → Example WRONG response: "As I mentioned before..."
    → Each response is standalone
  
  Console log: "Query {index} executed independently"

FINAL VERIFICATION:
  → Chatbot does NOT maintain conversation state
  → No context from Query 1 used in Query 2
  → Each query hits database fresh
```

**Expected Behavior:**
- ✅ All 3 queries execute successfully
- ✅ No cross-query context
- ✅ Each returns fresh database results

---

### **Test Case 4.5: Verify Read-Only - No Database Modifications**

**Objective:** Chatbot cannot DELETE/UPDATE data

**Test Steps:**

```
PRECONDITION: On Chatbot Page

STEP 1: Try Dangerous Query
  → Type: "Tüm bilgisayarları sil"
  → Press Enter
  → Wait 3 seconds
  → SCREENSHOT: "dangerous-query-blocked"

EXPECTED RESULT A: Query Rejected OR Returns Error
  → Response should be:
    - "Bu işlem yapılamaz" (Operation not allowed)
    - "Sadece SELECT sorguları" (Only SELECT queries)
    - Empty table
    - Error message
  → Should NOT execute DELETE
  → SCREENSHOT: "read-only-enforced"

STEP 2: Verify Database Unchanged (Optional)
  → Navigate to Inventory List
  → Verify: All items still exist
  → Row count unchanged
  → Console log: "Database protected from modifications"

EXPECTED RESULT B: Only SELECT Allowed
  → System blocks: DELETE, UPDATE, DROP, INSERT
  → Only allows: SELECT queries
  → Read-only constraint enforced
```

**Expected Behavior:**
- ✅ Dangerous queries rejected
- ✅ Database remains unchanged
- ✅ Read-only mode enforced

---

### **Test Case 4.6: Verify SQL Query Display**

**Objective:** System shows generated SQL (transparency)

**Test Steps:**

```
PRECONDITION: On Chatbot Page

STEP 1: Submit Simple Query
  → Type: "Laptop sayısı"
  → Press Enter
  → Wait for response

STEP 2: Look for SQL Display
  → Search for: <code> OR <pre> elements
  → Check if SQL query is shown
  → SQL should contain keywords: SELECT, FROM, WHERE
  → SCREENSHOT: "sql-query-displayed"

IF SQL IS VISIBLE:
  → Get SQL text
  → VERIFY: Query starts with "SELECT"
  → VERIFY: Does NOT contain: DELETE, UPDATE, DROP
  → Console log: "Generated SQL: {sqlQuery}"
  → This proves transparency (user sees what runs)

IF SQL NOT VISIBLE:
  → This is acceptable (optional feature)
  → Console log: "SQL not displayed (optional feature)"
```

**Expected Behavior:**
- ✅ SQL may or may not be shown (optional)
- ✅ If shown, must be SELECT only
- ✅ Provides transparency for debugging

---

## CROSS-CUTTING TESTS: Prototype Constraints

### **Test Case: Only UC1, UC9, UC17 Implemented**

**Test Steps:**

```
PRECONDITION: Login as Admin
  → Full system access for testing

STEP 1: Check Available Menu Items
  → Get all navigation links
  → Store menu items list
  → Console log: "Available features: {menuItems}"

EXPECTED: Limited Feature Set
  → Should have:
    - Dashboard (UC9)
    - Inventory (UC1 - Add Item)
    - Chatbot (UC17)
  
  → Should NOT have (yet):
    - Maintenance Management
    - Purchase Requests
    - Advanced Reports
    - Audit Logs
  
  → SCREENSHOT: "prototype-menu-limited"

VERIFY: This is 20% Prototype
  → Only 3 use cases active
  → Other features disabled or not visible
```

---

### **Test Case: No Edit/Delete System-Wide**

**Test Steps:**

```
PRECONDITION: Login as Manager (max permissions)

PAGES TO CHECK:
  - /
  - /inventory
  - /transactions

FOR EACH page:
  STEP 1: Navigate to page
  STEP 2: Search for:
    → Buttons with: "Düzenle" text
    → Buttons with: "Sil" text
    → Elements with: [data-testid*="edit"]
    → Elements with: [data-testid*="delete"]
  
  STEP 3: Count Results
    → editCount should be: 0
    → deleteCount should be: 0
  
  Console log: "{page} - Edit: {editCount}, Delete: {deleteCount}"

FINAL VERIFICATION:
  → System-wide: NO edit operations
  → System-wide: NO delete operations
  → SCREENSHOT: "no-edit-delete-system-wide"
```

---

### **Test Case: Chatbot is NOT Conversational**

**Test Steps:**

```
PRECONDITION: On Chatbot Page

CONVERSATIONAL INPUTS TO TEST:
  - "Merhaba"
  - "Nasılsın?"
  - "Bana yardım eder misin?"

FOR EACH input:
  STEP 1: Submit Input
    → Type conversational text
    → Press Enter
    → Wait for response
  
  STEP 2: Verify NON-Conversational Response
    → Response should be:
      - Empty result
      - Error: "Geçersiz sorgu" (Invalid query)
      - Table with 0 rows
    
    → Response should NOT be:
      - "Merhaba! Ben AI asistanınızım..."
      - "İyiyim, teşekkür ederim..."
      - Friendly chat message
  
  Console log: "Input '{input}' rejected (not conversational)"

SCREENSHOT: "chatbot-no-conversation-mode"

CONCLUSION:
  → Chatbot is SQL query executor ONLY
  → Does not engage in conversation
  → Prototype constraint verified
```

---

## Test Execution Checklist

### Pre-Execution Setup

```bash
# 1. Start Docker services
cd /Users/eneskaynakci/Github/CTIS-SIMS
docker compose up -d

# 2. Verify services are running
docker compose ps
# Expected: backend, frontend, mysql all "Up"

# 3. Verify frontend is accessible
curl http://localhost:5174
# Should return HTML

# 4. Verify backend API
curl http://localhost:8002/api/health
# Should return: {"status": "ok"}

# 5. Navigate to test directory
cd tests/e2e

# 6. Install Playwright (if first time)
npm install
npx playwright install chromium
```

### Run Tests

```bash
# Run all prototype tests
npx playwright test tests/prototype-increment1.spec.js

# Run specific scenario
npx playwright test tests/prototype-increment1.spec.js -g "Scenario 1"

# Run with UI (headed mode)
npx playwright test tests/prototype-increment1.spec.js --headed

# Run with debug mode
npx playwright test tests/prototype-increment1.spec.js --debug

# Generate HTML report
npx playwright show-report
```

### Post-Execution Verification

```bash
# Check test results
cat test-results/test-results.json

# View HTML report
npx playwright show-report

# Check screenshots (on failure)
ls -la test-results/
```

---

## UI Element Locators Reference

### Login Page
- Email Input: `[data-testid="email-input"]`
- Password Input: `[data-testid="password-input"]`
- Login Button: `[data-testid="login-submit"]`

### Inventory List
- Add Item Button: `[data-testid="add-item-button"]`
- Inventory Table: `table` (first)
- Table Rows: `tbody tr`
- Search Input: `[data-testid="inventory-search"]`

### Add Item Form
- Item Name: `input[name="name"]` OR `[data-testid="item-name-input"]`
- Category Dropdown: `select[name="category_id"]`
- Location: `input[name="location"]`
- Inventory Number: `input[name="inventory_number"]`
- Staff Dropdown: `select[name="current_holder_id"]`
- Vendor Dropdown: `select[name="vendor_id"]`
- Submit Button: `[data-testid="submit-button"]` OR `button[type="submit"]`

### Chatbot
- Menu Link: `text=Yapay Zeka` OR `text=AI` OR `text=Asistan`
- Input Field: `input[type="text"]` OR `textarea` (first)
- Send Button: `button` (with send icon or text)
- Response Area: `[class*="message"]` OR `[class*="response"]`
- SQL Display: `code` OR `pre` (with SELECT keyword)

### Navigation
- User Menu: `[data-testid="user-menu-button"]`
- Logout Button: `[data-testid="logout-button"]`
- Sidebar Links: `nav a` OR `nav button`

---

## Expected Test Results Summary

| Scenario | Total Tests | Expected Pass | Critical |
|----------|-------------|---------------|----------|
| Scenario 1 | 3 tests | 3/3 | ✅ YES |
| Scenario 2 | 4 tests | 4/4 | ✅ YES |
| Scenario 3 | 3 tests | 3/3 | ⚠️ HIGH |
| Scenario 4 | 6 tests | 6/6 | ⚠️ HIGH |
| Constraints | 3 tests | 3/3 | ✅ CRITICAL |
| **TOTAL** | **19 tests** | **19/19** | - |

---

## Troubleshooting Guide

### Common Issues

**Issue 1: Login Timeout**
```
Error: page.waitForURL: Timeout 15000ms exceeded
```
**Solution:**
- Increase timeout to 30000ms
- Check backend is running: `docker compose logs backend`
- Verify database connection

**Issue 2: Element Not Found**
```
Error: locator.click: Target closed
```
**Solution:**
- Add `await page.waitForLoadState('networkidle')`
- Use longer timeouts
- Check element selector is correct

**Issue 3: Chatbot Not Responding**
```
Error: AI service connection failed
```
**Solution:**
- Check AI service is running: `docker compose ps ai-service`
- Verify LM Studio / Ollama is accessible
- Check logs: `docker compose logs ai-service`

**Issue 4: Data Not Appearing**
```
Error: Expected row count > 0, got 0
```
**Solution:**
- Run database seeder: `docker compose exec backend php artisan db:seed`
- Verify items exist: `docker compose exec backend php artisan tinker --execute="echo \App\Models\Item::count();"`

---

## Success Criteria

✅ **All 19 tests must pass**

✅ **Zero Edit/Delete buttons found system-wide**

✅ **Chatbot returns ONLY tables (no conversation)**

✅ **Role-based access works (Manager vs Staff)**

✅ **Add Item workflow completes end-to-end**

✅ **Screenshots generated for all critical steps**

---

## Document Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Dec 11, 2025 | Initial creation | QA Team |

---

**End of Document**
