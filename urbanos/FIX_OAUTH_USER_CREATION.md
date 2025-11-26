# Fix OAuth User Creation Error

## Problem
When users sign in with Google OAuth, they get the error: "Database error saving new user"

This happens because the `handle_new_user()` trigger function cannot create profiles in the `public.users` table due to Row Level Security (RLS) policies.

## Solution

Apply the migration `20240102000015_fix_user_creation_comprehensive.sql` to your Supabase database.

### Steps to Apply:

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/iredygbhjgqcvekjlrrl
   - Go to **SQL Editor**

2. **Run the Migration**
   - Copy the contents of `supabase/migrations/20240102000015_fix_user_creation_comprehensive.sql`
   - Paste it into the SQL Editor
   - Click **Run**

   OR

   Use Supabase CLI:
   ```bash
   supabase db push
   ```

3. **Verify the Fix**
   - The migration will:
     - Update the `handle_new_user()` trigger function with better error handling
     - Fix RLS policies to allow trigger function to create profiles
     - Ensure the trigger is properly set up

## What the Migration Does

1. **Improves the Trigger Function**:
   - Better metadata extraction (handles both `raw_user_meta_data` and `user_metadata`)
   - Error handling that doesn't fail the auth signup
   - Uses `ON CONFLICT` to handle existing users

2. **Fixes RLS Policies**:
   - Removes restrictive policies
   - Creates a policy that allows:
     - Users to insert their own profiles (when authenticated)
     - Trigger function to insert profiles (when user ID exists in auth.users)

3. **Ensures Trigger Exists**:
   - Drops and recreates the trigger to ensure it's properly configured

## After Applying

1. Test Google sign-in again
2. The error should be resolved
3. User profiles should be created automatically

## If Error Persists

1. Check Supabase logs: Dashboard → Logs → Postgres Logs
2. Verify the trigger exists: 
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
3. Check RLS policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```

