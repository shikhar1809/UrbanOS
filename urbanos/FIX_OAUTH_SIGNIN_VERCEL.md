# Fix OAuth Sign-In Issue on Vercel

## Problem
After signing in through Google OAuth (with consent forms), users are not getting signed in on the Vercel deployment.

## Root Causes
1. **OAuth Redirect URL Mismatch**: The redirect URL in Supabase doesn't match the Vercel deployment URL
2. **Session Not Persisting**: Session cookies might not be set correctly after OAuth callback
3. **Environment Variables**: `NEXT_PUBLIC_APP_URL` might not be set correctly (though code now uses `window.location.origin` as fallback)

## Solutions Applied

### 1. Code Changes
- ✅ Updated `signInWithGoogle()` to always use `window.location.origin` instead of relying on environment variables
- ✅ Improved session detection with retry logic for OAuth callbacks
- ✅ Updated middleware to refresh auth sessions automatically

### 2. Required Supabase Configuration

**CRITICAL**: You must configure the OAuth redirect URL in Supabase:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/iredygbhjgqcvekjlrrl
2. Navigate to **Authentication** → **URL Configuration**
3. Add your Vercel URL to **Redirect URLs**:
   ```
   https://urbanos-rho.vercel.app/auth/callback
   ```
   Or if you have a custom domain:
   ```
   https://yourdomain.com/auth/callback
   ```

4. Also add the wildcard pattern (recommended):
   ```
   https://urbanos-*.vercel.app/auth/callback
   ```

5. Click **Save**

### 3. Verify Google OAuth Provider Settings

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Click on **Google**
3. Ensure:
   - ✅ **Enabled** is toggled ON
   - ✅ **Client ID** is set (from Google Cloud Console)
   - ✅ **Client Secret** is set (from Google Cloud Console)

### 4. Verify Google Cloud Console Settings

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, ensure you have:
   ```
   https://iredygbhjgqcvekjlrrl.supabase.co/auth/v1/callback
   ```
   This is the Supabase callback URL that Google redirects to.

### 5. Test the Flow

1. Deploy the updated code to Vercel
2. Visit: `https://urbanos-rho.vercel.app/os`
3. Click **Sign In** → **Sign in with Google**
4. Complete the Google consent flow
5. You should be redirected back and signed in

## Debugging

If sign-in still doesn't work:

### Check Browser Console
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for errors starting with `[Sign In]` or `[OAuth Callback]`
4. Check for any Supabase auth errors

### Check Network Tab
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Filter by "auth" or "callback"
4. Check the OAuth callback request:
   - Status should be 200 or 302
   - Response should contain session data

### Check Supabase Logs
1. Go to Supabase Dashboard
2. Navigate to **Logs** → **Auth Logs**
3. Look for OAuth-related errors

### Common Issues

#### Issue: "redirect_uri_mismatch"
**Solution**: The redirect URL in Google Cloud Console doesn't match Supabase's callback URL. Ensure you have:
```
https://iredygbhjgqcvekjlrrl.supabase.co/auth/v1/callback
```

#### Issue: "Invalid redirect URL"
**Solution**: Add your Vercel URL to Supabase Redirect URLs (see step 2 above)

#### Issue: Session exists but user is null
**Solution**: This is usually a timing issue. The code now includes retry logic, but if it persists:
- Clear browser cookies for the site
- Try signing in again
- Check if cookies are being blocked by browser settings

## Code Changes Summary

### `lib/auth-context.tsx`
- Changed `signInWithGoogle()` to use `window.location.origin` instead of `NEXT_PUBLIC_APP_URL`
- Added retry logic for session detection after OAuth callback
- Increased wait time for OAuth callbacks (1 second instead of 200ms)

### `middleware.ts`
- Added Supabase auth session refresh
- Ensures sessions persist across page loads

## Testing Checklist

- [ ] Supabase Redirect URL includes Vercel URL
- [ ] Google Cloud Console has Supabase callback URL
- [ ] Code deployed to Vercel
- [ ] Test sign-in flow end-to-end
- [ ] Verify session persists after page refresh
- [ ] Check browser console for errors
- [ ] Verify cookies are being set (check Application → Cookies in DevTools)

## Still Not Working?

If the issue persists after following all steps:

1. **Check Vercel Environment Variables**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
   - Note: `NEXT_PUBLIC_APP_URL` is no longer required (code uses `window.location.origin`)

2. **Clear All Data and Retry**:
   - Clear browser cookies for the site
   - Clear browser cache
   - Try in incognito/private mode

3. **Check Supabase Project Settings**:
   - Ensure project is active (not paused)
   - Check if there are any rate limits or restrictions

4. **Contact Support**:
   - If all else fails, check Supabase status page
   - Review Supabase documentation for OAuth troubleshooting

