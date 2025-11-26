# Deployment Guide for UrbanOS

## Quick Deploy to Vercel

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from the `urbanos` directory**:
   ```bash
   cd urbanos
   vercel
   ```
   
   Follow the prompts:
   - Link to existing project? **No** (first time)
   - Project name: **urbanos** (or your preferred name)
   - Directory: **./**
   - Override settings? **No**

4. **Set Environment Variables**:
   
   After first deployment, go to Vercel Dashboard → Your Project → Settings → Environment Variables
   
   Add all variables from `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://iredygbhjgqcvekjlrrl.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZWR5Z2JoamdxY3Zla2pscnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MzU0OTAsImV4cCI6MjA3OTMxMTQ5MH0.rLki_bdI8B3nGwrSajJaltaatfoUeAToG2rp3SvhjDM
   RESEND_API_KEY=re_L1sRiZZe_BLgf5zgUhmohWXaTd6QedN5y
   RESEND_FROM_EMAIL=onlyafterburners@gmail.com
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   INSTAGRAM_VERIFY_TOKEN=urbanos_verify_token
   WHATSAPP_VERIFY_TOKEN=urbanos_verify_token
   ```
   
   **Important**: Replace `NEXT_PUBLIC_APP_URL` with your actual Vercel deployment URL after first deploy.

5. **Redeploy** after adding environment variables:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click **Add New Project**
4. Import your Git repository (or drag & drop the `urbanos` folder)
5. Configure:
   - Framework Preset: **Next.js**
   - Root Directory: `urbanos`
   - Build Command: `npm run build`
   - Output Directory: `.next`
6. Add Environment Variables (same as above)
7. Click **Deploy**

### Post-Deployment Setup

1. **Update Supabase Redirect URLs**:
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your production URL: `https://your-app.vercel.app`
   - Add callback URL: `https://your-app.vercel.app/auth/callback`
   - Update Site URL to: `https://your-app.vercel.app`

2. **Update Google OAuth Redirect URI**:
   - Go to Google Cloud Console → Credentials
   - Add to Authorized redirect URIs:
     ```
     https://your-app.vercel.app/auth/callback
     ```

3. **Update Environment Variable**:
   - In Vercel Dashboard, update `NEXT_PUBLIC_APP_URL` to your production URL
   - Redeploy to apply changes

## Production URL

After deployment, your app will be available at:
- **Production**: `https://your-app.vercel.app`
- **Preview**: `https://your-app-git-branch.vercel.app` (for each branch/PR)

## Troubleshooting

### Build Errors
- Check Vercel build logs in the dashboard
- Ensure all environment variables are set
- Verify Node.js version (should be 18+)

### OAuth Not Working
- Verify redirect URLs in Supabase match production URL
- Check environment variables are set correctly
- Clear browser cache and try again

### Database Connection Issues
- Verify Supabase URL and keys are correct
- Check Supabase project is active
- Ensure RLS policies allow public access where needed

