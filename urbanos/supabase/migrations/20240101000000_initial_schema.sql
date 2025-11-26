-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create custom types
CREATE TYPE user_role AS ENUM ('citizen', 'agency', 'admin');
CREATE TYPE report_type AS ENUM ('pothole', 'streetlight', 'garbage', 'cybersecurity', 'other');
CREATE TYPE report_status AS ENUM ('submitted', 'received', 'in-progress', 'resolved', 'rejected');
CREATE TYPE report_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE report_source AS ENUM ('web', 'instagram', 'whatsapp', 'twitter');
CREATE TYPE notification_type AS ENUM ('report_update', 'agency_response', 'security_alert', 'system');

-- Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'citizen',
  region TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agencies table
CREATE TABLE public.agencies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  region TEXT NOT NULL,
  avg_response_time_hours NUMERIC DEFAULT 0,
  total_reports INTEGER DEFAULT 0,
  resolved_reports INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table
CREATE TABLE public.reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type report_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location JSONB NOT NULL, -- {lat, lng, address}
  status report_status DEFAULT 'submitted',
  priority report_priority DEFAULT 'medium',
  images TEXT[] DEFAULT '{}',
  is_anonymous BOOLEAN DEFAULT FALSE,
  source report_source DEFAULT 'web',
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  response_time_hours NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community officials table
CREATE TABLE public.community_officials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  region TEXT NOT NULL,
  responsibilities TEXT[] DEFAULT '{}',
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historical incidents table
CREATE TABLE public.historical_incidents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL,
  location JSONB NOT NULL, -- {lat, lng}
  occurred_at TIMESTAMPTZ NOT NULL,
  severity TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report comments table
CREATE TABLE public.report_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  is_agency BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_reports_user_id ON public.reports(user_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_type ON public.reports(type);
CREATE INDEX idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX idx_reports_agency_id ON public.reports(agency_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_community_officials_region ON public.community_officials(region);
CREATE INDEX idx_historical_incidents_occurred_at ON public.historical_incidents(occurred_at DESC);
CREATE INDEX idx_report_comments_report_id ON public.report_comments(report_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_officials_updated_at BEFORE UPDATE ON public.community_officials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate response time
CREATE OR REPLACE FUNCTION calculate_response_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = NOW();
    NEW.response_time_hours = EXTRACT(EPOCH FROM (NEW.resolved_at - NEW.submitted_at)) / 3600;
    
    -- Update agency stats
    UPDATE public.agencies
    SET 
      resolved_reports = resolved_reports + 1,
      avg_response_time_hours = (
        SELECT AVG(response_time_hours)
        FROM public.reports
        WHERE agency_id = NEW.agency_id AND status = 'resolved'
      )
    WHERE id = NEW.agency_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_report_response_time BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION calculate_response_time();

-- Function to create notification on report update
CREATE OR REPLACE FUNCTION notify_on_report_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO public.notifications (user_id, type, title, message, report_id)
    VALUES (
      NEW.user_id,
      'report_update',
      'Report Status Updated',
      'Your report "' || NEW.title || '" status changed to ' || NEW.status,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_user_on_report_update AFTER UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION notify_on_report_update();

-- Function to assign report to agency
CREATE OR REPLACE FUNCTION assign_report_to_agency()
RETURNS TRIGGER AS $$
DECLARE
  assigned_agency_id UUID;
BEGIN
  -- Find appropriate agency based on region and type
  SELECT id INTO assigned_agency_id
  FROM public.agencies
  WHERE region = (NEW.location->>'address')::TEXT
  ORDER BY avg_response_time_hours ASC
  LIMIT 1;
  
  IF assigned_agency_id IS NOT NULL THEN
    NEW.agency_id = assigned_agency_id;
    NEW.status = 'received';
    
    -- Increment agency total reports
    UPDATE public.agencies
    SET total_reports = total_reports + 1
    WHERE id = assigned_agency_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assign_agency_on_report_create BEFORE INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION assign_report_to_agency();

