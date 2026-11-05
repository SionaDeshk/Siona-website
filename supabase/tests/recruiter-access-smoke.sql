-- Siona v0.3: read-only access-control smoke test.
-- Run ONLY in the Supabase SQL editor against the intended test project.
-- Create a SECOND confirmed clinician user with no recruiter membership first.
-- Replace BOTH placeholder UUIDs below; keep single quotes.
-- This script does not insert, update or delete any records.
--
-- Important: SQL Editor normally runs with elevated database privileges.
-- SET LOCAL ROLE authenticated and JWT claim simulation below are needed
-- to exercise RLS as an ordinary client. This is NOT a substitute for
-- end-to-end browser/REST tests using actual user sessions.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'REPLACE_FOUNDER_UUID', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
DO $$
DECLARE n bigint;
BEGIN
  SELECT count(*) INTO n FROM public.recruiter_memberships
    WHERE user_id = auth.uid();
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: founder recruiter membership missing'; END IF;
  IF NOT public.is_recruiter() THEN RAISE EXCEPTION 'FAIL: founder recruiter check denied'; END IF;
  RAISE NOTICE 'PASS: founder recruiter membership';
END $$;
ROLLBACK;

BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'REPLACE_ORDINARY_CLINICIAN_UUID', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
DO $$
DECLARE n bigint;
BEGIN
  IF public.is_recruiter() THEN RAISE EXCEPTION 'FAIL: ordinary clinician has recruiter role'; END IF;
  SELECT count(*) INTO n FROM public.recruiter_memberships;
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: ordinary clinician can read recruiter memberships'; END IF;
  SELECT count(*) INTO n FROM public.clinician_profiles
    WHERE user_id <> auth.uid();
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: ordinary clinician can read others profiles'; END IF;
  SELECT count(*) INTO n FROM public.recruitment_pipeline;
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: ordinary clinician can read pipeline'; END IF;
  RAISE NOTICE 'PASS: ordinary clinician cannot read privileged data';
END $$;
ROLLBACK;

-- Manual write tests still required:
-- 1. As the ordinary clinician, attempt to INSERT/UPDATE recruitment_pipeline
--    through the client SDK and confirm permission denied.
-- 2. As an anonymous client, attempt to SELECT all three tables.
-- 3. As founder, change a candidate status and refresh to confirm persistence.
-- 4. In a second browser session, verify /platform/recruiter says Access restricted.
