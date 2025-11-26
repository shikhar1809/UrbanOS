-- Add authority_ids column to reports table for storing tagged authorities
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS authority_ids UUID[] DEFAULT '{}';

-- Add area_pin field to location JSONB structure (will be set via application)
-- Note: The location JSONB already exists, area_pin will be added as a property
-- when creating/updating reports in the application

-- Function to auto-tag authorities based on location
CREATE OR REPLACE FUNCTION auto_tag_authorities()
RETURNS TRIGGER AS $$
DECLARE
  report_region TEXT;
  tagged_authority_ids UUID[];
BEGIN
  -- Extract region from location JSONB (assuming address contains region info)
  -- Or use a reverse geocoding service in the application
  -- For now, we'll rely on the application to set this
  
  -- This function is a placeholder - actual tagging will happen in the application
  -- based on reverse geocoding of lat/lng coordinates
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON COLUMN public.reports.authority_ids IS 'Array of agency IDs automatically tagged based on report location';

-- Note: The actual authority tagging logic will be implemented in the application
-- using the authority-tagger service, as location-based matching requires
-- more complex logic (reverse geocoding, jurisdiction mapping, etc.)

