-- Fix RLS policy to allow authenticated users to view non-anonymous reports from other users
-- This enables the "All Reports" view to work for citizens

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;

-- Create a new policy that allows:
-- 1. Users to view their own reports
-- 2. Agency/admin users to view all reports
-- 3. Authenticated users to view non-anonymous reports from other users
CREATE POLICY "Users can view reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (
    -- Users can always view their own reports
    auth.uid() = user_id OR
    -- Agency/admin users can view all reports
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('agency', 'admin')
    ) OR
    -- Authenticated users can view non-anonymous reports from other users
    is_anonymous = false
  );

