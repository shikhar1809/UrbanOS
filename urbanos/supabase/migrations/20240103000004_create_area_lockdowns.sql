-- Create area lockdowns table for admin to lock down areas
CREATE TABLE IF NOT EXISTS public.area_lockdowns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location JSONB NOT NULL, -- {lat, lng, address, area, radius}
  reason TEXT NOT NULL, -- 'congestion', 'safety', 'emergency', 'maintenance', 'other'
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  affected_areas TEXT[] DEFAULT '{}',
  restrictions TEXT[] DEFAULT '{}', -- ['no_entry', 'reduced_access', 'emergency_only']
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_area_lockdowns_is_active ON public.area_lockdowns(is_active);
CREATE INDEX IF NOT EXISTS idx_area_lockdowns_created_at ON public.area_lockdowns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_area_lockdowns_severity ON public.area_lockdowns(severity);
CREATE INDEX IF NOT EXISTS idx_area_lockdowns_reason ON public.area_lockdowns(reason);

-- Enable RLS
ALTER TABLE public.area_lockdowns ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active lockdowns
CREATE POLICY "Anyone can view active lockdowns"
  ON public.area_lockdowns FOR SELECT
  USING (is_active = TRUE);

-- Policy: Admins can view all lockdowns
CREATE POLICY "Admins can view all lockdowns"
  ON public.area_lockdowns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Only admins can create lockdowns
CREATE POLICY "Only admins can create lockdowns"
  ON public.area_lockdowns FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Only admins can update lockdowns
CREATE POLICY "Only admins can update lockdowns"
  ON public.area_lockdowns FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Only admins can delete lockdowns
CREATE POLICY "Only admins can delete lockdowns"
  ON public.area_lockdowns FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

COMMENT ON TABLE public.area_lockdowns IS 'Stores area lockdowns created by admins for congestion, safety, or emergency reasons';

