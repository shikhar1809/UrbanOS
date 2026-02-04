-- Function to get pollution data within a bounding box
-- This is necessary because 'location' is stored as a JSONB object, 
-- and we need efficient numeric comparison for lat/lng which isn't 
-- optimal with standard PostgREST JSONB filtering syntax.

CREATE OR REPLACE FUNCTION get_pollution_in_bounds(
  min_lat float,
  max_lat float,
  min_lng float,
  max_lng float
)
RETURNS SETOF pollution_data
LANGUAGE sql
AS $$
  SELECT *
  FROM pollution_data
  WHERE (location->>'lat')::float >= min_lat
    AND (location->>'lat')::float <= max_lat
    AND (location->>'lng')::float >= min_lng
    AND (location->>'lng')::float <= max_lng
  LIMIT 1000; -- Safety limit
$$;
