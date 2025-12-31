#!/bin/bash

# CTIS-SIMS Testing Quick Start Script
# Phase 3 Validation Testing
# Date: December 3, 2025

echo "======================================"
echo "CTIS-SIMS Validation Testing"
echo "Phase 3: Form Request Validation"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
echo -e "${YELLOW}[1/6] Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"
echo ""

# Check if containers are up
echo -e "${YELLOW}[2/6] Checking containers...${NC}"
if ! docker-compose ps | grep -q "Up"; then
    echo -e "${RED}❌ Containers are not running. Starting containers...${NC}"
    docker-compose up -d
    sleep 5
fi
echo -e "${GREEN}✓ Containers are running${NC}"
echo ""

# Clear Laravel caches
echo -e "${YELLOW}[3/6] Clearing Laravel caches...${NC}"
docker-compose exec -T backend php artisan route:clear
docker-compose exec -T backend php artisan cache:clear
docker-compose exec -T backend php artisan config:clear
docker-compose exec -T backend php artisan optimize
echo -e "${GREEN}✓ Caches cleared${NC}"
echo ""

# Check database connection
echo -e "${YELLOW}[4/6] Checking database connection...${NC}"
if docker-compose exec -T backend php artisan migrate:status > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    exit 1
fi
echo ""

# Run migrations
echo -e "${YELLOW}[5/6] Running migrations...${NC}"
docker-compose exec -T backend php artisan migrate --force
echo -e "${GREEN}✓ Migrations complete${NC}"
echo ""

# Run tests
echo -e "${YELLOW}[6/6] Running test suite...${NC}"
echo ""
docker-compose exec -T backend php artisan test

# Check test result
TEST_RESULT=$?
echo ""

if [ $TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}======================================"
    echo "✓ All tests passed!"
    echo "======================================"
    echo ""
    echo "Next steps:"
    echo "1. Review test output above"
    echo "2. Perform manual API testing"
    echo "3. Test integration workflows"
    echo "4. Check application logs"
    echo ""
    echo "See NEXT_STEPS_ACTION_PLAN.md for details"
    echo -e "${NC}"
else
    echo -e "${RED}======================================"
    echo "❌ Some tests failed"
    echo "======================================"
    echo ""
    echo "Please review the errors above and:"
    echo "1. Check the test output"
    echo "2. Review application logs"
    echo "3. Fix failing tests"
    echo "4. Run this script again"
    echo -e "${NC}"
    exit 1
fi

# Optional: Show logs
echo ""
read -p "View application logs? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}Last 50 log entries:${NC}"
    docker-compose exec -T backend tail -n 50 storage/logs/laravel.log
fi

echo ""
echo "Testing script complete!"
