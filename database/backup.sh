#!/bin/bash
# MySQL Container Backup Script
# This script runs inside the MySQL container (ctis_db)

set -e

TIMESTAMP=$(date +%Y_%m_%d_%H_%M_%S)
BACKUP_DIR="/var/lib/mysql/backups"
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Database credentials from environment
DB_NAME="${MYSQL_DATABASE:-ctis_sims}"
DB_USER="${MYSQL_USER:-ctis_user}"
DB_PASSWORD="${MYSQL_PASSWORD:-secret_password}"

echo "📦 Creating backup: backup_${TIMESTAMP}.sql"

# Create backup
mysqldump -u"$DB_USER" -p"$DB_PASSWORD" \
  --no-tablespaces \
  --single-transaction \
  --quick \
  --lock-tables=false \
  "$DB_NAME" > "$BACKUP_FILE" 2>&1

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup created successfully!"
    echo "📁 File: $(basename "$BACKUP_FILE")"
    echo "📊 Size: $BACKUP_SIZE"
    echo "📍 Path: $BACKUP_FILE"
    
    # Cleanup old backups (keep last 10)
    cd "$BACKUP_DIR"
    ls -t backup_*.sql 2>/dev/null | tail -n +11 | xargs -r rm --
    
    BACKUP_COUNT=$(ls -1 backup_*.sql 2>/dev/null | wc -l)
    echo "📚 Total backups: $BACKUP_COUNT"
else
    echo "❌ Backup failed!"
    exit 1
fi
