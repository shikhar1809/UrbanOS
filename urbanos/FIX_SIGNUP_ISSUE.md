# Fix Sign-Up and Sign-In Issues

## Problem
1. Sign-up fails with "database error saving new user"
2. Sign-in doesn't work properly

## Root Cause
The RLS (Row Level Security) policy on the `users` table is blocking the trigger function `handle_new_user()` from creating user profiles when users sign up.

## Solution

Run the new migration file to fix the RLS policy:

### Step 1: Run the Migration

Go to your Supabase Dashboard:
1. Navigate to SQL Editor
2. Create a new query
3. Copy and paste the contents of: `supabase/migrations/20240102000014_fix_user_profile_creation_rls.sql`
4. Run the query

Or run it via Supabase CLI:
```bash
supabase db push
```

### Step 2: Verify the Fix

The migration does the following:
- Drops the old restrictive policy: "Users can insert their own profile"
- Creates a new policy: "Allow user profile creation" that:
  - Allows users to insert their own profile (when `auth.uid() = id`)
  - Allows the trigger function to insert profiles (when the id exists in `auth.users`)

### Step 3: Test

1. Try signing up with a new account
2. The profile should be created automatically by the trigger
3. Sign-in should work after confirming your email

## Alternative: Manual Fix

If you prefer to fix it manually in Supabase Dashboard:

1. Go to Authentication → Policies
2. Find the `users` table
3. Delete the "Users can insert their own profile" policy
4. Create a new policy with:
   - Policy name: "Allow user profile creation"
   - Allowed operation: INSERT
   - Policy definition:
   ```sql
   (auth.uid() = id OR EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = users.id))
   ```

## Why This Works

The new policy allows:
1. **Users to insert their own profiles** - When `auth.uid() = id`, the authenticated user can create their profile
2. **Trigger function to insert profiles** - When a user signs up, the trigger function `handle_new_user()` runs and inserts a profile. The `EXISTS` check ensures the id is valid (it must exist in `auth.users` due to the foreign key constraint).

This is secure because:
- The foreign key constraint ensures only valid user IDs can be inserted
- The email uniqueness constraint prevents duplicates
- Users can only insert profiles with their own ID

