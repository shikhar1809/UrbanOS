-- Fix permissions for users table to allow authenticated users to access their own profile
-- This fixes "permission denied for table users" error

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow user profile creation" ON public.users;
DROP POLICY IF EXISTS "Allow user profile creation via trigger" ON public.users;

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to insert their own profile (for client-side fallback)
-- Also allow trigger function to create profiles
CREATE POLICY "Allow user profile creation"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be inserting their own profile (auth.uid() matches id)
    auth.uid() = id OR
    -- OR allow if the ID exists in auth.users (for trigger function during signup)
    EXISTS (
      SELECT 1 
      FROM auth.users 
      WHERE auth.users.id = users.id
    )
  );

-- Grant necessary permissions to authenticated role
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
-- Note: No sequence needed as users table uses UUID (not auto-increment)

-- Ensure the trigger function can still create profiles
-- The function runs with SECURITY DEFINER so it should bypass RLS
-- But we also need to ensure the policy allows it
-- The INSERT policy above already covers this with the EXISTS check

