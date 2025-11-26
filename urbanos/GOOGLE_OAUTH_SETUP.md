# Google OAuth Setup Guide for Supabase

Follow these steps to enable Google sign-in in your Supabase project.

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Google+ API**:
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API" or "Identity Toolkit API"
   - Click **Enable**

4. Create OAuth 2.0 Credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: "UrbanOS" (or any name)

5. Add Authorized redirect URIs:
   ```
   https://iredygbhjgqcvekjlrrl.supabase.co/auth/v1/callback
   ```
   Replace with your Supabase project URL if different.

6. Copy your credentials:
   - **Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)
   - **Client Secret** (looks like: `GOCSPX-xxxxx`)

## Step 2: Configure in Supabase

1. Go to your Supabase Dashboard
2. Navigate to: **Authentication** → **Providers**
3. Find **Google** in the list
4. Toggle it **ON**
5. Enter your credentials:
   - **Client ID (for OAuth)**: Paste your Google Client ID
   - **Client Secret (for OAuth)**: Paste your Google Client Secret
6. Click **Save**

## Step 3: Test

1. Restart your dev server if it's running
2. Try signing in with Google
3. You should be redirected to Google's consent screen

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure you added the correct redirect URI in Google Cloud Console:
  `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
- Find your project ref in Supabase Dashboard → Settings → API

### Error: "invalid_client"
- Double-check your Client ID and Client Secret in Supabase
- Make sure they're copied correctly (no extra spaces)

### Still not working?
- Clear browser cache
- Try in incognito mode
- Check Supabase dashboard → Authentication → Logs for detailed errors

