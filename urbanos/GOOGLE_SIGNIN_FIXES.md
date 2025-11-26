# Google Sign-In Fixes Applied

## Issues Fixed

### 1. ✅ Redirect After Google Consent
- **Problem:** After Google OAuth, user was redirected to `/os` page
- **Fix:** Now redirects to landing page (`/`) so user stays on the same page
- **File:** `urbanos/lib/auth-context.tsx`

### 2. ✅ Profile Not Showing After OAuth
- **Problem:** Profile wasn't created automatically for Google OAuth users
- **Fix:** Added automatic profile creation in `loadProfile()` function
  - Checks if profile exists
  - If missing, creates it with user's Google name/email
  - Handles Google OAuth metadata properly
- **File:** `urbanos/lib/auth-context.tsx`

### 3. ✅ Profile Creation on Database Side
- **Problem:** Database trigger wasn't handling Google OAuth users properly
- **Fix:** Created new migration to update the trigger function
  - Better handles Google user metadata
  - Extracts name from multiple metadata fields
  - Handles conflicts gracefully
- **File:** `urbanos/supabase/migrations/20240102000013_fix_oauth_profile_creation.sql`

## What You Need to Do

### Run the New Migration

1. Go to Supabase Dashboard → SQL Editor
2. Run this new migration file:
   - `20240102000013_fix_oauth_profile_creation.sql`

This will update the database trigger to better handle Google OAuth users.

### Test It

1. **Clear your browser cache** or use incognito mode
2. Go to your landing page
3. Click "Sign In" → "Sign in with Google"
4. After Google consent:
   - ✅ You should be redirected back to landing page
   - ✅ Your profile should show in the top-left corner (click the user icon)
   - ✅ Profile name and email should display

## How It Works Now

1. **User clicks Google Sign In** → Redirects to Google consent
2. **User selects account** → Google redirects back to your site
3. **Site redirects to landing page** (`/`) not `/os`
4. **Auth context detects sign-in** → Checks for profile
5. **If profile missing** → Creates it automatically with Google data
6. **Profile loads** → User sees signed-in state in navbar

## Files Changed

- `urbanos/lib/auth-context.tsx` - Fixed redirect and profile creation
- `urbanos/supabase/migrations/20240102000013_fix_oauth_profile_creation.sql` - New migration

## Notes

- The profile will be created with:
  - Name from Google (or email username if name not available)
  - Email from Google account
  - Role: 'citizen' (default)

- If you see "User" instead of your name, it means Google didn't provide a name in the metadata. The migration handles multiple metadata sources.

