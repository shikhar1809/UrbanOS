-- Lucknow Demo Data Migration
-- This file contains realistic demo data for Lucknow city with real names, locations, and common civic issues

-- Insert Lucknow-specific agencies (will skip if email already exists)
INSERT INTO public.agencies (name, type, email, phone, region)
SELECT * FROM (VALUES
  ('Lucknow Municipal Corporation - Roads Division', 'Infrastructure', 'roads@lmc.gov.in', '0522-2234567', 'Lucknow'),
  ('Lucknow Electricity Supply Administration', 'Utilities', 'lesa@lucknow.gov.in', '0522-2234568', 'Lucknow'),
  ('Lucknow Nagar Nigam - Sanitation Department', 'Sanitation', 'sanitation@lmc.gov.in', '0522-2234569', 'Lucknow'),
  ('Lucknow Municipal Corporation - Animal Control', 'Sanitation', 'animalcontrol@lmc.gov.in', '0522-2234570', 'Lucknow'),
  ('Uttar Pradesh Police - Cyber Crime', 'Security', 'cybercrime@uppolice.gov.in', '0522-2234571', 'Lucknow'),
  ('Public Works Department - Lucknow', 'Infrastructure', 'pwd@up.gov.in', '0522-2234572', 'Lucknow'),
  ('Gomti Nagar Development Authority', 'Infrastructure', 'gnda@gomtinagar.gov.in', '0522-2234573', 'Gomti Nagar'),
  ('Hazratganj Ward Office', 'Municipal', 'hazratganj@lmc.gov.in', '0522-2234574', 'Hazratganj')
) AS v(name, type, email, phone, region)
WHERE NOT EXISTS (SELECT 1 FROM public.agencies WHERE agencies.email = v.email);

-- Insert/Update Lucknow community officials with real Indian names (will skip if email already exists)
INSERT INTO public.community_officials (name, role, region, responsibilities, email, phone)
SELECT * FROM (VALUES
  ('Rajesh Kumar Singh', 'Municipal Commissioner', 'Lucknow', ARRAY['Overall city governance', 'Budget allocation', 'Infrastructure development', 'Public services oversight'], 'rajesh.singh@lmc.gov.in', '0522-2234001'),
  ('Priya Sharma', 'Ward Councilor - Hazratganj', 'Hazratganj', ARRAY['Local infrastructure', 'Citizen complaints', 'Road maintenance', 'Street lighting'], 'priya.sharma@lmc.gov.in', '0522-2234002'),
  ('Amit Kumar Verma', 'Ward Councilor - Gomti Nagar', 'Gomti Nagar', ARRAY['Waste management', 'Public parks', 'Road safety', 'Community development'], 'amit.verma@lmc.gov.in', '0522-2234003'),
  ('Sunita Devi', 'Ward Councilor - Alambagh', 'Alambagh', ARRAY['Sanitation services', 'Drainage systems', 'Street cleaning', 'Public health'], 'sunita.devi@lmc.gov.in', '0522-2234004'),
  ('Vikram Singh', 'Ward Councilor - Aminabad', 'Aminabad', ARRAY['Market area maintenance', 'Traffic management', 'Public facilities', 'Citizen services'], 'vikram.singh@lmc.gov.in', '0522-2234005'),
  ('Anjali Tripathi', 'Ward Councilor - Indira Nagar', 'Indira Nagar', ARRAY['Residential area development', 'Water supply', 'Electricity coordination', 'Community welfare'], 'anjali.tripathi@lmc.gov.in', '0522-2234006'),
  ('Ramesh Chandra', 'Public Works Director', 'Lucknow', ARRAY['Road construction', 'Bridge maintenance', 'Public buildings', 'Infrastructure projects'], 'ramesh.chandra@pwd.up.gov.in', '0522-2234007'),
  ('Kavita Mishra', 'Environmental Officer', 'Lucknow', ARRAY['Waste management', 'Pollution control', 'Green initiatives', 'Environmental compliance'], 'kavita.mishra@lmc.gov.in', '0522-2234008'),
  ('Mohammad Asif', 'Animal Control Officer', 'Lucknow', ARRAY['Stray animal management', 'Animal carcass removal', 'Animal welfare', 'Public safety'], 'mohammad.asif@lmc.gov.in', '0522-2234009'),
  ('Deepak Yadav', 'Traffic Police Inspector', 'Lucknow', ARRAY['Traffic management', 'Road safety', 'Accident prevention', 'Public safety'], 'deepak.yadav@uppolice.gov.in', '0522-2234010')
) AS v(name, role, region, responsibilities, email, phone)
WHERE NOT EXISTS (SELECT 1 FROM public.community_officials WHERE community_officials.email = v.email);

