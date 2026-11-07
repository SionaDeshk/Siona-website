-- Siona Passport MVP: run in Supabase SQL editor after review.
create extension if not exists pgcrypto;

create table public.passport_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);
create table public.passport_licenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  jurisdiction text not null,
  license_type text not null default 'RN',
  license_number text,
  issued_on date,
  expires_on date,
  status text not null default 'self_reported' check (status in ('self_reported','pending','expired')),
  created_at timestamptz not null default now()
);
create table public.passport_ce_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  provider text not null,
  hours numeric(7,2) not null check (hours > 0 and hours <= 1000),
  completed_on date not null,
  accreditation text,
  created_at timestamptz not null default now()
);
create table public.passport_certifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  issuer text,
  issued_on date,
  expires_on date,
  created_at timestamptz not null default now()
);
create table public.passport_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null check (mime_type in ('application/pdf','image/jpeg','image/png')),
  bytes bigint not null check (bytes > 0 and bytes <= 10485760),
  ce_entry_id uuid references public.passport_ce_entries(id) on delete set null,
  license_id uuid references public.passport_licenses(id) on delete set null,
  certification_id uuid references public.passport_certifications(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint user_path_prefix check (storage_path like user_id::text || '/%')
);

alter table public.passport_profiles enable row level security;
alter table public.passport_licenses enable row level security;
alter table public.passport_ce_entries enable row level security;
alter table public.passport_certifications enable row level security;
alter table public.passport_documents enable row level security;

create policy "Own profile" on public.passport_profiles for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Own licenses" on public.passport_licenses for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Own CE" on public.passport_ce_entries for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Own certifications" on public.passport_certifications for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Own documents" on public.passport_documents for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create index on public.passport_licenses (user_id, expires_on);
create index on public.passport_ce_entries (user_id, completed_on);
create index on public.passport_certifications (user_id, expires_on);
create index on public.passport_documents (user_id, created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('passport-private', 'passport-private', false, 10485760, array['application/pdf','image/jpeg','image/png'])
on conflict (id) do nothing;

create policy "Upload own passport files" on storage.objects for insert to authenticated
with check (bucket_id = 'passport-private' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Read own passport files" on storage.objects for select to authenticated
using (bucket_id = 'passport-private' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Delete own passport files" on storage.objects for delete to authenticated
using (bucket_id = 'passport-private' and (storage.foldername(name))[1] = (select auth.uid())::text);
