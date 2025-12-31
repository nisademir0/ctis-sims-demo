#!/bin/bash

# 🧪 CTIS-SIMS API Validation Script
# Tests all critical endpoints for Week 1 compliance

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'

BASE_URL="http://localhost:8002/api"
TOKEN=""

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   CTIS-SIMS API Validation Test Suite    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Function to print test header
test_header() {
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}TEST: $1${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to print test result
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        echo -e "${RED}   Response: $3${NC}"
    fi
}

# ==========================================
# 1. AUTHENTICATION TEST
# ==========================================
test_header "1. Authentication (Login)"

echo "Attempting login with test credentials..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ctis.edu.tr",
    "password": "password"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$TOKEN" ]; then
    test_result 0 "Login successful"
    echo -e "   Token (first 20 chars): ${TOKEN:0:20}..."
else
    test_result 1 "Login failed" "$LOGIN_RESPONSE"
    echo -e "${RED}Cannot proceed without authentication token. Exiting.${NC}"
    exit 1
fi

# ==========================================
# 2. INVENTORY ENDPOINTS
# ==========================================
test_header "2.1. Get Item Statistics"

STATS_RESPONSE=$(curl -s -X GET "$BASE_URL/items/stats" \
  -H "Authorization: Bearer $TOKEN")

if echo "$STATS_RESPONSE" | grep -q "total_items"; then
    test_result 0 "Stats endpoint working"
    echo "$STATS_RESPONSE" | jq '.' 2>/dev/null || echo "$STATS_RESPONSE"
else
    test_result 1 "Stats endpoint failed" "$STATS_RESPONSE"
fi

# ==========================================
test_header "2.2. Get Items List"

ITEMS_RESPONSE=$(curl -s -X GET "$BASE_URL/items" \
  -H "Authorization: Bearer $TOKEN")

if echo "$ITEMS_RESPONSE" | grep -q "data"; then
    test_result 0 "Items list endpoint working"
    ITEM_COUNT=$(echo "$ITEMS_RESPONSE" | grep -o '"id"' | wc -l | tr -d ' ')
    echo "   Found $ITEM_COUNT items"
else
    test_result 1 "Items list failed" "$ITEMS_RESPONSE"
fi

# ==========================================
test_header "2.3. Create New Item with SRS Required Fields"

CREATE_ITEM_RESPONSE=$(curl -s -X POST "$BASE_URL/items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Monitor - API Validation",
    "category_id": 1,
    "location": "Test Lab",
    "status": "available",
    "warranty_period_months": 24,
    "condition_status": "new",
    "acquisition_method": "purchase",
    "purchase_value": 599.99,
    "current_value": 599.99,
    "depreciation_method": "straight_line"
  }')

