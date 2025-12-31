# Use Case Documentation - DEMO VERSION

This document details the 3 implemented use cases for the demonstration prototype.

---

## UC1 - Manage Inventory Items (Create Only)

**Related Requirement**: FReq 1.1.1 (Item Creation) under FReq 1.1 (Inventory Management)

### Description
Enables the Inventory Manager to create new inventory records by entering essential item information.

### Preconditions
- User must be authenticated
- User must have Manager or Admin role
- Categories must be predefined in the system

### Actors
- Inventory Manager (primary)
- Admin (secondary)

### Main Flow
1. Manager logs into the system
2. Manager navigates to "Create Item" page
3. System displays item creation form with fields:
   - Item Name (text input)
   - Category (dropdown - predefined categories)
   - Quantity (number input)
   - Location (text input)
   - Assigned Staff Member (dropdown - from user list)
4. Manager fills in all required fields
5. Manager clicks "Create" button
6. System validates the input
7. System creates the inventory record
8. System displays success message
9. System returns to dashboard with the new item visible

### Alternative Flows
**4a. Manager leaves required fields empty**
- System displays validation errors
- Manager corrects the errors and resubmits

**4b. Manager enters invalid quantity (negative or zero)**
- System displays validation error
- Manager enters valid quantity

### Postconditions
- New inventory item is created in the database
- Item appears in the inventory list
- Item is visible on Manager's dashboard
- If staff member is assigned, item appears on their dashboard

### Business Rules
- Only Manager and Admin roles can create items
- Category must be selected from predefined list
- Quantity must be a positive integer
- Location is required
- Staff assignment is optional

### Limitations (Demo Scope)
- **No Edit functionality**: Items cannot be modified after creation
- **No Delete functionality**: Items cannot be removed
- **No Category Management**: Categories are predefined, cannot be added/removed
- **No Error Recovery**: Basic validation only

---

## UC9 - View Role-Based Dashboard

**Related Requirement**: FReq 4.1 (Role-Based Dashboards)

### Description
After authentication, the system identifies the user's role and displays the appropriate dashboard with role-specific inventory visibility.

### Preconditions
- User must be authenticated
- User must have a valid role assigned

### Actors
- Manager (sees all items)
- Staff (sees only assigned items)
- Admin (sees all items)

### Main Flow - Manager/Admin
1. User logs into the system with Manager or Admin credentials
2. System authenticates the user
3. System identifies user role
4. System redirects to dashboard
5. System displays:
   - Total item count
   - Total quantity sum
   - Items by category breakdown
   - Complete inventory list (all items)
6. User can view item details (name, category, quantity, location, holder)

### Main Flow - Staff
1. User logs into the system with Staff credentials
2. System authenticates the user
3. System identifies user role as Staff
4. System redirects to dashboard
5. System displays:
   - Count of items assigned to this staff member
   - Quantity of assigned items
   - Items by category (only assigned items)
   - Filtered inventory list (only items where current_holder_id matches user)
6. Staff can view only their assigned items

### Alternative Flows
**5a. No items exist in system**
- Dashboard shows zero statistics
- Empty state message displayed

**5a. Staff has no assigned items**
- Dashboard shows zero statistics
- Message: "No items assigned to you"

### Postconditions
- User sees appropriate inventory view based on role
- Statistics reflect role-based data
- User can only see authorized items

### Business Rules
- Manager/Admin see ALL inventory items
- Staff see ONLY items where they are the current holder
- Statistics are calculated based on visible items only
- Real-time data (no caching)

---

## UC17 - Ask Inventory Question via Chatbot

**Related Requirement**: FReq 4.5 (Prompt-Based Inventory Queries) and FReq 7.5 (Retry Mechanism)

### Description
Provides a simplified query-only chatbot interface where users can type structured questions about inventory. The system translates natural language into read-only SQL queries and returns tabular results.

### Preconditions
- User must be authenticated
- AI service must be running
- Ollama with llama3.2 model must be available
- Database must contain inventory data

### Actors
- Any authenticated user (Manager, Staff, Admin)

### Main Flow
1. User clicks on the Chatbot icon (floating button or menu item)
2. System opens chatbot panel
3. User types a structured question in Turkish or English:
   - "How many Dell monitors do we have?"
   - "List all projectors in Lab-101"
   - "Show items in Lab-102"
   - "Count computers"
4. User presses Enter or clicks Send
5. System displays "Processing..." indicator
6. System sends query to AI service
7. AI service:
   - Analyzes the question
   - Generates appropriate SQL query
   - Validates query is read-only (SELECT only)
   - Executes query against database
8. AI service returns structured data
9. System displays results in tabular format:
   - Column headers
   - Data rows
   - Row count
10. User can ask another question (independent query, no context retention)

### Alternative Flows
**6a. AI service is unavailable**
- System displays error message
- "AI service is currently unavailable. Please try again later."

**7a. Question is ambiguous or cannot be interpreted**
- System returns clarification message
- "Could not understand the question. Please try: 'How many [item] do we have?' or 'List all [items] in [location]'"

