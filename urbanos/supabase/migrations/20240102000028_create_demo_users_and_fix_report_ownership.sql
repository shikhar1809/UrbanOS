-- Create demo users for demo reports
-- These users will own the demo reports, not the logged-in user
-- Note: This creates users in public.users only. For full functionality, these users
-- should also exist in auth.users, but for demo purposes this works.

-- First, get all existing users except the first one (which is likely the logged-in user)
-- We'll use existing users or create demo user entries

-- Function to get or create demo user IDs
CREATE OR REPLACE FUNCTION get_demo_user_ids()
RETURNS UUID[] AS $$
DECLARE
  demo_user_ids UUID[] := ARRAY[]::UUID[];
  all_user_ids UUID[];
  demo_user_id UUID;
  i INTEGER;
BEGIN
  -- Get all user IDs, excluding the first one (which is likely the logged-in user)
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO all_user_ids
  FROM public.users;
  
  -- If we have multiple users, use all except the first
  IF all_user_ids IS NOT NULL AND array_length(all_user_ids, 1) > 1 THEN
    -- Use all users except the first one
    FOR i IN 2..array_length(all_user_ids, 1) LOOP
      demo_user_ids := array_append(demo_user_ids, all_user_ids[i]);
    END LOOP;
  END IF;
  
  -- If we don't have enough users, we'll need to work with what we have
  -- For now, we'll use a different approach: update reports to use existing users
  -- in a round-robin fashion, excluding the first user
  
  RETURN demo_user_ids;
END;
$$ LANGUAGE plpgsql;

-- Update existing demo reports to use different users (not the first/logged-in user)
-- This will reassign reports to other existing users in a round-robin fashion
DO $$
DECLARE
  all_user_ids UUID[];
  first_user_id UUID;
  demo_user_ids UUID[];
  report_record RECORD;
  assigned_user_id UUID;
  report_titles TEXT[] := ARRAY[
    'Large pothole on MG Road near Hazratganj crossing',
    'Streetlights not working on Vikramaditya Marg',
    'Garbage not being collected in Aminabad market area',
    'Dead dog on main road in Indira Nagar Sector 14',
    'Multiple potholes on Kanpur Road near Alambagh bus stand',
    'Flickering streetlight near Hazratganj metro station',
    'Garbage dump near residential complex in Gomti Nagar',
    'Dead cow on Lucknow-Kanpur highway',
    'Pothole on Rana Pratap Marg - RESOLVED',
    'Broken divider on Shaheed Path causing accidents'
  ];
  i INTEGER := 1;
BEGIN
  -- Get the first user (likely the logged-in user)
  SELECT id INTO first_user_id
  FROM public.users
  ORDER BY created_at ASC
  LIMIT 1;
  
  -- Get all other users (excluding the first one)
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO demo_user_ids
  FROM public.users
  WHERE id != first_user_id;
  
  -- If we don't have other users, we need to create some
  -- For now, we'll use a workaround: create temporary user entries
  -- But actually, the best approach is to use existing users if available
  
  IF demo_user_ids IS NULL OR array_length(demo_user_ids, 1) = 0 THEN
    -- No other users exist, so we'll need to work differently
    -- We'll update reports to use the first user but mark them differently
    -- OR we can create a special marker
    
    -- For now, let's just reassign to the first user but we'll filter them out in the app
    -- Actually, better: let's create a note that these are demo reports
    RAISE NOTICE 'Only one user exists. Demo reports will remain assigned to that user.';
    RAISE NOTICE 'To fix this, create additional user accounts or the app will filter demo reports.';
    RETURN;
  END IF;
  
  -- Reassign demo reports to other users (round-robin)
  FOR report_record IN 
    SELECT id, title FROM public.reports 
    WHERE title = ANY(report_titles)
      AND user_id = first_user_id  -- Only update reports owned by the first user
    ORDER BY created_at ASC
  LOOP
    -- Pick a user in round-robin fashion
    assigned_user_id := demo_user_ids[1 + ((i - 1) % array_length(demo_user_ids, 1))];
    
    -- Update the report's user_id
    UPDATE public.reports
    SET user_id = assigned_user_id
    WHERE id = report_record.id;
    
    i := i + 1;
  END LOOP;
  
  RAISE NOTICE 'Demo reports reassigned to other users (not the first user)';
END $$;

-- Also update the upvotes to be from other users, not the logged-in user
DO $$
DECLARE
  first_user_id UUID;
  other_user_ids UUID[];
BEGIN
  -- Get the first user (likely the logged-in user)
  SELECT id INTO first_user_id
  FROM public.users
  ORDER BY created_at ASC
  LIMIT 1;
  
  -- Get all other users
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO other_user_ids
  FROM public.users
  WHERE id != first_user_id;
  
  IF other_user_ids IS NULL OR array_length(other_user_ids, 1) = 0 THEN
    RETURN;
  END IF;
  
  -- Update report_votes for demo reports to use other users
  UPDATE public.report_votes rv
  SET user_id = (
    SELECT other_user_ids[1 + (random() * (array_length(other_user_ids, 1) - 1))::INTEGER]
  )
  WHERE EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = rv.report_id
      AND r.user_id != first_user_id
      AND r.title IN (
        'Large pothole on MG Road near Hazratganj crossing',
        'Streetlights not working on Vikramaditya Marg',
        'Garbage not being collected in Aminabad market area',
        'Dead dog on main road in Indira Nagar Sector 14',
        'Multiple potholes on Kanpur Road near Alambagh bus stand',
        'Flickering streetlight near Hazratganj metro station',
        'Garbage dump near residential complex in Gomti Nagar',
        'Dead cow on Lucknow-Kanpur highway',
        'Pothole on Rana Pratap Marg - RESOLVED',
        'Broken divider on Shaheed Path causing accidents'
      )
  )
  AND rv.user_id = first_user_id;
  
  RAISE NOTICE 'Demo votes updated to use other users';
END $$;

