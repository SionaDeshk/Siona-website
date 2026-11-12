-- Siona Platform v0.2: private clinician profiles and founder-controlled recruiter access.
-- Run in a dedicated Supabase project. Never use service-role credentials in the browser.
create extension if not exists pgcrypto;

create table if not exists public.clinician_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 100),
  specialty text not null check (char_length(specialty) between 2 and 100),
  preferred_region text not null check (char_length(preferred_region) between 2 and 100),
  work_arrangement text not null check (work_arrangement in ('Travel','Permanent','Per diem','Flexible')),
  experience_years smallint not null check (experience_years between 0 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Recruiter access is granted manually by an administrator via the SQL editor.
-- Clients cannot grant themselves recruiter access.
create table if not exists public.recruiter_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.recruitment_pipeline (
  clinician_user_id uuid primary key references public.clinician_profiles(user_id) on delete cascade,
  status text not null default 'Interested' check (status in ('Interested','Contacted','In conversation')),
  updated_at timestamptz not null default now()
);

create or replace function public.is_recruiter()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.recruiter_memberships where user_id = (select auth.uid())); $$;

revoke all on function public.is_recruiter() from public;
grant execute on function public.is_recruiter() to authenticated;

alter table public.clinician_profiles enable row level security;
alter table public.recruiter_memberships enable row level security;
alter table public.recruitment_pipeline enable row level security;

create policy "Clinicians can read own profile or recruiters can read profiles"
on public.clinician_profiles for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_recruiter()));

create policy "Clinicians can create only their own profile"
on public.clinician_profiles for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "Clinicians can update only their own profile"
on public.clinician_profiles for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Recruiters can view their membership"
on public.recruiter_memberships for select to authenticated
using (user_id = (select auth.uid()));

create policy "Recruiters can read pipeline"
on public.recruitment_pipeline for select to authenticated
using ((select public.is_recruiter()));

create policy "Recruiters can create pipeline"
on public.recruitment_pipeline for insert to authenticated
with check ((select public.is_recruiter()));

create policy "Recruiters can update pipeline"
on public.recruitment_pipeline for update to authenticated
using ((select public.is_recruiter()))
with check ((select public.is_recruiter()));

create or replace function public.touch_profile_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at = now(); return new; end; $$;

create trigger clinician_profiles_updated_at before update on public.clinician_profiles
for each row execute function public.touch_profile_updated_at();

-- Recruiter membership bootstrap (run manually after creating your own auth user):
-- insert into public.recruiter_memberships(user_id)
-- values ('YOUR-AUTH-USER-UUID');