**7b. Query would modify data (INSERT/UPDATE/DELETE)**
- AI service rejects the query
- System displays: "Chatbot is read-only. Cannot modify data."

**7c. No results found**
- System displays empty table with message
- "No items found matching your query"

### Postconditions
- User receives requested information
- No data is modified
- Query is logged (optional)
- Chatbot remains open for next question

### Business Rules
- **Read-only**: Only SELECT queries allowed
- **No conversational context**: Each query is independent
- **Structured questions**: Works best with clear, specific questions
- **No modifications**: Cannot create, update, or delete data
- **Role-based filtering**: Staff queries respect their data access (future enhancement)

### Supported Query Patterns
1. **Count queries**:
   - "How many [item type]?"
   - "Count [item type] in [location]"

2. **List queries**:
   - "List all [item type]"
   - "Show [item type] in [location]"
   - "What [item type] are in [location]?"

3. **Location queries**:
   - "Show items in [location]"
   - "What's in [location]?"

4. **Category queries**:
   - "List all monitors"
   - "Show computers"

### Limitations (Demo Scope)
- **No conversation state**: Cannot reference previous questions
- **No follow-up questions**: Each query is independent
- **Structured format required**: Free-form conversational queries may fail
- **Basic error handling**: Limited retry mechanism
- **No natural language responses**: Returns data tables only, no explanatory text

---

## Data Requirements

### Demo Users
```
Admin:
  - Email: admin@ctis.edu.tr
  - Password: password
  - Role: Admin

Manager:
  - Email: manager@ctis.edu.tr
  - Password: password
  - Role: Manager

Staff:
  - Email: staff@ctis.edu.tr
  - Password: password
  - Role: Staff
```

### Predefined Categories
1. Computers
2. Monitors
3. Projectors
4. Cables
5. Furniture

### Sample Inventory Items (15 items)
- 3 Computer types (Dell, HP, Lenovo)
- 3 Monitor types (Dell, HP, LG)
- 3 Projector types (Epson, BenQ, Sony)
- 3 Cable types (HDMI, USB-C, DisplayPort)
- 3 Furniture types (Chair, Desk, Cabinet)

**Distribution**:
- 10 items: No holder (available)
- 5 items: Assigned to Staff member

---

## Testing Scenarios

### Scenario 1: Manager Creates New Item (UC1)
1. Login as manager@ctis.edu.tr
2. Navigate to "Create Item"
3. Fill form:
   - Name: "Samsung Monitor S24"
   - Category: Monitors
   - Quantity: 3
   - Location: Lab-103
   - Staff: (leave unassigned)
4. Click Create
5. Verify success message
6. Verify item appears on dashboard

### Scenario 2: Role-Based Dashboard - Manager View (UC9)
1. Login as manager@ctis.edu.tr
2. View dashboard
3. Verify statistics show all 15+ items
4. Verify can see items assigned to staff
5. Verify can see unassigned items

### Scenario 3: Role-Based Dashboard - Staff View (UC9)
1. Login as staff@ctis.edu.tr
2. View dashboard
3. Verify statistics show only 5 assigned items
4. Verify cannot see unassigned items
5. Verify cannot see items assigned to others

### Scenario 4: Chatbot Count Query (UC17)
1. Login as any user
2. Open chatbot
3. Type: "How many monitors do we have?"
4. Verify receives table with count
5. Verify no errors

### Scenario 5: Chatbot List Query (UC17)
1. Open chatbot
2. Type: "List all projectors in Lab-101"
3. Verify receives table with:
   - Column headers
   - Projector rows from Lab-101
   - Correct data

### Scenario 6: Chatbot Error Handling (UC17)
1. Open chatbot
2. Type: "Delete all monitors"
3. Verify receives error: "Read-only"
4. No data is deleted

---

## Success Criteria

### UC1 Success
- ✅ Manager can create items
- ✅ All required fields validated
- ✅ Item appears in database
- ✅ Item visible on dashboard
- ✅ Staff users cannot access create page

### UC9 Success
- ✅ Manager sees all items
- ✅ Staff sees only assigned items
- ✅ Statistics calculate correctly
- ✅ Role filtering works automatically

### UC17 Success
- ✅ Chatbot accepts questions
- ✅ Returns tabular data
- ✅ No conversational text
- ✅ Read-only queries only
- ✅ Rejects data modifications
- ✅ Handles common question patterns

---

## Out of Scope (Deferred Features)

The following are **NOT** implemented in this demo:

❌ Edit inventory items  
❌ Delete inventory items  
❌ Category management (CRUD)  
❌ User management (CRUD)  
❌ Transaction management (checkout/return)  
❌ Maintenance requests  
❌ Purchase requests  
❌ Email notifications  
❌ Reporting features  
❌ QR code generation  
❌ Advanced search/filters  
❌ Bulk operations  
❌ Export/import data  
❌ Audit logs  
❌ System settings  

These features exist in the full system but are excluded from the demo to focus on the 3 core use cases.
