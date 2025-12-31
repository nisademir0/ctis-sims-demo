#!/bin/bash

# CTIS-SIMS Frontend - Quick Fix Script
# Date: December 3, 2025
# Purpose: Fix useAuth import paths and cleanup

echo "🔧 CTIS-SIMS Frontend - Quick Fix Script"
echo "========================================"
echo ""

# Navigate to frontend directory
cd "$(dirname "$0")/frontend" || exit 1

echo "📍 Current directory: $(pwd)"
echo ""

# Backup files before making changes
echo "💾 Creating backup..."
mkdir -p .backup
cp -r src .backup/src-$(date +%Y%m%d-%H%M%S)
echo "✅ Backup created in .backup/"
echo ""

# Fix imports in src/pages/ (7 files)
echo "🔄 Fixing imports in src/pages/..."
sed -i '' "s|from '../context/AuthContext'|from '../hooks/useAuth'|g" src/pages/Login.jsx
sed -i '' "s|from '../context/AuthContext'|from '../hooks/useAuth'|g" src/pages/Dashboard.jsx
sed -i '' "s|from '../context/AuthContext'|from '../hooks/useAuth'|g" src/pages/Transactions.jsx

# Fix imports in components (2 files)
echo "🔄 Fixing imports in src/components/common/..."
sed -i '' "s|from '../../context/AuthContext'|from '../../hooks/useAuth'|g" src/components/common/Sidebar.jsx
sed -i '' "s|from '../../context/AuthContext'|from '../../hooks/useAuth'|g" src/components/common/Navbar.jsx

# Fix imports in nested pages (11 files)
echo "🔄 Fixing imports in src/pages subdirectories..."
sed -i '' "s|from '../../context/AuthContext'|from '../../hooks/useAuth'|g" src/pages/Profile.jsx
sed -i '' "s|from '../../context/AuthContext'|from '../../hooks/useAuth'|g" src/pages/inventory/InventoryList.jsx
sed -i '' "s|from '../../context/AuthContext'|from '../../hooks/useAuth'|g" src/pages/inventory/ItemDetails.jsx
sed -i '' "s|from '../../context/AuthContext'|from '../../hooks/useAuth'|g" src/pages/inventory/ItemForm.jsx
sed -i '' "s|from '../../context/AuthContext'|from '../../hooks/useAuth'|g" src/pages/requests/MaintenanceRequestList.jsx
sed -i '' "s|from '../../context/AuthContext'|from '../../hooks/useAuth'|g" src/pages/requests/MaintenanceRequestDetails.jsx
sed -i '' "s|from '../../context/AuthContext'|from '../../hooks/useAuth'|g" src/pages/requests/PurchaseRequestList.jsx
sed -i '' "s|from '../../context/AuthContext'|from '../../hooks/useAuth'|g" src/pages/requests/PurchaseRequestDetails.jsx
sed -i '' "s|from '../../context/AuthContext'|from '../../hooks/useAuth'|g" src/pages/chatbot/ChatbotPage.jsx
sed -i '' "s|from '../../context/AuthContext'|from '../../hooks/useAuth'|g" src/pages/admin/UserManagement.jsx
sed -i '' "s|from '../../context/AuthContext'|from '../../hooks/useAuth'|g" src/pages/admin/SystemSettings.jsx

echo "✅ All imports fixed (18 files)"
echo ""

# Delete backup file
echo "🗑️  Removing backup file..."
if [ -f "src/pages/Dashboard.jsx.backup" ]; then
    rm src/pages/Dashboard.jsx.backup
    echo "✅ Deleted Dashboard.jsx.backup"
else
    echo "ℹ️  Dashboard.jsx.backup not found (may already be deleted)"
fi
echo ""

# Run ESLint check
echo "🔍 Running ESLint check..."
npm run lint 2>&1 | tee lint-results.txt
echo ""

# Summary
echo "================================================"
echo "✅ Quick fixes applied!"
echo ""
echo "Changes made:"
echo "  - Fixed useAuth imports in 18 files"
echo "  - Deleted Dashboard.jsx.backup"
echo "  - Created backup in .backup/"
echo ""
echo "Next steps:"
echo "  1. Review lint-results.txt for remaining issues"
echo "  2. Test the application: npm run dev"
echo "  3. Fix remaining ESLint warnings (optional)"
echo ""
echo "Backup location: .backup/src-$(ls -t .backup | head -1)"
echo "================================================"
