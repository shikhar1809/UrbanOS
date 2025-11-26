# Testing Google Sign-In - Step by Step

## Quick Debug Steps

1. **Open Browser Console** (F12 → Console tab)

2. **Try Google Sign-In:**
   - Click "Sign In" → "Sign in with Google"
   - After Google consent, check the console

3. **Look for these console messages:**
   - `Auth state changed: SIGNED_IN [email]` - Should appear if session is detected
   - `Initial session check: [email]` - Should show your email
   - Any error messages

4. **Check Network Tab:**
   - Look for `/auth/callback` request
   - Check the response - should redirect to `/`
   - Check if cookies are being set

5. **Check Cookies:**
   - DevTools → Application → Cookies
   - Should see Supabase auth cookies (sb-*)

## What Should Happen

1. Click Google Sign In → Goes to Google
2. Select account → Google redirects to Supabase
3. Supabase processes → Redirects to `/auth/callback?code=...`
4. Callback route exchanges code → Sets cookies → Redirects to `/`
5. Browser client reads cookies → Session detected → Profile loads

## Common Issues

- **No cookies:** Callback route isn't setting cookies properly
- **Cookies not readable:** Browser client can't read cookies (domain/path issue)
- **Session not detected:** Auth context isn't checking session properly

## Manual Test

Open browser console on landing page and run:

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

If this shows a session but the UI doesn't, then it's a state management issue.

