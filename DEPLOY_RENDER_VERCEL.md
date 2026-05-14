# Deploy SmartEduMate — Render (Backend) + Vercel (Frontend)

**Total time: ~30 minutes**
**Cost: Free** (Render free tier + Vercel free tier + MongoDB Atlas free tier)

---

## Architecture

```
Browser
  │
  ├── https://your-app.vercel.app  ──→  Vercel (React SPA)
  │                                         │
  │                                         │ VITE_API_URL
  │                                         ▼
  └── API calls ──────────────────→  Render (Node.js)
                                         │
                              ┌──────────┼──────────┐
                              ▼          ▼          ▼
                         Render       Render    MongoDB
                         Postgres     Redis      Atlas
```

---

## PART 1 — MongoDB Atlas (Free Database)

Render has no managed MongoDB, so we use Atlas free tier.

### Step 1.1 — Create Atlas account
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) → **Try Free**
2. Sign up → choose **Free (M0)** cluster → region: **Mumbai (ap-south-1)**
3. Cluster name: `smartedumate`

### Step 1.2 — Create database user
1. **Database Access** → **Add New Database User**
2. Username: `sel_user`
3. Password: generate a strong one (save it!)
4. Role: **Read and write to any database**

### Step 1.3 — Allow network access
1. **Network Access** → **Add IP Address**
2. Click **Allow Access from Anywhere** (`0.0.0.0/0`)
   *(Render IPs are dynamic, so we allow all)*

### Step 1.4 — Get connection string
1. **Clusters** → **Connect** → **Drivers**
2. Copy the connection string — looks like:
   ```
   mongodb+srv://sel_user:<password>@smartedumate.xxxxx.mongodb.net/
   ```
3. Replace `<password>` with your actual password
4. Add database name at end: `...mongodb.net/smartedumate_ai`

**Save this string** — you'll need it in Render.

---

## PART 2 — Render (Backend + Postgres + Redis)

