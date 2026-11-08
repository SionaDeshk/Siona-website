# Siona Passport MVP

Branch: `feat/siona-passport-mvp`. This is an isolated implementation track; the production Siona website is unchanged.

## Architecture
- Next.js 16 App Router frontend hosted on Vercel
- Supabase Auth for authenticated clinician sessions
- Supabase Postgres with user-scoped row-level security
- Supabase Storage private bucket `passport-private`
- No public credential sharing or automatic verification in MVP

## Data model
- `passport_profiles`: clinician profile
- `passport_licenses`: jurisdiction, type, number, dates, self-reported status
- `passport_ce_entries`: provider, course, hours, completion date
- `passport_certifications`: issuer, certification, expiry
- `passport_documents`: file metadata and optional link to credential

## Security constraints
Do not upload PHI, patient records, SSNs, driver's licenses, or background checks in the MVP. Use private storage and authenticated user access only. Do not put the Supabase service-role key in the browser or GitHub. Use UUID-prefixed paths: `<auth.uid()>/<random-id>.pdf`. Enforce MIME/size limits server-side in addition to storage limits. Use signed download URLs with short expiry, never public URLs. Apply anti-malware scanning and retention/deletion policies before broader launch. An uploaded document is NOT verified by Siona.

## Implementation order
1. Review and apply `supabase/migrations/20261107_passport_initial.sql` in the intended Supabase project. This step is not automatic.
2. Add `@supabase/ssr` and `@supabase/supabase-js` to package dependencies and install locally.
3. Configure `NEXT_PUBLIC_PASSPORT_SUPABASE_URL` and `NEXT_PUBLIC_PASSPORT_SUPABASE_PUBLISHABLE_KEY` in Vercel and local environment. Never commit real values.
4. Implement SSR auth callbacks and guarded `/passport/app` routes. Confirm no unauthenticated data exposure.
5. Build license, CE, certification CRUD and private document upload with per-user ownership checks.
6. Build dashboard aggregations and date-filtered CE totals. Do not imply one state's CE qualifies for another.
7. Add credential PDF export, unit tests for ownership, and browser-level auth tests.
8. Deploy preview and test with synthetic credentials before real personal data.

## MVP acceptance criteria
- A signed-in nurse can add, edit, and delete their own CE entries.
- A nurse can upload a PDF certificate, download it privately, and delete it.
- A second account cannot read the first account's rows or files.
- Dashboard displays accurate CE totals for a selected date range and expiration reminders.
- A consolidated export clearly labels self-reported information.