-- Insert historical incidents for Lucknow (for predictor algorithm)
-- Using real Lucknow coordinates
INSERT INTO public.historical_incidents (type, location, occurred_at, severity) VALUES
  ('pothole', '{"lat": 26.8467, "lng": 80.9462}', NOW() - INTERVAL '30 days', 'high'), -- Hazratganj
  ('pothole', '{"lat": 26.8606, "lng": 80.9889}', NOW() - INTERVAL '25 days', 'medium'), -- Gomti Nagar
  ('streetlight', '{"lat": 26.8381, "lng": 80.9236}', NOW() - INTERVAL '20 days', 'low'), -- Alambagh
  ('garbage', '{"lat": 26.8500, "lng": 80.9500}', NOW() - INTERVAL '15 days', 'medium'), -- Aminabad
  ('animal_carcass', '{"lat": 26.8700, "lng": 80.9800}', NOW() - INTERVAL '12 days', 'high'), -- Indira Nagar
  ('pothole', '{"lat": 26.8550, "lng": 80.9400}', NOW() - INTERVAL '10 days', 'high'), -- Near Hazratganj
  ('streetlight', '{"lat": 26.8650, "lng": 80.9900}', NOW() - INTERVAL '8 days', 'low'), -- Gomti Nagar
  ('garbage', '{"lat": 26.8400, "lng": 80.9200}', NOW() - INTERVAL '5 days', 'medium'), -- Alambagh
  ('pothole', '{"lat": 26.8480, "lng": 80.9450}', NOW() - INTERVAL '3 days', 'medium'), -- Hazratganj area
  ('animal_carcass', '{"lat": 26.8620, "lng": 80.9850}', NOW() - INTERVAL '2 days', 'high'), -- Gomti Nagar
  ('streetlight', '{"lat": 26.8520, "lng": 80.9480}', NOW() - INTERVAL '1 day', 'low'), -- Aminabad
  ('garbage', '{"lat": 26.8680, "lng": 80.9750}', NOW() - INTERVAL '12 hours', 'low'); -- Indira Nagar

