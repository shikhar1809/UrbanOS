-- Fix congestion_tracking table RLS to allow public access for admin panel

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can create congestion entries" ON public.congestion_tracking;
DROP POLICY IF EXISTS "Admins can update congestion entries" ON public.congestion_tracking;
DROP POLICY IF EXISTS "Admins can delete congestion entries" ON public.congestion_tracking;
DROP POLICY IF EXISTS "Admins can view all congestion" ON public.congestion_tracking;

-- Allow anyone to view all congestion data (for admin panel)
CREATE POLICY "Anyone can view all congestion"
  ON public.congestion_tracking FOR SELECT
  USING (true);

-- Allow anyone to create congestion entries (for admin panel)
CREATE POLICY "Anyone can create congestion entries"
  ON public.congestion_tracking FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update congestion entries (for admin panel)
CREATE POLICY "Anyone can update congestion entries"
  ON public.congestion_tracking FOR UPDATE
  USING (true);

-- Allow anyone to delete congestion entries (for admin panel)
CREATE POLICY "Anyone can delete congestion entries"
  ON public.congestion_tracking FOR DELETE
  USING (true);

COMMENT ON POLICY "Anyone can create congestion entries" ON public.congestion_tracking IS 'Allows public access to create congestion entries for admin panel functionality';

