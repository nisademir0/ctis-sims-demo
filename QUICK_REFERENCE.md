# CTIS-SIMS DEMO - Quick Reference Card

## 🎯 3 Use Cases

| UC | Name | Who | What |
|----|------|-----|------|
| UC1 | Create Items | Manager | Add new inventory items |
| UC9 | Role Dashboard | All Users | View items based on role |
| UC17 | Chatbot Queries | All Users | Ask inventory questions |

---

## 👥 Login Credentials

### Manager (Full Access)
```
Email: manager@ctis.edu.tr
Password: password
```
Can: Create items, See all items, Use chatbot

### Staff (Limited Access)
```
Email: staff@ctis.edu.tr
Password: password
```
Can: See assigned items only, Use chatbot

---

## 🚀 Quick Start

```bash
cd CTIS-SIMS-DEMO
./setup-demo.sh
```

Or manually:
```bash
docker compose up -d
docker compose exec backend php artisan migrate --seed
open http://localhost:5174
```

---

## 📝 Example Chatbot Questions

✅ **Count queries:**
- "How many Dell monitors do we have?"
- "Count projectors"

✅ **List queries:**
- "List all monitors"
- "Show projectors in Lab-101"

✅ **Location queries:**
- "What's in Lab-102?"
- "Show items in Office-A"

❌ **NOT Supported:**
- "Delete all monitors" (read-only)
- "Update monitor location" (read-only)
- "Add new monitor" (use Create Item form)

---

## 🔧 API Endpoints

### Public
```
POST /api/login
```

### Protected
```
GET  /api/user
POST /api/logout
GET  /api/items          # Role-filtered
POST /api/items          # Manager only
GET  /api/items/stats
POST /api/chat           # Read-only
GET  /api/categories
GET  /api/users
```

---

## 📊 Demo Data

- **Users**: 3 (Admin, Manager, Staff)
- **Categories**: 5 (Computers, Monitors, Projectors, Cables, Furniture)
- **Items**: 15 sample inventory items
- **Assigned Items**: 5 items assigned to Staff

---

## ✅ Testing Checklist

### UC1: Create Item
- [ ] Login as Manager
- [ ] Navigate to "Create Item"
- [ ] Fill all fields
- [ ] Submit form
- [ ] Verify item appears on dashboard

### UC9: Role Dashboard
- [ ] Login as Manager → See all 15+ items
- [ ] Logout
- [ ] Login as Staff → See only 5 assigned items
- [ ] Verify statistics are different

### UC17: Chatbot
- [ ] Click chatbot icon
- [ ] Type: "How many monitors?"
- [ ] Verify table response
- [ ] Type: "List projectors"
- [ ] Verify list response

---

## 🛑 What's NOT in Demo

- ❌ Edit/Delete items
- ❌ User management
- ❌ Category management
- ❌ Transactions (checkout/return)
- ❌ Maintenance requests
- ❌ Purchase requests
- ❌ Reports
- ❌ Notifications

---

## 📍 URLs

- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:8002/api
- **AI Service**: http://localhost:8001
- **Database**: localhost:3307
- **phpMyAdmin**: http://localhost:8081

---

## 🐛 Common Issues

### Containers not starting?
```bash
docker compose down -v
docker compose up -d
```

### Database empty?
```bash
docker compose exec backend php artisan migrate:fresh --seed
```

### Frontend shows 404?
```bash
docker compose restart frontend
```

### Chatbot not working?
Check if Ollama is running:
```bash
curl http://localhost:11434/api/tags
```

---

## 📞 Support

See detailed documentation:
- `README.md` - Setup instructions
- `USE_CASES.md` - Detailed use case descriptions
- `DEMO_CHANGES.md` - What's different from full version

**Demo Version**: 1.0.0-demo  
**Created**: December 31, 2025
