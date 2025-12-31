-- =====================================================
-- CTIS-SIMS: Database Security Hardening
-- Create Read-Only User for AI Service
-- =====================================================
-- Date: December 3, 2025
-- Purpose: Defense in depth - even if SQL validator bypassed, 
--          AI cannot modify data

-- 1. Create read-only user for AI service
CREATE USER IF NOT EXISTS 'ai_readonly'@'%' 
IDENTIFIED BY 'AI_RO_P@ssw0rd_CHANGE_ME';

-- 2. Grant SELECT permissions ONLY on specific tables/views
GRANT SELECT ON ctis_sims.view_general_inventory TO 'ai_readonly'@'%';
GRANT SELECT ON ctis_sims.items TO 'ai_readonly'@'%';
GRANT SELECT ON ctis_sims.users TO 'ai_readonly'@'%';
GRANT SELECT ON ctis_sims.item_categories TO 'ai_readonly'@'%';
GRANT SELECT ON ctis_sims.transactions TO 'ai_readonly'@'%';
GRANT SELECT ON ctis_sims.vendors TO 'ai_readonly'@'%';

-- 3. Explicitly DENY any write operations
REVOKE INSERT, UPDATE, DELETE, DROP, ALTER, CREATE ON ctis_sims.* FROM 'ai_readonly'@'%';

-- 4. Apply changes
FLUSH PRIVILEGES;

-- 5. Verify permissions (run this to check)
SHOW GRANTS FOR 'ai_readonly'@'%';

-- =====================================================
-- VERIFICATION TESTS
-- =====================================================

-- Test 1: SELECT should work
-- Connect as ai_readonly and run:
-- SELECT * FROM view_general_inventory LIMIT 5;
-- Expected: Success

-- Test 2: INSERT should fail
-- INSERT INTO items (name) VALUES ('test');
-- Expected: ERROR 1142 (42000): INSERT command denied

-- Test 3: DROP should fail
-- DROP TABLE items;
-- Expected: ERROR 1142 (42000): DROP command denied

-- Test 4: DELETE should fail
-- DELETE FROM items WHERE id = 1;
-- Expected: ERROR 1142 (42000): DELETE command denied

-- =====================================================
-- DOCKER ENVIRONMENT SETUP
-- =====================================================

-- After running this script, update your docker-compose.yml:

-- ai-service:
--   environment:
--     - DB_HOST=db
--     - DB_USER=ai_readonly
--     - DB_PASSWORD=AI_RO_P@ssw0rd_CHANGE_ME  # CHANGE THIS!
--     - DB_NAME=ctis_sims

-- IMPORTANT: Generate a strong password using:
-- openssl rand -base64 32
-- And replace AI_RO_P@ssw0rd_CHANGE_ME everywhere

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================

-- DROP USER IF EXISTS 'ai_readonly'@'%';
-- FLUSH PRIVILEGES;
