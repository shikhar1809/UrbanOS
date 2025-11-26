-- Fix alerts table RLS to allow public access for admin panel
-- This allows the admin panel to work without requiring authentication

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Only agencies and admins can create alerts" ON public.alerts;
DROP POLICY IF EXISTS "Only agencies and admins can update alerts" ON public.alerts;
DROP POLICY IF EXISTS "Agencies and admins can view all alerts" ON public.alerts;

-- Make created_by nullable to allow unauthenticated inserts
ALTER TABLE public.alerts 
  ALTER COLUMN created_by DROP NOT NULL;

-- Allow anyone to view all alerts (for admin panel)
CREATE POLICY "Anyone can view all alerts"
  ON public.alerts FOR SELECT
  USING (true);

-- Allow anyone to create alerts (for admin panel)
CREATE POLICY "Anyone can create alerts"
  ON public.alerts FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update alerts (for admin panel)
CREATE POLICY "Anyone can update alerts"
  ON public.alerts FOR UPDATE
  USING (true);

-- Allow anyone to delete alerts (for admin panel)
CREATE POLICY "Anyone can delete alerts"
  ON public.alerts FOR DELETE
  USING (true);

-- Add comment
COMMENT ON POLICY "Anyone can create alerts" ON public.alerts IS 'Allows public access to create alerts for admin panel functionality';

