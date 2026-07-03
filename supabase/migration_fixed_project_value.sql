-- ============================================================
-- REDIX ERP — Add Fixed Project Value to Leads Migration
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS fixed_project_value NUMERIC;
