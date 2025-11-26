# OAuth Troubleshooting Guide

## Issue: "OAuth error: no_code"

This error occurs when the OAuth callback route receives a request without a `code` parameter.

### Possible Causes

1. **Redirect URL not configured in Supabase**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Ensure `http://localhost:3000/auth/callback` is in the "Redirect URLs" list
   - Site URL should be `http://localhost:3000`

2. **Supabase processing the code before redirect**
   - Supabase might be handling the code exchange server-side
   - Check if cookies are being set (DevTools → Application → Cookies)

3. **Code in hash fragment instead of query params**
   - Some OAuth flows put the code in the URL hash (`#code=...`) instead of query params (`?code=...`)
   - Check the browser URL after redirect

### Quick Fixes

1. **Verify Supabase Configuration:**
   ```
   Supabase Dashboard → Authentication → URL Configuration
   - Site URL: http://localhost:3000
   - Redirect URLs should include: http://localhost:3000/auth/callback
   ```

2. **Check Browser Network Tab:**
   - Look for requests to `/auth/callback`
   - Check if the code is in the request URL
   - Check response headers for cookies

3. **Check Console Logs:**
   - Look for `[OAuth Callback]` logs to see what parameters are received

### If Code is Missing

If the callback route consistently receives no code:
1. The OAuth flow might be completing successfully on Supabase's side
2. Check if you're already signed in (cookies might be set)
3. Try refreshing the page - if session exists, you should be signed in

### Manual Test

Open browser console and check:
```javascript
// Check current session
const { createClient } = await import('@supabase/ssr');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const { data } = await supabase.auth.getSession();
console.log('Session:', data);
```

If session exists but you see "no_code", the OAuth flow actually succeeded - the error is just from the callback route not receiving the code parameter (which is fine if Supabase handled it server-side).


