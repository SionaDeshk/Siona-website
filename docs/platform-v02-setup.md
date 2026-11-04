# Siona Platform v0.2: secure foundation

This branch is **schema and security groundwork**, not a working live login. The public /platform route remains a fictional-data demo.

## Set up a dedicated Supabase project

1. Create a Supabase project owned by Siona. Enable email confirmation, configure the site's redirect allowlist and review email rate limits.
2. Run `supabase/migrations/202611040001_platform_foundation.sql` using the Supabase SQL editor or CLI.
3. Create your own user through Supabase Auth. Find its UUID in Authentication > Users.
4. In the SQL editor, manually grant recruiter access:
   `insert into public.recruiter_memberships (user_id) values ('YOUR-AUTH-USER-UUID');`
5. Before adding live account creation, configure server-side session handling, secure cookie-based auth, CSRF-safe mutations, bot protection, and verified email workflows. Never ship the service role key to the browser.
6. Build separate protected routes for clinician self-service and recruiters. Do not reuse the public demo dashboard for real data.
7. Test RLS with two distinct clinician accounts and one recruiter account: clinician A must not read B, neither clinician can elevate to recruiter, and only recruiters can see or edit pipeline rows.
8. Review privacy disclosures, data retention, breach response, access auditing, and credential handling before collecting any licenses or identity documents.

## Data boundaries

Only minimal clinician preference fields are defined. **Do not collect SSNs, DOB, medical information, copies of licenses, background checks, or identity documents** through this prototype. Any credential storage will require a separate secure design, private buckets, access policies, and retention procedures.

## Why no real signup yet?

The website currently has no Supabase project configuration or secure auth dependencies. This migration prepares the data model and row-level security without pretending the publicly accessible demo is a secure portal.
