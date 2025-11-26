# Apply Database Fix for Sign-Up and Sign-In

## Issues Fixed
1. ✅ Sign-up fails with "database error saving new user"
2. ✅ Sign-in not working after OAuth

## Root Cause
The Row Level Security (RLS) policy on the `users` table is blocking the trigger function `handle_new_user()` from creating user profiles automatically when users sign up.

## Solution

### Step 1: Apply the Migration

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of this file: `supabase/migrations/20240102000014_fix_user_profile_creation_rls.sql`
5. Click **Run**

**Option B: Via Supabase CLI**
```bash
cd urbanos
supabase db push
```

### Step 2: Verify the Fix

After running the migration, verify:
1. Go to **Authentication → Policies** in Supabase Dashboard
2. Find the `users` table
3. You should see a policy named **"Allow user profile creation"** with INSERT permissions

### Step 3: Test

1. **Test Sign-Up:**
   - Go to http://localhost:3000/
   - Click "Sign In"
   - Click "Sign up"
   - Fill in email, password, and name
   - Click "Sign up"
   - Should show success message (no database error)

2. **Test Sign-In:**
   - Sign in with your email and password
   - Should work without errors

3. **Test Google Sign-In:**
   - Click "Sign In"
   - Click "Google"
   - Complete Google authentication
   - Should redirect back and show you as signed in

## What the Migration Does

The migration:
1. **Removes** the old restrictive policy: "Users can insert their own profile"
2. **Creates** a new policy: "Allow user profile creation" that:
   - Allows users to insert their own profile (when authenticated)
   - Allows the trigger function to insert profiles (when id exists in auth.users)

This is secure because:
- Foreign key constraint ensures only valid user IDs
- Email uniqueness prevents duplicates
- Users can only create profiles with their own ID

## Troubleshooting

If sign-up still doesn't work:
1. Check Supabase Dashboard → Logs for any errors
2. Verify the trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
3. Verify the function exists: `SELECT * FROM pg_proc WHERE proname = 'handle_new_user';`
4. Check RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users';`

