# CTIS-SIMS Manual Test Checklist
# Comprehensive manual testing guide for all features

## 📋 Test Environment Setup
- [ ] Backend running: http://localhost:8002
- [ ] Frontend running: http://localhost:5174
- [ ] Database seeded with test data
- [ ] Browser: Chrome/Firefox/Safari
- [ ] Test user credentials ready

## 🔐 FR-1: Authentication & User Management

### FR-1.1: User Login
- [ ] Valid credentials → Dashboard
- [ ] Invalid email → Error message
- [ ] Invalid password → Error message
- [ ] Empty fields → Validation errors
- [ ] "Remember me" functionality
- [ ] Session persistence

**Test Data:**
- Admin: admin@ctis.edu.tr / password
- Manager: serkan@ctis.edu.tr / password
- Staff: leyla@ctis.edu.tr / password

**Screenshots:** 
- [ ] Login page
- [ ] Validation errors
- [ ] Successful login

---

### FR-1.2: Role-Based Access Control
- [ ] Admin can access all pages
- [ ] Inventory Manager: Limited access
- [ ] Staff: Basic access only
- [ ] Unauthorized access → Error page

**Test Steps:**
1. Login as Staff
2. Try to access /settings/users
3. Verify error message
4. Screenshot error

---

### FR-1.6-1.7: Password Reset
- [ ] Click "Forgot Password"
- [ ] Enter valid email
- [ ] Receive reset link (check logs)
- [ ] Reset password with token
- [ ] Login with new password

---

### FR-1.8-1.9: Profile Management
- [ ] View profile information
- [ ] Update name
- [ ] Update email
- [ ] Update phone
- [ ] Changes persist after reload

---

### FR-1.10: Change Password
- [ ] Current password validation
- [ ] New password strength check
- [ ] Password confirmation match
- [ ] Success notification
- [ ] Login with new password

---

### FR-1.11-1.12: Avatar Management
- [ ] Upload avatar (JPG/PNG)
- [ ] Preview before upload
- [ ] Avatar displays in navbar
- [ ] Delete avatar
- [ ] Default avatar after delete

---

## 📦 FR-2: Inventory Management

### FR-2.1-2.2: View & Search Inventory
- [ ] Inventory list loads
- [ ] Search by name
- [ ] Search by barcode
- [ ] Real-time search updates
- [ ] Pagination works
- [ ] Items per page selector

**Test Data:**
Search: "laptop", "monitor", "mouse"

---

### FR-2.3-2.4: Filtering
- [ ] Filter by category
- [ ] Filter by status (Available/Borrowed/Maintenance)
- [ ] Filter by location
- [ ] Multiple filters combined
- [ ] Clear filters button

---

### FR-2.5: Add New Item (Admin/Manager only)
- [ ] Click "Add Item" button
- [ ] Fill required fields
- [ ] Upload item image
- [ ] Generate QR code
- [ ] Save item
- [ ] Item appears in list

**Required Fields:**
- Item name
- Category
- Barcode
- Quantity
- Purchase date
- Location

---

### FR-2.6: Edit Item
- [ ] Click edit icon
- [ ] Update information
- [ ] Save changes
- [ ] Changes reflected in list
- [ ] Activity log updated

---

### FR-2.7: Delete Item
- [ ] Click delete icon
- [ ] Confirm deletion dialog
- [ ] Item removed from list
- [ ] Cannot delete borrowed items

---

### FR-2.8: Item Details
- [ ] Click item row
- [ ] View full details
- [ ] See transaction history
- [ ] See maintenance history
- [ ] Download QR code

---

### FR-2.10: QR Code
- [ ] QR code displayed
- [ ] Download QR code
- [ ] Scan with phone
- [ ] QR redirects to item details

---

## 🔄 FR-3: Transaction Management

### FR-3.2: Item Checkout
- [ ] Select available item
- [ ] Click "Checkout"
- [ ] Select borrower
- [ ] Set due date
- [ ] Add notes
- [ ] Confirm checkout
- [ ] Email notification sent
- [ ] Item status → Borrowed

**Test Scenarios:**
1. Checkout single item
2. Try to checkout unavailable item → Error
3. Try to checkout to user with overdue items → Blocked

---

### FR-3.3: Item Return
- [ ] Find active transaction
- [ ] Click "Return"
- [ ] Select return condition (Good/Damaged/Lost)
- [ ] Add return notes
- [ ] Confirm return
- [ ] If late → Calculate late fee
- [ ] If damaged → Create maintenance request

