# Siona Passport setup and validation

Implementation lives on `feat/siona-passport-mvp`, under `/passport`. No production deployment or main branch update is required. The existing Siona pages remain intact.

## Separate Supabase project

1. Select the **siona-passport** Supabase project (never the website's database).
2. Review and apply `supabase/migrations/20261107_passport_initial.sql`, then `supabase/migrations/20261108_passport_ownership.sql` in its SQL editor. These migrations are **not automatically applied**. The second migration rejects cross-owner credential links and enforces private bucket settings. Existing invalid document links must be corrected before applying its constraints.
3. Set `NEXT_PUBLIC_PASSPORT_SUPABASE_URL` and `NEXT_PUBLIC_PASSPORT_SUPABASE_PUBLISHABLE_KEY` in local `.env.local` and the Vercel preview environment. Use the project's publishable key, never a service-role key. Passport does not read or fall back to the existing website's Supabase variables. All operations use the authenticated clinician's token and RLS. No credentials are committed.
4. Set `NEXT_PUBLIC_SITE_URL` to the exact preview/deployment origin. In Supabase Auth URL Configuration, set the Site URL and allow `<origin>/passport/auth/callback` for each intended environment. Enable Email/password auth and email confirmation. Configure SMTP and Auth rate limits for production. Confirmation links must return an authorization code to the callback (PKCE); browser confirmation should happen in the browser that initiated signup.
5. Install with `npm ci`, then `npm run dev`. Open `/passport`. Missing configuration disables login safely.

## Upload behavior

PDF/JPEG/PNG uploads are limited to **4 MiB** by the server application to fit Vercel's 4.5 MB function payload limit, including multipart overhead. The initial storage migration permits 10 MiB as an outer bound. The Server Action body limit is 4,400 KB. Both MIME and magic bytes are checked, filenames are metadata only, and storage paths use `<user UUID>/<random UUID>.<extension>`. Downloads require an owned metadata row and generate a 60-second signed URL. Anyone possessing that short-lived URL can use it until expiration. Never publish it. Deleting a credential retains its documents, with their credential links set to null; delete documents separately to remove stored files. Failed metadata inserts trigger storage cleanup. If cleanup fails during an outage, reconcile orphaned files operationally.

Uploads are **not malware scanned** or verified. Do not upload PHI, patient data, SSNs, driver's licenses, or background checks. Before broader launch, add malware scanning/quarantine and documented retention/account-deletion policies, as required by the MVP spec. Supabase user deletion cascades metadata but does not automatically remove storage objects; an operational storage cleanup process is needed before offering account deletion.

## Checks

- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
- `npx playwright test tests/e2e/passport.spec.ts`: desktop/mobile anonymous guards and login layout.
- `npm test` includes a live RLS/storage isolation test, skipped unless the two synthetic test account pairs below and public Supabase environment variables are set. Use two distinct, confirmed accounts in a test/preview project. It creates synthetic CE/file fixtures and removes them afterward. Never supply production personal credentials.
  - `PASSPORT_TEST_EMAIL_A`, `PASSPORT_TEST_PASSWORD_A`
  - `PASSPORT_TEST_EMAIL_B`, `PASSPORT_TEST_PASSWORD_B`
- Before real data: sign up/confirm/sign in; refresh session; add/edit/delete each credential type; test inclusive CE range totals; upload/download/delete a synthetic PDF; test second-account row/file denial; export and inspect the PDF; sign out and confirm protected routes redirect. Live project tests require the configured project and network access to its exact Supabase hostname.

PDF summaries clearly label all data self-reported and unverified. CE date filters apply to CE entries; license and certification sections export all owned records. Standard PDF font substitutes unsupported non-ASCII characters with `?`. Expiry reminders use UTC dates and include expired records plus the next 90 days. CE totals do not determine jurisdiction eligibility.

## Implementation verification (2026-11-07)

Production build and TypeScript check passed. All 16 local unit tests passed; the live Supabase isolation test was skipped because no project credentials/test accounts were configured. Four desktop/mobile browser assertions passed using `/usr/bin/chromium`; the configured sign-in/sign-out browser scenarios require the same test account settings. Passport-specific ESLint checks passed. Repository-wide lint reports nine pre-existing errors in `src/app/page.tsx`, `src/app/biologics/page.tsx`, `src/app/intelligence/page.tsx`, and `src/components/intelligence-field.tsx`; those existing website files were left unchanged. No migrations or production deployments were performed.
