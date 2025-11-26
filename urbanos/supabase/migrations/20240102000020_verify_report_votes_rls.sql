-- Verify and fix RLS policies for report_votes
-- This migration ensures that vote counts are visible to everyone

-- First, drop ALL existing SELECT policies to ensure a clean slate
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'report_votes' 
        AND (policyname LIKE '%view%' OR policyname LIKE '%SELECT%')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.report_votes', r.policyname);
    END LOOP;
END $$;

-- Drop the specific policy we know exists
DROP POLICY IF EXISTS "Anyone can view report votes" ON public.report_votes;
DROP POLICY IF EXISTS "Users can view report votes" ON public.report_votes;
DROP POLICY IF EXISTS "Public can view report votes" ON public.report_votes;

-- Create a new policy that allows public read access
-- By omitting "TO authenticated" or "TO public", this policy applies to ALL roles
CREATE POLICY "Anyone can view report votes"
  ON public.report_votes FOR SELECT
  USING (true);

-- Grant SELECT permission to authenticated role (for API routes)
-- This ensures authenticated users can read votes
GRANT SELECT ON public.report_votes TO authenticated;

-- Grant SELECT permission to anon role (for public access)
-- This ensures unauthenticated users can read votes
GRANT SELECT ON public.report_votes TO anon;

