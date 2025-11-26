-- Add videos field to reports table
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS videos TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.reports.videos IS 'Array of video file URLs stored in Supabase storage';

