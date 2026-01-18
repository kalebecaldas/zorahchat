#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Backend...${NC}"
cd backend
npm install
node index.js &
BACKEND_PID=$!
cd ..

echo -e "${BLUE}Starting Frontend...${NC}"
cd frontend
npm install
npm run dev -- --host &
FRONTEND_PID=$!
cd ..

echo -e "${GREEN}System running!${NC}"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Access locally at: http://localhost:5173"
echo "Access from network at: http://$(ipconfig getifaddr en0 || hostname -I | awk '{print $1}'):5173"
echo ""
echo "Press Ctrl+C to stop"

# Wait for both processes
wait
