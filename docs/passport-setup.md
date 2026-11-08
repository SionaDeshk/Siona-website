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
- `npm test` runs local tests. The live isolation test runs only with `PASSPORT_RUN_LIVE_TESTS=1`, even if credentials are present. It delegates to the reviewed standalone script so cleanup and secret redaction stay consistent.
- The standalone command is `node --env-file=.env.passport-test scripts/test-passport-isolation.mjs` (Node 22+). Run only against the confirmed non-production **siona-passport** project with disposable records and two dedicated confirmed test users. An explicit standalone invocation runs immediately; there is no interactive confirmation. Store these six values in the ignored `.env.passport-test` file, never chat or Git:
  - `PASSPORT_TEST_SUPABASE_URL`
  - `PASSPORT_TEST_PUBLISHABLE_KEY`
  - `PASSPORT_TEST_USER_A_EMAIL`, `PASSPORT_TEST_USER_A_PASSWORD`
  - `PASSPORT_TEST_USER_B_EMAIL`, `PASSPORT_TEST_USER_B_PASSWORD`
- The expanded script checks both account directions, owner row access/updates, forged ownership, cross-account credential links, anonymous denial, private file downloads/signing/overwriting/deletion, and fixture deletion. It tracks IDs before writes, attempts every cleanup, verifies removal, and signs out only its local test sessions. It never creates/deletes accounts or changes policies. Network outages can still leave fixtures; any cleanup failure must be resolved before calling the run successful. These checks do not cover every table or policy (profile writes are deliberately excluded to preserve existing profiles).
- The configured browser sign-in/sign-out test also requires `PASSPORT_RUN_LIVE_TESTS=1`, account A credentials, and a `PASSPORT_TEST_SUPABASE_URL` exactly matching the app's `NEXT_PUBLIC_PASSPORT_SUPABASE_URL`. Passport browser tests disable traces, screenshots, and video so authentication artifacts are not retained. Use synthetic credentials only.
- Before real data: sign up/confirm/sign in; refresh session; add/edit/delete each credential type; test inclusive CE range totals; upload/download/delete a synthetic PDF; test second-account row/file denial; export and inspect the PDF; sign out and confirm protected routes redirect. Live project tests require the configured project and network access to its exact Supabase hostname.

PDF summaries clearly label all data self-reported and unverified. CE date filters apply to CE entries; license and certification sections export all owned records. Standard PDF font substitutes unsupported non-ASCII characters with `?`. Expiry reminders use UTC dates and include expired records plus the next 90 days. CE totals do not determine jurisdiction eligibility.

## Implementation verification (2026-11-07)

Production build and TypeScript check passed. All 16 local unit tests passed; the live Supabase isolation test was skipped because no project credentials/test accounts were configured. Four desktop/mobile browser assertions passed using `/usr/bin/chromium`; the configured sign-in/sign-out browser scenarios require the same test account settings. Passport-specific ESLint checks passed. Repository-wide lint reports nine pre-existing errors in `src/app/page.tsx`, `src/app/biologics/page.tsx`, `src/app/intelligence/page.tsx`, and `src/components/intelligence-field.tsx`; those existing website files were left unchanged. No migrations or production deployments were performed.

## Follow-up review (2026-11-08)

Document listing now pages through all owned metadata rows rather than stopping at Supabase's default row cap. License/certification date ordering is validated by the shared schema. PDF text wraps using actual font measurements so long identifiers and wide characters fit within the page margins. Live tests are explicitly opt-in and share the hardened standalone runner. No live project policies or migrations were changed during this review; live isolation remains unverified until credentials and project connectivity are available.

Follow-up check results: production build and TypeScript passed; 18 local tests passed, with the live isolation test skipped. Six desktop/mobile browser checks passed, including anonymous route guards, responsive login, and automated WCAG checks; two configured-login cases were skipped. Targeted Passport lint passed. Repository-wide lint still reports the same nine pre-existing website errors. The build still warns that missing website metadataBase configuration defaults to localhost. No live Supabase security result is claimed.

## Password recovery and form feedback

