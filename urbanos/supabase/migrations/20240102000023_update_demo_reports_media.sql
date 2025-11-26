-- Migration to update existing demo reports with images and videos
-- Run this if you already ran the lucknow_demo_data migration before images/videos were added

DO $$
DECLARE
  report_record RECORD;
BEGIN
  -- Update each demo report with appropriate images and videos based on title
  
  -- Large pothole on MG Road
  UPDATE public.reports
  SET 
    images = ARRAY[
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop'
    ]::TEXT[],
    videos = ARRAY['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4']::TEXT[]
  WHERE title = 'Large pothole on MG Road near Hazratganj crossing'
    AND (images IS NULL OR array_length(images, 1) = 0 OR images = ARRAY[]::TEXT[]);
  
  -- Streetlights not working
  UPDATE public.reports
  SET 
    images = ARRAY[
      'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
    ]::TEXT[]
  WHERE title = 'Streetlights not working on Vikramaditya Marg'
    AND (images IS NULL OR array_length(images, 1) = 0 OR images = ARRAY[]::TEXT[]);
  
  -- Garbage not being collected
  UPDATE public.reports
  SET 
    images = ARRAY[
      'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop'
    ]::TEXT[],
    videos = ARRAY['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4']::TEXT[]
  WHERE title = 'Garbage not being collected in Aminabad market area'
    AND (images IS NULL OR array_length(images, 1) = 0 OR images = ARRAY[]::TEXT[]);
  
  -- Dead dog
  UPDATE public.reports
  SET 
    images = ARRAY[
      'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&h=600&fit=crop'
    ]::TEXT[]
  WHERE title = 'Dead dog on main road in Indira Nagar Sector 14'
    AND (images IS NULL OR array_length(images, 1) = 0 OR images = ARRAY[]::TEXT[]);
  
  -- Multiple potholes on Kanpur Road
  UPDATE public.reports
  SET 
    images = ARRAY[
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=600&fit=crop'
    ]::TEXT[],
    videos = ARRAY['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4']::TEXT[]
  WHERE title = 'Multiple potholes on Kanpur Road near Alambagh bus stand'
    AND (images IS NULL OR array_length(images, 1) = 0 OR images = ARRAY[]::TEXT[]);
  
  -- Flickering streetlight
  UPDATE public.reports
  SET 
    images = ARRAY[
      'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=800&h=600&fit=crop'
    ]::TEXT[]
  WHERE title = 'Flickering streetlight near Hazratganj metro station'
    AND (images IS NULL OR array_length(images, 1) = 0 OR images = ARRAY[]::TEXT[]);
  
  -- Garbage dump near residential complex
  UPDATE public.reports
  SET 
    images = ARRAY[
      'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=800&h=600&fit=crop'
    ]::TEXT[]
  WHERE title = 'Garbage dump near residential complex in Gomti Nagar'
    AND (images IS NULL OR array_length(images, 1) = 0 OR images = ARRAY[]::TEXT[]);
  
  -- Dead cow on highway
  UPDATE public.reports
  SET 
    images = ARRAY[
      'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=600&fit=crop'
    ]::TEXT[],
    videos = ARRAY['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4']::TEXT[]
  WHERE title = 'Dead cow on Lucknow-Kanpur highway'
    AND (images IS NULL OR array_length(images, 1) = 0 OR images = ARRAY[]::TEXT[]);
  
  -- Pothole on Rana Pratap Marg (RESOLVED)
  UPDATE public.reports
  SET 
    images = ARRAY[
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=600&fit=crop'
    ]::TEXT[]
  WHERE title = 'Pothole on Rana Pratap Marg - RESOLVED'
    AND (images IS NULL OR array_length(images, 1) = 0 OR images = ARRAY[]::TEXT[]);
  
  -- Broken divider on Shaheed Path
  UPDATE public.reports
  SET 
    images = ARRAY[
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'
    ]::TEXT[],
    videos = ARRAY['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4']::TEXT[]
  WHERE title = 'Broken divider on Shaheed Path causing accidents'
    AND (images IS NULL OR array_length(images, 1) = 0 OR images = ARRAY[]::TEXT[]);
  
  RAISE NOTICE 'Updated demo reports with images and videos';
END $$;

