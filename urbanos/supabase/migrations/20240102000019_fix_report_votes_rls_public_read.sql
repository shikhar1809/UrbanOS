-- Fix RLS policies for report_votes to allow public read access
-- Vote counts should be visible to everyone, even unauthenticated users

-- Drop ALL existing SELECT policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view report votes" ON public.report_votes;
DROP POLICY IF EXISTS "Users can view report votes" ON public.report_votes;
DROP POLICY IF EXISTS "Public can view report votes" ON public.report_votes;

-- Create new policy that allows public read access (no authentication required)
-- IMPORTANT: We do NOT use "TO authenticated" or "TO public" here
-- Omitting the TO clause makes the policy apply to ALL users (authenticated and unauthenticated)
CREATE POLICY "Anyone can view report votes"
  ON public.report_votes FOR SELECT
  USING (true);  -- No authentication required for reading votes

-- Verify the policy was created correctly
-- The policy should allow anyone (authenticated or not) to SELECT from report_votes
-- The INSERT, UPDATE, DELETE policies remain the same (require authentication)

