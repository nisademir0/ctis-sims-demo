#!/bin/bash

# =====================================================
# CTIS-SIMS: Database Performance Index Setup Script
# =====================================================
# Run this script to add all performance indexes to production database
# Estimated time: 2-5 minutes depending on data size
# Safe to run: Indexes are added with IF NOT EXISTS logic

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}CTIS-SIMS Database Index Setup${NC}"
echo -e "${GREEN}========================================${NC}"

# Database connection details
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3307}"
DB_NAME="${DB_NAME:-ctis_sims}"
DB_USER="${DB_USER:-ctis_user}"

echo -e "\n${YELLOW}Database Configuration:${NC}"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"

# Prompt for password
echo -e "\n${YELLOW}Enter database password:${NC}"
read -s DB_PASSWORD

# Test connection
echo -e "\n${YELLOW}Testing database connection...${NC}"
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Connection successful${NC}"
else
    echo -e "${RED}✗ Connection failed. Please check your credentials.${NC}"
    exit 1
fi

# Run Laravel migration
echo -e "\n${YELLOW}Running Laravel migration for indexes...${NC}"
cd backend
php artisan migrate --path=database/migrations/2025_12_03_add_performance_indexes.php

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Indexes created successfully${NC}"
else
    echo -e "${RED}✗ Migration failed${NC}"
    exit 1
fi

# Verify indexes
echo -e "\n${YELLOW}Verifying indexes...${NC}"

INDEXES=(
    "items:idx_items_status"
    "items:idx_items_category_status"
    "items:idx_items_holder"
    "items:idx_items_active"
    "items:idx_items_fulltext_search"
    "transactions:idx_transactions_return_date"
    "transactions:idx_transactions_user_item"
    "users:idx_users_name"
    "item_categories:idx_categories_name"
)

for INDEX_PAIR in "${INDEXES[@]}"; do
    IFS=':' read -r TABLE INDEX <<< "$INDEX_PAIR"
    
    RESULT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
        -sse "SHOW INDEX FROM $TABLE WHERE Key_name = '$INDEX';" 2>/dev/null | wc -l)
    
    if [ "$RESULT" -gt 0 ]; then
        echo -e "  ${GREEN}✓${NC} $TABLE.$INDEX"
    else
        echo -e "  ${RED}✗${NC} $TABLE.$INDEX ${RED}(MISSING!)${NC}"
    fi
done

# Analyze tables to update statistics
echo -e "\n${YELLOW}Analyzing tables to update optimizer statistics...${NC}"
TABLES=("items" "transactions" "users" "item_categories" "vendors")

for TABLE in "${TABLES[@]}"; do
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
        -e "ANALYZE TABLE $TABLE;" > /dev/null 2>&1
    echo -e "  ${GREEN}✓${NC} Analyzed $TABLE"
done

# Show index sizes
echo -e "\n${YELLOW}Index sizes:${NC}"
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" <<SQL
SELECT 
    table_name AS 'Table',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Total Size (MB)',
    ROUND((index_length / 1024 / 1024), 2) AS 'Index Size (MB)',
    ROUND((index_length / (data_length + index_length) * 100), 2) AS 'Index %'
FROM information_schema.TABLES
WHERE table_schema = '$DB_NAME'
AND table_name IN ('items', 'transactions', 'users', 'item_categories', 'vendors')
ORDER BY (data_length + index_length) DESC;
SQL

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Test query performance with EXPLAIN"
echo "2. Monitor slow query log"
echo "3. Consider query optimization based on actual usage patterns"

echo -e "\n${YELLOW}Performance Testing:${NC}"
echo "  Run: mysql -h $DB_HOST -p$DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME"
echo "  Then: EXPLAIN SELECT * FROM items WHERE status = 'available';"
echo "  Expected: 'Using index' or 'Using where; Using index'"

exit 0
