#!/bin/bash
# ════════════════════════════════════════════════════════════════════════════
# SmartEduLearn — VPS Provisioning Script
# Run this ONCE on a fresh Ubuntu 22.04 / 24.04 server as root
# Usage: bash provision-server.sh
# ════════════════════════════════════════════════════════════════════════════

set -e

DOMAIN="YOUR_DOMAIN.com"
APP_DIR="/opt/smartedulear"
APP_USER="smartedu"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log() { echo -e "${GREEN}[$(date +%H:%M:%S)] $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +%H:%M:%S)] ⚠ $1${NC}"; }

log "Starting server provisioning..."

# ── 1. System update ──────────────────────────────────────────────────────────
log "Updating system packages..."
apt-get update -qq && apt-get upgrade -y -qq

# ── 2. Install Docker ─────────────────────────────────────────────────────────
log "Installing Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi
log "Docker $(docker --version)"

# ── 3. Install Docker Compose plugin ─────────────────────────────────────────
log "Installing Docker Compose..."
apt-get install -y docker-compose-plugin
log "Docker Compose $(docker compose version)"

# ── 4. Create app user ────────────────────────────────────────────────────────
log "Creating app user: $APP_USER"
if ! id "$APP_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$APP_USER"
  usermod -aG docker "$APP_USER"
fi

# ── 5. Create app directory ───────────────────────────────────────────────────
log "Creating app directory: $APP_DIR"
mkdir -p "$APP_DIR/nginx/ssl"
mkdir -p "$APP_DIR/database"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# ── 6. Configure UFW firewall ─────────────────────────────────────────────────
log "Configuring firewall..."
apt-get install -y ufw
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
log "Firewall configured (SSH + HTTP + HTTPS only)"

# ── 7. Install Certbot for SSL ────────────────────────────────────────────────
log "Installing Certbot..."
apt-get install -y certbot

# ── 8. Get SSL certificate ────────────────────────────────────────────────────
log "Obtaining SSL certificate for $DOMAIN..."
warn "Make sure your domain DNS A record points to this server's IP first!"
read -p "Press Enter when DNS is ready, or Ctrl+C to skip SSL setup..."

certbot certonly --standalone \
  --non-interactive \
  --agree-tos \
  --email "admin@$DOMAIN" \
  -d "$DOMAIN" \
  -d "www.$DOMAIN" || warn "SSL cert failed — you can run certbot manually later"

# Copy certs to nginx ssl dir
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  cp -rL "/etc/letsencrypt/live/$DOMAIN" "$APP_DIR/nginx/ssl/live/$DOMAIN"
  log "SSL certificates copied to $APP_DIR/nginx/ssl"
fi

# ── 9. Set up auto-renewal cron ───────────────────────────────────────────────
log "Setting up SSL auto-renewal..."
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && docker compose -f $APP_DIR/docker-compose.prod.yml exec frontend nginx -s reload") | crontab -

# ── 10. Install fail2ban ──────────────────────────────────────────────────────
log "Installing fail2ban..."
apt-get install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# ── 11. Swap space (important for small VPS) ──────────────────────────────────
log "Setting up 2GB swap..."
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Server provisioned successfully!${NC}"
echo ""
echo "Next steps:"
echo "  1. Copy your app files to $APP_DIR"
echo "  2. Create $APP_DIR/.env.production with your real secrets"
echo "  3. Update nginx/nginx.prod.conf with your domain"
echo "  4. Run: docker compose -f docker-compose.prod.yml up -d"
echo ""
echo "Server info:"
echo "  App dir:  $APP_DIR"
echo "  App user: $APP_USER"
echo "  Firewall: SSH + HTTP + HTTPS"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
