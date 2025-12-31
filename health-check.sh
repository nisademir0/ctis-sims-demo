#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           CTIS-SIMS System Health Check                       ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check Docker containers
echo "📦 Checking Docker Containers..."
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" | grep -E "ctis_"
echo ""

# Check Backend
echo "🔧 Checking Backend (Laravel)..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8002/api/user 2>/dev/null)
if [ "$BACKEND_STATUS" = "401" ]; then
    echo "✅ Backend is running (401 = auth required, which is correct)"
else
    echo "⚠️  Backend returned: $BACKEND_STATUS"
fi
echo ""

# Check Frontend
echo "🎨 Checking Frontend (React)..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5174)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend returned: $FRONTEND_STATUS"
fi
echo ""

# Check AI Service
echo "🤖 Checking AI Service (Python)..."
AI_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/health)
if [ "$AI_STATUS" = "200" ]; then
    echo "✅ AI Service is running"
else
    echo "⚠️  AI Service returned: $AI_STATUS"
fi
echo ""

# Check Database
echo "🗄️  Checking Database (MySQL)..."
DB_CHECK=$(docker compose exec -T db mysql -uctis_user -psecret_password -e "SELECT 1;" ctis_sims 2>&1)
if echo "$DB_CHECK" | grep -q "1"; then
    echo "✅ Database is accessible"
else
    echo "❌ Database connection failed"
fi
echo ""

# Test Login
echo "🔐 Testing API Login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8002/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ctis.edu.tr","password":"password"}')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo "✅ Login endpoint working"
    TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)
    
    # Test authenticated endpoint
    echo ""
    echo "👤 Testing Authenticated Endpoint..."
    USER_RESPONSE=$(curl -s -X GET http://localhost:8002/api/user \
      -H "Authorization: Bearer $TOKEN" \
      -H "Accept: application/json")
    
    if echo "$USER_RESPONSE" | grep -q "email"; then
        echo "✅ Authentication working"
    else
        echo "❌ Authentication failed"
    fi
else
    echo "❌ Login failed"
fi
echo ""

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                     System Access URLs                         ║"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo "║ Frontend:     http://localhost:5174                           ║"
echo "║ Backend API:  http://localhost:8002/api                       ║"
echo "║ AI Service:   http://localhost:8001                           ║"
echo "║ phpMyAdmin:   http://localhost:8081                           ║"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo "║ Credentials:  admin@ctis.edu.tr / password                    ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
