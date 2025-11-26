# Fix Sign-In Issue on Vercel

## 🔴 Problem
Sign-in with Google is not working properly on Vercel deployment.

## ✅ Solution

### Step 1: Set Environment Variable in Vercel

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Select your **UrbanOS** project
   - Click **Settings** → **Environment Variables**

2. **Add/Update this variable:**
   ```
   NEXT_PUBLIC_APP_URL=https://urbanos-rho.vercel.app
   ```
   
   **Important Settings:**
   - ✅ Enable for **Production**
   - ✅ Enable for **Preview**
   - ✅ Enable for **Development**

3. **Save** the variable

### Step 2: Configure Supabase Redirect URLs

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/iredygbhjgqcvekjlrrl
   - Click **Authentication** → **URL Configuration**

2. **Set Site URL:**
   ```
   https://urbanos-rho.vercel.app
   ```

3. **Add Redirect URLs:**
   Add these URLs (one per line):
   ```
   https://urbanos-rho.vercel.app/auth/callback
   https://urbanos-rho.vercel.app/*
   https://urbanos-rho.vercel.app
   ```

4. **Click "Save"**

### Step 3: Configure Google OAuth Provider

1. **In Supabase Dashboard:**
   - Go to **Authentication** → **Providers**
   - Click on **Google**

2. **Verify these settings:**
   - ✅ **Enabled**: Should be checked
   - **Client ID**: Should be set (from Google Cloud Console)
   - **Client Secret**: Should be set (from Google Cloud Console)

3. **Authorized redirect URIs in Google Cloud Console:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Find your OAuth 2.0 Client ID
   - Add this to **Authorized redirect URIs**:
     ```
     https://iredygbhjgqcvekjlrrl.supabase.co/auth/v1/callback
     ```

### Step 4: Redeploy on Vercel

After setting the environment variable:

1. **Go to Vercel Dashboard** → Your Project → **Deployments**
2. Click **"⋯"** (three dots) on the latest deployment
3. Select **"Redeploy"**
4. Wait for deployment to complete

### Step 5: Test Sign-In

1. Visit: `https://urbanos-rho.vercel.app/`
2. Click **"Sign In"** button
3. Click **"Sign in with Google"**
4. Should redirect to Google sign-in
5. After signing in, should redirect back to Vercel (not localhost)

---

## 🔍 Troubleshooting

### Issue: Still redirects to localhost

**Check:**
1. ✅ `NEXT_PUBLIC_APP_URL` is set in Vercel environment variables
2. ✅ Variable is enabled for Production environment
3. ✅ You've redeployed after adding the variable
4. ✅ Supabase redirect URLs include your Vercel URL

**Fix:**
- Clear browser cache and cookies
- Try in incognito/private window
- Check browser console for errors

### Issue: "Invalid redirect URL" error

**Check:**
1. ✅ Supabase redirect URLs are configured correctly
2. ✅ Google OAuth redirect URI includes Supabase callback URL
3. ✅ No typos in URLs (https, no trailing slashes)

**Fix:**
- Verify all URLs match exactly (case-sensitive)
- Remove any trailing slashes
- Ensure using `https://` not `http://`

### Issue: Sign-in button does nothing

**Check:**
1. ✅ Browser console for JavaScript errors
2. ✅ Network tab for failed requests
3. ✅ Supabase project is active

**Fix:**
- Check browser console for errors
- Verify Supabase project is not paused
- Check if ad blockers are interfering

### Issue: OAuth succeeds but user not logged in

**Check:**
1. ✅ Auth callback route is working (`/auth/callback`)
2. ✅ Cookies are being set (check browser DevTools)
3. ✅ Supabase session is created

**Fix:**
- Check browser console for callback errors
- Verify cookies are not blocked
- Check if third-party cookies are allowed

---

## 📋 Quick Checklist

- [ ] `NEXT_PUBLIC_APP_URL` set to `https://urbanos-rho.vercel.app` in Vercel
- [ ] Environment variable enabled for Production
- [ ] Supabase Site URL set to `https://urbanos-rho.vercel.app`
- [ ] Supabase redirect URLs include Vercel domain
- [ ] Google OAuth redirect URI includes Supabase callback
- [ ] Redeployed on Vercel after changes
- [ ] Tested sign-in in incognito window
- [ ] Checked browser console for errors

---

## 🚀 After Fix

Once everything is configured:

1. **Sign-in should work** - Users can sign in with Google
2. **Redirects correctly** - Returns to Vercel domain, not localhost
3. **Session persists** - User stays logged in across page refreshes
4. **Profile loads** - User profile information displays correctly

---

## 📞 Still Having Issues?

If sign-in still doesn't work after following all steps:

1. **Check Vercel Build Logs:**
   - Go to Deployment → View Build Logs
   - Look for any errors related to environment variables

2. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for errors in Console tab
   - Check Network tab for failed requests

3. **Check Supabase Logs:**
   - Go to Supabase Dashboard → Logs
   - Look for authentication errors

4. **Verify Environment Variables:**
   - In Vercel, check that all variables are set correctly
   - Ensure no typos or extra spaces

---

**Last Updated:** After admin panel deployment  
**Status:** Ready to fix

