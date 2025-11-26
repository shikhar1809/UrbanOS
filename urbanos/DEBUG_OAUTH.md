# Debugging OAuth Sign-In Issues

## Current Problem
- Redirect works (user comes back to landing page)
- But no profile/user is shown (not signed in)

## What to Check

### 1. Check Browser Console
Open browser DevTools (F12) → Console tab and look for:
- `Auth state changed:` messages
- Any error messages
- Check if session is being detected

### 2. Check Network Tab
- Look for calls to `/auth/callback`
- Check if cookies are being set (Application tab → Cookies)
- Look for Supabase auth API calls

### 3. Check Cookies
In DevTools → Application → Cookies → `http://localhost:3000`
- Look for cookies starting with `sb-` (Supabase cookies)
- Should see: `sb-iredygbhjgqcvekjlrrl-auth-token` and similar

### 4. Manual Test in Console
Open browser console on your landing page and run:
```javascript
// Check if Supabase client can read session
const { data } = await window.supabase.auth.getSession();
console.log('Session:', data);
```

### 5. Verify Redirect URL in Supabase
Go to Supabase Dashboard → Authentication → URL Configuration
- Site URL: `http://localhost:3000`
- Redirect URLs should include: `http://localhost:3000/auth/callback`

## Common Issues

1. **Cookies not being set** - Check if cookies are HttpOnly and domain matches
2. **Session not persisting** - Cookies might be blocked or not readable by browser client
3. **Callback route not being hit** - Check network tab to see if `/auth/callback` is called
4. **Code exchange failing** - Check server logs for errors

## Quick Fixes to Try

### Fix 1: Ensure Browser Client Reads Cookies
The browser client should automatically read cookies, but if not:
- Check if cookies have correct domain/path
- Verify SameSite settings

### Fix 2: Add Explicit Session Refresh
After redirect, force a session refresh on client side

### Fix 3: Check Supabase Redirect Configuration
Make sure redirect URL is exactly: `http://localhost:3000/auth/callback`

