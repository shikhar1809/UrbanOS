-- Function to get aggregated pollution clusters within a bounding box
-- This partitions the area into a grid and returns one point per cell
-- with aggregated statistics (count, avg_aqi).

CREATE OR REPLACE FUNCTION get_pollution_clusters_in_bounds(
  min_lat float,
  max_lat float,
  min_lng float,
  max_lng float,
  grid_size float
)
RETURNS TABLE (
  lat float,
  lng float,
  count bigint,
  avg_aqi float,
  max_aqi float
)
LANGUAGE sql
AS $$
  SELECT
    (floor(((location->>'lat')::float) / grid_size) * grid_size + grid_size/2) as lat,
    (floor(((location->>'lng')::float) / grid_size) * grid_size + grid_size/2) as lng,
    count(*) as count,
    avg((level)::float) as avg_aqi,
    max((level)::float) as max_aqi
  FROM pollution_data
  WHERE (location->>'lat')::float >= min_lat
    AND (location->>'lat')::float <= max_lat
    AND (location->>'lng')::float >= min_lng
    AND (location->>'lng')::float <= max_lng
  GROUP BY 1, 2;
$$;
