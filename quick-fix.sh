#!/bin/bash

# Quick Fix Script for StepperGO Image & Itinerary Issues
# Run this to apply all fixes at once

echo "🔧 StepperGO - Quick Fix Script"
echo "================================"
echo ""

# Step 1: Stop any running servers
echo "📌 Step 1: Stopping any running servers..."
pkill -f "next dev" 2>/dev/null
sleep 2
echo "✅ Servers stopped"
echo ""

# Step 2: Reset database
echo "📌 Step 2: Resetting database..."
npx prisma migrate reset --force
echo "✅ Database reset"
echo ""

# Step 3: Seed database
echo "📌 Step 3: Seeding database with images..."
npx tsx prisma/seed.ts
echo "✅ Database seeded (2 trips with images)"
echo ""

# Step 4: Add more trips
echo "📌 Step 4: Adding 6 more trips with images..."
npx tsx prisma/add-more-trips.ts
echo "✅ Added 6 more trips"
echo ""

# Step 5: Start development server
echo "📌 Step 5: Starting development server..."
echo ""
echo "🚀 Server starting at http://localhost:3000"
echo "📖 Open http://localhost:3000/trips to see the fixes!"
echo ""
echo "Press Ctrl+C to stop the server when done testing."
echo ""

npm run dev
