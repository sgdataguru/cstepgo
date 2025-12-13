#!/bin/bash

# StepperGO Audit Runner
# Usage: ./scripts/audit/run-audit.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║        StepperGO Application Audit & Validation           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Navigate to project root
cd "$(dirname "$0")/../.."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Load environment variables
if [ -f ".env" ]; then
    echo -e "${GREEN}✓ Loading environment from .env${NC}"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${YELLOW}⚠️  No .env file found. Using defaults.${NC}"
fi

# Check if server is running
echo -e "${CYAN}🔍 Checking server status...${NC}"
if curl -s http://localhost:3000/api/trips > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Server is running${NC}"
    SERVER_RUNNING=true
else
    echo -e "${YELLOW}⚠️  Server not running. Starting server in background...${NC}"
    npm run dev > /dev/null 2>&1 &
    SERVER_PID=$!
    SERVER_RUNNING=false
    
    # Wait for server to start (max 30 seconds)
    echo "   Waiting for server to start..."
    for i in {1..30}; do
        if curl -s http://localhost:3000/api/trips > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Server started successfully${NC}"
            break
        fi
        sleep 1
        echo -n "."
    done
    echo ""
fi

# Run the validation script
echo -e "\n${CYAN}🚀 Running validation script...${NC}\n"
npx tsx scripts/audit/validate-app.ts

# Store exit code
EXIT_CODE=$?

# Clean up server if we started it
if [ "$SERVER_RUNNING" = false ] && [ ! -z "$SERVER_PID" ]; then
    echo -e "\n${YELLOW}Stopping background server...${NC}"
    kill $SERVER_PID 2>/dev/null || true
fi

echo -e "\n${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "📊 Audit reports saved to: scripts/audit/reports/"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"

exit $EXIT_CODE
