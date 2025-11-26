# Fix "Permission Denied for Table Users" Error

## Problem
The error "permission denied for table users" occurs because the Row Level Security (RLS) policies on the `users` table are not properly configured to allow authenticated users to access their own profiles.

## Solution

### Step 1: Apply the Migration

Go to **Supabase Dashboard → SQL Editor** and run:
**`supabase/migrations/20240102000017_fix_users_table_permissions.sql`**

This migration will:
1. ✅ Drop existing restrictive policies
2. ✅ Create new policies with explicit permissions for authenticated users
3. ✅ Grant SELECT, INSERT, UPDATE permissions to the authenticated role
4. ✅ Ensure users can view, update, and create their own profiles

### Step 2: What This Fixes

The migration fixes:
- **View permission**: Authenticated users can view their own profile
- **Update permission**: Authenticated users can update their own profile  
- **Insert permission**: Authenticated users can create their own profile (client-side fallback)
- **Trigger function**: Still allows the trigger function to create profiles during signup

### Step 3: Verify

After applying the migration:
1. The error should be resolved
2. Users should be able to view their profiles
3. Profile loading should work correctly

## Technical Details

The migration:
- Explicitly grants permissions to the `authenticated` role
- Uses `TO authenticated` in all policies to ensure proper access
- Maintains security by only allowing users to access their own profiles (`auth.uid() = id`)
- Allows the trigger function to create profiles via the EXISTS check

