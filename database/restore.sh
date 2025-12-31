#!/bin/bash
# MySQL Container Restore Script
# This script runs inside the MySQL container (ctis_db)

set -e

BACKUP_DIR="/var/lib/mysql/backups"

# Database credentials from environment
DB_NAME="${MYSQL_DATABASE:-ctis_sims}"
DB_USER="${MYSQL_USER:-ctis_user}"
DB_PASSWORD="${MYSQL_PASSWORD:-secret_password}"

# Get backup file (either passed as argument or use latest)
if [ -n "$1" ]; then
    BACKUP_FILE="${BACKUP_DIR}/$1"
else
    # Find latest backup
    BACKUP_FILE=$(ls -t "${BACKUP_DIR}"/backup_*.sql 2>/dev/null | head -n 1)
fi

if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ No backup file found!"
    exit 1
fi

echo "📦 Restoring from: $(basename "$BACKUP_FILE")"
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "📏 Backup size: $BACKUP_SIZE"

# Restore backup
mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$BACKUP_FILE" 2>&1

if [ $? -eq 0 ]; then
    # Verify restoration
    USER_COUNT=$(mysql -u"$DB_USER" -p"$DB_PASSWORD" -N -e "SELECT COUNT(*) FROM users" "$DB_NAME" 2>/dev/null || echo "0")
    ITEM_COUNT=$(mysql -u"$DB_USER" -p"$DB_PASSWORD" -N -e "SELECT COUNT(*) FROM items" "$DB_NAME" 2>/dev/null || echo "0")
    
    echo "✅ Database restored successfully!"
    echo "   └─ Users: $USER_COUNT"
    echo "   └─ Items: $ITEM_COUNT"
else
    echo "❌ Restore failed!"
    exit 1
fi
