# 🚀 SmartEduLearn — Deployment Guide (No Docker Required)

Deploy the full stack for **free** using managed cloud services.

---

## Services You Need (all free)

| Service | What for | Sign up |
|---------|----------|---------|
| [Neon](https://neon.tech) | PostgreSQL database | neon.tech |
| [Upstash](https://upstash.com) | Redis (sessions, rate limiting) | upstash.com |
| [Render](https://render.com) | Node.js backend hosting | render.com |
| [Vercel](https://vercel.com) | React frontend hosting | vercel.com |
| [Cloudinary](https://cloudinary.com) *(optional)* | File/image uploads | cloudinary.com |

---

## Step 1 — PostgreSQL on Neon (5 minutes)

1. Go to [neon.tech](https://neon.tech) → **Sign up free**
2. Create a new project → name it `smartedulear`
3. Copy the **Connection string** — looks like:
   ```
   postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/smartedulear?sslmode=require
   ```
4. Run the schema to create all tables:
   ```bash
   # Install psql if you don't have it, or use Neon's built-in SQL editor
   psql "your-neon-connection-string" -f database/schema.sql
   ```
   Or paste the contents of `database/schema.sql` into the **Neon SQL Editor** and run it.

---

## Step 2 — Redis on Upstash (2 minutes)

1. Go to [upstash.com](https://upstash.com) → **Sign up free**
2. Create a new Redis database → region: closest to your Render region
3. Copy the **Redis URL** — looks like:
   ```
   rediss://default:password@xxx.upstash.io:6379
   ```

---

## Step 3 — Backend on Render (10 minutes)

1. Go to [render.com](https://render.com) → **Sign up with GitHub**
2. Click **New → Web Service**
3. Connect your GitHub repo: `vshivan/Smart_edu`
4. Configure:
   - **Name:** `smartedulear-server`
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

5. Add **Environment Variables** (click "Add Environment Variable" for each):

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | your Neon connection string |
   | `REDIS_URL` | your Upstash Redis URL |
   | `JWT_SECRET` | run `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` and paste result |
   | `FRONTEND_URL` | `https://your-app.vercel.app` (fill after Step 4) |
   | `ALLOWED_ORIGINS` | `https://your-app.vercel.app` |
   | `GEMINI_API_KEY` | your Gemini API key |
   | `GEMINI_MODEL` | `gemini-1.5-flash` |
   | `GOOGLE_CLIENT_ID` | your Google OAuth client ID |
   | `GOOGLE_CLIENT_SECRET` | your Google OAuth client secret |
   | `GOOGLE_CALLBACK_URL` | `https://smartedulear-server.onrender.com/auth/google/callback` |
   | `GMAIL_USER` | your Gmail address *(optional)* |
   | `GMAIL_APP_PASSWORD` | your Gmail app password *(optional)* |

6. Click **Create Web Service** → wait ~3 minutes for first deploy

7. Your backend URL will be: `https://smartedulear-server.onrender.com`

8. **Run the DB migration** — open Render Shell or use Neon SQL editor:
   ```bash
   # In Render Shell (Dashboard → your service → Shell tab)
   node scripts/migrate.js
   ```

---

## Step 4 — Frontend on Vercel (5 minutes)

1. Go to [vercel.com](https://vercel.com) → **Sign up with GitHub**
2. Click **Add New → Project**
3. Import your repo: `vshivan/Smart_edu`
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

5. Add **Environment Variable**:
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://smartedulear-server.onrender.com` |

6. Click **Deploy** → wait ~2 minutes

7. Your frontend URL will be: `https://smartedulear.vercel.app` (or similar)

8. **Go back to Render** and update `FRONTEND_URL` and `ALLOWED_ORIGINS` with your actual Vercel URL.

---

## Step 5 — Google OAuth (update callback URL)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. APIs & Services → Credentials → your OAuth client
3. Add to **Authorized redirect URIs**:
   ```
   https://smartedulear-server.onrender.com/auth/google/callback
   ```
4. Add to **Authorized JavaScript origins**:
   ```
   https://smartedulear.vercel.app
   ```

---

## Step 6 — Verify everything works

```bash
# Health check
curl https://smartedulear-server.onrender.com/health

# Should return:
# {"status":"ok","service":"smartedulear-unified","timestamp":"..."}
```

Then open your Vercel URL and test:
- ✅ Register a new account
- ✅ Login
- ✅ Forgot password (check console logs on Render if Gmail not configured)
- ✅ Google OAuth

---

## Local Development (no Docker)

For local dev you need PostgreSQL and Redis running locally.

### Option A — Use cloud services locally too (easiest)
Just use your Neon + Upstash URLs in `server/.env`. No local DB needed.

### Option B — Install locally on Windows

**PostgreSQL:**
1. Download from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
2. Install with default settings, set a password
3. Run: `psql -U postgres -c "CREATE DATABASE smartedulear;"`
4. Run schema: `psql -U postgres -d smartedulear -f database/schema.sql`
5. `DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/smartedulear`

**Redis (Windows):**
1. Install [Memurai](https://www.memurai.com/) — Redis-compatible for Windows, free
2. It starts automatically as a Windows service
3. `REDIS_URL=redis://localhost:6379`

### Start the server
```bash
cd server
npm install
npm run dev
# → http://localhost:3000
```

### Start the frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Free Tier Limits

| Service | Limit | Notes |
|---------|-------|-------|
| Render | 1 free web service, spins down after 15min inactivity | First request after sleep takes ~30s |
| Neon | 0.5 GB storage, 1 project | More than enough for MVP |
| Upstash | 10,000 Redis commands/day | ~100 active users/day |
| Vercel | Unlimited deployments | No limits for static sites |

**To avoid Render cold starts:** Upgrade to Render Starter ($7/mo) or use a free uptime monitor like [UptimeRobot](https://uptimerobot.com) to ping `/health` every 14 minutes.

---

## Redeploy after code changes

**Backend (Render):** Auto-deploys on every push to `main` ✅

**Frontend (Vercel):** Auto-deploys on every push to `main` ✅

Both are connected to your GitHub repo — just `git push` and they redeploy automatically.
