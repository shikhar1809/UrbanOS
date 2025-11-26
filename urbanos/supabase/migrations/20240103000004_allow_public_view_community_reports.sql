-- Fix: Allow public viewing of community reports
-- This ensures community reports are visible to everyone, including logged-out users
-- 
-- IMPORTANT: This migration must be run to fix the community reports display issue.
-- Run this in Supabase SQL Editor.

-- Step 1: Drop existing SELECT policy on community_reports
DO $$ 
BEGIN
  -- Drop the existing policy that only allows authenticated users
  DROP POLICY IF EXISTS "Anyone can view community reports" ON public.community_reports;
  
  -- Log success
  RAISE NOTICE 'Dropped existing SELECT policy on community_reports table';
END $$;

-- Step 2: Create a new policy that allows public viewing (both authenticated and unauthenticated)
CREATE POLICY "Public can view community reports"
  ON public.community_reports FOR SELECT
  USING (true);
  -- Allow viewing all community reports regardless of:
  -- - authentication status
  -- - curator_id
  -- - user role

-- Step 3: Verify the policy was created
DO $$
BEGIN
  RAISE NOTICE 'Successfully created "Public can view community reports" policy';
  RAISE NOTICE 'All users (authenticated and unauthenticated) can now view community reports';
END $$;

-- Step 4: Allow public viewing of curator user info (for community reports display)
-- This allows unauthenticated users to see curator names/emails in community reports
DO $$ 
BEGIN
  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS "Public can view curator profiles" ON public.users;
  
  -- Log
  RAISE NOTICE 'Dropped existing curator profile policy if it existed';
END $$;

-- Create policy to allow viewing user profiles when they are curators of community reports
CREATE POLICY "Public can view curator profiles"
  ON public.users FOR SELECT
  USING (
    -- Allow viewing if user is a curator of any community report
    EXISTS (
      SELECT 1 FROM public.community_reports cr
      WHERE cr.curator_id = users.id
    )
    OR
    -- Also allow viewing own profile (for authenticated users)
    auth.uid() = id
  );

-- Step 5: Verify
DO $$
BEGIN
  RAISE NOTICE 'Successfully created "Public can view curator profiles" policy';
  RAISE NOTICE 'Unauthenticated users can now view curator info in community reports';
END $$;

-- Note: Other policies (INSERT, UPDATE, DELETE) remain unchanged
-- This migration only affects SELECT (read) operations for the community_reports and users tables

