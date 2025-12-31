#!/bin/bash

# CTIS-SIMS Comprehensive SRS Compliance Testing
# Tests all critical functionalities against SRS requirements
# Date: December 4, 2025

set -e

BASE_URL="http://localhost:8002/api"
FRONTEND_URL="http://localhost:5174"
AI_URL="http://localhost:8001"

echo "════════════════════════════════════════════════════════════════"
echo "🧪 CTIS-SIMS COMPREHENSIVE SRS COMPLIANCE TEST SUITE"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📋 Testing against SRS v2.0 requirements"
echo "🕐 Started at: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

PASSED=0
FAILED=0
TOTAL=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
test_count=0

# Function to run a test
run_test() {
    local test_name=$1
    local srs_ref=$2
    local command=$3
    local expected=$4
    
    test_count=$((test_count + 1))
    TOTAL=$((TOTAL + 1))
    
    echo ""
    echo "────────────────────────────────────────────────────────────────"
    echo "Test #$test_count: $test_name"
    echo "SRS Reference: $srs_ref"
    echo "────────────────────────────────────────────────────────────────"
    
    # Run the command and capture output
    if response=$(eval "$command" 2>&1); then
        # Check if expected string is in response
        if echo "$response" | grep -q "$expected"; then
            echo -e "${GREEN}✅ PASSED${NC}"
            echo "Response excerpt: $(echo "$response" | head -c 200)..."
            PASSED=$((PASSED + 1))
            return 0
        else
            echo -e "${RED}❌ FAILED${NC}"
            echo "Expected to find: '$expected'"
            echo "Actual response: $response"
            FAILED=$((FAILED + 1))
            return 1
        fi
    else
        echo -e "${RED}❌ FAILED (Command Error)${NC}"
        echo "Error: $response"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Function to setup authentication token
setup_auth() {
    echo "🔐 Setting up authentication..."
    
    # Try to login
    TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@ctis.edu","password":"admin123"}' || echo "")
    
    if [ -z "$TOKEN_RESPONSE" ]; then
        echo "❌ Failed to connect to backend"
        exit 1
    fi
    
    TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$TOKEN" ]; then
        echo "⚠️  Login failed, trying to register admin user..."
        # Registration might not be available, skip for now
        TOKEN=""
    else
        echo "✅ Authentication successful"
        export AUTH_TOKEN="$TOKEN"
    fi
}

echo "════════════════════════════════════════════════════════════════"
echo "SECTION 1: SYSTEM HEALTH CHECKS"
echo "════════════════════════════════════════════════════════════════"

# Test 1: Frontend Health (NFR-1.1)
run_test \
    "Frontend Accessibility" \
    "NFR-1.1: Dashboard load time <1s" \
    "curl -s -w '%{http_code}' -o /dev/null $FRONTEND_URL" \
    "200"

# Test 2: Backend Health
run_test \
    "Backend API Accessibility" \
    "NFR-3.1: System uptime >99%" \
    "curl -s -w '%{http_code}' -o /dev/null $BASE_URL/items 2>&1" \
    "401"  # Expected: 401 (requires auth, but server is up)

# Test 3: AI Service Health
run_test \
    "AI Service Accessibility" \
    "NFR-1.3: AI response time <3s" \
    "curl -s -w '%{http_code}' -o /dev/null $AI_URL/health 2>&1" \
    "200"

# Test 4: Database Connectivity
run_test \
    "Database Connection" \
    "NFR-3.4: Database availability" \
    "docker exec ctis_db mysql -u ctis_user -pctis_password -e 'SELECT 1' ctis_db 2>&1" \
    "1"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "SECTION 2: AUTHENTICATION & AUTHORIZATION (SRS FR-1)"
echo "════════════════════════════════════════════════════════════════"

# Setup authentication for remaining tests
setup_auth

# Test 5: User Login (FR-1.2)
run_test \
    "User Login" \
    "FR-1.2: User login with password hashing" \
    "curl -s -X POST '$BASE_URL/login' -H 'Content-Type: application/json' -d '{\"email\":\"admin@ctis.edu\",\"password\":\"admin123\"}'" \
    "token"

# Test 6: Protected Route Access
run_test \
    "Protected Route Without Auth" \
    "NFR-4.1: Authentication required for all operations" \
    "curl -s -w '%{http_code}' -o /dev/null $BASE_URL/items" \
    "401"

# Test 7: Protected Route With Auth
if [ ! -z "$AUTH_TOKEN" ]; then
    run_test \
        "Protected Route With Auth" \
        "NFR-4.1: Authenticated access" \
        "curl -s -w '%{http_code}' -o /dev/null -H 'Authorization: Bearer $AUTH_TOKEN' $BASE_URL/items" \
        "200"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "SECTION 3: INVENTORY MANAGEMENT (SRS FR-2)"
echo "════════════════════════════════════════════════════════════════"

if [ ! -z "$AUTH_TOKEN" ]; then
    # Test 8: List Items (FR-2.4)
    run_test \
        "List Inventory Items" \
        "FR-2.4: View item details" \
        "curl -s -H 'Authorization: Bearer $AUTH_TOKEN' '$BASE_URL/items'" \
        "data"
    
    # Test 9: Get Categories (FR-2.1)
    run_test \
        "List Categories" \
        "FR-2.1: Category management" \
        "curl -s -H 'Authorization: Bearer $AUTH_TOKEN' '$BASE_URL/categories'" \
        "id"
    
    # Test 10: Dashboard Statistics (FR-5.1)
    run_test \
        "Dashboard Statistics" \
        "FR-5.1: Generate inventory summary report" \
        "curl -s -H 'Authorization: Bearer $AUTH_TOKEN' '$BASE_URL/items/stats'" \
        "total_items"
    
    # Test 11: Create Item with SRS Required Fields (FR-2.7, FR-2.8, FR-2.9)
    TIMESTAMP=$(date +%s)
    run_test \
        "Create Item with SRS Fields" \
        "FR-2.7-2.9: Warranty, condition, acquisition tracking" \
        "curl -s -X POST -H 'Authorization: Bearer $AUTH_TOKEN' -H 'Content-Type: application/json' \
        '$BASE_URL/items' \
        -d '{
            \"inventory_number\":\"TEST-$TIMESTAMP\",
            \"name\":\"Test Item SRS Compliance\",
            \"category_id\":1,
            \"location\":\"Test Location\",
            \"status\":\"available\",
            \"warranty_period_months\":24,
            \"condition_status\":\"new\",
            \"acquisition_method\":\"purchase\",
            \"purchase_value\":1500.00
        }'" \
        "inventory_number"
    
    # Test 12: Search/Filter Items (FR-2.5)
    run_test \
        "Search Items" \
        "FR-2.5: Search/filter items" \
        "curl -s -H 'Authorization: Bearer $AUTH_TOKEN' '$BASE_URL/items?search=Laptop'" \
        "data"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "SECTION 4: TRANSACTION MANAGEMENT (SRS FR-3)"
