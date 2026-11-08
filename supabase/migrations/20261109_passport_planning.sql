-- REVIEW ONLY: apply after the initial and ownership migrations in siona-passport.
-- This migration is not applied by the app. Existing website tables/policies are untouched.
create table public.passport_ce_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  target_hours numeric(7,2) not null check (target_hours > 0 and target_hours <= 10000),
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);
create table public.passport_renewal_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  license_id uuid,
  certification_id uuid,
  title text not null check (char_length(title) between 1 and 200),
  notes text check (char_length(notes) <= 1000),
  due_on date,
  estimated_fee numeric(9,2) check (estimated_fee >= 0 and estimated_fee <= 1000000),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  check (num_nonnulls(license_id, certification_id) = 1),
  foreign key (license_id, user_id) references public.passport_licenses(id, user_id) on delete cascade,
  foreign key (certification_id, user_id) references public.passport_certifications(id, user_id) on delete cascade
);
alter table public.passport_ce_goals enable row level security;
alter table public.passport_renewal_tasks enable row level security;
create policy "Own CE goals" on public.passport_ce_goals for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Own renewal tasks" on public.passport_renewal_tasks for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create index on public.passport_ce_goals (user_id, created_at desc);
create index on public.passport_renewal_tasks (user_id, completed, due_on);
-- Explicit Data API privileges; RLS still scopes every authenticated operation.
revoke all on public.passport_ce_goals, public.passport_renewal_tasks from anon;
grant select, insert, update, delete on public.passport_ce_goals, public.passport_renewal_tasks to authenticated;
