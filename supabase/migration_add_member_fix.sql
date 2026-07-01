-- ============================================================
-- REDIX ERP — Add Team Member Foreign Key Fix
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Drop foreign key constraint on public.employees referencing auth.users
alter table public.employees drop constraint if exists employees_id_fkey;

-- 2. Drop existing foreign keys on referencing tables so we can recreate them with ON UPDATE CASCADE
alter table public.leads drop constraint if exists leads_assigned_to_fkey;
alter table public.calls drop constraint if exists calls_employee_id_fkey;
alter table public.activities drop constraint if exists activities_employee_id_fkey;
alter table public.expenses drop constraint if exists expenses_employee_id_fkey;

-- 3. Re-create foreign keys with ON UPDATE CASCADE and proper ON DELETE behavior
alter table public.leads 
  add constraint leads_assigned_to_fkey 
  foreign key (assigned_to) references public.employees(id) 
  on delete set null 
  on update cascade;

alter table public.calls 
  add constraint calls_employee_id_fkey 
  foreign key (employee_id) references public.employees(id) 
  on delete cascade 
  on update cascade;

alter table public.activities 
  add constraint activities_employee_id_fkey 
  foreign key (employee_id) references public.employees(id) 
  on delete set null 
  on update cascade;

alter table public.expenses 
  add constraint expenses_employee_id_fkey 
  foreign key (employee_id) references public.employees(id) 
  on delete set null 
  on update cascade;

-- 4. Make email unique in public.employees to prevent duplicate employee records
alter table public.employees drop constraint if exists employees_email_key;
alter table public.employees add constraint employees_email_key unique (email);

-- 5. Update the auth trigger function to link pre-existing employees by email when they sign up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  existing_emp_id uuid;
begin
  -- Check if an employee with the same email already exists
  select id into existing_emp_id from public.employees where email = new.email limit 1;
  
  if existing_emp_id is not null then
    -- Update the existing employee's ID to the new auth user's ID
    -- This will cascade to referencing tables (leads, calls, activities, expenses)
    update public.employees set id = new.id where id = existing_emp_id;
  else
    -- Insert a new employee record if none exists
    insert into public.employees (id, name, email, role)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
      new.email,
      coalesce(new.raw_user_meta_data ->> 'role', 'sales_rep')
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;
