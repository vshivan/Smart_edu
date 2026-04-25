# Render Environment Variables — Required Setup

Go to Render → your service → Environment → add/update ALL of these:

## Required (app won't work without these)

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | your Neon connection string |
| `REDIS_URL` | your Upstash Redis URL |
| `JWT_SECRET` | long random string (64+ chars) |
| `GEMINI_API_KEY` | your Gemini API key |
| `GEMINI_MODEL` | `gemini-1.5-flash` |

## Frontend URL (critical for OAuth redirect)

| Key | Value |
|-----|-------|
| `FRONTEND_URL` | `https://smart-edu-seven.vercel.app` |
| `ALLOWED_ORIGINS` | `https://smart-edu-seven.vercel.app` |
| `RENDER_EXTERNAL_URL` | `https://smart-edu-ed5y.onrender.com` |

## Google OAuth

| Key | Value |
|-----|-------|
| `GOOGLE_CLIENT_ID` | your Google client ID |
| `GOOGLE_CLIENT_SECRET` | your Google client secret |
| `GOOGLE_CALLBACK_URL` | `https://smart-edu-ed5y.onrender.com/auth/google/callback` |

## Also update Google Cloud Console

Go to console.cloud.google.com → APIs & Services → Credentials → your OAuth client:

**Authorized redirect URIs** — add:
```
https://smart-edu-ed5y.onrender.com/auth/google/callback
```

**Authorized JavaScript origins** — add:
```
https://smart-edu-seven.vercel.app
```
