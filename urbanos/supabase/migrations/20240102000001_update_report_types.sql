-- Update report_type enum to include new types
ALTER TYPE report_type ADD VALUE IF NOT EXISTS 'cyber';
ALTER TYPE report_type ADD VALUE IF NOT EXISTS 'road_safety_hazards';
ALTER TYPE report_type ADD VALUE IF NOT EXISTS 'public_infrastructure';
ALTER TYPE report_type ADD VALUE IF NOT EXISTS 'environmental';
ALTER TYPE report_type ADD VALUE IF NOT EXISTS 'health_safety';

-- Note: PostgreSQL doesn't allow removing enum values, so we keep old types
-- Map old 'cybersecurity' to new 'cyber' for consistency (optional - keeping both for backward compatibility)

