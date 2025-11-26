# Fix: OAuth Redirect to Localhost on Vercel

## Problem
When signing in on the Vercel site, users are redirected to localhost instead of the Vercel URL.

## Solution

### Step 1: Update Environment Variable in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Find or add: `NEXT_PUBLIC_APP_URL`
3. Set it to your Vercel production URL (e.g., `https://your-app-name.vercel.app`)
4. Make sure it's enabled for **Production**, **Preview**, and **Development**
5. Click **Save**

### Step 2: Configure Supabase OAuth Redirect URLs

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Under **Redirect URLs**, add:
   - `https://your-app-name.vercel.app/auth/callback`
   - `https://your-app-name.vercel.app/*` (wildcard for all paths)
3. Under **Site URL**, set it to: `https://your-app-name.vercel.app`
4. Click **Save**

### Step 3: Redeploy on Vercel

After updating the environment variable:
1. Go to Vercel Dashboard → Deployments
2. Click **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

### Step 4: Test

1. Visit your Vercel site
2. Click "Sign In"
3. Complete Google authentication
4. You should be redirected back to your Vercel site (not localhost)

## Why This Happens

The OAuth redirect uses `NEXT_PUBLIC_APP_URL` environment variable. If it's not set or set to localhost, the redirect will go to localhost. The code has been updated to use this variable when available.

## Verification

After fixing, check:
- ✅ `NEXT_PUBLIC_APP_URL` is set to your Vercel URL in Vercel dashboard
- ✅ Supabase redirect URLs include your Vercel URL
- ✅ Site URL in Supabase is set to your Vercel URL
- ✅ Redeployment completed successfully

