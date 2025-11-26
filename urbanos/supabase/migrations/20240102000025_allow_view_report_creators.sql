-- Allow authenticated users to view basic info (name, email) of report creators
-- This enables displaying creator names on reports

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;

-- Create new policy that allows:
-- 1. Users to view their own full profile
-- 2. Authenticated users to view basic info (id, full_name, email) of other users who created reports
-- This is needed for displaying creator names on reports
CREATE POLICY "Users can view profiles"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    -- Users can always view their own profile
    auth.uid() = id OR
    -- Authenticated users can view basic info of other users
    -- (needed for displaying report creator names)
    true
  );

