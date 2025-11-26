# Vercel Deployment Fix - 404 Error

## Problem
The site is showing a 404 error because Vercel is not configured to use the `urbanos` subdirectory as the root.

## Solution

You need to configure the **Root Directory** in Vercel Dashboard:

### Step 1: Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Click on your project: **UrbanOS_Hack_Beyond_SRMCEM**

### Step 2: Set Root Directory
1. Go to **Settings** tab
2. Click **General** in the left sidebar
3. Scroll down to **Root Directory**
4. Click **Edit**
5. Set the root directory to: `urbanos`
6. Click **Save**

### Step 3: Redeploy
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **three dots (⋯)** menu
4. Click **Redeploy**
5. Wait for the deployment to complete

## Alternative: Use vercel.json (Already Done)

The `vercel.json` file has been pushed to the repository with:
```json
{
  "rootDirectory": "urbanos"
}
```

However, Vercel may still require you to set it in the dashboard for the first time.

## Verify Deployment

After redeploying, check:
1. The deployment logs for any build errors
2. That the build command runs from the `urbanos` directory
3. That environment variables are set correctly

## Common Issues

### Issue: Build fails
- Check that all environment variables are set in Vercel dashboard
- Check deployment logs for specific errors

### Issue: Still 404 after setting root directory
- Make sure you clicked **Save** in Vercel dashboard
- Trigger a new deployment after saving
- Wait 2-3 minutes for deployment to complete

### Issue: Environment variables missing
- Go to **Settings** → **Environment Variables**
- Add all required variables from `.env.local`
- Redeploy after adding variables

