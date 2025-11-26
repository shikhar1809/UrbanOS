-- Allow curators to view reports they're curating
-- This is needed for PIL document generation and other curator operations

CREATE POLICY "Curators can view reports they're curating"
  ON public.reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.community_reports cr
      WHERE cr.report_id = reports.id
      AND cr.curator_id = auth.uid()
    )
  );

