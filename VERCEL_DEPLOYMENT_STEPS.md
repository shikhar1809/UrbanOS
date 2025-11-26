# Complete Vercel Deployment Guide for UrbanOS

## Prerequisites
- ✅ Code pushed to GitHub: `https://github.com/shikhar1809/UrbanOS_Hack_Beyond_SRMCEM.git`
- ✅ GitHub account connected to Vercel

---

## Step-by-Step Deployment

### Step 1: Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Sign in with your GitHub account (if not already signed in)

### Step 2: Import Project
1. Click **"Add New..."** button (or **"Import Project"**)
2. Click **"Import Git Repository"**
3. Find and select: **shikhar1809/UrbanOS_Hack_Beyond_SRMCEM**
4. Click **"Import"**

### Step 3: Configure Project Settings

#### **Framework Preset**
- Should auto-detect as **Next.js**
- If not, select: **Next.js**

#### **Root Directory** ⚠️ **IMPORTANT**
1. Click **"Edit"** next to Root Directory
2. Click **"Browse"** or type manually
3. Select: `urbanos`
4. Or type: `urbanos`
5. This tells Vercel your Next.js app is in the `urbanos` folder

#### **Build and Output Settings**
- **Build Command**: `npm run build` (default - should be correct)
- **Output Directory**: `.next` (default - should be correct)
- **Install Command**: `npm install` (default - should be correct)

### Step 4: Add Environment Variables

Click **"Environment Variables"** section and add these one by one:

#### **Supabase Configuration**
```
NEXT_PUBLIC_SUPABASE_URL=https://iredygbhjgqcvekjlrrl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZWR5Z2JoamdxY3Zla2pscnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MzU0OTAsImV4cCI6MjA3OTMxMTQ5MH0.rLki_bdI8B3nGwrSajJaltaatfoUeAToG2rp3SvhjDM
SUPABASE_SERVICE_ROLE_KEY=(add your service role key from Supabase dashboard)
```

#### **Weather & Air Quality APIs**
```
METASOURCE_API_KEY=l9m0kupv8gfjfb4qk9snkw3mu0ti0pzvpk3yw66f
DATA_GOV_IN_API_KEY=579b464db66ec23bdd0000019779c845298b477271ef862e22055b68
```

#### **Email Service**
```
RESEND_API_KEY=re_L1sRiZZe_BLgf5zgUhmohWXaTd6QedN5y
RESEND_FROM_EMAIL=onlyafterburners@gmail.com
```

#### **Twilio WhatsApp**
```
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN
TWILIO_WHATSAPP_NUMBER=whatsapp:+YOUR_TWILIO_NUMBER
```

#### **App URL** (Update after deployment)
```
NEXT_PUBLIC_APP_URL=https://urban-os-hack-beyond-srmcem-sb32.vercel.app
```
*(Update this to your actual Vercel URL after first deployment)*

#### **Social Media (Optional)**
```
WHATSAPP_VERIFY_TOKEN=urbanos_verify_token
INSTAGRAM_VERIFY_TOKEN=urbanos_verify_token
```

**Important**: 
- Select **Production**, **Preview**, and **Development** for all variables
- Click **"Add"** after each variable

### Step 5: Deploy
1. Scroll down and click **"Deploy"** button
2. Wait for deployment to complete (2-5 minutes)
3. You'll see a progress bar and build logs

### Step 6: Verify Deployment
1. After deployment completes, you'll see:
   - ✅ **Success** message
   - A **Visit** button
   - Your deployment URL

2. Click **"Visit"** or go to your deployment URL

3. **Expected Result**:
   - Should see the UrbanOS landing page
   - Not a 404 error

---

## If You Still See 404 Error

### Check Build Logs
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **"Build Logs"** or **"Functions"**
4. Look for any errors

### Common Fixes

#### Fix 1: Verify Root Directory
1. Go to **Settings** → **General**
2. Verify **Root Directory** is set to `urbanos`
3. If not, set it and click **Save**
4. Go to **Deployments** → Click **⋯** → **Redeploy**

#### Fix 2: Check Environment Variables
1. Go to **Settings** → **Environment Variables**
2. Verify all required variables are added
3. Make sure they're enabled for **Production**

#### Fix 3: Manual Redeploy
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **⋯** (three dots) menu
4. Click **Redeploy**
5. Wait for it to complete

---

## After Successful Deployment

### 1. Update App URL Environment Variable
After you get your final Vercel URL:
1. Go to **Settings** → **Environment Variables**
2. Find `NEXT_PUBLIC_APP_URL`
3. Click **Edit**
4. Update to your actual Vercel URL
5. Click **Save**
6. Redeploy (this will trigger automatically on next push)

### 2. Configure Twilio Webhook
1. Go to Twilio Console → WhatsApp Sandbox Settings
2. Set webhook URL to: `https://your-vercel-url.vercel.app/api/webhooks/whatsapp`
3. Save

---

## Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| 404 Error | Check Root Directory is set to `urbanos` |
| Build Fails | Check Build Logs for specific errors |
| Missing Environment Variables | Add them in Settings → Environment Variables |
| API Errors | Verify all API keys are correct |

---

## Success Checklist

- [ ] Project imported from GitHub
- [ ] Root Directory set to `urbanos`
- [ ] All environment variables added
- [ ] Deployment completed successfully
- [ ] Site loads (not 404)
- [ ] Landing page displays correctly
- [ ] Updated `NEXT_PUBLIC_APP_URL` to actual Vercel URL

---

## Need Help?

If deployment fails:
1. Copy the build error logs
2. Check Vercel's documentation: https://vercel.com/docs
3. Verify your GitHub repository has all the latest code

