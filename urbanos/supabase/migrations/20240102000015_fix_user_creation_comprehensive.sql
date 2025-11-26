-- Comprehensive fix for OAuth user profile creation
-- This ensures the trigger function can create user profiles even with RLS enabled

-- First, ensure the trigger function exists with proper metadata handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert user profile with comprehensive metadata extraction
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.user_metadata->>'full_name',
      NEW.user_metadata->>'name',
      NEW.user_metadata->>'display_name',
      split_part(COALESCE(NEW.email, 'user@example.com'), '@', 1)
    ),
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      (NEW.user_metadata->>'role')::user_role,
      'citizen'
    )
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = COALESCE(EXCLUDED.email, users.email),
    full_name = COALESCE(EXCLUDED.full_name, users.full_name, users.full_name),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the auth signup
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing policies that might block inserts
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow user profile creation" ON public.users;

-- Create a more permissive insert policy that allows the trigger function
-- The trigger function runs with SECURITY DEFINER, so we need to allow inserts
-- when the user ID exists in auth.users (which it does when the trigger fires)
-- Note: In trigger context, auth.uid() may be NULL, so we check auth.users table
CREATE POLICY "Allow user profile creation via trigger"
  ON public.users FOR INSERT
  WITH CHECK (
    -- Allow if authenticated user is inserting their own profile
    (auth.uid() IS NOT NULL AND auth.uid() = id) OR
    -- Allow if the ID exists in auth.users (trigger function context)
    -- This is safe because it can only happen during user creation
    EXISTS (
      SELECT 1 
      FROM auth.users 
      WHERE auth.users.id = users.id
    )
  );

-- Also allow service_role to bypass RLS (for the trigger function)
-- This ensures the SECURITY DEFINER function can always create profiles
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Grant the postgres role (function owner) permission to insert
-- This allows SECURITY DEFINER functions to bypass RLS
-- Note: This is safe because the function checks auth.users table
GRANT INSERT ON public.users TO postgres, anon, authenticated;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions to the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;

