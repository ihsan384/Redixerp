-- ============================================================
-- REDIX ERP — Finance Management System Migration
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Extend REVENUE table with new finance fields
ALTER TABLE public.revenue ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE public.revenue ADD COLUMN IF NOT EXISTS total_project_amount NUMERIC;
ALTER TABLE public.revenue ADD COLUMN IF NOT EXISTS transaction_id TEXT;
ALTER TABLE public.revenue ADD COLUMN IF NOT EXISTS received_by TEXT;
ALTER TABLE public.revenue ADD COLUMN IF NOT EXISTS due_date TEXT;

-- 2. INVOICES TABLE
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT NOT NULL,
  issue_date TEXT NOT NULL,
  due_date TEXT,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  gst NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PARTNERS TABLE
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  share_percentage NUMERIC DEFAULT 0,
  share_fixed NUMERIC,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. PARTNER_PAYOUTS TABLE
CREATE TABLE IF NOT EXISTS public.partner_payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  period_start TEXT,
  period_end TEXT,
  status TEXT DEFAULT 'pending',
  paid_date TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable RLS on new tables
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_payouts ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies — Invoices
DROP POLICY IF EXISTS "Allow public read access to invoices" ON public.invoices;
CREATE POLICY "Allow public read access to invoices" ON public.invoices FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert access to invoices" ON public.invoices;
CREATE POLICY "Allow public insert access to invoices" ON public.invoices FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update access to invoices" ON public.invoices;
CREATE POLICY "Allow public update access to invoices" ON public.invoices FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete access to invoices" ON public.invoices;
CREATE POLICY "Allow public delete access to invoices" ON public.invoices FOR DELETE USING (true);

-- 7. RLS Policies — Partners
DROP POLICY IF EXISTS "Allow public read access to partners" ON public.partners;
CREATE POLICY "Allow public read access to partners" ON public.partners FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert access to partners" ON public.partners;
CREATE POLICY "Allow public insert access to partners" ON public.partners FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update access to partners" ON public.partners;
CREATE POLICY "Allow public update access to partners" ON public.partners FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete access to partners" ON public.partners;
CREATE POLICY "Allow public delete access to partners" ON public.partners FOR DELETE USING (true);

-- 8. RLS Policies — Partner Payouts
DROP POLICY IF EXISTS "Allow public read access to partner_payouts" ON public.partner_payouts;
CREATE POLICY "Allow public read access to partner_payouts" ON public.partner_payouts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert access to partner_payouts" ON public.partner_payouts;
CREATE POLICY "Allow public insert access to partner_payouts" ON public.partner_payouts FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update access to partner_payouts" ON public.partner_payouts;
CREATE POLICY "Allow public update access to partner_payouts" ON public.partner_payouts FOR UPDATE USING (true);

-- 9. Also add update/delete policies to revenue & expenses if missing
DROP POLICY IF EXISTS "Allow public update access to revenue" ON public.revenue;
CREATE POLICY "Allow public update access to revenue" ON public.revenue FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete access to revenue" ON public.revenue;
CREATE POLICY "Allow public delete access to revenue" ON public.revenue FOR DELETE USING (true);
DROP POLICY IF EXISTS "Allow public update access to expenses" ON public.expenses;
CREATE POLICY "Allow public update access to expenses" ON public.expenses FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete access to expenses" ON public.expenses;
CREATE POLICY "Allow public delete access to expenses" ON public.expenses FOR DELETE USING (true);
