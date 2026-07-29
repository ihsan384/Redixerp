-- REDIX Ecosystem Unified Supabase SQL Schema
-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. EMPLOYEES TABLE
create table if not exists public.employees (
    id uuid references auth.users(id) on delete cascade primary key,
    name text not null,
    email text not null unique,
    role text not null default 'admin',
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. LEADS TABLE
create table if not exists public.leads (
    id uuid default gen_random_uuid() primary key,
    name text,
    email text,
    phone text,
    company text,
    source text default 'website_contact',
    status text not null default 'new', -- 'new', 'contacted', 'qualified', 'converted', 'lost'
    notes text,
    assigned_to uuid references public.employees(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. CLIENTS TABLE
create table if not exists public.clients (
    id uuid default gen_random_uuid() primary key,
    lead_id uuid references public.leads(id) on delete set null,
    name text not null,
    company text,
    email text not null,
    phone text,
    address text,
    status text default 'active', -- 'active', 'inactive'
    client_secret text default gen_random_uuid()::text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. CONTACTS TABLE
create table if not exists public.contacts (
    id uuid default gen_random_uuid() primary key,
    lead_id uuid references public.leads(id) on delete set null,
    client_id uuid references public.clients(id) on delete set null,
    name text not null,
    email text,
    phone text,
    company text,
    position text,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. MESSAGES TABLE (ERP Inbox)
create table if not exists public.messages (
    id uuid default gen_random_uuid() primary key,
    lead_id uuid references public.leads(id) on delete set null,
    contact_id uuid references public.contacts(id) on delete set null,
    client_id uuid references public.clients(id) on delete set null,
    type text not null default 'contact', -- 'contact', 'quote', 'career', 'portfolio', 'general'
    name text not null,
    email text not null,
    phone text,
    subject text,
    content text not null,
    status text not null default 'unread', -- 'unread', 'read', 'replied', 'archived'
    assigned_to uuid references public.employees(id) on delete set null,
    metadata jsonb default '{}'::jsonb,
    reply_history jsonb default '[]'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. PROJECTS TABLE
create table if not exists public.projects (
    id uuid default gen_random_uuid() primary key,
    client_id uuid references public.clients(id) on delete cascade,
    title text not null,
    description text,
    status text default 'in_progress', -- 'planning', 'in_progress', 'completed', 'on_hold', 'cancelled'
    budget numeric default 0,
    start_date date,
    due_date date,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. QUOTES TABLE
create table if not exists public.quotes (
    id uuid default gen_random_uuid() primary key,
    lead_id uuid references public.leads(id) on delete set null,
    client_id uuid references public.clients(id) on delete set null,
    quote_number text,
    name text not null,
    email text not null,
    service text,
    budget_range text,
    details text,
    amount numeric default 0,
    status text default 'pending', -- 'pending', 'sent', 'accepted', 'rejected'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. INVOICES TABLE
create table if not exists public.invoices (
    id uuid default gen_random_uuid() primary key,
    client_id uuid references public.clients(id) on delete set null,
    project_id uuid references public.projects(id) on delete set null,
    invoice_number text not null,
    amount numeric not null default 0,
    status text default 'pending', -- 'draft', 'pending', 'paid', 'overdue', 'cancelled'
    due_date date,
    items jsonb default '[]'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. REVIEW_REQUESTS TABLE (Token Generator)
create table if not exists public.review_requests (
    id uuid default gen_random_uuid() primary key,
    client_id uuid references public.clients(id) on delete cascade,
    token text not null unique default gen_random_uuid()::text,
    client_email text not null,
    client_name text not null,
    used boolean default false,
    expires_at timestamp with time zone default (now() + interval '30 days'),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. CLIENT_REVIEWS TABLE
create table if not exists public.client_reviews (
    id uuid default gen_random_uuid() primary key,
    client_id uuid references public.clients(id) on delete set null,
    review_request_id uuid references public.review_requests(id) on delete set null,
    name text not null,
    company text,
    position text,
    service text,
    rating integer default 5 check (rating >= 1 and rating <= 5),
    review text not null,
    logo_url text,
    status text default 'pending', -- 'pending', 'approved', 'rejected', 'hidden'
    featured boolean default false,
    verified boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. NEWSLETTER_SUBSCRIBERS TABLE
create table if not exists public.newsletter_subscribers (
    id uuid default gen_random_uuid() primary key,
    email text not null unique,
    status text default 'subscribed', -- 'subscribed', 'unsubscribed'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. NOTIFICATIONS TABLE (ERP Realtime Alerts)
create table if not exists public.notifications (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    message text not null,
    type text not null default 'message', -- 'message', 'review', 'quote', 'lead'
    reference_id uuid,
    read boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
alter table public.employees enable row level security;
alter table public.leads enable row level security;
alter table public.clients enable row level security;
alter table public.contacts enable row level security;
alter table public.messages enable row level security;
alter table public.projects enable row level security;
alter table public.quotes enable row level security;
alter table public.invoices enable row level security;
alter table public.review_requests enable row level security;
alter table public.client_reviews enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.notifications enable row level security;

-- RLS POLICIES

-- Public Read Policy for Client Reviews (Website only displays approved reviews)
drop policy if exists "Allow public select for approved client reviews" on public.client_reviews;
create policy "Allow public select for approved client reviews" 
  on public.client_reviews for select 
  using (status = 'approved');

-- Allow Service Role / ERP full access to client_reviews
drop policy if exists "Allow full access for authenticated/admin client reviews" on public.client_reviews;
create policy "Allow full access for authenticated/admin client reviews" 
  on public.client_reviews for all 
  using (true) with check (true);

-- Newsletter Subscribers Policy
drop policy if exists "Allow insert newsletter subscribers" on public.newsletter_subscribers;
create policy "Allow insert newsletter subscribers" 
  on public.newsletter_subscribers for insert 
  with check (true);

drop policy if exists "Allow select newsletter subscribers" on public.newsletter_subscribers;
create policy "Allow select newsletter subscribers" 
  on public.newsletter_subscribers for select 
  using (true);

-- Allow public insert for Messages, Leads, Quotes, Review Requests (processed via backend API routes)
drop policy if exists "Allow insert for messages" on public.messages;
create policy "Allow insert for messages" on public.messages for insert with check (true);
drop policy if exists "Allow select update for messages" on public.messages;
create policy "Allow select update for messages" on public.messages for all using (true);

drop policy if exists "Allow full access to leads" on public.leads;
create policy "Allow full access to leads" on public.leads for all using (true);

drop policy if exists "Allow full access to clients" on public.clients;
create policy "Allow full access to clients" on public.clients for all using (true);

drop policy if exists "Allow full access to contacts" on public.contacts;
create policy "Allow full access to contacts" on public.contacts for all using (true);

drop policy if exists "Allow full access to projects" on public.projects;
create policy "Allow full access to projects" on public.projects for all using (true);

drop policy if exists "Allow full access to quotes" on public.quotes;
create policy "Allow full access to quotes" on public.quotes for all using (true);

drop policy if exists "Allow full access to invoices" on public.invoices;
create policy "Allow full access to invoices" on public.invoices for all using (true);

drop policy if exists "Allow full access to review_requests" on public.review_requests;
create policy "Allow full access to review_requests" on public.review_requests for all using (true);

drop policy if exists "Allow full access to notifications" on public.notifications;
create policy "Allow full access to notifications" on public.notifications for all using (true);
