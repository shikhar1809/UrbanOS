# Vercel Environment Variables Setup

Your deployment failed because environment variables are not set. Follow these steps:

## Option 1: Add via Vercel Dashboard (Easiest)

1. Go to: https://vercel.com/royalshikher-4385s-projects/urbanos/settings/environment-variables
2. Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL = https://iredygbhjgqcvekjlrrl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZWR5Z2JoamdxY3Zla2pscnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MzU0OTAsImV4cCI6MjA3OTMxMTQ5MH0.rLki_bdI8B3nGwrSajJaltaatfoUeAToG2rp3SvhjDM
RESEND_API_KEY = re_L1sRiZZe_BLgf5zgUhmohWXaTd6QedN5y
RESEND_FROM_EMAIL = onlyafterburners@gmail.com
NEXT_PUBLIC_APP_URL = https://urbanos-5bxxfw8jk-royalshikher-4385s-projects.vercel.app
INSTAGRAM_VERIFY_TOKEN = urbanos_verify_token
WHATSAPP_VERIFY_TOKEN = urbanos_verify_token
```

3. **Important**: After adding, go to the "Deployments" tab and click "Redeploy" on the latest deployment.

## Option 2: Add via Vercel CLI

Run these commands from the `urbanos` directory:

```bash
cd urbanos
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add RESEND_API_KEY production
vercel env add RESEND_FROM_EMAIL production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add INSTAGRAM_VERIFY_TOKEN production
vercel env add WHATSAPP_VERIFY_TOKEN production
```

When prompted, paste the values from your `.env.local` file.

## After Adding Environment Variables

1. **Redeploy**: Go to Vercel Dashboard → Deployments → Click "Redeploy" on latest deployment
2. **Update Supabase Redirect URLs**: 
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your production URL to redirect URLs
   - Update Site URL to your production URL
3. **Update Google OAuth**:
   - Go to Google Cloud Console → Credentials
   - Add production callback URL

## Production URL

Once deployed, your app will be at:
- **Production**: `https://urbanos-5bxxfw8jk-royalshikher-4385s-projects.vercel.app`
- Or check Vercel Dashboard for custom domain

