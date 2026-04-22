#!/bin/bash
# ════════════════════════════════════════════════════════════════════════════
# SmartEduLearn — One-command setup script
# Usage: bash setup.sh
# ════════════════════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🎓 SmartEduLearn Setup${NC}"
echo "================================"

# 1. Check Node.js
if ! command -v node &> /dev/null; then
  echo -e "${RED}✗ Node.js not found. Install from https://nodejs.org (v20+)${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# 2. Check Docker
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}⚠ Docker not found. You'll need to run databases manually.${NC}"
  echo "  Install Docker Desktop: https://www.docker.com/products/docker-desktop/"
  DOCKER_AVAILABLE=false
else
  echo -e "${GREEN}✓ Docker $(docker --version | cut -d' ' -f3)${NC}"
  DOCKER_AVAILABLE=true
fi

# 3. Copy .env if not exists
if [ ! -f infrastructure/.env ]; then
  cp infrastructure/.env.example infrastructure/.env
  echo -e "${YELLOW}⚠ Created infrastructure/.env — FILL IN YOUR API KEYS before starting!${NC}"
  echo "  Required: GEMINI_API_KEY, JWT_SECRET, GOOGLE_CLIENT_ID/SECRET"
else
  echo -e "${GREEN}✓ infrastructure/.env already exists${NC}"
fi

# 4. Install frontend dependencies
echo ""
echo "Installing frontend dependencies..."
cd frontend && npm install && cd ..
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# 5. Install backend dependencies
echo ""
echo "Installing backend service dependencies..."
for service in api-gateway auth-service course-service ai-service quiz-service gamification-service tutor-service payment-service notification-service admin-service; do
  if [ -f "backend/$service/package.json" ]; then
    cd "backend/$service" && npm install && cd ../..
    echo -e "${GREEN}✓ $service${NC}"
  fi
done

# 6. Start databases
if [ "$DOCKER_AVAILABLE" = true ]; then
  echo ""
  echo "Starting databases (PostgreSQL, MongoDB, Redis)..."
  cd infrastructure && docker-compose up -d postgres mongodb redis && cd ..
  echo -e "${GREEN}✓ Databases started${NC}"
  echo "  Waiting 5s for databases to be ready..."
  sleep 5
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Edit infrastructure/.env with your API keys"
echo "  2. Start backend:  cd backend/auth-service && npm run dev"
echo "     (repeat for each service, or use: npm run docker:up)"
echo "  3. Start frontend: npm run dev:frontend"
echo "  4. Open: http://localhost:5173"
echo -e "${GREEN}════════════════════════════════════════${NC}"
