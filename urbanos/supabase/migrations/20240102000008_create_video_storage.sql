-- Create storage bucket for report videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-videos', 'report-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for report videos
CREATE POLICY "Anyone can view report videos"
ON storage.objects FOR SELECT
  USING (bucket_id = 'report-videos');

CREATE POLICY "Authenticated users can upload report videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'report-videos');

CREATE POLICY "Users can update their own videos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'report-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'report-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

