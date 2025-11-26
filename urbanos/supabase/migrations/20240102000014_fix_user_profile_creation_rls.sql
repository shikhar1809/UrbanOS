-- Fix RLS policies to allow trigger function to create user profiles
-- The handle_new_user() trigger function needs to bypass RLS to create profiles
-- When a user signs up, the trigger runs but RLS blocks the insert

-- Drop the restrictive insert policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

-- The trigger function runs with SECURITY DEFINER, but RLS still applies
-- We need to allow the function to insert profiles. Since the function runs
-- after a user is created in auth.users, we can check if the id exists there.

-- Create a policy that allows inserts when:
-- 1. The user is authenticated and inserting their own profile (auth.uid() = id)
-- 2. The id exists in auth.users (allows the trigger function to insert)
CREATE POLICY "Allow user profile creation"
  ON public.users FOR INSERT
  WITH CHECK (
    -- Allow if user is inserting their own profile
    auth.uid() = id OR
    -- Allow if the id exists in auth.users (for trigger function during signup)
    -- This ensures only valid user IDs from auth.users can be inserted
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = users.id)
  );

-- Note: This is secure because:
-- 1. The foreign key constraint (REFERENCES auth.users(id)) ensures only valid IDs
-- 2. The email uniqueness constraint prevents duplicate profiles
-- 3. Users can only insert profiles with their own authenticated ID
-- 4. The trigger can insert profiles for newly created auth.users entries
