# Fix Google OAuth 400 "App doesn't comply" Error

## Root Cause
Google is rejecting the OAuth request because the OAuth consent screen 
is not properly configured or the app is in "Testing" mode with unverified users.

## Fix Steps

### Step 1 — Google Cloud Console
Go to: https://console.cloud.google.com → APIs & Services → OAuth consent screen

1. **User Type**: Select "External"
2. **App name**: SmartEduLearn
3. **User support email**: your email
4. **Developer contact**: your email
5. Click **Save and Continue**

### Step 2 — Scopes
Add these scopes:
- `email`
- `profile`  
- `openid`

Click **Save and Continue**

### Step 3 — Test Users (if in Testing mode)
Add your email as a test user so you can login during development.

### Step 4 — Publishing Status
For production: Click **Publish App** to move from Testing → Production
(This allows any Google account to sign in, not just test users)

### Step 5 — Authorized URIs (already done)
Verify these are set in Credentials → your OAuth client:

**Authorized JavaScript origins:**
- http://localhost:5173
- https://smart-edu-seven.vercel.app

**Authorized redirect URIs:**
- http://localhost:3000/auth/google/callback
- https://smart-edu-ed5y.onrender.com/auth/google/callback