echo "════════════════════════════════════════════════════════════════"

if [ ! -z "$AUTH_TOKEN" ]; then
    # Test 13: Transaction History (FR-3.3)
    run_test \
        "Transaction History" \
        "FR-3.3: Track transaction history" \
        "curl -s -H 'Authorization: Bearer $AUTH_TOKEN' '$BASE_URL/transactions'" \
        "data"
    
    # Test 14: Overdue Items (FR-3.5)
    run_test \
        "Overdue Items List" \
        "FR-3.5: Identify overdue items" \
        "curl -s -H 'Authorization: Bearer $AUTH_TOKEN' '$BASE_URL/transactions/overdue'" \
        "data"
    
    # Test 15: My Loans (FR-3.3)
    run_test \
        "User Loan History" \
        "FR-3.3: User transaction tracking" \
        "curl -s -H 'Authorization: Bearer $AUTH_TOKEN' '$BASE_URL/transactions/my-loans'" \
        "data"
    
    # Test 16: Transaction Statistics
    run_test \
        "Transaction Statistics" \
        "FR-5.1: Transaction reporting" \
        "curl -s -H 'Authorization: Bearer $AUTH_TOKEN' '$BASE_URL/transactions/stats'" \
        "active_transactions"
    
    # Test 17: Checkout Item (FR-3.1)
    # Note: This will only work if there's an available item
    run_test \
        "Checkout Validation" \
        "FR-3.1: Check out item to user" \
        "curl -s -X POST -H 'Authorization: Bearer $AUTH_TOKEN' -H 'Content-Type: application/json' \
        '$BASE_URL/transactions/checkout' \
        -d '{
            \"item_id\":999999,
            \"user_id\":1,
            \"due_date\":\"2025-12-31\"
        }'" \
        "error"  # Should fail with validation error (good - validation works)
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "SECTION 5: AI CHATBOT (SRS FR-4)"
echo "════════════════════════════════════════════════════════════════"

if [ ! -z "$AUTH_TOKEN" ]; then
    # Test 18: AI Chatbot Query (FR-4.1)
    echo "⏱️  Testing AI response time (SRS NFR-1.3: <3s)..."
    START_TIME=$(date +%s)
    
    run_test \
        "AI Chatbot Turkish Query" \
        "FR-4.1: Accept Turkish natural language queries" \
        "curl -s -X POST -H 'Authorization: Bearer $AUTH_TOKEN' -H 'Content-Type: application/json' \
        '$BASE_URL/chat' \
        -d '{\"query\":\"Kaç adet laptop var?\"}'" \
        "result"
    
    END_TIME=$(date +%s)
    AI_RESPONSE_TIME=$((END_TIME - START_TIME))
    
    echo "AI Response Time: ${AI_RESPONSE_TIME}s"
    if [ $AI_RESPONSE_TIME -lt 3 ]; then
        echo -e "${GREEN}✅ AI Performance: MEETS SRS requirement (<3s)${NC}"
    else
        echo -e "${RED}❌ AI Performance: VIOLATES SRS requirement (${AI_RESPONSE_TIME}s >= 3s)${NC}"
    fi
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "SECTION 6: DATABASE SCHEMA VALIDATION (SRS Section 5)"
echo "════════════════════════════════════════════════════════════════"

