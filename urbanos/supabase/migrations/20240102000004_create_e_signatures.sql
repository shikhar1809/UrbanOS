-- Create e_signatures table for advanced digital signatures
CREATE TABLE IF NOT EXISTS public.e_signatures (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  signature_data JSONB NOT NULL, -- {name, email, consent, timestamp, etc.}
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_e_signatures_report_id ON public.e_signatures(report_id);
CREATE INDEX IF NOT EXISTS idx_e_signatures_user_id ON public.e_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_e_signatures_signed_at ON public.e_signatures(signed_at DESC);

-- Add comment for documentation
COMMENT ON TABLE public.e_signatures IS 'Stores e-signatures with IP, timestamp, and consent data for legal validity';

