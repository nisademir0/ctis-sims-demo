#!/bin/bash

# 🧪 CTIS-SIMS: Quick Testing Script
# Run this to verify the system is working

echo "╔════════════════════════════════════════════╗"
echo "║   CTIS-SIMS: Quick System Test            ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check Docker containers
echo -e "${BLUE}━━━ Checking Docker Containers ━━━${NC}"
CONTAINERS=$(docker ps --format "{{.Names}}" | grep "ctis_" | wc -l | tr -d ' ')

if [ "$CONTAINERS" -eq 5 ]; then
    echo -e "${GREEN}✅ All 5 containers running${NC}"
else
    echo -e "${RED}❌ Only $CONTAINERS/5 containers running${NC}"
    echo -e "${YELLOW}Run: docker-compose up -d${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}━━━ Container Status ━━━${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep "ctis_"

echo ""
echo -e "${BLUE}━━━ Testing Services ━━━${NC}"

# Test Backend
echo -n "Testing Backend API... "
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8002/api/items/stats)
if [ "$BACKEND_STATUS" -eq 401 ] || [ "$BACKEND_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ Backend responding${NC}"
else
    echo -e "${RED}❌ Backend not responding (HTTP $BACKEND_STATUS)${NC}"
fi

# Test Frontend
echo -n "Testing Frontend... "
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5174)
if [ "$FRONTEND_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ Frontend responding${NC}"
else
    echo -e "${RED}❌ Frontend not responding (HTTP $FRONTEND_STATUS)${NC}"
fi

# Test AI Service
echo -n "Testing AI Service... "
AI_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8001)
if [ "$AI_STATUS" -eq 200 ] || [ "$AI_STATUS" -eq 404 ]; then
    echo -e "${GREEN}✅ AI Service responding${NC}"
else
    echo -e "${RED}❌ AI Service not responding (HTTP $AI_STATUS)${NC}"
fi

# Test Database
echo -n "Testing Database... "
DB_TEST=$(docker exec ctis_db mysql -uctis_user -pctis_pass -e "SELECT 1" ctis_sims 2>&1)
if echo "$DB_TEST" | grep -q "1"; then
    echo -e "${GREEN}✅ Database accessible${NC}"
else
    echo -e "${RED}❌ Database not accessible${NC}"
fi

echo ""
echo -e "${BLUE}━━━ Access URLs ━━━${NC}"
echo -e "Frontend:    ${GREEN}http://localhost:5174${NC}"
echo -e "Backend API: ${GREEN}http://localhost:8002/api${NC}"
echo -e "phpMyAdmin:  ${GREEN}http://localhost:8081${NC}"
echo -e "AI Service:  ${GREEN}http://localhost:8001${NC}"

echo ""
echo -e "${BLUE}━━━ Test Credentials ━━━${NC}"
echo -e "Admin:    admin@ctis.edu.tr / password"
echo -e "Manager:  serkan@ctis.edu.tr / password"
echo -e "Staff:    leyla@ctis.edu.tr / password"

echo ""
echo -e "${BLUE}━━━ Manual Testing Checklist ━━━${NC}"
echo "1. Login at http://localhost:5174"
echo "2. Navigate to 'İşlem Yönetimi' (Transactions)"
echo "3. Navigate to 'Zimmetli Eşyalarım' (My Loans)"
echo "4. Try to checkout an item (Admin/Manager only)"
echo "5. Try to return an item"
echo "6. Check for console errors (F12 in browser)"

echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}System is ready for testing!${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