### Step 2.1 — Create Render account
Go to [render.com](https://render.com) → Sign up with GitHub

### Step 2.2 — Connect your GitHub repo
1. Push your code to GitHub if not already:
   ```bash
   cd Smart_edu
   git add .
   git commit -m "feat: add render + vercel deployment config"
   git push origin main
   ```

### Step 2.3 — Deploy using Blueprint (render.yaml)
1. Render Dashboard → **New** → **Blueprint**
2. Connect your GitHub repo
3. Render will detect `render.yaml` automatically
4. It will create:
   - ✅ Web Service: `smartedumate-server`
   - ✅ PostgreSQL: `smartedumate-postgres`
   - ✅ Redis: `smartedumate-redis`
5. Click **Apply**

### Step 2.4 — Set environment variables
After the blueprint deploys, go to your **Web Service** → **Environment**

Set these variables (the ones marked `sync: false` in render.yaml):

| Variable | Value |
|----------|-------|
| `MONGODB_URL` | `mongodb+srv://sel_user:PASSWORD@smartedumate.xxxxx.mongodb.net/smartedumate_ai` |
| `FRONTEND_URL` | `https://your-app.vercel.app` *(set after Vercel deploy)* |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app` *(set after Vercel deploy)* |
| `GEMINI_API_KEY` | Your Gemini API key |
| `GEMINI_MODEL` | `gemini-1.5-flash` |
| `RAZORPAY_KEY_ID` | `rzp_test_...` or `rzp_live_...` |
| `RAZORPAY_KEY_SECRET` | Your Razorpay secret |
| `RAZORPAY_WEBHOOK_SECRET` | Your webhook secret |
| `RESEND_API_KEY` | `re_...` |
| `RESEND_FROM` | `SmartEduMate <noreply@yourdomain.com>` |
| `GOOGLE_CLIENT_ID` | *(optional)* |
| `GOOGLE_CLIENT_SECRET` | *(optional)* |
| `GOOGLE_CALLBACK_URL` | `https://smartedumate-server.onrender.com/auth/google/callback` |
| `PINECONE_API_KEY` | *(optional)* |

### Step 2.5 — Run database migration
After the service is live:
1. Go to your Web Service → **Shell** tab
2. Run:
   ```bash
   node scripts/migrate.js
   ```
   Or it runs automatically on first deploy via the build command.

### Step 2.6 — Verify backend is live
Visit: `https://smartedumate-server.onrender.com/health`

Should return:
```json
{"status":"ok","service":"smartedumate-unified","timestamp":"..."}
```

> ⚠️ **Free tier note**: Render free services spin down after 15 minutes of inactivity.
> First request after sleep takes ~30 seconds. Upgrade to **Starter ($7/mo)** for always-on.

---

## PART 3 — Vercel (Frontend)

### Step 3.1 — Create Vercel account
Go to [vercel.com](https://vercel.com) → Sign up with GitHub

### Step 3.2 — Import project
1. Vercel Dashboard → **Add New Project**
2. Import your GitHub repo
3. **Configure Project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`  ← important!
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3.3 — Set environment variable
In the **Environment Variables** section during import (or after in Settings):

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://smartedumate-server.onrender.com` |

> No trailing slash. This is your Render service URL.

### Step 3.4 — Deploy
Click **Deploy** — Vercel builds and deploys in ~2 minutes.

Your app will be live at: `https://smartedumate-XXXX.vercel.app`

### Step 3.5 — Add custom domain (optional)
1. Vercel → Project → **Settings** → **Domains**
2. Add your domain → follow DNS instructions

---

## PART 4 — Connect Frontend ↔ Backend

### Step 4.1 — Update CORS on Render
Go back to Render → Web Service → Environment → update:

| Variable | Value |
|----------|-------|
| `FRONTEND_URL` | `https://smartedumate-XXXX.vercel.app` |
| `ALLOWED_ORIGINS` | `https://smartedumate-XXXX.vercel.app` |

Click **Save Changes** → Render redeploys automatically.

### Step 4.2 — Update Razorpay webhook URL
Razorpay Dashboard → Settings → Webhooks → Add:
```
https://smartedumate-server.onrender.com/payments/webhook
```

### Step 4.3 — Update Google OAuth callback (if using)
Google Cloud Console → Credentials → OAuth Client → Authorized redirect URIs:
```
https://smartedumate-server.onrender.com/auth/google/callback
```

---

## PART 5 — Create Admin User

After everything is live, create your admin account:

```bash
# Register normally through the app UI, then upgrade via Render Shell:
# Render → Web Service → Shell

node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
pool.query(\"UPDATE users SET role='admin', is_active=true WHERE email='your@email.com'\")
  .then(r => { console.log('Done:', r.rowCount, 'rows'); pool.end(); })
  .catch(e => { console.error(e); pool.end(); });
"
```

---

## Checklist

- [ ] MongoDB Atlas cluster created and connection string saved
- [ ] Render blueprint deployed (server + postgres + redis)
- [ ] All env vars set in Render dashboard
- [ ] `https://smartedumate-server.onrender.com/health` returns `{"status":"ok"}`
- [ ] Vercel project created with `frontend` as root directory
- [ ] `VITE_API_URL` set in Vercel to your Render URL
- [ ] `https://your-app.vercel.app` loads the app
- [ ] Login / Register works
- [ ] `ALLOWED_ORIGINS` updated in Render with Vercel URL
- [ ] Admin user created

---

## Troubleshooting

**CORS error in browser console**
→ Check `ALLOWED_ORIGINS` in Render includes your exact Vercel URL (no trailing slash)

**"Failed to fetch" on API calls**
→ Check `VITE_API_URL` in Vercel is set correctly and has no trailing slash
→ Redeploy Vercel after changing env vars

**Render service sleeping (30s delay)**
→ Upgrade to Starter plan ($7/mo) or use [UptimeRobot](https://uptimerobot.com) free ping every 5 min to keep it awake

**Database migration failed**
→ Render Shell → `node scripts/migrate.js` — check error output
→ Ensure `DATABASE_URL` is set (auto-set by blueprint)

**MongoDB connection failed**
→ Check Atlas Network Access allows `0.0.0.0/0`
→ Check password has no special chars that need URL encoding (use `%40` for `@`)

**Razorpay payment not working**
→ Check `RAZORPAY_KEY_ID` starts with `rzp_test_` for test mode
→ Frontend needs the same key — it's sent from backend in `/payments/order` response
