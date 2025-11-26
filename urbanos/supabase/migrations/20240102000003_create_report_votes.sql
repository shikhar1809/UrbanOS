-- Create report_votes table
CREATE TABLE IF NOT EXISTS public.report_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_report_votes_report_id ON public.report_votes(report_id);
CREATE INDEX IF NOT EXISTS idx_report_votes_user_id ON public.report_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_report_votes_vote_type ON public.report_votes(vote_type);
CREATE INDEX IF NOT EXISTS idx_report_votes_created_at ON public.report_votes(created_at DESC);

-- Add updated_at trigger
CREATE TRIGGER update_report_votes_updated_at BEFORE UPDATE ON public.report_votes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.report_votes IS 'Stores user votes (upvote/downvote) on reports';

