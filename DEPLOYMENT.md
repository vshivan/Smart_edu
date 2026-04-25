# SmartEduLearn — Deployment Guide

## Overview

| What | Where |
|------|-------|
| Frontend | Nginx (port 80/443) → serves React SPA |
| Backend  | Node.js (port 3001, internal only) |
| Databases | Postgres + MongoDB + Redis (internal only) |
| SSL | Let's Encrypt via Certbot (auto-renews) |
| CI/CD | GitHub Actions → SSH deploy on push to `main` |

---

## Option A — Automated (GitHub Actions + VPS)

### Step 1 — Get a VPS

Recommended providers (cheapest to most):
- **Hetzner** — CX22 (2 vCPU, 4GB RAM) ~€4/month ← best value
- **DigitalOcean** — Basic Droplet (2 vCPU, 2GB RAM) ~$12/month
- **AWS Lightsail** — $5/month (1GB RAM — add swap)
- **Vultr** — $6/month

Minimum specs: **2 vCPU, 2GB RAM, 20GB SSD**, Ubuntu 22.04 or 24.04

---

### Step 2 — Point your domain to the VPS

In your domain registrar (GoDaddy / Namecheap / Cloudflare):

```
A record:   YOUR_DOMAIN.com     → YOUR_SERVER_IP
A record:   www.YOUR_DOMAIN.com → YOUR_SERVER_IP
```

Wait 5–30 minutes for DNS to propagate.

---

### Step 3 — Provision the server

SSH into your fresh VPS and run:

```bash
ssh root@YOUR_SERVER_IP
curl -fsSL https://raw.githubusercontent.com/YOUR_GITHUB/smartedulear/main/scripts/provision-server.sh | bash
```

Or copy the script manually:
```bash
scp scripts/provision-server.sh root@YOUR_SERVER_IP:/tmp/
ssh root@YOUR_SERVER_IP "bash /tmp/provision-server.sh"
```

This installs Docker, configures the firewall, gets SSL certs, and sets up the app directory.

---

### Step 4 — Configure GitHub Secrets

Go to your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**

Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token (Hub → Account Settings → Security) |
| `SSH_HOST` | Your VPS IP address |
| `SSH_USER` | `smartedu` (created by provision script) |
| `SSH_PRIVATE_KEY` | Your SSH private key (`cat ~/.ssh/id_rsa`) |
| `PRODUCTION_DOMAIN` | `yourdomain.com` |
| `PRODUCTION_ENV` | Full contents of your `.env.production` file |

---

### Step 5 — Update config files with your domain

**`nginx/nginx.prod.conf`** — replace `YOUR_DOMAIN.com`:
```nginx
server_name yourdomain.com www.yourdomain.com;
ssl_certificate /etc/nginx/ssl/live/yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/nginx/ssl/live/yourdomain.com/privkey.pem;
```

**`.env.production`** — fill in all values:
```env
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
POSTGRES_PASSWORD=use_a_strong_random_password
REDIS_PASSWORD=use_a_strong_random_password
JWT_SECRET=<128-char hex — run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RESEND_API_KEY=re_...
GEMINI_API_KEY=...
```

---

### Step 6 — Deploy

Push to `main` branch — GitHub Actions will:
1. Run all 100 tests
2. Build Docker images and push to Docker Hub
3. SSH into your VPS and do a rolling restart

```bash
git add .
git commit -m "deploy: initial production deployment"
git push origin main
```

Watch it at: **GitHub → Actions tab**

---

## Option B — Manual Deploy (no CI/CD)

If you don't want GitHub Actions, deploy manually:

```bash
# 1. Edit the config at the top of the script
nano scripts/deploy.sh

# 2. Run it
bash scripts/deploy.sh
```

---

## Option C — Deploy on a Single Machine (simplest)

If you just want it running on one server without CI/CD:

```bash
# On your server
git clone https://github.com/YOUR_GITHUB/smartedulear.git
cd smartedulear

# Copy and fill in production env
cp .env.production.example .env.production
nano .env.production

# Start everything
docker compose -f docker-compose.prod.yml up -d

# Check logs
docker compose -f docker-compose.prod.yml logs -f
```

---

## Post-Deployment Checklist

- [ ] `https://yourdomain.com` loads the app
- [ ] `https://yourdomain.com/api/health` returns `{"status":"ok"}`
- [ ] Login works
- [ ] AI course generation works (Gemini key valid)
- [ ] Razorpay test payment works
- [ ] Email notification received (Resend key valid)
- [ ] SSL certificate is valid (green padlock)
- [ ] Admin panel accessible at `/admin`

---

## Useful Commands (on the server)

```bash
# View all container status
docker compose -f /opt/smartedulear/docker-compose.prod.yml ps

# Follow logs
docker compose -f /opt/smartedulear/docker-compose.prod.yml logs -f

# Follow only server logs
docker compose -f /opt/smartedulear/docker-compose.prod.yml logs -f server

# Restart a single service
docker compose -f /opt/smartedulear/docker-compose.prod.yml restart server

# Stop everything
docker compose -f /opt/smartedulear/docker-compose.prod.yml down

# Database backup
docker exec sel_postgres pg_dump -U sel_user smartedulear > backup_$(date +%Y%m%d).sql

# Check disk usage
docker system df
```

---

## Monitoring (optional but recommended)

For production monitoring, add **Uptime Kuma** (free, self-hosted):

```yaml
# Add to docker-compose.prod.yml
  uptime-kuma:
    image: louislam/uptime-kuma:1
    container_name: sel_uptime
    ports:
      - "3002:3001"
    volumes:
      - uptime_data:/app/data
    restart: always
```

Then visit `http://YOUR_SERVER_IP:3002` and add monitors for:
- `https://yourdomain.com` (frontend)
- `https://yourdomain.com/api/health` (backend)

---

## Scaling (when you need it)

The current setup runs everything on one server. When you need to scale:

1. **Database** → Move Postgres to [Supabase](https://supabase.com) (free tier), MongoDB to [Atlas](https://mongodb.com/atlas) (free tier)
2. **Redis** → Move to [Upstash](https://upstash.com) (free tier, serverless)
3. **Backend** → Deploy to [Railway](https://railway.app) or [Render](https://render.com)
4. **Frontend** → Deploy to [Vercel](https://vercel.com) or [Netlify](https://netlify.com) (free)
5. **Files** → AWS S3 (already configured in `.env`)
