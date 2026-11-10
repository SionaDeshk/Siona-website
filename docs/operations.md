# Siona Operations — first working module

Operations adds business supply-coordination workflows to the existing Next.js app and Supabase project at `/workspace/operations`. Evo remains the research and supplier-diligence workspace. This module uses its existing authentication, active internal membership, and supplier records. It requires no additional paid project or provider.

## Included

- Practice/location onboarding, business contacts, review evidence, review validity and administrator approval.
- A supplier-linked product/service catalog. Product changes invalidate the previous eligibility review through a revision check.
- Eligibility records for each exact product revision, U.S. state/DC and channel (Clinician or Consumer), with evidence and expiry.
- Coordination requests with a documented lifecycle: Draft → Review → Ready → Coordinating → Completed, plus Hold and Cancelled.
- External handoff references, supplied lot and expiry, a request history and an immutable attributed activity log.
- Responsive screens, search and channel filters, validation and a development-only interactive rehearsal.

This is an internal operations pilot. The additional [practice portal](practice-portal.md) provides separate location-scoped accounts and deliberately published catalog entries after its own migration. A consumer request is internal channel planning, not a public checkout or customer order. Clinical records, patient details, prescribing, payment processing, pharmacy dispensing, automated purchasing and actual shipping integrations are outside this module. Prescription medicines and research-use-only products can be recorded for diligence, but cannot be approved or progressed into coordination. A future licensed partner integration needs a separate implementation and review; changing a product name or obtaining a COA does not enable it.

## Activate in the existing project

The previously installed Evolution Engine schema and administrator membership stay in place. **Do not rerun its initial setup or first-administrator scripts.**

1. Review `supabase/migrations/202611100001_operations.sql`, back up the existing project, and apply this **new migration once** through the existing migration process or Supabase SQL editor as the database owner. It creates only five `ops_*` tables, a private helper schema, functions, indexes and new-table policies. It references existing suppliers and members; it does not alter their tables or policies. Its transaction refuses to run if Operations already exists.
2. Keep the existing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` settings. No new credentials or environment variables are needed. Never put a database password or service-role key in a public variable.
3. Deploy the reviewed application changes through the normal release process. Sign in to Evo and select **Operations workspace →**. Direct access is `/workspace/operations`.
4. Verify live with the intended internal roles: administrator, analyst, viewer, and an authenticated non-member. Also verify anonymous API access is denied. Local disposable-database tests do not establish that the hosted Auth/PostgREST configuration is correct.

Without this additional migration, Operations displays a database-update message and does not create replacement records or use demonstration data. The existing Evo workspace remains available.

## First workflow

1. **Practices → Add practice:** create one business record per location. Record its actual state, operations contact, scope and onboarding requirements. **Review onboarding** is administrator-only; Ready requires current dated evidence and substantive findings. Editing the practice resets it to Onboarding and clears its approval.
2. **Evo → Supply network:** complete supplier diligence there. Operations reuses those supplier records and requires current Approved stage, independent verification and a non-synthetic supplier at each handoff.
3. **Catalog → Add product:** record the actual supplier, internal SKU, classification, request unit and intended-use scope. **Review eligibility** records an administrator's product-specific state and channel assessment. Clinician approval does not authorize the Consumer channel or another state. An Approved label records an operator assessment; it is not a regulatory authorization issued by the software.
4. **New request:** choose a product, channel, state, quantity, requested date and business requirements. A Clinician request must reference a practice; Consumer planning must not borrow a practice record.
5. **Requests → Update coordination:** move Draft to Review. Ready, Coordinating and Completed each recheck current eligibility, supplier status and relevant practice onboarding. Record an external partner reference for Coordinating. Completed physical supplies additionally require a supplied lot and current expiry date. This records an outcome reported by the operator, not a carrier-confirmed delivery.
6. Use **Hold** when a gap or exception appears. Re-enter Review after resolving it. Terminal records remain visible, preserving their history. Each stage transition requires a rationale.

The date fields use ISO dates, with UTC date-only comparisons in the UI and UTC database date comparisons. Review validity through today's date is accepted. Existing Ready labels do not auto-transition at midnight; the interface shows current blockers and the database rechecks before the next handoff.

## Preview and verification

Run `npm run dev` and open `/workspace/operations/preview`. It contains fictional examples and supports an in-memory rehearsal of the forms and lifecycle. Changes stay in the tab and reset on refresh; it sends no write requests to the live API. This route is a 404 in production. It is not a substitute for actual source-backed supplier or practice records.

```sh
npm run lint
npm run typecheck
npm test
npm run test:db
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
npm run build
```

`test:db` uses only its disposable local PostgreSQL container. It applies both migrations, exercises the existing Engine and new Operations permissions and workflows, rolls back Operations before Evo, and confirms pre-existing application data survives. It never connects to the hosted project. Browser tests cover access denial, a full rehearsal through lot recording, practice creation, filters, mobile overflow and automated WCAG AA checks.

## Security and operational limits

- `/api/operations` uses the existing server-side Supabase cookie session and active membership checks. All mutations require same-origin JSON, a 16 KB streamed body limit, strict Zod validation and a writer role. The route never logs business payloads.
- All five new tables use RLS. Active internal members can read; authenticated clients have no direct insert/update/delete privileges. A narrowly scoped security-definer RPC checks roles, action fields and table constraints; reviews require administrator access even when the HTTP route is bypassed. Function search paths are empty and object references are qualified. Audit records capture the persisted record's fields, including evidence URLs, review validity and attribution, in the same transaction as the change. Application members cannot edit the history, and later reviews do not replace earlier snapshots.
- Request transitions lock the record and compare its version. Handoffs hold shared locks on the product, practice, eligibility and supplier records while validating them. Concurrent stale saves fail rather than overwrite a newer transition. Product revisions protect reviews from changed catalog scope.
- Evidence URLs are citations only; the application never fetches arbitrary destinations. Store evidence in appropriately controlled systems and use business records only. No patient file upload or medication fulfillment is added.
- The list endpoint loads up to 500 records per category and reports truncation. Missing linked records fail closed in the interface; the database checks actual records before transition. Add server pagination and aggregate reporting before expanding beyond the pilot. There is no background expiry scheduler, stock reservation, automated recall system, live supplier sync or shipment tracking provider.
- No external emails, orders, supplier approvals, purchases or payments are sent automatically.

## Rollback

Export Operations records first. `supabase/rollback/202611100001_operations.sql` removes only this module, retaining Evo's tables, supplier records and memberships. It is destructive to Operations data and must be explicitly approved before production use. Roll Operations back before the underlying Evolution Engine because of its foreign-key and helper-function dependencies. The initial migration has not been applied to the hosted project by this implementation task.
