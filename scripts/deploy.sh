#!/bin/bash
# ════════════════════════════════════════════════════════════════════════════
# SmartEduLearn — Manual Deploy Script
# Run from your LOCAL machine to deploy to the VPS
# Usage: bash scripts/deploy.sh
# ════════════════════════════════════════════════════════════════════════════

set -e

# ── Config — edit these ───────────────────────────────────────────────────────
SSH_USER="smartedu"
SSH_HOST="YOUR_SERVER_IP"
APP_DIR="/opt/smartedulear"
DOMAIN="YOUR_DOMAIN.com"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[$(date +%H:%M:%S)] $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +%H:%M:%S)] ⚠ $1${NC}"; }
err()  { echo -e "${RED}[$(date +%H:%M:%S)] ✗ $1${NC}"; exit 1; }

# ── Pre-flight checks ─────────────────────────────────────────────────────────
[ ! -f ".env.production" ] && err ".env.production not found. Create it first."
command -v docker &>/dev/null || err "Docker not installed locally"
command -v ssh    &>/dev/null || err "SSH not available"

log "Starting deployment to $SSH_HOST..."

# ── 1. Build images locally ───────────────────────────────────────────────────
log "Building server image..."
docker build -t smartedulear-server:latest ./server

log "Building frontend image..."
docker build \
  --build-arg VITE_API_URL="https://$DOMAIN/api" \
  -t smartedulear-frontend:latest \
  ./frontend

# ── 2. Save and transfer images ───────────────────────────────────────────────
log "Saving Docker images..."
docker save smartedulear-server:latest smartedulear-frontend:latest | gzip > /tmp/sel_images.tar.gz

log "Transferring images to server (this may take a few minutes)..."
scp /tmp/sel_images.tar.gz "$SSH_USER@$SSH_HOST:/tmp/sel_images.tar.gz"
rm /tmp/sel_images.tar.gz

# ── 3. Transfer config files ──────────────────────────────────────────────────
log "Transferring config files..."
scp docker-compose.prod.yml "$SSH_USER@$SSH_HOST:$APP_DIR/"
scp .env.production          "$SSH_USER@$SSH_HOST:$APP_DIR/"
scp -r nginx/                "$SSH_USER@$SSH_HOST:$APP_DIR/"
scp -r database/             "$SSH_USER@$SSH_HOST:$APP_DIR/"

# ── 4. Deploy on server ───────────────────────────────────────────────────────
log "Deploying on server..."
ssh "$SSH_USER@$SSH_HOST" << 'REMOTE'
  set -e
  cd /opt/smartedulear

  echo "Loading Docker images..."
  docker load < /tmp/sel_images.tar.gz
  rm /tmp/sel_images.tar.gz

  echo "Starting services..."
  docker compose -f docker-compose.prod.yml up -d --no-deps server
  sleep 10

  # Wait for server health
  for i in $(seq 1 12); do
    if docker compose -f docker-compose.prod.yml exec -T server wget -qO- http://localhost:3001/health > /dev/null 2>&1; then
      echo "Server healthy ✓"
      break
    fi
    echo "Waiting for server... ($i/12)"
    sleep 5
  done

  docker compose -f docker-compose.prod.yml up -d --no-deps frontend
  docker image prune -f

  echo "Deployment complete ✓"
REMOTE

log "✅ Deployment successful!"
echo ""
echo "  App:    https://$DOMAIN"
echo "  Health: https://$DOMAIN/api/health"
echo ""
echo "  Logs:   ssh $SSH_USER@$SSH_HOST 'docker compose -f $APP_DIR/docker-compose.prod.yml logs -f'"
