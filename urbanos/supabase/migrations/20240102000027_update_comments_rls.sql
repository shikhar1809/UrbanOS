-- Update RLS policy for report_comments to allow viewing comments on reports users can view
DROP POLICY IF EXISTS "Users can view comments on their reports" ON public.report_comments;

CREATE POLICY "Users can view comments on visible reports"
  ON public.report_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_comments.report_id 
        AND (
          r.user_id = auth.uid() OR
          r.is_anonymous = false OR
          EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('agency', 'admin')
          )
        )
    )
  );

