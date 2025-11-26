# 🔧 Quick Fix: Google Sign-In Error

## The Problem
```
{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}
```

This means Google OAuth is not enabled in your Supabase project.

---

## ✅ Quick Fix (3 Steps)

### Step 1: Get Google OAuth Credentials (5 minutes)

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create/Select Project:**
   - Click project dropdown at top
   - Create new project: "UrbanOS" (or use existing)

3. **Enable APIs:**
   - Go to **APIs & Services** → **Library**
   - Search "Identity Toolkit API"
   - Click **Enable**

4. **Create OAuth Credentials:**
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: "UrbanOS"

5. **Add Redirect URI:**
   ```
   https://iredygbhjgqcvekjlrrl.supabase.co/auth/v1/callback
   ```
   Paste this in **Authorized redirect URIs** field

6. **Copy Credentials:**
   - Copy **Client ID** (e.g., `123456.apps.googleusercontent.com`)
   - Copy **Client Secret** (e.g., `GOCSPX-xxxxx`)

---

### Step 2: Enable in Supabase (2 minutes)

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Enable Google Provider:**
   - Click **Authentication** (sidebar)
   - Click **Providers**
   - Find **Google** in the list
   - Toggle the switch to **ON**

3. **Enter Credentials:**
   - **Client ID (for OAuth):** Paste your Google Client ID
   - **Client Secret (for OAuth):** Paste your Google Client Secret
   - Click **Save**

---

### Step 3: Test (1 minute)

1. **Refresh your app** (or restart dev server)
2. **Try Google Sign In** again
3. You should see Google's consent screen

---

## 🎯 Your Exact Redirect URI

For your Supabase project, use this redirect URI in Google Cloud Console:

```
https://iredygbhjgqcvekjlrrl.supabase.co/auth/v1/callback
```

Make sure to add this **exactly** in Google Cloud Console → OAuth 2.0 Client → Authorized redirect URIs

---

## ⚠️ Common Issues

**"redirect_uri_mismatch" error?**
- Double-check the redirect URI is added correctly
- Make sure there are no trailing spaces
- It should be: `https://iredygbhjgqcvekjlrrl.supabase.co/auth/v1/callback`

**"invalid_client" error?**
- Verify Client ID and Secret are correct
- Check for extra spaces when pasting
- Make sure you saved in Supabase dashboard

**Still not working?**
- Clear browser cache
- Try incognito mode
- Check Supabase → Authentication → Logs for detailed error messages

---

**Need more help?** See `GOOGLE_OAUTH_SETUP.md` for detailed instructions.

