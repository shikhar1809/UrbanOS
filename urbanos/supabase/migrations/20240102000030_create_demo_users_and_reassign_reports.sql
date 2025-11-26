-- Reassign demo reports to existing users (excluding the first/logged-in user)
-- IMPORTANT: This migration requires at least 2 user accounts to work properly.
-- If you only have one user account, create 2-3 additional test accounts in the app first,
-- then re-run this migration.

-- First, check how many users exist and reassign reports
DO $$
DECLARE
  total_users INTEGER;
  first_user_id UUID;
  other_user_ids UUID[];
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
  -- Count total users
  SELECT COUNT(*) INTO total_users FROM public.users;
  
  -- Get the first user (likely the logged-in user - exclude demo emails)
  SELECT id INTO first_user_id
  FROM public.users
  WHERE email NOT LIKE '%@demo.urbanos.in'
  ORDER BY created_at ASC
  LIMIT 1;
  
  -- Get all other users (excluding the first one and any demo users)
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO other_user_ids
  FROM public.users
  WHERE id != COALESCE(first_user_id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND email NOT LIKE '%@demo.urbanos.in';
  
  RAISE NOTICE 'Total users: %', total_users;
  RAISE NOTICE 'First user ID: %', first_user_id;
  RAISE NOTICE 'Other users available: %', COALESCE(array_length(other_user_ids, 1), 0);
  
  IF other_user_ids IS NULL OR array_length(other_user_ids, 1) = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'WARNING: Only one user account found!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'To fix demo report ownership:';
    RAISE NOTICE '1. Create 2-3 additional test accounts in your app (sign up with different emails)';
    RAISE NOTICE '2. Re-run this migration';
    RAISE NOTICE '3. Demo reports will then be assigned to different users';
    RAISE NOTICE '';
    RAISE NOTICE 'For now, the app will filter demo reports from "My Reports" view.';
    RAISE NOTICE 'But they will still show your name as creator in "All Reports".';
    RAISE NOTICE '========================================';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Reassigning demo reports to other users...';
  
  -- Reassign demo reports to other users (round-robin)
  FOR report_record IN 
    SELECT id, title FROM public.reports 
    WHERE title = ANY(report_titles)
    ORDER BY created_at ASC
  LOOP
    -- Pick a user in round-robin fashion
    assigned_user_id := other_user_ids[1 + ((i - 1) % array_length(other_user_ids, 1))];
    
    -- Update the report's user_id
    UPDATE public.reports
    SET user_id = assigned_user_id
    WHERE id = report_record.id;
    
    RAISE NOTICE 'Reassigned "%" to user %', report_record.title, assigned_user_id;
    
    i := i + 1;
  END LOOP;
  
  RAISE NOTICE 'Successfully reassigned % demo reports to other users', i - 1;
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
  WHERE email NOT LIKE '%@demo.urbanos.in'
  ORDER BY created_at ASC
  LIMIT 1;
  
  -- Get all other users
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO other_user_ids
  FROM public.users
  WHERE id != COALESCE(first_user_id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND email NOT LIKE '%@demo.urbanos.in';
  
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
  
  RAISE NOTICE 'Updated demo votes to use other users';
END $$;
