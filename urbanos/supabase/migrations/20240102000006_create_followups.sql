-- Create community_report_followups table
CREATE TABLE IF NOT EXISTS public.community_report_followups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  community_report_id UUID REFERENCES public.community_reports(id) ON DELETE CASCADE NOT NULL,
  followup_number INTEGER NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  response_received_at TIMESTAMPTZ,
  email_opens_count INTEGER DEFAULT 0,
  response_status TEXT DEFAULT 'pending' NOT NULL CHECK (response_status IN ('pending', 'replied', 'ignored')),
  authority_response TEXT,
  curator_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_followups_community_report_id ON public.community_report_followups(community_report_id);
CREATE INDEX IF NOT EXISTS idx_followups_sent_at ON public.community_report_followups(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_followups_response_status ON public.community_report_followups(response_status);

-- Add updated_at trigger
CREATE TRIGGER update_followups_updated_at BEFORE UPDATE ON public.community_report_followups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.community_report_followups IS 'Tracks follow-up emails sent to authorities and their responses';

