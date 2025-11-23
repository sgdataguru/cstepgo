#!/bin/bash

# Driver Profile Feature - Setup & Testing Script
# Run this after implementation is complete

echo "🚀 Driver Profile Feature - Setup Script"
echo "=========================================="
echo ""

# Step 1: Generate Prisma Client
echo "📦 Step 1: Generating Prisma Client..."
npx prisma generate
if [ $? -eq 0 ]; then
    echo "✅ Prisma client generated successfully"
else
    echo "❌ Error generating Prisma client"
    exit 1
fi
echo ""

# Step 2: Run Database Migration
echo "🗄️  Step 2: Running database migration..."
npx prisma migrate dev --name add_driver_profile_features
if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully"
else
    echo "❌ Error running migration"
    exit 1
fi
echo ""

# Step 3: Check for TypeScript errors
echo "🔍 Step 3: Checking TypeScript errors..."
npx tsc --noEmit
if [ $? -eq 0 ]; then
    echo "✅ No TypeScript errors found"
else
    echo "⚠️  TypeScript errors found (this is normal if migration just ran)"
    echo "   Run 'npx prisma generate' again and restart your editor"
fi
echo ""

# Step 4: Start Dev Server
echo "🌐 Step 4: Starting development server..."
echo "   Server will be available at http://localhost:3002"
echo "   Press Ctrl+C to stop"
echo ""
npm run dev
