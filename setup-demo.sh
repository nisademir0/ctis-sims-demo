#!/bin/bash

echo "🚀 Setting up CTIS-SIMS DEMO..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"

# Stop any existing containers
echo "📦 Stopping existing containers..."
docker compose down -v

# Start services
echo "🐳 Starting Docker services..."
docker compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to initialize (30 seconds)..."
sleep 30

# Run migrations
echo "🗄️  Running database migrations..."
docker compose exec backend php artisan migrate --force

# Seed demo data
echo "🌱 Seeding demo data..."
docker compose exec backend php artisan db:seed --class=DemoSeeder

echo ""
echo "✅ DEMO Setup Complete!"
echo ""
echo "📊 Demo Access:"
echo "   Frontend: http://localhost:5174"
echo "   Backend API: http://localhost:8002/api"
echo "   AI Service: http://localhost:8001"
echo ""
echo "👥 Demo Credentials:"
echo "   Manager:"
echo "     Email: manager@ctis.edu.tr"
echo "     Password: password"
echo ""
echo "   Staff:"
echo "     Email: staff@ctis.edu.tr"
echo "     Password: password"
echo ""
echo "📝 Use Cases:"
echo "   UC1: Create items (Manager login → Create Item)"
echo "   UC9: View dashboard (role-based filtering)"
echo "   UC17: Ask questions (Chatbot icon)"
echo ""