-- Function to create demo reports (to be called with a user_id)
-- Usage: SELECT create_demo_reports_for_user('user-uuid-here');
CREATE OR REPLACE FUNCTION create_demo_reports_for_user(target_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Report 1: Pothole in Hazratganj
  INSERT INTO public.reports (
    user_id, type, title, description, location, status, priority, is_anonymous, source, submitted_at, images, videos
  ) VALUES (
    target_user_id,
    'pothole',
    'Large pothole on MG Road near Hazratganj crossing',
    'There is a very deep pothole on MG Road near the Hazratganj crossing. It has been causing traffic jams and vehicle damage. Many two-wheelers have had accidents here. Please repair it urgently.',
    '{"lat": 26.8467, "lng": 80.9462, "address": "MG Road, Hazratganj, Lucknow, Uttar Pradesh"}',
    'in-progress',
    'high',
    false,
    'web',
    NOW() - INTERVAL '5 days',
    ARRAY[
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop'
    ],
    ARRAY['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4']
  );

  -- Report 2: Streetlight not working in Gomti Nagar
  INSERT INTO public.reports (
    user_id, type, title, description, location, status, priority, is_anonymous, source, submitted_at, images
  ) VALUES (
    target_user_id,
    'streetlight',
    'Streetlights not working on Vikramaditya Marg',
    'All streetlights on Vikramaditya Marg in Gomti Nagar have been non-functional for the past week. It is very dark and unsafe for pedestrians, especially women. Please fix the streetlights immediately.',
    '{"lat": 26.8606, "lng": 80.9889, "address": "Vikramaditya Marg, Gomti Nagar, Lucknow, Uttar Pradesh"}',
    'received',
    'medium',
    false,
    'web',
    NOW() - INTERVAL '3 days',
    ARRAY[
      'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
    ]
  );

  -- Report 3: Garbage accumulation in Aminabad
  INSERT INTO public.reports (
    user_id, type, title, description, location, status, priority, is_anonymous, source, submitted_at, images, videos
  ) VALUES (
    target_user_id,
    'garbage',
    'Garbage not being collected in Aminabad market area',
    'Garbage has been accumulating in the Aminabad market area for the past 10 days. The smell is unbearable and it is attracting stray animals. The municipal garbage collection has stopped coming to this area.',
    '{"lat": 26.8500, "lng": 80.9500, "address": "Aminabad Market, Lucknow, Uttar Pradesh"}',
    'submitted',
    'high',
    false,
    'web',
    NOW() - INTERVAL '2 days',
    ARRAY[
      'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop'
    ],
    ARRAY['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4']
  );

  -- Report 4: Animal carcass on road in Indira Nagar
  INSERT INTO public.reports (
    user_id, type, title, description, location, status, priority, is_anonymous, source, submitted_at, images
  ) VALUES (
    target_user_id,
    'animal_carcass',
    'Dead dog on main road in Indira Nagar Sector 14',
    'There is a dead dog on the main road in Indira Nagar Sector 14 near the park. It has been there for 2 days and is creating a health hazard. Please remove it immediately.',
    '{"lat": 26.8700, "lng": 80.9800, "address": "Sector 14, Indira Nagar, Lucknow, Uttar Pradesh"}',
    'submitted',
    'high',
    false,
    'web',
    NOW() - INTERVAL '1 day',
    ARRAY[
      'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&h=600&fit=crop'
    ]
  );

  -- Report 5: Pothole in Alambagh
  INSERT INTO public.reports (
    user_id, type, title, description, location, status, priority, is_anonymous, source, submitted_at, images, videos
  ) VALUES (
    target_user_id,
    'pothole',
    'Multiple potholes on Kanpur Road near Alambagh bus stand',
    'There are multiple large potholes on Kanpur Road near the Alambagh bus stand. Buses and other vehicles are having difficulty navigating. This is a high-traffic area and needs immediate attention.',
    '{"lat": 26.8381, "lng": 80.9236, "address": "Kanpur Road, Alambagh, Lucknow, Uttar Pradesh"}',
    'resolved',
    'high',
    false,
    'web',
    NOW() - INTERVAL '7 days',
    ARRAY[
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=600&fit=crop'
    ],
    ARRAY['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4']
  );

  -- Report 6: Streetlight issue in Hazratganj
  INSERT INTO public.reports (
    user_id, type, title, description, location, status, priority, is_anonymous, source, submitted_at, images
  ) VALUES (
    target_user_id,
    'streetlight',
    'Flickering streetlight near Hazratganj metro station',
    'A streetlight near the Hazratganj metro station entrance has been flickering continuously for days. It is very annoying and may cause seizures. Please replace the bulb or fix the wiring.',
    '{"lat": 26.8480, "lng": 80.9450, "address": "Hazratganj Metro Station, Lucknow, Uttar Pradesh"}',
    'received',
    'low',
    false,
    'web',
    NOW() - INTERVAL '4 days',
    ARRAY[
      'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=800&h=600&fit=crop'
    ]
  );

  -- Report 7: Garbage in residential area
  INSERT INTO public.reports (
    user_id, type, title, description, location, status, priority, is_anonymous, source, submitted_at, images
  ) VALUES (
    target_user_id,
    'garbage',
    'Garbage dump near residential complex in Gomti Nagar',
    'Someone has created an illegal garbage dump near our residential complex in Gomti Nagar. The garbage is overflowing and creating a nuisance. Please clear it and take action against those responsible.',
    '{"lat": 26.8620, "lng": 80.9850, "address": "Gomti Nagar Extension, Lucknow, Uttar Pradesh"}',
    'submitted',
    'medium',
    false,
    'web',
    NOW() - INTERVAL '6 hours',
    ARRAY[
      'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=800&h=600&fit=crop'
    ]
  );

  -- Report 8: Animal carcass on highway
  INSERT INTO public.reports (
    user_id, type, title, description, location, status, priority, is_anonymous, source, submitted_at, images, videos
  ) VALUES (
    target_user_id,
    'animal_carcass',
    'Dead cow on Lucknow-Kanpur highway',
    'There is a dead cow on the Lucknow-Kanpur highway near the toll plaza. It is blocking one lane and creating a traffic hazard. Please remove it immediately before it causes an accident.',
    '{"lat": 26.8400, "lng": 80.9000, "address": "Lucknow-Kanpur Highway, Near Toll Plaza, Lucknow, Uttar Pradesh"}',
    'submitted',
    'high',
    false,
    'web',
    NOW() - INTERVAL '3 hours',
    ARRAY[
      'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=600&fit=crop'
    ],
    ARRAY['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4']
  );

  -- Report 9: Resolved pothole (for testing resolved status)
  INSERT INTO public.reports (
    user_id, type, title, description, location, status, priority, is_anonymous, source, submitted_at, resolved_at, response_time_hours, images
  ) VALUES (
    target_user_id,
    'pothole',
    'Pothole on Rana Pratap Marg - RESOLVED',
    'There was a large pothole on Rana Pratap Marg that has now been fixed. Thank you for the quick response!',
    '{"lat": 26.8550, "lng": 80.9400, "address": "Rana Pratap Marg, Lucknow, Uttar Pradesh"}',
    'resolved',
    'medium',
    false,
    'web',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '8 days',
    48,
    ARRAY[
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=600&fit=crop'
    ]
  );

  -- Report 10: Road safety hazard
  INSERT INTO public.reports (
    user_id, type, title, description, location, status, priority, is_anonymous, source, submitted_at, images, videos
  ) VALUES (
    target_user_id,
    'road_safety_hazards',
    'Broken divider on Shaheed Path causing accidents',
    'A section of the road divider on Shaheed Path has been broken and metal rods are protruding. This is very dangerous for vehicles. Several accidents have already occurred. Please repair it urgently.',
    '{"lat": 26.8500, "lng": 80.9600, "address": "Shaheed Path, Lucknow, Uttar Pradesh"}',
    'in-progress',
    'high',
    false,
    'web',
    NOW() - INTERVAL '1 day',
    ARRAY[
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'
    ],
    ARRAY['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4']
  );
END;
$$ LANGUAGE plpgsql;

-- Automatically create demo reports for any existing user
-- This will use the first user found in the system (from public.users which syncs with auth.users)
DO $$
DECLARE
  demo_user_id UUID;
  user_exists BOOLEAN;
BEGIN
  -- Check if any users exist in public.users (which should sync with auth.users via trigger)
  SELECT EXISTS(SELECT 1 FROM public.users LIMIT 1) INTO user_exists;
  
  IF user_exists THEN
    -- Use the first existing user
    SELECT id INTO demo_user_id FROM public.users ORDER BY created_at ASC LIMIT 1;
    
    -- Only create reports if we don't already have demo reports for this user
    IF NOT EXISTS (SELECT 1 FROM public.reports WHERE user_id = demo_user_id AND title LIKE '%Hazratganj%' LIMIT 1) THEN
      PERFORM create_demo_reports_for_user(demo_user_id);
      RAISE NOTICE 'Demo reports created successfully for user: %', demo_user_id;
    ELSE
      RAISE NOTICE 'Demo reports already exist for user: %. Skipping creation.', demo_user_id;
    END IF;
  ELSE
    RAISE NOTICE 'No users found in public.users. Reports will be created automatically when you sign up and re-run this migration.';
  END IF;
END $$;

-- Also create demo reports directly (in case function approach has issues)
-- This creates reports for any existing user automatically
-- Note: These will only insert if a user exists in public.users
INSERT INTO public.reports (
  user_id, type, title, description, location, status, priority, is_anonymous, source, submitted_at, images, videos
)
SELECT 
  (SELECT id FROM public.users ORDER BY created_at ASC LIMIT 1),
  'pothole',
  'Large pothole on MG Road near Hazratganj crossing',
  'There is a very deep pothole on MG Road near the Hazratganj crossing. It has been causing traffic jams and vehicle damage. Many two-wheelers have had accidents here. Please repair it urgently.',
  '{"lat": 26.8467, "lng": 80.9462, "address": "MG Road, Hazratganj, Lucknow, Uttar Pradesh"}'::jsonb,
  'in-progress',
  'high',
  false,
  'web',
  NOW() - INTERVAL '5 days',
  ARRAY[
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop'
  ]::TEXT[],
  ARRAY['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4']::TEXT[]
WHERE EXISTS (SELECT 1 FROM public.users LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM public.reports WHERE title = 'Large pothole on MG Road near Hazratganj crossing' LIMIT 1);

INSERT INTO public.reports (
  user_id, type, title, description, location, status, priority, is_anonymous, source, submitted_at, images
)
SELECT 
  (SELECT id FROM public.users ORDER BY created_at ASC LIMIT 1),
  'streetlight',
  'Streetlights not working on Vikramaditya Marg',
  'All streetlights on Vikramaditya Marg in Gomti Nagar have been non-functional for the past week. It is very dark and unsafe for pedestrians, especially women. Please fix the streetlights immediately.',
  '{"lat": 26.8606, "lng": 80.9889, "address": "Vikramaditya Marg, Gomti Nagar, Lucknow, Uttar Pradesh"}'::jsonb,
  'received',
  'medium',
  false,
  'web',
  NOW() - INTERVAL '3 days',
  ARRAY[
    'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
  ]::TEXT[]
WHERE EXISTS (SELECT 1 FROM public.users LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM public.reports WHERE title = 'Streetlights not working on Vikramaditya Marg' LIMIT 1);

INSERT INTO public.reports (
  user_id, type, title, description, location, status, priority, is_anonymous, source, submitted_at, images, videos
)
SELECT 
  (SELECT id FROM public.users ORDER BY created_at ASC LIMIT 1),
  'garbage',
  'Garbage not being collected in Aminabad market area',
  'Garbage has been accumulating in the Aminabad market area for the past 10 days. The smell is unbearable and it is attracting stray animals. The municipal garbage collection has stopped coming to this area.',
  '{"lat": 26.8500, "lng": 80.9500, "address": "Aminabad Market, Lucknow, Uttar Pradesh"}'::jsonb,
  'submitted',
  'high',
  false,
  'web',
  NOW() - INTERVAL '2 days',
  ARRAY[
    'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop'
  ]::TEXT[],
  ARRAY['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4']::TEXT[]
WHERE EXISTS (SELECT 1 FROM public.users LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM public.reports WHERE title = 'Garbage not being collected in Aminabad market area' LIMIT 1);

INSERT INTO public.reports (
  user_id, type, title, description, location, status, priority, is_anonymous, source, submitted_at, images
)
SELECT 
  (SELECT id FROM public.users ORDER BY created_at ASC LIMIT 1),
  'animal_carcass',
  'Dead dog on main road in Indira Nagar Sector 14',
  'There is a dead dog on the main road in Indira Nagar Sector 14 near the park. It has been there for 2 days and is creating a health hazard. Please remove it immediately.',
  '{"lat": 26.8700, "lng": 80.9800, "address": "Sector 14, Indira Nagar, Lucknow, Uttar Pradesh"}'::jsonb,
  'submitted',
  'high',
  false,
  'web',
  NOW() - INTERVAL '1 day',
  ARRAY[
    'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&h=600&fit=crop'
  ]::TEXT[]
WHERE EXISTS (SELECT 1 FROM public.users LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM public.reports WHERE title = 'Dead dog on main road in Indira Nagar Sector 14' LIMIT 1);

INSERT INTO public.reports (
  user_id, type, title, description, location, status, priority, is_anonymous, source, submitted_at, images, videos
)
SELECT 
  (SELECT id FROM public.users ORDER BY created_at ASC LIMIT 1),
  'pothole',
  'Multiple potholes on Kanpur Road near Alambagh bus stand',
  'There are multiple large potholes on Kanpur Road near the Alambagh bus stand. Buses and other vehicles are having difficulty navigating. This is a high-traffic area and needs immediate attention.',
  '{"lat": 26.8381, "lng": 80.9236, "address": "Kanpur Road, Alambagh, Lucknow, Uttar Pradesh"}'::jsonb,
  'resolved',
  'high',
  false,
  'web',
  NOW() - INTERVAL '7 days',
  ARRAY[
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=600&fit=crop'
  ]::TEXT[],
  ARRAY['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4']::TEXT[]
WHERE EXISTS (SELECT 1 FROM public.users LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM public.reports WHERE title = 'Multiple potholes on Kanpur Road near Alambagh bus stand' LIMIT 1);

INSERT INTO public.reports (
  user_id, type, title, description, location, status, priority, is_anonymous, source, submitted_at, images
)
SELECT 
  (SELECT id FROM public.users ORDER BY created_at ASC LIMIT 1),
  'streetlight',
  'Flickering streetlight near Hazratganj metro station',
  'A streetlight near the Hazratganj metro station entrance has been flickering continuously for days. It is very annoying and may cause seizures. Please replace the bulb or fix the wiring.',
  '{"lat": 26.8480, "lng": 80.9450, "address": "Hazratganj Metro Station, Lucknow, Uttar Pradesh"}'::jsonb,
  'received',
  'low',
  false,
  'web',
  NOW() - INTERVAL '4 days',
  ARRAY[
    'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=800&h=600&fit=crop'
  ]::TEXT[]
WHERE EXISTS (SELECT 1 FROM public.users LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM public.reports WHERE title = 'Flickering streetlight near Hazratganj metro station' LIMIT 1);

INSERT INTO public.reports (
  user_id, type, title, description, location, status, priority, is_anonymous, source, submitted_at, images
)
SELECT 
  (SELECT id FROM public.users ORDER BY created_at ASC LIMIT 1),
  'garbage',
  'Garbage dump near residential complex in Gomti Nagar',
  'Someone has created an illegal garbage dump near our residential complex in Gomti Nagar. The garbage is overflowing and creating a nuisance. Please clear it and take action against those responsible.',
  '{"lat": 26.8620, "lng": 80.9850, "address": "Gomti Nagar Extension, Lucknow, Uttar Pradesh"}'::jsonb,
  'submitted',
  'medium',
  false,
  'web',
  NOW() - INTERVAL '6 hours',
  ARRAY[
    'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=800&h=600&fit=crop'
  ]::TEXT[]
WHERE EXISTS (SELECT 1 FROM public.users LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM public.reports WHERE title = 'Garbage dump near residential complex in Gomti Nagar' LIMIT 1);

INSERT INTO public.reports (
  user_id, type, title, description, location, status, priority, is_anonymous, source, submitted_at, images, videos
)
SELECT 
  (SELECT id FROM public.users ORDER BY created_at ASC LIMIT 1),
  'animal_carcass',
  'Dead cow on Lucknow-Kanpur highway',
  'There is a dead cow on the Lucknow-Kanpur highway near the toll plaza. It is blocking one lane and creating a traffic hazard. Please remove it immediately before it causes an accident.',
  '{"lat": 26.8400, "lng": 80.9000, "address": "Lucknow-Kanpur Highway, Near Toll Plaza, Lucknow, Uttar Pradesh"}'::jsonb,
  'submitted',
  'high',
  false,
  'web',
  NOW() - INTERVAL '3 hours',
  ARRAY[
    'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=600&fit=crop'
  ]::TEXT[],
  ARRAY['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4']::TEXT[]
WHERE EXISTS (SELECT 1 FROM public.users LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM public.reports WHERE title = 'Dead cow on Lucknow-Kanpur highway' LIMIT 1);

INSERT INTO public.reports (
  user_id, type, title, description, location, status, priority, is_anonymous, source, submitted_at, resolved_at, response_time_hours, images
)
SELECT 
  (SELECT id FROM public.users ORDER BY created_at ASC LIMIT 1),
  'pothole',
  'Pothole on Rana Pratap Marg - RESOLVED',
  'There was a large pothole on Rana Pratap Marg that has now been fixed. Thank you for the quick response!',
  '{"lat": 26.8550, "lng": 80.9400, "address": "Rana Pratap Marg, Lucknow, Uttar Pradesh"}'::jsonb,
  'resolved',
  'medium',
  false,
  'web',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '8 days',
  48,
  ARRAY[
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=600&fit=crop'
  ]::TEXT[]
WHERE EXISTS (SELECT 1 FROM public.users LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM public.reports WHERE title = 'Pothole on Rana Pratap Marg - RESOLVED' LIMIT 1);

INSERT INTO public.reports (
  user_id, type, title, description, location, status, priority, is_anonymous, source, submitted_at, images, videos
)
SELECT 
  (SELECT id FROM public.users ORDER BY created_at ASC LIMIT 1),
  'road_safety_hazards',
  'Broken divider on Shaheed Path causing accidents',
  'A section of the road divider on Shaheed Path has been broken and metal rods are protruding. This is very dangerous for vehicles. Several accidents have already occurred. Please repair it urgently.',
  '{"lat": 26.8500, "lng": 80.9600, "address": "Shaheed Path, Lucknow, Uttar Pradesh"}'::jsonb,
  'in-progress',
  'high',
  false,
  'web',
  NOW() - INTERVAL '1 day',
  ARRAY[
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'
  ]::TEXT[],
  ARRAY['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4']::TEXT[]
WHERE EXISTS (SELECT 1 FROM public.users LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM public.reports WHERE title = 'Broken divider on Shaheed Path causing accidents' LIMIT 1);

-- Add upvotes and create community reports for demo data
-- Reports with 50+ upvotes will be promoted to community reports
DO $$
DECLARE
  demo_user_id UUID;
  report_record RECORD;
  vote_counts INTEGER[] := ARRAY[65, 45, 72, 38, 55, 25, 15, 8, 3, 58];
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
  -- Get the first user
  SELECT id INTO demo_user_id FROM public.users ORDER BY created_at ASC LIMIT 1;
  
  IF demo_user_id IS NULL THEN
    RAISE NOTICE 'No users found. Skipping upvote creation.';
    RETURN;
  END IF;
  
  -- For each demo report, add upvotes and create community reports if needed
  FOR report_record IN 
    SELECT id, title FROM public.reports 
    WHERE user_id = demo_user_id
      AND title = ANY(report_titles)
    ORDER BY created_at ASC
  LOOP
    IF i <= array_length(vote_counts, 1) THEN
      -- Add one upvote from the demo user (for display purposes)
      INSERT INTO public.report_votes (report_id, user_id, vote_type)
      VALUES (report_record.id, demo_user_id, 'upvote')
      ON CONFLICT (report_id, user_id) DO NOTHING;
      
      -- If this report should have 50+ upvotes, create community_report entry directly
      IF vote_counts[i] >= 50 THEN
        INSERT INTO public.community_reports (report_id, curator_id, upvote_count, status, promoted_at)
        VALUES (report_record.id, demo_user_id, vote_counts[i], 'active', NOW() - INTERVAL '2 days')
        ON CONFLICT (report_id) DO UPDATE SET 
          upvote_count = vote_counts[i],
          status = 'active';
        
        RAISE NOTICE 'Created community report for: % with % upvotes', report_record.title, vote_counts[i];
      END IF;
      
      i := i + 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Demo upvotes and community reports created successfully!';
END $$;

