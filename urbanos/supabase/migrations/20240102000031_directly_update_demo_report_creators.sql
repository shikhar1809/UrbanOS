-- Directly update demo reports to show different creator names
-- This works by updating the user_id to use existing users in a round-robin fashion
-- OR if only one user exists, it will create a workaround

-- First, let's see what we're working with
DO $$
DECLARE
  first_user_id UUID;
  all_user_ids UUID[];
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
  user_count INTEGER;
BEGIN
  -- Get all user IDs
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO all_user_ids
  FROM public.users;
  
  SELECT COUNT(*) INTO user_count FROM public.users;
  
  RAISE NOTICE 'Total users in database: %', user_count;
  
  IF all_user_ids IS NULL OR array_length(all_user_ids, 1) = 0 THEN
    RAISE NOTICE 'No users found. Cannot reassign reports.';
    RETURN;
  END IF;
  
  -- Get the first user (likely the logged-in user)
  first_user_id := all_user_ids[1];
  
  RAISE NOTICE 'First user ID: %', first_user_id;
  RAISE NOTICE 'Total users available: %', array_length(all_user_ids, 1);
  
  -- If we have multiple users, reassign reports
  IF array_length(all_user_ids, 1) > 1 THEN
    RAISE NOTICE 'Multiple users found. Reassigning reports...';
    
    -- Reassign demo reports to other users (round-robin, excluding first user)
    FOR report_record IN 
      SELECT id, title FROM public.reports 
      WHERE title = ANY(report_titles)
      ORDER BY created_at ASC
    LOOP
      -- Pick a user in round-robin fashion (skip first user)
      -- Use modulo to cycle through users 2, 3, 4, etc.
      assigned_user_id := all_user_ids[1 + (i % (array_length(all_user_ids, 1) - 1)) + 1];
      
      -- Update the report's user_id
      UPDATE public.reports
      SET user_id = assigned_user_id
      WHERE id = report_record.id;
      
      RAISE NOTICE 'Reassigned "%" to user %', report_record.title, assigned_user_id;
      
      i := i + 1;
    END LOOP;
    
    RAISE NOTICE 'Successfully reassigned % demo reports', i - 1;
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ONLY ONE USER ACCOUNT FOUND!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'To fix creator names on demo reports:';
    RAISE NOTICE '1. Sign out of your current account';
    RAISE NOTICE '2. Create 2-3 additional test accounts with different emails';
    RAISE NOTICE '3. Sign back in with your main account';
    RAISE NOTICE '4. Re-run this migration';
    RAISE NOTICE '';
    RAISE NOTICE 'The app will filter demo reports from "My Reports",';
    RAISE NOTICE 'but they will show your name as creator until reassigned.';
    RAISE NOTICE '========================================';
  END IF;
END $$;

-- Show current ownership after update
DO $$
DECLARE
  rec RECORD;
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
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Current demo report ownership:';
  FOR rec IN 
    SELECT r.title, u.email as owner_email, u.full_name as owner_name, r.user_id
    FROM public.reports r
    JOIN public.users u ON u.id = r.user_id
    WHERE r.title = ANY(report_titles)
    ORDER BY r.title
  LOOP
    RAISE NOTICE '  - "%": % (%) [ID: %]', rec.title, COALESCE(rec.owner_name, 'No name'), rec.owner_email, rec.user_id;
  END LOOP;
END $$;