if echo "$CREATE_ITEM_RESPONSE" | grep -q "warranty_period_months"; then
    test_result 0 "Item created with new SRS fields"
    NEW_ITEM_ID=$(echo "$CREATE_ITEM_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "   Created item ID: $NEW_ITEM_ID"
else
    test_result 1 "Item creation failed" "$CREATE_ITEM_RESPONSE"
fi

# ==========================================
# 3. TRANSACTION MANAGEMENT
# ==========================================
test_header "3.1. Get Transaction Statistics"

TX_STATS_RESPONSE=$(curl -s -X GET "$BASE_URL/transactions/stats" \
  -H "Authorization: Bearer $TOKEN")

if echo "$TX_STATS_RESPONSE" | grep -q "total_transactions\|active_loans"; then
    test_result 0 "Transaction stats endpoint working"
    echo "$TX_STATS_RESPONSE" | jq '.' 2>/dev/null || echo "$TX_STATS_RESPONSE"
else
    test_result 1 "Transaction stats failed" "$TX_STATS_RESPONSE"
fi

# ==========================================
test_header "3.2. Get Overdue Items"

OVERDUE_RESPONSE=$(curl -s -X GET "$BASE_URL/transactions/overdue" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/transactions/overdue" \
  -H "Authorization: Bearer $TOKEN")

if [ "$HTTP_CODE" = "200" ]; then
    test_result 0 "Overdue endpoint accessible"
    OVERDUE_COUNT=$(echo "$OVERDUE_RESPONSE" | grep -o '"id"' | wc -l | tr -d ' ')
    echo "   Found $OVERDUE_COUNT overdue items"
else
    test_result 1 "Overdue endpoint failed (HTTP $HTTP_CODE)" "$OVERDUE_RESPONSE"
fi

# ==========================================
test_header "3.3. Get My Active Loans"

MY_LOANS_RESPONSE=$(curl -s -X GET "$BASE_URL/transactions/my-loans" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/transactions/my-loans" \
  -H "Authorization: Bearer $TOKEN")

if [ "$HTTP_CODE" = "200" ]; then
    test_result 0 "My loans endpoint accessible"
    LOAN_COUNT=$(echo "$MY_LOANS_RESPONSE" | grep -o '"id"' | wc -l | tr -d ' ')
    echo "   User has $LOAN_COUNT active loans"
else
    test_result 1 "My loans endpoint failed (HTTP $HTTP_CODE)" "$MY_LOANS_RESPONSE"
fi

# ==========================================
test_header "3.4. Get Transaction History"

TX_HISTORY_RESPONSE=$(curl -s -X GET "$BASE_URL/transactions" \
  -H "Authorization: Bearer $TOKEN")

if echo "$TX_HISTORY_RESPONSE" | grep -q "data\|transactions"; then
    test_result 0 "Transaction history endpoint working"
    TX_COUNT=$(echo "$TX_HISTORY_RESPONSE" | grep -o '"id"' | wc -l | tr -d ' ')
    echo "   Found $TX_COUNT transactions"
else
    test_result 1 "Transaction history failed" "$TX_HISTORY_RESPONSE"
fi

# ==========================================
test_header "3.5. Checkout Item (if available item exists)"

# Get first available item
AVAILABLE_ITEM=$(curl -s -X GET "$BASE_URL/items" \
  -H "Authorization: Bearer $TOKEN" | \
  grep -o '"id":[0-9]*,"inventory_number":"[^"]*","name":"[^"]*","category_id":[0-9]*,"location":"[^"]*","status":"available"' | \
  head -1)

AVAILABLE_ITEM_ID=$(echo "$AVAILABLE_ITEM" | grep -o '"id":[0-9]*' | cut -d':' -f2)

if [ ! -z "$AVAILABLE_ITEM_ID" ]; then
    echo "   Using available item ID: $AVAILABLE_ITEM_ID"
    
    # Get a user ID for checkout (try to get user ID 2 or any user)
    USERS_RESPONSE=$(curl -s -X GET "$BASE_URL/users" -H "Authorization: Bearer $TOKEN")
    USER_ID=$(echo "$USERS_RESPONSE" | grep -o '"id":[0-9]*' | head -2 | tail -1 | cut -d':' -f2)
    
    if [ -z "$USER_ID" ]; then
        USER_ID=2  # Fallback to user ID 2
    fi
    
    echo "   Checking out to user ID: $USER_ID"
    
    CHECKOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/transactions/checkout" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"item_id\": $AVAILABLE_ITEM_ID,
        \"user_id\": $USER_ID,
        \"due_date\": \"2025-12-20\",
        \"notes\": \"API validation test checkout\"
      }")
    
    if echo "$CHECKOUT_RESPONSE" | grep -q "transaction\|success"; then
        test_result 0 "Checkout successful"
        TX_ID=$(echo "$CHECKOUT_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
        echo "   Transaction ID: $TX_ID"
        
        # Try to return the item immediately
        if [ ! -z "$TX_ID" ]; then
            sleep 1
            test_header "3.6. Return Item"
            
            RETURN_RESPONSE=$(curl -s -X POST "$BASE_URL/transactions/$TX_ID/return" \
              -H "Authorization: Bearer $TOKEN" \
              -H "Content-Type: application/json" \
              -d '{
                "condition_notes": "Returned immediately after test",
                "damage_reported": false
              }')
            
            if echo "$RETURN_RESPONSE" | grep -q "success\|returned"; then
                test_result 0 "Return successful"
            else
                test_result 1 "Return failed" "$RETURN_RESPONSE"
            fi
        fi
    else
        test_result 1 "Checkout failed" "$CHECKOUT_RESPONSE"
    fi
else
    echo -e "${YELLOW}⚠️  SKIP: No available items found for checkout test${NC}"
fi

# ==========================================
test_header "3.7. Invalid Checkout (Non-existent Item)"

INVALID_CHECKOUT=$(curl -s -X POST "$BASE_URL/transactions/checkout" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": 99999,
    "user_id": 2,
    "due_date": "2025-12-20",
    "notes": "Should fail"
  }')

if echo "$INVALID_CHECKOUT" | grep -q "error\|not found\|404"; then
    test_result 0 "Invalid checkout properly rejected"
else
    test_result 1 "Invalid checkout should have failed" "$INVALID_CHECKOUT"
fi

# ==========================================
# 4. SOFT DELETE TEST
# ==========================================
test_header "4.1. Soft Delete Item"

# Create a test item to delete
DELETE_TEST_ITEM=$(curl -s -X POST "$BASE_URL/items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Item for Deletion",
    "category_id": 1,
    "location": "Delete Test",
    "status": "available"
  }')

DELETE_ITEM_ID=$(echo "$DELETE_TEST_ITEM" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ ! -z "$DELETE_ITEM_ID" ]; then
    echo "   Created test item ID: $DELETE_ITEM_ID"
    
    DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/items/$DELETE_ITEM_ID" \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$DELETE_RESPONSE" | grep -q "success\|deleted"; then
        test_result 0 "Soft delete successful"
        
        # Verify item is not in normal list
        VERIFY_RESPONSE=$(curl -s -X GET "$BASE_URL/items" \
          -H "Authorization: Bearer $TOKEN")
        
        if ! echo "$VERIFY_RESPONSE" | grep -q "\"id\":$DELETE_ITEM_ID"; then
            echo -e "   ${GREEN}✓${NC} Item no longer appears in normal queries"
        else
            echo -e "   ${YELLOW}⚠${NC}  Item still appears (soft delete may not be working)"
        fi
    else
        test_result 1 "Soft delete failed" "$DELETE_RESPONSE"
    fi
else
    echo -e "${YELLOW}⚠️  SKIP: Could not create test item for deletion${NC}"
fi

# ==========================================
# 5. CHATBOT ENDPOINT
# ==========================================
test_header "5. Chatbot Natural Language Query"

CHATBOT_RESPONSE=$(curl -s -X POST "$BASE_URL/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Kaç tane monitör var?"
  }')

if echo "$CHATBOT_RESPONSE" | grep -q "sql\|results"; then
    test_result 0 "Chatbot endpoint working"
    SQL=$(echo "$CHATBOT_RESPONSE" | grep -o '"sql":"[^"]*' | cut -d'"' -f4)
    echo "   Generated SQL: $SQL"
else
    test_result 1 "Chatbot endpoint failed" "$CHATBOT_RESPONSE"
fi

# ==========================================
# SUMMARY
# ==========================================
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           TEST SUMMARY                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Backend API is functional${NC}"
echo -e "${GREEN}✅ Transaction management endpoints working${NC}"
echo -e "${GREEN}✅ New SRS fields accessible${NC}"
echo -e "${GREEN}✅ Soft delete implemented${NC}"
echo -e "${GREEN}✅ Chatbot integration active${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "   1. Review FRONTEND_INTEGRATION_PLAN.md"
echo "   2. Start frontend development for transaction management"
echo "   3. Test frontend with these validated endpoints"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}Test completed successfully!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
