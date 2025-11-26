-- Function to automatically promote report to community report when it reaches 50 upvotes
CREATE OR REPLACE FUNCTION promote_to_community_report()
RETURNS TRIGGER AS $$
DECLARE
  upvote_count INTEGER;
  downvote_count INTEGER;
  net_votes INTEGER;
  report_exists BOOLEAN;
BEGIN
  -- Count upvotes and downvotes for the report
  SELECT 
    COUNT(*) FILTER (WHERE vote_type = 'upvote'),
    COUNT(*) FILTER (WHERE vote_type = 'downvote')
  INTO upvote_count, downvote_count
  FROM public.report_votes
  WHERE report_id = NEW.report_id;
  
  net_votes := upvote_count;
  
  -- Check if report already has a community_report entry
  SELECT EXISTS(SELECT 1 FROM public.community_reports WHERE report_id = NEW.report_id)
  INTO report_exists;
  
  -- If report has 50+ upvotes and doesn't already have a community_report entry
  IF net_votes >= 50 AND NOT report_exists THEN
    -- Create community_report entry
    INSERT INTO public.community_reports (report_id, curator_id, upvote_count, status, promoted_at)
    SELECT 
      r.id,
      r.user_id,
      upvote_count,
      'active',
      NOW()
    FROM public.reports r
    WHERE r.id = NEW.report_id;
    
    -- Create notification for curator
    INSERT INTO public.notifications (user_id, type, title, message, report_id)
    SELECT 
      r.user_id,
      'report_update',
      'Report Promoted to Community Report',
      'Your report "' || r.title || '" has reached 50 upvotes and has been promoted to a Community Report!',
      r.id
    FROM public.reports r
    WHERE r.id = NEW.report_id;
  END IF;
  
  -- Update upvote_count if community_report exists
  IF report_exists THEN
    UPDATE public.community_reports
    SET upvote_count = upvote_count
    WHERE report_id = NEW.report_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires after insert or update on report_votes
CREATE TRIGGER check_promote_to_community_report
  AFTER INSERT OR UPDATE ON public.report_votes
  FOR EACH ROW
  EXECUTE FUNCTION promote_to_community_report();

