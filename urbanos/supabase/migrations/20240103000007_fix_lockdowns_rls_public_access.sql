-- Fix area_lockdowns table RLS to allow public access for admin panel

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Only admins can create lockdowns" ON public.area_lockdowns;
DROP POLICY IF EXISTS "Only admins can update lockdowns" ON public.area_lockdowns;
DROP POLICY IF EXISTS "Only admins can delete lockdowns" ON public.area_lockdowns;
DROP POLICY IF EXISTS "Admins can view all lockdowns" ON public.area_lockdowns;

-- Make created_by nullable to allow unauthenticated inserts
ALTER TABLE public.area_lockdowns 
  ALTER COLUMN created_by DROP NOT NULL;

-- Allow anyone to view all lockdowns (for admin panel)
CREATE POLICY "Anyone can view all lockdowns"
  ON public.area_lockdowns FOR SELECT
  USING (true);

-- Allow anyone to create lockdowns (for admin panel)
CREATE POLICY "Anyone can create lockdowns"
  ON public.area_lockdowns FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update lockdowns (for admin panel)
CREATE POLICY "Anyone can update lockdowns"
  ON public.area_lockdowns FOR UPDATE
  USING (true);

-- Allow anyone to delete lockdowns (for admin panel)
CREATE POLICY "Anyone can delete lockdowns"
  ON public.area_lockdowns FOR DELETE
  USING (true);

COMMENT ON POLICY "Anyone can create lockdowns" ON public.area_lockdowns IS 'Allows public access to create lockdowns for admin panel functionality';

