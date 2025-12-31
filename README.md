# CTIS-SIMS DEMO - Limited Features

A simplified demo version showcasing 3 key use cases of the inventory management system.

---

## 🎯 Demo Scope

This demo implements **3 specific use cases** only:

### ✅ UC1 - Create Inventory Items (Manager Only)
- Manager can create new inventory records
- Fields: Item Name, Category, Quantity, Location, assigned Staff Member
- Categories are predefined (no category management)
- **No edit/delete functionality**

### ✅ UC9 - View Role-Based Dashboard
- After login, users see role-based content:
  - **Manager**: Views ALL inventory items
  - **Staff**: Views only items assigned to them
- Real-time statistics display

### ✅ UC17 - Ask Inventory Questions (Chatbot - Read Only)
- Query-only interface
- Example queries:
  - "How many Dell monitors do we have?"
  - "List all projectors in Lab-101"
- Returns tabular data only (no conversational text)
- **No data modification via chatbot**

---

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Ollama installed with llama3.2 model (for AI features)
- Ports available: 5174 (frontend), 8002 (backend), 8001 (AI), 3307 (database)

### Start the Demo

\`\`\`bash
cd CTIS-SIMS-DEMO

# Start all services
docker compose up -d

# Wait ~30 seconds for initialization

# Run migrations and seed demo data
docker compose exec backend php artisan migrate --seed

# Access the demo
open http://localhost:5174
\`\`\`

### Demo Credentials

**Manager Account** (Can create items + see all items):
\`\`\`
Email:    manager@ctis.edu.tr
Password: password
\`\`\`

**Staff Account** (Can only see assigned items):
\`\`\`
Email:    staff@ctis.edu.tr
Password: password
\`\`\`

---

## 📦 What's Included

### ✅ Enabled Features
- User authentication (login/logout)
- Role-based dashboard
- Create inventory items (Manager only)
- View inventory list (role-filtered)
- AI chatbot for read-only queries
- Predefined categories
- Dashboard statistics

### ❌ Disabled Features (Not in Demo)
- Edit inventory items
- Delete inventory items
- Category management (CRUD)
- User management
- Transaction management (checkout/return)
- Maintenance requests
- Purchase requests
- Notifications
- Reports
- Settings pages
- Email notifications

---

## 🧪 Testing the Demo

### Test UC1: Create Inventory Item (Manager)
\`\`\`bash
# Login as manager
TOKEN=$(curl -s -X POST http://localhost:8002/api/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"manager@ctis.edu.tr","password":"password"}' \\
  | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

# Create a new item
curl -X POST http://localhost:8002/api/items \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Dell Monitor P2422H",
    "category_id": 1,
    "quantity": 5,
    "location": "Lab-101",
    "current_holder_id": 2
  }'
\`\`\`

### Test UC9: Role-Based Dashboard
\`\`\`bash
# Manager sees all items
curl -H "Authorization: Bearer $TOKEN" http://localhost:8002/api/items

# Get dashboard stats
curl -H "Authorization: Bearer $TOKEN" http://localhost:8002/api/items/stats
\`\`\`

### Test UC17: Chatbot Query
\`\`\`bash
# Ask a question
curl -X POST http://localhost:8002/api/chat \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"query":"How many monitors do we have?"}'
\`\`\`

---

## 📝 Use Case Validation

### UC1 ✅ Manage Inventory Items (Create only)
- [x] Manager can create items
- [x] Fields: Name, Category, Quantity, Location, Staff
- [x] Categories predefined
- [x] No edit/delete

### UC9 ✅ View Role-Based Dashboard
- [x] Manager sees all items
- [x] Staff sees only assigned items
- [x] Dashboard statistics displayed

### UC17 ✅ Ask Inventory Question via Chatbot
- [x] Query-only interface
- [x] Structured questions supported
- [x] Returns tabular results
- [x] No conversational text
- [x] No data modification

---

**Version**: 1.0.0-demo  
**Purpose**: Prototype demonstration of 3 core use cases  
**Status**: ✅ Demo Ready
