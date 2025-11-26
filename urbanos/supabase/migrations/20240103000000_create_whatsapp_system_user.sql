-- Create WhatsApp System User for anonymous reports
-- This migration creates a system user profile for WhatsApp reports
-- Note: You must first create the auth user via Supabase Dashboard or Admin API

-- Step 1: Check if system user already exists
DO $$
DECLARE
  system_user_id UUID;
  auth_user_exists BOOLEAN;
BEGIN
  -- Check if user exists in public.users
  SELECT id INTO system_user_id
  FROM public.users
  WHERE email = 'whatsapp@urbanos.local'
  LIMIT 1;

  -- If user already exists, exit
  IF system_user_id IS NOT NULL THEN
    RAISE NOTICE 'WhatsApp system user already exists with ID: %', system_user_id;
    RETURN;
  END IF;

  -- Try to find an existing auth user with this email
  -- Since we can't directly query auth.users, we'll need to create it separately
  -- For now, we'll create a placeholder that can be updated later
  
  RAISE NOTICE 'System user profile does not exist.';
  RAISE NOTICE '';
  RAISE NOTICE 'Please follow these steps:';
  RAISE NOTICE '1. Go to Supabase Dashboard > Authentication > Users';
  RAISE NOTICE '2. Click "Add User" and create a user with:';
  RAISE NOTICE '   - Email: whatsapp@urbanos.local';
  RAISE NOTICE '   - Password: (generate a secure random password)';
  RAISE NOTICE '3. Note the User ID (UUID) from the created user';
  RAISE NOTICE '4. Run the SQL query below with the actual UUID:';
  RAISE NOTICE '';
  RAISE NOTICE 'INSERT INTO public.users (id, email, full_name, role)';
  RAISE NOTICE 'VALUES (''YOUR_USER_ID_HERE'', ''whatsapp@urbanos.local'', ''WhatsApp User'', ''citizen'');';
  RAISE NOTICE '';
  RAISE NOTICE 'Alternatively, you can run the helper function after creating the auth user.';

END $$;

-- Helper function to create system user profile if auth user exists
-- Usage: SELECT create_whatsapp_system_user('your-user-id-from-auth');
CREATE OR REPLACE FUNCTION create_whatsapp_system_user(auth_user_uuid UUID)
RETURNS TABLE(user_id UUID, email TEXT, created BOOLEAN) AS $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  -- Check if profile already exists
  SELECT EXISTS(
    SELECT 1 FROM public.users WHERE id = auth_user_uuid
  ) INTO user_exists;

  IF user_exists THEN
    -- User profile already exists
    RETURN QUERY
    SELECT u.id, u.email, false
    FROM public.users u
    WHERE u.id = auth_user_uuid;
  ELSE
    -- Create new user profile
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
      auth_user_uuid,
      'whatsapp@urbanos.local',
      'WhatsApp User',
      'citizen'
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      updated_at = NOW();
    
    RETURN QUERY
    SELECT auth_user_uuid, 'whatsapp@urbanos.local', true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_whatsapp_system_user(UUID) TO authenticated, anon;

