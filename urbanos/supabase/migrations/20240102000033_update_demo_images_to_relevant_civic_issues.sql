-- Update demo report images to use relevant civic issue photos
-- Potholes, damaged roads, animal carcasses, streetlights, garbage

UPDATE public.reports
SET images = ARRAY[
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=600&fit=crop'
]::TEXT[]
WHERE title = 'Large pothole on MG Road near Hazratganj crossing';

UPDATE public.reports
SET images = ARRAY[
  'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
]::TEXT[]
WHERE title = 'Streetlights not working on Vikramaditya Marg';

UPDATE public.reports
SET images = ARRAY[
  'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop'
]::TEXT[]
WHERE title = 'Garbage not being collected in Aminabad market area';

UPDATE public.reports
SET images = ARRAY[
  'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=600&fit=crop'
]::TEXT[]
WHERE title = 'Dead dog on main road in Indira Nagar Sector 14';

UPDATE public.reports
SET images = ARRAY[
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=600&fit=crop'
]::TEXT[]
WHERE title = 'Multiple potholes on Kanpur Road near Alambagh bus stand';

UPDATE public.reports
SET images = ARRAY[
  'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
]::TEXT[]
WHERE title = 'Flickering streetlight near Hazratganj metro station';

UPDATE public.reports
SET images = ARRAY[
  'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=800&h=600&fit=crop'
]::TEXT[]
WHERE title = 'Garbage dump near residential complex in Gomti Nagar';

UPDATE public.reports
SET images = ARRAY[
  'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=600&fit=crop'
]::TEXT[]
WHERE title = 'Dead cow on Lucknow-Kanpur highway';

UPDATE public.reports
SET images = ARRAY[
  'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop'
]::TEXT[]
WHERE title = 'Pothole on Rana Pratap Marg - RESOLVED';

UPDATE public.reports
SET images = ARRAY[
  'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'
]::TEXT[]
WHERE title = 'Broken divider on Shaheed Path causing accidents';

