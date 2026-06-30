-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. EMPLOYEES TABLE
create table if not exists public.employees (
    id uuid references auth.users(id) on delete cascade primary key,
    name text not null,
    email text not null,
    role text not null,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. LEADS TABLE
create table if not exists public.leads (
    id uuid default gen_random_uuid() primary key,
    shop_name text not null,
    category text not null,
    phone text not null,
    website text,
    address text,
    rating numeric,
    status text not null,
    assigned_to uuid references public.employees(id) on delete set null,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. CALLS TABLE
create table if not exists public.calls (
    id uuid default gen_random_uuid() primary key,
    lead_id uuid references public.leads(id) on delete cascade not null,
    employee_id uuid references public.employees(id) on delete cascade not null,
    start_time timestamp with time zone default timezone('utc'::text, now()) not null,
    end_time timestamp with time zone,
    duration_seconds integer,
    outcome text not null,
    notes text,
    follow_up boolean default false not null,
    follow_up_date text,
    follow_up_time text,
    follow_up_reminder text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. ACTIVITIES TABLE
create table if not exists public.activities (
    id uuid default gen_random_uuid() primary key,
    lead_id uuid references public.leads(id) on delete cascade not null,
    employee_id uuid references public.employees(id) on delete set null,
    type text not null,
    description text not null,
    metadata jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. REVENUE TABLE
create table if not exists public.revenue (
    id uuid default gen_random_uuid() primary key,
    lead_id uuid references public.leads(id) on delete cascade not null,
    package text not null,
    amount numeric not null,
    payment_status text not null,
    payment_method text not null,
    received_date text not null,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. EXPENSES TABLE
create table if not exists public.expenses (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    category text not null,
    amount numeric not null,
    payment_method text not null,
    date text not null,
    notes text,
    employee_id uuid references public.employees(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for all tables
alter table public.employees enable row level security;
alter table public.leads enable row level security;
alter table public.calls enable row level security;
alter table public.activities enable row level security;
alter table public.revenue enable row level security;
alter table public.expenses enable row level security;

-- ROW LEVEL SECURITY (RLS) POLICIES

-- Employees Policies
create policy "Allow public read access to employees" on public.employees for select using (true);
create policy "Allow public insert access to employees" on public.employees for insert with check (true);
create policy "Allow public update access to employees" on public.employees for update using (true);

-- Leads Policies
create policy "Allow public read access to leads" on public.leads for select using (true);
create policy "Allow public insert access to leads" on public.leads for insert with check (true);
create policy "Allow public update access to leads" on public.leads for update using (true);
create policy "Allow public delete access to leads" on public.leads for delete using (true);

-- Calls Policies
create policy "Allow public read access to calls" on public.calls for select using (true);
create policy "Allow public insert access to calls" on public.calls for insert with check (true);
create policy "Allow public update access to calls" on public.calls for update using (true);

-- Activities Policies
create policy "Allow public read access to activities" on public.activities for select using (true);
create policy "Allow public insert access to activities" on public.activities for insert with check (true);

-- Revenue Policies
create policy "Allow public read access to revenue" on public.revenue for select using (true);
create policy "Allow public insert access to revenue" on public.revenue for insert with check (true);

-- Expenses Policies
create policy "Allow public read access to expenses" on public.expenses for select using (true);
create policy "Allow public insert access to expenses" on public.expenses for insert with check (true);