**Conditions to Test:**
- On-time return (Good condition)
- Late return (Good condition) → Late fee
- Late return (Damaged) → Maintenance + Late fee

---

### FR-3.4-3.5: Overdue & Late Fees
- [ ] View overdue transactions
- [ ] Late fee calculated correctly
- [ ] Severity classification (Low/Medium/High/Critical)
- [ ] Email notification for overdue
- [ ] User blocked from new checkouts

**Late Fee Calculation:**
- 0-2 days: 5 TL/day
- 3-7 days: 10 TL/day
- 8+ days: 20 TL/day

---

### FR-3.6-3.7: Transaction History
- [ ] View all transactions
- [ ] Filter by status
- [ ] Filter by user
- [ ] Filter by date range
- [ ] Export to CSV
- [ ] Export to Excel

---

## 🔧 FR-4: Maintenance Management

### FR-4.1: Create Maintenance Request
- [ ] Select item
- [ ] Choose maintenance type (Repair/Service/Inspection)
- [ ] Set priority (Low/Medium/High/Urgent)
- [ ] Add description
- [ ] Upload photos
- [ ] Submit request
- [ ] Item status → Maintenance

**Priorities:**
- Urgent: 2 hours SLA
- High: 4 hours SLA
- Medium: 24 hours SLA
- Low: 72 hours SLA

---

### FR-4.2: Assign Maintenance (Manager/Admin)
- [ ] View pending requests
- [ ] Assign to technician
- [ ] Set scheduled date
- [ ] Notification sent to assignee

---

### FR-4.3-4.4: Update & Complete
- [ ] Technician views assigned tasks
- [ ] Update status (In Progress)
- [ ] Add work notes
- [ ] Enter cost
- [ ] Upload completion photos
- [ ] Mark as complete
- [ ] Item status → Available

---

### FR-4.8: SLA Tracking
- [ ] View SLA due date
- [ ] Time remaining indicator
- [ ] SLA breach warning
- [ ] First response tracking
- [ ] Resolution time tracking

**Test Scenarios:**
1. Urgent request → Check 2h SLA
2. Complete within SLA → Success
3. Complete after SLA → Breach logged

---

## 🛒 FR-5: Purchase Request Management

### FR-5.1: Create Purchase Request
- [ ] Click "New Purchase Request"
- [ ] Enter item details
- [ ] Set quantity
- [ ] Add justification
- [ ] Set needed-by date
- [ ] Attach supporting documents
- [ ] Submit request

---

### FR-5.2-5.3: Approve/Reject (Admin/Manager)
- [ ] View pending requests
- [ ] Review details
- [ ] Approve request
- [ ] Or reject with reason
- [ ] Email notification sent

---

### FR-5.4: Mark as Ordered
- [ ] Select approved request
- [ ] Enter order details
- [ ] Add vendor information
- [ ] Set expected delivery
- [ ] Mark as ordered

---

### FR-5.5: Mark as Received
- [ ] Verify delivery
- [ ] Enter actual quantity
- [ ] Add to inventory
- [ ] Close purchase request

---

## 📊 FR-6: Reporting

### FR-6.1: Inventory Report
- [ ] Generate inventory report
- [ ] View summary statistics
- [ ] Filter by category
- [ ] Filter by status
- [ ] Export to CSV
- [ ] Export to Excel

**Metrics to Verify:**
- Total items
- Available items
- Borrowed items
- Items in maintenance
- Low stock alerts

---

### FR-6.2: Transaction Report
- [ ] Select date range
- [ ] View transaction summary
- [ ] Active vs completed
- [ ] Overdue count
- [ ] Late fee total
- [ ] Download report

---

### FR-6.3: Maintenance Report
- [ ] Maintenance statistics
- [ ] By priority
- [ ] By status
- [ ] Average resolution time
- [ ] Cost analysis
- [ ] SLA compliance rate

---

### FR-6.4: User Activity Report
- [ ] User transaction count
- [ ] Overdue items per user
- [ ] Late fees per user
- [ ] Activity timeline

---

## 🔔 FR-7: Notifications

### FR-7.1: View Notifications
- [ ] Notification bell icon
- [ ] Unread count badge
- [ ] Click to view list
- [ ] Notification types displayed

**Notification Types:**
- Item checkout confirmation
- Return reminder (1 day before due)
- Overdue notification
- Maintenance assignment
- Purchase request approval
- System announcements

---