`/passport/login` links to `/passport/forgot-password`. Recovery requires the existing Passport Supabase variables and a valid `NEXT_PUBLIC_SITE_URL` (HTTPS for hosted previews; HTTP is allowed only for localhost/127.0.0.1 development). Add this complete recovery URL to Supabase Auth's redirect allowlist, replacing the host with the intended preview host:

```text
https://your-preview-host/passport/auth/callback?next=%2Fpassport%2Freset-password
```

Keep the existing sign-up callback allowlisted too. Supabase's recovery email template should preserve its standard confirmation link and the requested redirect. Open the email in the same browser that requested it so the PKCE verifier cookie is available. The callback exchanges the code server-side and allows only the dashboard or reset-password page as destinations. `/passport/reset-password` requires an authenticated session; password changes are performed with that user's client, never administrative credentials. Invalid/expired links return to sign-in. Signed-in users can also use this page to change their own password, subject to Supabase's recent-authentication and password policies.

The recovery response does not reveal whether an account exists or whether the provider rejected a particular email/rate-limited request. Delivery must be validated with a dedicated synthetic mailbox after configuring SMTP and redirect URLs. No email-delivery success is claimed by local checks. Reset forms validate matching passwords of 8–128 characters; Supabase may impose stronger requirements. Password values are never included in returned action state, logs, or URLs.

Forms show pending labels and disable submit buttons during Server Actions. Deleting records/documents asks for confirmation when JavaScript is available; cancel leaves the item untouched. These confirmations are a user-interface safeguard, not an authorization boundary—server ownership checks still protect every mutation. Credential deletion retains linked documents; document deletion removes the private file.

Recovery follow-up verification: production build, TypeScript, targeted Passport lint, and 21 local tests passed. Eight desktop/mobile browser checks passed, including the recovery page's navigation, responsive layout, accessibility, and signed-out reset-page guard. One live isolation test and two configured sign-in browser cases remain skipped. Recovery email delivery and an authenticated password update have not been exercised against Supabase. The existing metadataBase build warning remains; no website configuration was changed.

## Form retry behavior and document links

Credential and profile saves now return errors in the form rather than redirecting away. Validation highlights individual fields and focuses the first invalid field. Entered values survive provider errors and can be retried; successful new-credential saves clear the add form, while edits retain their saved values. Drafts remain only in the mounted page, not browser storage: navigation, sign-out, or refresh can clear them.

The upload form retains its selected credential and original File in memory after a rejected upload. Retry resends that selection without asking the user to choose the file again. Choosing a replacement updates the selection; success clears it. File bytes are never reflected in action state or URLs. If a response is interrupted and the commit outcome is unknown, the form advises refreshing the vault before retrying to avoid duplicates. Failed metadata writes attempt to remove the uploaded object; cleanup errors are reported explicitly.

Each vault document shows its linked license, CE entry, or certification and a link to that record. Credential cards list their attached documents with links back to the vault entries. Deleted credentials leave retained documents clearly marked as unlinked. If a credential cannot be loaded, the UI reports that instead of presenting a guessed association. Upload choices include credential type and identifying context to distinguish similar names.

`npm run test:passport-ui` starts a loopback-only fake Supabase provider on port 54331 and an isolated Next dev server on port 3001. It uses synthetic users/records and overrides Passport variables for that server; it never calls a hosted Supabase project. It verifies failed-save retries, invalid-date errors, profile preservation, file retention, bidirectional document links, deletion cancellation, and signed-in dashboard accessibility on desktop and mobile. Run it separately from other Next dev/browser runs because they share the `.next` development directory. This suite tests UI behavior, not Supabase RLS or real authentication security. Those still require the separately authorized live isolation test.

Form/link verification (2026-11-08): production build, TypeScript, targeted lint, and 24 local tests passed. Fourteen simulated signed-in desktop/mobile checks passed, including failed edits, validation focus, upload retries, deletion cancellation, links, and dashboard accessibility. Eight regular Passport browser checks passed; two live-login cases and the live isolation unit wrapper remain skipped. The fake-provider checks establish UI behavior only. The existing metadataBase build warning remains. Main, website configuration, and live database policies were not changed.
