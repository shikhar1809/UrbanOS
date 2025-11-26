-- Create congestion tracking table for real-time congestion monitoring
CREATE TABLE IF NOT EXISTS public.congestion_tracking (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
  location JSONB NOT NULL, -- {lat, lng, address, area}
  congestion_level TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  source TEXT DEFAULT 'manual', -- 'manual', 'realtime_feed', 'sensor', 'user_report'
  description TEXT,
  vehicle_count INTEGER,
  average_speed NUMERIC, -- km/h
  affected_radius NUMERIC, -- meters
  is_active BOOLEAN DEFAULT TRUE,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}', -- Additional data like weather, events, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_congestion_tracking_is_active ON public.congestion_tracking(is_active);
CREATE INDEX IF NOT EXISTS idx_congestion_tracking_created_at ON public.congestion_tracking(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_congestion_tracking_level ON public.congestion_tracking(congestion_level);
CREATE INDEX IF NOT EXISTS idx_congestion_tracking_source ON public.congestion_tracking(source);

-- Enable RLS
ALTER TABLE public.congestion_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active congestion data
CREATE POLICY "Anyone can view active congestion"
  ON public.congestion_tracking FOR SELECT
  USING (is_active = TRUE);

-- Policy: Admins can view all congestion data
CREATE POLICY "Admins can view all congestion"
  ON public.congestion_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can create congestion entries
CREATE POLICY "Admins can create congestion entries"
  ON public.congestion_tracking FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can update congestion entries
CREATE POLICY "Admins can update congestion entries"
  ON public.congestion_tracking FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can delete congestion entries
CREATE POLICY "Admins can delete congestion entries"
  ON public.congestion_tracking FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

COMMENT ON TABLE public.congestion_tracking IS 'Stores real-time congestion data for areas, can be updated via real-time feed or manually by admins';

