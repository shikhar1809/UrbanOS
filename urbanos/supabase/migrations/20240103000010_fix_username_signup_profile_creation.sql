-- Fix profile creation for username-based signup
-- This ensures the trigger can create profiles even with RLS enabled

-- 1. Ensure the trigger function can bypass RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile, using SECURITY DEFINER to bypass RLS
  -- This function runs with the privileges of the function owner (postgres)
  -- so it can bypass RLS policies
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'username', 
      COALESCE(NEW.email, 'user'),
      'User'
    ),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'citizen')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.users.email),
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Update the existing policy to be more permissive
-- The SECURITY DEFINER function should bypass RLS, but we'll keep the policy as a fallback
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (
    auth.uid() = id OR
    -- Allow if the user exists in auth.users (for newly created accounts)
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = users.id
    )
  );

-- 4. Grant necessary permissions to the function
-- Ensure the function owner has the right to insert
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated;
GRANT INSERT ON public.users TO postgres;

