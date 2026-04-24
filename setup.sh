#!/bin/bash
# ════════════════════════════════════════════════════════════════════════════
# SmartEduLearn — One-command local setup
# Usage: bash setup.sh
# ════════════════════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}✓ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
err()  { echo -e "${RED}✗ $1${NC}"; exit 1; }

echo -e "${GREEN}🎓 SmartEduLearn Setup${NC}"
echo "════════════════════════════════"

# 1. Node.js check
command -v node &>/dev/null || err "Node.js not found. Install v20+ from https://nodejs.org"
log "Node.js $(node -v)"

# 2. Docker check
if ! command -v docker &>/dev/null; then
  warn "Docker not found — install from https://www.docker.com/products/docker-desktop/"
  DOCKER=false
else
  log "Docker $(docker --version | cut -d' ' -f3)"
  DOCKER=true
fi

# 3. Create .env from example
if [ ! -f .env ]; then
  cp .env.example .env
  warn "Created .env — fill in your keys before starting:"
  echo "   Required: GEMINI_API_KEY"
  echo "   Optional: CASHFREE_APP_ID, CASHFREE_SECRET_KEY, GMAIL_USER, GMAIL_APP_PASSWORD"
else
  log ".env already exists"
fi

# 4. Install dependencies
echo ""
echo "Installing dependencies..."
npm install --prefix server --legacy-peer-deps --silent
log "Server dependencies installed"
npm install --prefix frontend --silent
log "Frontend dependencies installed"

# 5. Start
echo ""
if [ "$DOCKER" = true ]; then
  echo "Starting with Docker..."
  docker compose up -d
  log "All containers started"
  echo ""
  echo -e "${GREEN}════════════════════════════════${NC}"
  echo -e "${GREEN}✅ Ready!${NC}"
  echo ""
  echo "  Frontend → http://localhost:3000"
  echo "  API      → http://localhost:3001"
  echo "  Health   → http://localhost:3001/health"
  echo ""
  echo "  Logs:  docker compose logs -f"
  echo "  Stop:  docker compose down"
  echo -e "${GREEN}════════════════════════════════${NC}"
else
  echo -e "${GREEN}════════════════════════════════${NC}"
  echo -e "${GREEN}✅ Dependencies installed!${NC}"
  echo ""
  echo "Start databases manually, then:"
  echo "  npm run dev:server    (port 3001)"
  echo "  npm run dev:frontend  (port 3000)"
  echo -e "${GREEN}════════════════════════════════${NC}"
fi
