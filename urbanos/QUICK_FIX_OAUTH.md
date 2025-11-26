# Quick Fix: OAuth "Database error saving new user"

## Immediate Steps

### 1. Apply the Database Migration

**Go to Supabase Dashboard:**
1. Open: https://supabase.com/dashboard/project/iredygbhjgqcvekjlrrl/sql/new
2. Copy the entire contents of: `supabase/migrations/20240102000015_fix_user_creation_comprehensive.sql`
3. Paste into SQL Editor
4. Click **Run**

### 2. What This Fixes

The migration:
- ✅ Updates the trigger function with better error handling
- ✅ Fixes RLS policies to allow trigger to create profiles
- ✅ Ensures the trigger is properly configured
- ✅ Adds exception handling so auth signup doesn't fail

### 3. Test Again

After running the migration:
1. Try Google sign-in again
2. The error should be gone
3. Your profile should be created automatically

## If Still Not Working

Check Supabase logs:
1. Dashboard → Logs → Postgres Logs
2. Look for errors related to `handle_new_user` function

The client-side code has also been updated to automatically create profiles if the trigger fails.

