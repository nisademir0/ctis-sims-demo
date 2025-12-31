#!/bin/bash
# Auto-restore latest backup on container start
# This script checks if database is empty and restores the latest backup if available

set -e

BACKUP_DIR="/var/www/html/storage/app/backups"
DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-3306}"
DB_DATABASE="${DB_DATABASE:-ctis_sims}"
DB_USERNAME="${DB_USERNAME:-ctis_user}"
DB_PASSWORD="${DB_PASSWORD:-ctis_password}"

echo "🔍 Checking database status..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
for i in {1..30}; do
    if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" -e "SELECT 1" "$DB_DATABASE" &> /dev/null; then
        echo "✅ Database connection established"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Database connection timeout"
        exit 1
    fi
    sleep 1
done

# Check if users table exists and has data
USER_COUNT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" -N -e "SELECT COUNT(*) FROM users" "$DB_DATABASE" 2>/dev/null || echo "0")

echo "📊 Current user count: $USER_COUNT"

# If database is empty or has no users, try to restore latest backup
if [ "$USER_COUNT" -eq "0" ]; then
    echo "⚠️  Database is empty. Looking for backups..."
    
    if [ -d "$BACKUP_DIR" ]; then
        # Find the latest backup file
        LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/*.sql 2>/dev/null | head -n 1)
        
        if [ -n "$LATEST_BACKUP" ]; then
            echo "📦 Found backup: $LATEST_BACKUP"
            echo "🔄 Restoring database from backup..."
            
            if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" --skip-ssl "$DB_DATABASE" < "$LATEST_BACKUP"; then
                NEW_USER_COUNT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" --skip-ssl -N -e "SELECT COUNT(*) FROM users" "$DB_DATABASE" 2>/dev/null || echo "0")
                echo "✅ Database restored successfully! Users: $NEW_USER_COUNT"
            else
                echo "❌ Backup restore failed"
                echo "⚙️  Running fresh database seed instead..."
                php artisan db:seed
            fi
        else
            echo "ℹ️  No backup files found in $BACKUP_DIR"
            echo "⚙️  Running database seed..."
            php artisan db:seed
        fi
    else
        echo "ℹ️  Backup directory not found"
        echo "⚙️  Running database seed..."
        php artisan db:seed
    fi
else
    echo "✅ Database already populated (Users: $USER_COUNT)"
fi

echo "🎯 Database initialization complete!"