### FR-7.2-7.3: Mark Read & Delete
- [ ] Mark single as read
- [ ] Mark all as read
- [ ] Delete notification
- [ ] Clear all notifications

---

### FR-7.4: Real-time Updates
- [ ] Open two browser windows
- [ ] Perform action in one
- [ ] Notification appears in other
- [ ] No page refresh needed

---

## 🤖 FR-8: AI Chatbot

### FR-8.1-8.2: Natural Language Queries
- [ ] Open chatbot
- [ ] Ask: "How many items are available?"
- [ ] Verify SQL generation
- [ ] Check results displayed

**Test Queries:**
1. "Show me overdue transactions"
2. "Which items are in maintenance?"
3. "List all laptops"
4. "Show users with most checkouts"

---

### FR-8.3: Results Display
- [ ] Results in table format
- [ ] Columns labeled correctly
- [ ] Data matches actual DB
- [ ] Export results button

---

### FR-8.4: Chat History
- [ ] Previous queries visible
- [ ] Scroll through history
- [ ] Re-run previous query
- [ ] Clear chat history

---

## 🎨 NFR: Non-Functional Requirements

### NFR-2: Turkish Language
- [ ] All UI text in Turkish
- [ ] Error messages in Turkish
- [ ] Date format: DD.MM.YYYY
- [ ] Number format: 1.234,56
- [ ] Currency: TL

---

### NFR-3: Dark Mode
- [ ] Toggle dark mode
- [ ] Theme persists
- [ ] All pages support dark mode
- [ ] Good contrast maintained
- [ ] Icons visible in both modes

---

### NFR-4: Mobile Responsiveness
- [ ] Test on mobile (375px width)
- [ ] Navigation menu responsive
- [ ] Tables scroll horizontally
- [ ] Forms usable on mobile
- [ ] Touch targets adequate (44px min)

**Breakpoints to Test:**
- Mobile: 375px, 414px
- Tablet: 768px, 1024px
- Desktop: 1280px, 1920px

---

### NFR-5: Accessibility
- [ ] Keyboard navigation works
- [ ] Tab order logical
- [ ] Focus indicators visible
- [ ] Alt text on images
- [ ] ARIA labels present
- [ ] Color contrast ratio > 4.5:1

**Keyboard Tests:**
- Tab through form
- Enter to submit
- Escape to close modals
- Arrow keys in dropdowns

---

## ⚡ Performance Testing

### Page Load Times
- [ ] Dashboard < 2s
- [ ] Inventory list < 2s
- [ ] Reports < 3s
- [ ] Search results < 1s

### Network Conditions
- [ ] Test on 3G throttling
- [ ] Test on slow Wi-Fi
- [ ] Check loading indicators
- [ ] Graceful error handling

---

## 🔒 Security Testing

### Authentication
- [ ] Session timeout (2 hours)
- [ ] Logout clears session
- [ ] Protected routes redirect
- [ ] CSRF protection

### Data Validation
- [ ] XSS prevention
- [ ] SQL injection prevention
- [ ] File upload restrictions
- [ ] Input sanitization

---

## 🌐 Cross-Browser Testing

### Chrome
- [ ] All features work
- [ ] Styling correct
- [ ] Console no errors

### Firefox
- [ ] All features work
- [ ] Styling correct
- [ ] Console no errors

### Safari
- [ ] All features work
- [ ] Styling correct
- [ ] Console no errors

---

## 📝 Bug Reporting Template

```markdown
**Bug ID:** BUG-001
**Priority:** High/Medium/Low
**Module:** Authentication / Inventory / etc.
**Requirement:** FR-X.X

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**


**Actual Result:**


**Screenshot:**
[Attach]

**Browser:** Chrome 120
**Date:** 2025-12-09
**Tester:** [Your Name]
```

---

## ✅ Sign-Off

**Test Execution Date:** ___________
**Tester Name:** ___________
**Overall Status:** ⬜ Pass  ⬜ Fail  ⬜ Partial
**Total Tests:** _____ / _____  Passed
**Critical Bugs:** _____
**Comments:**


---

## 📊 Summary Statistics

| Module | Total Tests | Passed | Failed | Pass Rate |
|--------|-------------|--------|--------|-----------|
| Authentication | | | | |
| Inventory | | | | |
| Transactions | | | | |
| Maintenance | | | | |
| Purchase Requests | | | | |
| Reporting | | | | |
| Notifications | | | | |
| AI Chatbot | | | | |
| **TOTAL** | | | | |
