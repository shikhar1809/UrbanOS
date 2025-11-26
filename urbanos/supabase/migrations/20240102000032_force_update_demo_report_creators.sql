-- FORCE UPDATE: Change demo reports to show different creators
-- This will work even with one user by creating a workaround

DO $$
DECLARE
  first_user_id UUID;
  all_user_ids UUID[];
  demo_report_titles TEXT[] := ARRAY[
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
  report_rec RECORD;
  i INTEGER := 0;
  target_user_id UUID;
BEGIN
  -- Get all users
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO all_user_ids
  FROM public.users;
  
  IF all_user_ids IS NULL OR array_length(all_user_ids, 1) = 0 THEN
    RAISE NOTICE 'No users found. Cannot update reports.';
    RETURN;
  END IF;
  
  first_user_id := all_user_ids[1];
  
  -- If we have multiple users, reassign in round-robin
  IF array_length(all_user_ids, 1) > 1 THEN
    RAISE NOTICE 'Found % users. Reassigning demo reports...', array_length(all_user_ids, 1);
    
    FOR report_rec IN 
      SELECT id, title FROM public.reports 
      WHERE title = ANY(demo_report_titles)
      ORDER BY created_at ASC
    LOOP
      -- Round-robin through users (skip first user, cycle through others)
      target_user_id := all_user_ids[1 + ((i % (array_length(all_user_ids, 1) - 1)) + 1)];
      
      UPDATE public.reports
      SET user_id = target_user_id
      WHERE id = report_rec.id;
      
      i := i + 1;
    END LOOP;
    
    RAISE NOTICE 'Successfully reassigned % demo reports', i;
  ELSE
    -- ONLY ONE USER: Update reports to use NULL user_id (will show as anonymous/demo)
    -- But wait, user_id is NOT NULL, so we can't do that
    -- Instead, let's just leave them but mark them as anonymous
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ONLY ONE USER FOUND!';
    RAISE NOTICE 'Marking demo reports as anonymous...';
    RAISE NOTICE '========================================';
    
    UPDATE public.reports
    SET is_anonymous = TRUE
    WHERE title = ANY(demo_report_titles);
    
    RAISE NOTICE 'Marked % demo reports as anonymous', 
      (SELECT COUNT(*) FROM public.reports WHERE title = ANY(demo_report_titles));
    
    RAISE NOTICE '';
    RAISE NOTICE 'To show different creator names:';
    RAISE NOTICE '1. Sign out and create 2-3 test accounts';
    RAISE NOTICE '2. Sign back in';
    RAISE NOTICE '3. Re-run this migration';
  END IF;
  
  -- Show final status
  RAISE NOTICE '';
  RAISE NOTICE 'Final demo report ownership:';
  FOR report_rec IN 
    SELECT r.title, u.email, u.full_name, r.is_anonymous
    FROM public.reports r
    LEFT JOIN public.users u ON u.id = r.user_id
    WHERE r.title = ANY(demo_report_titles)
    ORDER BY r.title
  LOOP
    IF report_rec.is_anonymous THEN
      RAISE NOTICE '  - "%": Anonymous', report_rec.title;
    ELSE
      RAISE NOTICE '  - "%": % (%)', 
        report_rec.title, 
        COALESCE(report_rec.full_name, 'No name'), 
        report_rec.email;
    END IF;
  END LOOP;
END $$;

