-- Fix: Allow public viewing of ALL reports (both anonymous and non-anonymous)
-- This ensures reports from WhatsApp and other sources are visible on the map
-- 
-- IMPORTANT: This migration must be run to fix the reports display issue.
-- Run this in Supabase SQL Editor.

-- Step 1: Drop all existing SELECT policies on reports to avoid conflicts
-- This ensures we start with a clean slate
DO $$ 
BEGIN
  -- Drop all known SELECT policies that might conflict
  DROP POLICY IF EXISTS "Public can view non-anonymous reports" ON public.reports;
  DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
  DROP POLICY IF EXISTS "Users can view reports" ON public.reports;
  DROP POLICY IF EXISTS "Public can view all reports" ON public.reports;
  
  -- Log success
  RAISE NOTICE 'Dropped existing SELECT policies on reports table';
END $$;

-- Step 2: Create a comprehensive policy that allows public viewing of ALL reports
-- This policy applies to both authenticated and unauthenticated users
CREATE POLICY "Public can view all reports"
  ON public.reports FOR SELECT
  USING (true); 
  -- Allow viewing all reports regardless of:
  -- - is_anonymous flag
  -- - user_id
  -- - authentication status

-- Step 3: Verify the policy was created
DO $$
BEGIN
  RAISE NOTICE 'Successfully created "Public can view all reports" policy';
  RAISE NOTICE 'All users (authenticated and unauthenticated) can now view all reports';
END $$;

-- Note: Other policies (INSERT, UPDATE, DELETE) remain unchanged
-- This migration only affects SELECT (read) operations for the reports table

