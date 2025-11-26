-- Remove community reports that don't meet the 50 upvote criteria
-- This ensures only reports with 50+ upvotes are shown as community reports

-- Delete community reports with less than 50 upvotes
DELETE FROM public.community_reports
WHERE upvote_count < 50;

-- Log the cleanup
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Removed % community reports that did not meet 50 upvote criteria', deleted_count;
END $$;

-- Add a check constraint to prevent future invalid community reports
-- (Optional - uncomment if you want to enforce this at the database level)
-- ALTER TABLE public.community_reports
-- ADD CONSTRAINT check_min_upvotes CHECK (upvote_count >= 50);

