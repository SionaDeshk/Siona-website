# Siona practice portal

`/practice` connects invited practice users to Siona Operations in the existing application and Supabase project. It provides a published catalog, business coordination requests and practice-visible updates. No additional project, payment processor or messaging provider is required.

## Scope

- Separate practice membership with requester and viewer permissions. Users can switch only among their own active practice locations.
- Reviewed public catalog descriptions for an exact product revision and state, subject to current supplier approval and Clinician eligibility.
- Requests entering Operations at Review, with a business reference, requirements and retry deduplication.
- Public progress descriptions and deliberately published staff updates. Internal diligence, supplier identity, SKUs, credential evidence, internal review notes and partner handoff references stay outside the practice response.
- Cancellation by requesters during Review or Hold, immediate access revocation and immutable internal audit history.

This is a business coordination pilot. Patient records, prescribing, pharmacy dispensing, payments, a public consumer checkout, stock availability and automated shipping are outside this module. Medicine and research-use-only coordination blocks remain in place. Patient-specific workflows stay in appropriately licensed partners' systems. Free text is not automatic PHI detection or filtering; enter business information only.

## Activate in the existing project

**Do not rerun the installed Evolution Engine setup or recreate its administrator.** Review and apply these additive migrations once, in order, through the existing owner-controlled migration process:

1. `supabase/migrations/202611100001_operations.sql`, if Operations is not yet installed.
2. `supabase/migrations/202611100002_practice_portal.sql`.

Both refuse to run over their existing module. The portal migration adds three tables, portal-specific Operations request fields, private helpers, an update trigger and bounded RPCs. It does not give external accounts access to existing Intelligence or Operations rows, or change Evo's membership policy.

Keep the existing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the relevant Vercel scope and local environment. No new credential is required. Never put a database password or service-role key in a public variable. Deploy reviewed source through the normal release process after preview approval. Neither Operations migration has been applied to the hosted project by this implementation task.

If only the original Operations migration is installed, its existing screens still work. The Practice access view identifies the additional database update, and external access remains closed.

## Link an account

1. Create and review the practice location in Operations. An account alone does not complete credential or business review.
2. Provision the intended person's Auth identity through the existing Supabase administrator workflow, including confirmation and password/recovery arrangements. Account provisioning, invitations and recovery remain administrator-managed; the application does not send an invitation.
3. In **Operations → Practice access → Link practice account**, select the location, enter the existing Auth email and choose **Submit and view requests** or **View only**. An active internal administrator must make or change this link.
4. Share the actual deployment's `/practice/login` address through the authorized onboarding process. Do not add external users to `intel_members`, which grants internal workspace access.
5. Use **Edit permissions → Disabled** to revoke a location. Every read and mutation rechecks membership, even with a valid Auth session.

An account may have both internal and explicit practice memberships. Internal sign-in defaults to Evo for internal members; practice sign-in requires practice membership. Destinations are fixed application routes, never user-supplied redirect URLs.

## Publish a catalog entry

1. Complete supplier diligence in Evo and product/state/Clinician eligibility in Operations.
2. Choose **Catalog → Publish to practice**. Enter the public title and description, state, validity, status and internal review rationale.
3. Published entries appear only while the product revision, supplier, eligibility and practice onboarding remain current. Consumer approval does not substitute for Clinician approval.
4. Use **Edit publication** to revise or pause an entry. Version checks prevent stale publication saves. A saved Published label does not override the live availability checks.

Internal descriptions are not automatically published. Publication is not a statement of stock, price, a binding quote or medical authorization.

## Request and handoff

Practices choose an entry, quantity, requested date within 365 days and optional business requirements. The database verifies membership, requester permission, location, publication, product scope and current reviews before creating a Review-stage request. A submission key makes retries return the original request and rejects reuse with changed contents.

Staff continue the existing Operations lifecycle. Stage changes publish a fixed progress description, without exposing the internal rationale. **Publish practice update** on a portal request's detail panel creates an explicitly practice-visible business message and an internal audit record. It does not send email.

Requesters can cancel their practice's portal requests during Review or Hold with a reason and version check. Later stages require the operating partner process. Progress is operator-recorded coordination, not carrier-confirmed delivery or a purchase transaction.

## Access and data boundaries

- Server routes validate Supabase sessions, same-origin JSON, strict schemas and streamed 4 KB bodies. Unsupported actor/stage/patient-specific field names are rejected; operators still control free-text contents.
- Raw Operations/Intelligence rows remain inaccessible to practice users through RLS. Security-definer RPCs use empty search paths, qualified objects, explicit field projections and `auth.uid()`. A practice ID alone never authorizes access.
- The database rechecks permissions and live readiness. Mutations lock the membership and relevant resources; idempotency is scoped to a practice and submission key.
- Account linking and publication independently require an internal administrator. Practice-visible staff messages require an internal writer. External users cannot grant themselves access or change internal stages.
- `/practice` and `/api/practice` responses are private/no-store and noindex. No public signup, automatic invitation, MFA enrollment screen, background scheduler or patient upload is added.
- This pilot displays up to 100 catalog entries, 100 recent requests and 500 updates, with a truncation notice. Add pagination/archive retrieval before larger use.

## Rehearsal and checks

Run `npm run dev` and open `/practice/preview`. Fictional locations demonstrate requesting, cancellation and view-only access. Changes stay in the tab, send no live requests and reset on refresh. The route is a 404 in production.

```sh
npm run lint
npm run typecheck
npm test
npm run test:db
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
npm run build
```

The disposable PostgreSQL suite covers practice isolation, raw-table access, role checks, public/private field separation, publication eligibility, concurrent retries, revocation, cancellation and rollback. Browser checks cover the rehearsal, location switching, denied unauthenticated access, mobile overflow and automated WCAG AA checks.

Before inviting a real practice, verify the hosted session, RPCs, public/private separation and revocation with two distinct practice accounts and an internal administrator. Local SQL and fictional browser tests do not establish hosted configuration or clinical suitability.

## Rollback

Export relevant data first. `supabase/rollback/202611100002_practice_portal.sql` removes memberships, publications, public updates and portal-specific request fields. It preserves underlying Operations requests and internal audit snapshots. It is destructive to the removed portal records and requires explicit approval in production. Roll Portal back before Operations, and Operations before Evo.
