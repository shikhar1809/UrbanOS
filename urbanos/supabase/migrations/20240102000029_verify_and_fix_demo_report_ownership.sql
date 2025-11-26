-- Verify and fix demo report ownership
-- This will check if demo reports are owned by the first user and provide a report

DO $$
DECLARE
  first_user_id UUID;
  first_user_email TEXT;
  demo_report_count INTEGER;
  other_users_count INTEGER;
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
  -- Get the first user (likely the logged-in user)
  SELECT id, email INTO first_user_id, first_user_email
  FROM public.users
  ORDER BY created_at ASC
  LIMIT 1;
  
  -- Count how many demo reports are owned by the first user
  SELECT COUNT(*) INTO demo_report_count
  FROM public.reports
  WHERE title = ANY(report_titles)
    AND user_id = first_user_id;
  
  -- Count how many other users exist
  SELECT COUNT(*) INTO other_users_count
  FROM public.users
  WHERE id != first_user_id;
  
  RAISE NOTICE 'First user: % (%)', first_user_email, first_user_id;
  RAISE NOTICE 'Demo reports owned by first user: %', demo_report_count;
  RAISE NOTICE 'Other users available: %', other_users_count;
  
  IF demo_report_count > 0 AND other_users_count = 0 THEN
    RAISE NOTICE 'WARNING: Demo reports are owned by the logged-in user, but no other users exist.';
    RAISE NOTICE 'SOLUTION: Create additional user accounts in the app, then re-run migration 20240102000028.';
    RAISE NOTICE 'The app will filter these reports from "My Reports" view, but they will show the logged-in user as creator in "All Reports".';
  ELSIF demo_report_count > 0 AND other_users_count > 0 THEN
    RAISE NOTICE 'Demo reports need to be reassigned. Run migration 20240102000028 to reassign them.';
  ELSE
    RAISE NOTICE 'Demo reports appear to be correctly assigned to other users.';
  END IF;
  
  -- Show current ownership distribution
  RAISE NOTICE 'Current demo report ownership:';
  FOR rec IN 
    SELECT r.title, u.email as owner_email, u.full_name as owner_name
    FROM public.reports r
    JOIN public.users u ON u.id = r.user_id
    WHERE r.title = ANY(report_titles)
    ORDER BY r.title
  LOOP
    RAISE NOTICE '  - %: owned by % (%)', rec.title, rec.owner_name, rec.owner_email;
  END LOOP;
END $$;

