#!/bin/bash
set -e

echo "🚀 Starting Laravel application..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
WAIT_TIME=0
MAX_WAIT=30

while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    if php artisan db:show >/dev/null 2>&1; then
        echo "✅ Database connection established"
        break
    fi
    echo "   Waiting... ($WAIT_TIME/${MAX_WAIT}s)"
    sleep 2
    WAIT_TIME=$((WAIT_TIME + 2))
done

if [ $WAIT_TIME -ge $MAX_WAIT ]; then
    echo "❌ Database connection timeout. Proceeding anyway..."
fi

# Run migrations
echo "🔄 Running database migrations..."
php artisan migrate --force

# Check if database is empty (no users)
USER_COUNT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" --skip-ssl -N -e "SELECT COUNT(*) FROM users" "$DB_DATABASE" 2>/dev/null || echo "0")

echo "👥 Current user count: $USER_COUNT"

if [ "$USER_COUNT" -eq "0" ]; then
    echo "⚠️  Database is empty. Looking for backups..."
    
    BACKUP_DIR="/var/www/storage/app/backups"
    
    # Check if backup directory exists
    if [ -d "$BACKUP_DIR" ]; then
        echo "✅ Backup directory exists: $BACKUP_DIR"
        
        # Count backup files
        BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/*.sql 2>/dev/null | wc -l)
        echo "📊 Found $BACKUP_COUNT backup file(s)"
        
        # Find the latest backup file
        LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/*.sql 2>/dev/null | head -n 1)
        
        if [ -n "$LATEST_BACKUP" ]; then
            echo "📦 Latest backup: $(basename "$LATEST_BACKUP")"
            BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
            echo "📏 Backup size: $BACKUP_SIZE"
            echo "🔄 Restoring database from backup..."
            
            # Restore backup with better error handling
            RESTORE_OUTPUT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" --skip-ssl "$DB_DATABASE" < "$LATEST_BACKUP" 2>&1)
            RESTORE_EXIT_CODE=$?
            
            if [ $RESTORE_EXIT_CODE -eq 0 ]; then
                # Verify restoration
                NEW_USER_COUNT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" --skip-ssl -N -e "SELECT COUNT(*) FROM users" "$DB_DATABASE" 2>/dev/null || echo "0")
                ITEM_COUNT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" --skip-ssl -N -e "SELECT COUNT(*) FROM items" "$DB_DATABASE" 2>/dev/null || echo "0")
                TRANSACTION_COUNT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" --skip-ssl -N -e "SELECT COUNT(*) FROM transactions" "$DB_DATABASE" 2>/dev/null || echo "0")
                
                if [ "$NEW_USER_COUNT" -gt "0" ]; then
                    echo "✅ Database restored successfully!"
                    echo "   └─ Users: $NEW_USER_COUNT"
                    echo "   └─ Items: $ITEM_COUNT"
                    echo "   └─ Transactions: $TRANSACTION_COUNT"
                else
                    echo "❌ Restore verification failed (user count still 0)"
                    echo "⚙️  Running fresh database seed instead..."
                    php artisan db:seed --force
                fi
            else
                echo "❌ Backup restore failed (exit code: $RESTORE_EXIT_CODE)"
                if [ -n "$RESTORE_OUTPUT" ]; then
                    echo "🔍 Error details:"
                    echo "$RESTORE_OUTPUT" | head -n 5
                fi
                echo "⚙️  Running fresh database seed instead..."
                php artisan db:seed --force
            fi
        else
            echo "❌ No backup files found in directory"
            echo "⚙️  Running database seed..."
            php artisan db:seed --force
        fi
    else
        echo "❌ Backup directory not found: $BACKUP_DIR"
        echo "📁 Creating backup directory..."
        mkdir -p "$BACKUP_DIR"
        echo "⚙️  Running database seed..."
        php artisan db:seed --force
    fi
else
    echo "✅ Database already populated"
fi

# Clear and cache configurations
echo "🔧 Optimizing Laravel..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Create necessary directories
mkdir -p /var/www/storage/logs
touch /var/www/storage/logs/scheduler.log

echo "✅ Application ready!"

# Start services based on CONTAINER_MODE
if [ "${CONTAINER_MODE}" = "fpm" ]; then
    echo "🚀 Starting PHP-FPM..."
    exec php-fpm
else
    echo "🚀 Starting Laravel with Supervisor..."
    echo "   └─ Laravel server will run on port 8000"
    echo "   └─ Scheduler runs every minute in background"
    exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
fi