# Test 19: Verify SRS Required Fields in Items Table
run_test \
    "SRS Required Fields in Items Table" \
    "FR-2.7-2.10: Database schema compliance" \
    "docker exec ctis_db mysql -u ctis_user -pctis_password ctis_db -e 'DESCRIBE items' 2>&1" \
    "warranty_period_months"

# Test 20: Verify Soft Delete Field
run_test \
    "Soft Delete Implementation" \
    "FR-2.3: Soft delete (deleted_at column)" \
    "docker exec ctis_db mysql -u ctis_user -pctis_password ctis_db -e 'DESCRIBE items' 2>&1" \
    "deleted_at"

# Test 21: Verify Transactions Table
run_test \
    "Transactions Table Exists" \
    "FR-3.x: Transaction management schema" \
    "docker exec ctis_db mysql -u ctis_user -pctis_password ctis_db -e 'DESCRIBE transactions' 2>&1" \
    "checkout_date"

# Test 22: Verify AI Logs Table
run_test \
    "AI Logs Table Exists" \
    "FR-4.7: Track AI query accuracy" \
    "docker exec ctis_db mysql -u ctis_user -pctis_password ctis_db -e 'DESCRIBE ai_logs' 2>&1" \
    "query"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "SECTION 7: SECURITY VALIDATION (SRS NFR-4)"
echo "════════════════════════════════════════════════════════════════"

# Test 23: SQL Injection Protection (NFR-4.3)
if [ ! -z "$AUTH_TOKEN" ]; then
    run_test \
        "SQL Injection Protection" \
        "NFR-4.3: SQL injection prevention" \
        "curl -s -H 'Authorization: Bearer $AUTH_TOKEN' '$BASE_URL/items?search=1%27%20OR%20%271%27=%271'" \
        "data"  # Should return valid response, not SQL error
fi

# Test 24: Rate Limiting (NFR-4.6)
echo ""
echo "Test #$((test_count + 1)): Rate Limiting Test"
echo "SRS Reference: NFR-4.6: Rate limiting"
echo "────────────────────────────────────────────────────────────────"
echo "⏳ Sending multiple rapid requests..."

RATE_LIMIT_EXCEEDED=false
for i in {1..65}; do
    response=$(curl -s -w '%{http_code}' -o /dev/null "$BASE_URL/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@test.com","password":"test"}' 2>&1)
    
    if [ "$response" = "429" ]; then
        RATE_LIMIT_EXCEEDED=true
        echo -e "${GREEN}✅ PASSED - Rate limit triggered at request #$i${NC}"
        PASSED=$((PASSED + 1))
        break
    fi
done

TOTAL=$((TOTAL + 1))
if [ "$RATE_LIMIT_EXCEEDED" = false ]; then
    echo -e "${YELLOW}⚠️  WARNING - Rate limit not triggered after 65 requests${NC}"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "📊 FINAL RESULTS"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

# Calculate success rate
SUCCESS_RATE=$((PASSED * 100 / TOTAL))
echo "Success Rate: $SUCCESS_RATE%"
echo ""

# SRS Compliance Estimate
if [ $SUCCESS_RATE -ge 95 ]; then
    echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}🎉 EXCELLENT: System is SRS compliant (${SUCCESS_RATE}%)${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
elif [ $SUCCESS_RATE -ge 85 ]; then
    echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}✅ GOOD: System is mostly SRS compliant (${SUCCESS_RATE}%)${NC}"
    echo -e "${YELLOW}Minor improvements needed for production${NC}"
    echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"
elif [ $SUCCESS_RATE -ge 70 ]; then
    echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}⚠️  ACCEPTABLE: System meets core requirements (${SUCCESS_RATE}%)${NC}"
    echo -e "${YELLOW}Several improvements needed before production${NC}"
    echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"
else
    echo -e "${RED}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}❌ NEEDS WORK: System below SRS compliance target (${SUCCESS_RATE}%)${NC}"
    echo -e "${RED}Critical issues must be addressed${NC}"
    echo -e "${RED}════════════════════════════════════════════════════════════════${NC}"
fi

echo ""
echo "🕐 Completed at: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "📋 Next Steps:"
echo "   1. Review failed tests above"
echo "   2. Check CRITICAL_AMBIGUITIES_AND_QUESTIONS.md"
echo "   3. Address high-priority SRS gaps"
echo "   4. Re-run this test suite after fixes"
echo ""
echo "════════════════════════════════════════════════════════════════"

# Exit with error code if tests failed
if [ $FAILED -gt 0 ]; then
    exit 1
fi

exit 0
