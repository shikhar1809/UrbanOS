-- Fix RLS policy to allow authenticated users to insert their own profiles
-- This is needed for client-side profile creation fallback

-- Drop the old restrictive policy if it exists
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow user profile creation via trigger" ON public.users;
DROP POLICY IF EXISTS "Allow user profile creation" ON public.users;

-- Create a comprehensive insert policy that allows:
-- 1. Authenticated users to insert their own profile (client-side fallback)
-- 2. Trigger function to insert profiles (via auth.users check)
CREATE POLICY "Allow user profile creation"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if authenticated user is inserting their own profile
    auth.uid() = id OR
    -- Allow if the ID exists in auth.users (for trigger function)
    EXISTS (
      SELECT 1 
      FROM auth.users 
      WHERE auth.users.id = users.id
    )
  );

-- Ensure users can still view and update their own profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR
    -- Allow viewing if profile exists for authenticated user
    EXISTS (
      SELECT 1 FROM auth.users WHERE auth.users.id = users.id
    )
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

