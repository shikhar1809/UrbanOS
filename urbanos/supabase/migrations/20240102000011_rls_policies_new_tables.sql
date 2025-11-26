-- RLS Policies for new tables

-- Enable RLS on new tables
ALTER TABLE public.report_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.e_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_report_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pil_documents ENABLE ROW LEVEL SECURITY;

-- Report Votes Policies
CREATE POLICY "Anyone can view report votes"
  ON public.report_votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own votes"
  ON public.report_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
  ON public.report_votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON public.report_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- E-Signatures Policies
CREATE POLICY "Users can view e-signatures on reports they can see"
  ON public.e_signatures FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = e_signatures.report_id
      AND (r.user_id = auth.uid() OR r.is_anonymous = false)
    )
  );

CREATE POLICY "Users can create their own e-signatures"
  ON public.e_signatures FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Community Reports Policies
CREATE POLICY "Anyone can view community reports"
  ON public.community_reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Curators can update their community reports"
  ON public.community_reports FOR UPDATE
  TO authenticated
  USING (auth.uid() = curator_id);

CREATE POLICY "Only system can create community reports"
  ON public.community_reports FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Created via trigger

-- Follow-ups Policies
CREATE POLICY "Curators can view follow-ups for their community reports"
  ON public.community_report_followups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.community_reports cr
      WHERE cr.id = community_report_followups.community_report_id
      AND cr.curator_id = auth.uid()
    )
  );

CREATE POLICY "Curators can create follow-ups for their community reports"
  ON public.community_report_followups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.community_reports cr
      WHERE cr.id = community_report_followups.community_report_id
      AND cr.curator_id = auth.uid()
    )
  );

CREATE POLICY "Curators can update follow-ups for their community reports"
  ON public.community_report_followups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.community_reports cr
      WHERE cr.id = community_report_followups.community_report_id
      AND cr.curator_id = auth.uid()
    )
  );

-- PIL Documents Policies
CREATE POLICY "Curators can view PIL documents for their community reports"
  ON public.pil_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.community_reports cr
      WHERE cr.id = pil_documents.community_report_id
      AND cr.curator_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'agency')
    )
  );

CREATE POLICY "Curators can create PIL documents for their community reports"
  ON public.pil_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = curator_id AND
    EXISTS (
      SELECT 1 FROM public.community_reports cr
      WHERE cr.id = pil_documents.community_report_id
      AND cr.curator_id = auth.uid()
    )
  );

CREATE POLICY "Curators can update PIL documents for their community reports"
  ON public.pil_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.community_reports cr
      WHERE cr.id = pil_documents.community_report_id
      AND cr.curator_id = auth.uid()
    )
  );

