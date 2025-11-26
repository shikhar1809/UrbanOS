-- Allow public (unauthenticated) users to view non-anonymous reports
-- This enables the map to show reports even when users are not signed in

-- Create a policy that allows anyone (authenticated or not) to view non-anonymous reports
CREATE POLICY "Public can view non-anonymous reports"
  ON public.reports FOR SELECT
  USING (is_anonymous = false);

