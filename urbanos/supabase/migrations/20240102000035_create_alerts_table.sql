-- Create alerts table for authorities to push alerts
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- 'road_closure', 'construction', 'diversion', 'disaster', 'flood', 'relief_material'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location JSONB, -- {lat, lng, address, area}
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  images TEXT[] DEFAULT '{}',
  relief_materials JSONB, -- For disaster alerts: {locations: [{lat, lng, address, items: []}], contact: {}}
  affected_areas TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_alerts_type ON public.alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_is_active ON public.alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_agency_id ON public.alerts(agency_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON public.alerts(severity);

-- Enable RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active alerts
CREATE POLICY "Anyone can view active alerts"
  ON public.alerts FOR SELECT
  USING (is_active = TRUE);

-- Policy: Agencies and admins can view all alerts
CREATE POLICY "Agencies and admins can view all alerts"
  ON public.alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('agency', 'admin')
    )
  );

-- Policy: Only agencies and admins can create alerts
CREATE POLICY "Agencies and admins can create alerts"
  ON public.alerts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('agency', 'admin')
    )
  );

-- Policy: Only agencies and admins can update alerts
CREATE POLICY "Agencies and admins can update alerts"
  ON public.alerts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('agency', 'admin')
    )
  );

-- Add comment
COMMENT ON TABLE public.alerts IS 'Stores alerts from authorities about road closures, construction, diversions, disasters, and relief materials';

