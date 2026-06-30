-- ============================================================
-- REDIX ERP — Auth Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add missing columns to employees table
alter table public.employees
  add column if not exists is_active boolean default true not null,
  add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now()) not null;

-- 2. Auto-create employee profile when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.employees (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'sales_rep')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Drop existing trigger if any
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Updated RLS Policies for employees
-- Drop old wide-open policies
drop policy if exists "Allow public read access to employees" on public.employees;
drop policy if exists "Allow public insert access to employees" on public.employees;
drop policy if exists "Allow public update access to employees" on public.employees;

-- Authenticated users can read all employees
create policy "Authenticated users can read employees"
  on public.employees for select
  to authenticated
  using (true);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.employees for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Service role / trigger can insert (for auto-profile creation)
create policy "Allow insert for auth trigger"
  on public.employees for insert
  with check (true);

-- Admins can update any employee
create policy "Admins can update any employee"
  on public.employees for update
  to authenticated
  using (
    exists (
      select 1 from public.employees
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can delete employees
create policy "Admins can delete employees"
  on public.employees for delete
  to authenticated
  using (
    exists (
      select 1 from public.employees
      where id = auth.uid() and role = 'admin'
    )
  );

-- 4. Update other table policies to require authentication
-- Leads
drop policy if exists "Allow public read access to leads" on public.leads;
drop policy if exists "Allow public insert access to leads" on public.leads;
drop policy if exists "Allow public update access to leads" on public.leads;
drop policy if exists "Allow public delete access to leads" on public.leads;

create policy "Authenticated read leads" on public.leads for select to authenticated using (true);
create policy "Authenticated insert leads" on public.leads for insert to authenticated with check (true);
create policy "Authenticated update leads" on public.leads for update to authenticated using (true);
create policy "Authenticated delete leads" on public.leads for delete to authenticated using (true);

-- Calls
drop policy if exists "Allow public read access to calls" on public.calls;
drop policy if exists "Allow public insert access to calls" on public.calls;
drop policy if exists "Allow public update access to calls" on public.calls;

create policy "Authenticated read calls" on public.calls for select to authenticated using (true);
create policy "Authenticated insert calls" on public.calls for insert to authenticated with check (true);
create policy "Authenticated update calls" on public.calls for update to authenticated using (true);
create policy "Authenticated delete calls" on public.calls for delete to authenticated using (true);

-- Activities
drop policy if exists "Allow public read access to activities" on public.activities;
drop policy if exists "Allow public insert access to activities" on public.activities;

create policy "Authenticated read activities" on public.activities for select to authenticated using (true);
create policy "Authenticated insert activities" on public.activities for insert to authenticated with check (true);

-- Revenue
drop policy if exists "Allow public read access to revenue" on public.revenue;
drop policy if exists "Allow public insert access to revenue" on public.revenue;

create policy "Authenticated read revenue" on public.revenue for select to authenticated using (true);
create policy "Authenticated insert revenue" on public.revenue for insert to authenticated with check (true);
create policy "Authenticated update revenue" on public.revenue for update to authenticated using (true);
create policy "Authenticated delete revenue" on public.revenue for delete to authenticated using (true);

-- Expenses
drop policy if exists "Allow public read access to expenses" on public.expenses;
drop policy if exists "Allow public insert access to expenses" on public.expenses;

create policy "Authenticated read expenses" on public.expenses for select to authenticated using (true);
create policy "Authenticated insert expenses" on public.expenses for insert to authenticated with check (true);
create policy "Authenticated update expenses" on public.expenses for update to authenticated using (true);
create policy "Authenticated delete expenses" on public.expenses for delete to authenticated using (true);
