# Fix Username Sign-In Issues

## Problem
"Database error creating new user" when trying to sign in with username.

## Solution

### Step 1: Run the Database Migration

Go to Supabase Dashboard → SQL Editor and run:

```sql
-- Fix profile creation for username-based signup
-- This ensures the trigger can create profiles even with RLS enabled

-- 1. Ensure the trigger function can bypass RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile, using SECURITY DEFINER to bypass RLS
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
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = users.id
    )
  );
```

### Step 2: (Optional) Set SUPABASE_SERVICE_ROLE_KEY in Vercel

For the best experience, add `SUPABASE_SERVICE_ROLE_KEY` in Vercel:
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add: `SUPABASE_SERVICE_ROLE_KEY` = (your service role key from Supabase)
3. Redeploy

If you don't set this, the app will fall back to direct signup (which may require email confirmation).

### Step 3: Disable Email Confirmation (Recommended)

1. Go to Supabase Dashboard → Authentication → Settings
2. Find "Enable email confirmations"
3. **Disable it** (turn it off)
4. Save

This allows immediate sign-in after account creation.

## How It Works Now

1. User enters username → clicks "Continue"
2. App tries API route first (if service role key is set)
3. Falls back to direct Supabase signup if API route fails
4. Trigger automatically creates profile when user is created
5. App verifies profile exists and creates it manually if needed
6. User is signed in automatically

## Testing

After running the migration:
1. Visit: https://urbanos-rho.vercel.app/os
2. Click "Profile" → "Sign In"
3. Enter a username (e.g., "testuser")
4. Click "Continue"
5. Should work without errors!

