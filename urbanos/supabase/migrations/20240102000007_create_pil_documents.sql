-- Create pil_documents table
CREATE TABLE IF NOT EXISTS public.pil_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  community_report_id UUID REFERENCES public.community_reports(id) ON DELETE CASCADE NOT NULL,
  curator_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  document_path TEXT NOT NULL, -- Path to PDF in storage
  filed_at TIMESTAMPTZ,
  court_case_number TEXT,
  status TEXT DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'filed', 'pending', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pil_documents_community_report_id ON public.pil_documents(community_report_id);
CREATE INDEX IF NOT EXISTS idx_pil_documents_curator_id ON public.pil_documents(curator_id);
CREATE INDEX IF NOT EXISTS idx_pil_documents_status ON public.pil_documents(status);
CREATE INDEX IF NOT EXISTS idx_pil_documents_filed_at ON public.pil_documents(filed_at DESC);

-- Add updated_at trigger
CREATE TRIGGER update_pil_documents_updated_at BEFORE UPDATE ON public.pil_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.pil_documents IS 'Public Interest Litigation documents filed for community reports';

