## DEMO VERSION - SIMPLIFIED FRONTEND

This demo frontend includes only the pages needed for the 3 use cases:

### Included Pages:
1. **Login** - Authentication
2. **Dashboard** - Role-based view (UC9)
3. **Create Item** - Item creation form (UC1 - Manager only)
4. **Chatbot** - Read-only AI queries (UC17)

### Removed Pages:
- Edit Item
- Item Details (with edit/delete)
- User Management
- Category Management
- Transactions
- Maintenance Requests
- Purchase Requests
- Notifications
- Reports
- Settings
- Profile (advanced features)

### Navigation Changes:
The sidebar now only shows:
- Dashboard
- Create Item (Manager/Admin only)
- Chatbot
- Logout

### Component Modifications:
- **Sidebar.jsx** - Simplified to 3 menu items
- **App.jsx** - Removed unused routes
- **ItemForm.jsx** - Create-only mode (no edit)
- **ChatbotPage.jsx** - Query-only (no follow-ups)
- **Dashboard.jsx** - Role-based filtering applied
