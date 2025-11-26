-- Function to increment email opens count for follow-ups
CREATE OR REPLACE FUNCTION increment_email_opens(
  community_report_id_param UUID,
  followup_num INTEGER
)
RETURNS void AS $$
BEGIN
  UPDATE public.community_report_followups
  SET email_opens_count = COALESCE(email_opens_count, 0) + 1
  WHERE community_report_id = community_report_id_param
    AND followup_number = followup_num;
END;
$$ LANGUAGE plpgsql;

-- Create storage bucket for community reports documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-reports', 'community-reports', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for community reports documents
CREATE POLICY "Anyone can view community report documents"
ON storage.objects FOR SELECT
  USING (bucket_id = 'community-reports');

CREATE POLICY "Authenticated users can upload community report documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'community-reports');

