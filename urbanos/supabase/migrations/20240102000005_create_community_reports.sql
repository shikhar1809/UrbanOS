-- Create community_reports table
CREATE TABLE IF NOT EXISTS public.community_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL UNIQUE,
  curator_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  upvote_count INTEGER DEFAULT 0 NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'resolved', 'escalated_to_pil')),
  promoted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_community_reports_report_id ON public.community_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_community_reports_curator_id ON public.community_reports(curator_id);
CREATE INDEX IF NOT EXISTS idx_community_reports_status ON public.community_reports(status);
CREATE INDEX IF NOT EXISTS idx_community_reports_upvote_count ON public.community_reports(upvote_count DESC);
CREATE INDEX IF NOT EXISTS idx_community_reports_promoted_at ON public.community_reports(promoted_at DESC);

-- Add updated_at trigger
CREATE TRIGGER update_community_reports_updated_at BEFORE UPDATE ON public.community_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.community_reports IS 'Reports that have reached 50+ upvotes and become community reports';

