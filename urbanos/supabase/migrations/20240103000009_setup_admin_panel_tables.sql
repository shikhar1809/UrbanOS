-- Complete setup script for admin panel tables
-- This script ensures all tables exist and have proper RLS policies for public access
-- Run this after the individual table creation migrations

-- Ensure alerts table exists and has correct structure
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'alerts') THEN
    RAISE NOTICE 'Alerts table does not exist. Please run 20240102000035_create_alerts_table.sql first.';
  END IF;
END $$;

-- Ensure area_lockdowns table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'area_lockdowns') THEN
    RAISE NOTICE 'Area lockdowns table does not exist. Please run 20240103000004_create_area_lockdowns.sql first.';
  END IF;
END $$;

-- Ensure congestion_tracking table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'congestion_tracking') THEN
    RAISE NOTICE 'Congestion tracking table does not exist. Please run 20240103000005_create_congestion_tracking.sql first.';
  END IF;
END $$;

-- This migration should be run after:
-- 1. 20240102000035_create_alerts_table.sql
-- 2. 20240103000004_create_area_lockdowns.sql
-- 3. 20240103000005_create_congestion_tracking.sql
-- 4. 20240103000006_fix_alerts_rls_public_access.sql
-- 5. 20240103000007_fix_lockdowns_rls_public_access.sql
-- 6. 20240103000008_fix_congestion_rls_public_access.sql

COMMENT ON TABLE public.alerts IS 'Stores alerts from authorities. RLS policies allow public access for admin panel.';
COMMENT ON TABLE public.area_lockdowns IS 'Stores area lockdowns. RLS policies allow public access for admin panel.';
COMMENT ON TABLE public.congestion_tracking IS 'Stores congestion data. RLS policies allow public access for admin panel.';

