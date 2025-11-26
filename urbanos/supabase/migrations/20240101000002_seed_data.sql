-- Insert sample agencies
INSERT INTO public.agencies (name, type, email, phone, region) VALUES
  ('Municipal Roads Department', 'Infrastructure', 'roads@city.gov', '555-0101', 'Downtown'),
  ('Electrical Services Division', 'Utilities', 'electric@city.gov', '555-0102', 'Downtown'),
  ('Waste Management Department', 'Sanitation', 'waste@city.gov', '555-0103', 'Downtown'),
  ('Cyber Security Task Force', 'Security', 'cyber@city.gov', '555-0104', 'City-wide'),
  ('North District Public Works', 'Infrastructure', 'north@city.gov', '555-0201', 'North District'),
  ('South District Services', 'Infrastructure', 'south@city.gov', '555-0301', 'South District'),
  ('East Side Municipal Office', 'Infrastructure', 'east@city.gov', '555-0401', 'East Side'),
  ('West End Services', 'Infrastructure', 'west@city.gov', '555-0501', 'West End');

-- Insert sample community officials
INSERT INTO public.community_officials (name, role, region, responsibilities, email, phone) VALUES
  (
    'Sarah Martinez',
    'City Council Member',
    'Downtown',
    ARRAY['Infrastructure oversight', 'Budget approval', 'Community engagement'],
    'sarah.martinez@city.gov',
    '555-1001'
  ),
  (
    'James Chen',
    'District Commissioner',
    'North District',
    ARRAY['Local governance', 'Public safety', 'Development planning'],
    'james.chen@city.gov',
    '555-1002'
  ),
  (
    'Maria Rodriguez',
    'Public Works Director',
    'City-wide',
    ARRAY['Road maintenance', 'Public facilities', 'Emergency response'],
    'maria.rodriguez@city.gov',
    '555-1003'
  ),
  (
    'David Thompson',
    'Community Liaison Officer',
    'South District',
    ARRAY['Citizen complaints', 'Community programs', 'Public communication'],
    'david.thompson@city.gov',
    '555-1004'
  ),
  (
    'Aisha Patel',
    'Environmental Officer',
    'City-wide',
    ARRAY['Waste management', 'Environmental compliance', 'Sustainability initiatives'],
    'aisha.patel@city.gov',
    '555-1005'
  ),
  (
    'Robert Kim',
    'IT Security Manager',
    'City-wide',
    ARRAY['Cybersecurity', 'Data protection', 'System monitoring'],
    'robert.kim@city.gov',
    '555-1006'
  ),
  (
    'Emily Johnson',
    'Ward Councilor',
    'East Side',
    ARRAY['Local advocacy', 'Policy development', 'Constituent services'],
    'emily.johnson@city.gov',
    '555-1007'
  ),
  (
    'Michael Brown',
    'Infrastructure Manager',
    'West End',
    ARRAY['Utilities oversight', 'Maintenance scheduling', 'Capital projects'],
    'michael.brown@city.gov',
    '555-1008'
  );

-- Insert historical incidents (for predictor algorithm)
INSERT INTO public.historical_incidents (type, location, occurred_at, severity) VALUES
  ('pothole', '{"lat": 40.7128, "lng": -74.0060}', NOW() - INTERVAL '30 days', 'high'),
  ('pothole', '{"lat": 40.7130, "lng": -74.0062}', NOW() - INTERVAL '25 days', 'medium'),
  ('streetlight', '{"lat": 40.7135, "lng": -74.0070}', NOW() - INTERVAL '20 days', 'low'),
  ('garbage', '{"lat": 40.7140, "lng": -74.0080}', NOW() - INTERVAL '15 days', 'medium'),
  ('pothole', '{"lat": 40.7145, "lng": -74.0090}', NOW() - INTERVAL '10 days', 'high'),
  ('streetlight', '{"lat": 40.7150, "lng": -74.0100}', NOW() - INTERVAL '8 days', 'low'),
  ('pothole', '{"lat": 40.7128, "lng": -74.0061}', NOW() - INTERVAL '5 days', 'medium'),
  ('garbage', '{"lat": 40.7132, "lng": -74.0065}', NOW() - INTERVAL '3 days', 'low'),
  ('cybersecurity', '{"lat": 40.7138, "lng": -74.0075}', NOW() - INTERVAL '2 days', 'high'),
  ('pothole', '{"lat": 40.7142, "lng": -74.0082}', NOW() - INTERVAL '1 day', 'medium');

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'citizen')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

