# Siona Evolution Engine — MVP

An internal, evidence-led workspace at `/workspace/intelligence`. It adds to the existing Next.js application; the public site, contact endpoint, Biologics/Intelligence editorial pages, and Passport demonstration at `/platform` remain available.

## Current integration status

The latest repository base inspected for this feature was `e064659` on `main`. It contains the Biologics supplier playbook/questionnaire and a Passport **demonstration**, but no existing Supabase client, authentication implementation, migrations, or configured Supabase connection. This feature therefore supplies the missing integration without replacing another application's policies. No remote database migration has been run. The existing Supabase project's URL/publishable key and an authorized database administrator are still needed for live use.

The core platform does not require an AI provider. Do not use synthetic records as real research, suppliers, customers, or commercial evidence.

## Connect the existing Supabase project

1. Review and back up the existing project before applying a migration. Do not create a second paid project merely for this feature.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` and the deployment/environment settings. A legacy anonymous key may be used if the project has not adopted publishable keys. These are the public client connection settings; **never supply a service-role key** to a `NEXT_PUBLIC_` field. Production requires an HTTPS project URL.
3. Apply `supabase/migrations/202611080001_evolution_engine.sql` through your established Supabase migration process or the SQL editor as the database owner. The migration is transactional and intentionally uses new `intel_*` tables and an isolated `intel_private` schema. It does not alter existing tables or policies, including Passport data. It uses Supabase's existing `auth` and `storage` schemas. Do not run the test bootstrap on a real project.
4. Provision an existing Auth user as the first internal administrator. Replace the placeholders below; do not copy them unchanged. Membership is separate from authentication:

   ```sql
   insert into public.intel_members(user_id, display_name, role)
   select id, 'REPLACE_WITH_INTERNAL_DISPLAY_NAME', 'admin'
   from auth.users where email = 'REPLACE_WITH_EXISTING_AUTH_EMAIL';
   ```

   Verify exactly one intended row was inserted. Add other users with `analyst` or `viewer` roles using the same administrator-controlled process. Disable public signup in Supabase Auth if it is not required by other applications. Membership RLS still denies all non-members even if Auth signup remains enabled for another app. Do not weaken existing Auth policies or existing application access.
5. Use an existing password-enabled Auth account to sign in at `/workspace/login`. New identities, invitations, and password recovery are managed by your existing Supabase administrator/Auth workflows in this MVP; this feature does not expose public signup or account administration. Setting `active=false` immediately revokes access on subsequent database/API requests.
6. Restart the development server after changing settings. Confirm a non-member is denied, a viewer is read-only, and an analyst can complete the workflow below. Then verify the same boundaries against the actual project's Storage API and Auth configuration before production use.

Cloud tasks should use their existing isolated checkout rather than create a worktree. The feature is on `feature/siona-evolution-engine`; review before merging or deploying.

## First real workflow

1. **Signals:** add a real original source URL, publisher, publication date, summary, industry/geography, reliability reasoning, evidence classification, relevance, and confidence. The server records collection time. Use *Record review* to document verification or dismissal. A publisher claim or model interpretation is not automatically a verified fact.
2. **Opportunities:** choose *Develop hypothesis* from a signal, or select one or more signals in *New hypothesis*. Answer the problem, affected party, proposed contribution, prospective customers/partners, economics, barriers, assumptions, and invalidation questions. Empty economics or partner information remains unknown; it is not a favorable result.
3. **Evaluate:** record a 0–5 assessment and reasoning for all nine criteria, leaving scores blank where evidence is missing. *Link evidence* can add supporting **or contradicting** signals and interpretation. Weights can be changed only by an administrator.
4. **Relationships:** add a legal organization and contacts. Record meeting/communication notes. A dated next action atomically creates a follow-up task; the executive queue shows it alongside validation experiments. Associate suppliers/institutions with opportunities through *Link relationship*.
5. **Supply network:** create a supplier against an organization, record categories, actual manufacturing locations, quality documentation, COA availability, traceability, commercial terms, verification status, owner, gaps, and next action. Use *Update diligence* as evidence arrives. Upload supporting documents privately, review them, and record the findings.
6. **Tasks:** assign an internal owner, due date, experiment design and success/invalidation criteria. Completion requires an outcome of at least ten characters; the database also enforces this requirement.
7. **Decisions:** record an attributed rationale, evidence links, changes to assumptions, and the next opportunity stage. Stage changes and the decision record are one transaction. The decision log and activity history remain visible in the executive workspace.

No purchase workflow, public catalog, external email outreach, inventory action, or automated supplier approval is implemented.

## Scoring

Criteria: customer demand, market attractiveness, differentiation, potential economics, feasibility, strategic fit, regulatory manageability, capital efficiency, and evidence quality. For the final two burden-related criteria, **higher means a more manageable burden**, not higher complexity or greater capital need.

Default weights total 100 (demand/evidence 15 each, other criteria 10). The score is `100 × sum(weight × known score / 5) / total configured weight`. Unknowns stay in the denominator and contribute zero. Coverage is known weight divided by total weight. Confidence is coverage multiplied by `0.25 + 0.75 × evidence-quality-score/5`; missing evidence quality therefore materially reduces confidence. A score without a sufficiently documented rationale is not counted. No number is a forecast of success. Compare the reasoning and missing evidence, not just rank order.

## Supplier qualification

Stages: Identified → Contacted → Responded → Under Review → Qualified → Negotiating → Approved / Rejected. Users can return records to review as circumstances change. New suppliers always start at Identified.

Qualified/Approved require:

- COA availability, substantive quality documentation and lot/manufacturer traceability;
- an independently verified status;
- at least one private supporting document with recorded human-verification findings;
- an attributable human review of **identity, classification, quality, traceability, commercial, and pilot** gates, plus a rationale of at least 20 characters.

The database enforces these gates even if a client bypasses the UI. Approval does not establish regulatory authorization or suitability for every product; human review is category/intended-use/jurisdiction specific. The playbook and questionnaire remain the source of diligence questions. A COA alone is insufficient. Do not treat research-use-only labeling as authorization for human use.

## Documents

The `intel-supplier-documents` bucket is private, limited to PDF/PNG/JPEG/plain text up to 4 MB. The upload route bounds the request, verifies supported file signatures/content, generates a UUID object name under the supplier ID, and records metadata. On metadata failure it attempts to remove the uploaded object. Bucket policies independently require an active member for reads and writer access plus a real supplier path for uploads. Signed download URLs last 60 seconds and use attachment disposition.

These checks are not antivirus scanning or a complete content-disarm service. Treat documents as untrusted, download them using managed endpoint protection, and add malware scanning/quarantine before processing a large external supplier intake. No automatic document ingestion or interpretation is performed. Supplier files are not sent to an AI provider.

## Sources and ingestion

Manual entry is the default and works without feed access. Add a tracked source with *Add source*. An administrator can enable the built-in FDA-focused Federal Register adapter with this exact URL:

```text
https://www.federalregister.gov/api/v1/documents.json?conditions%5Bagencies%5D%5B%5D=food-and-drug-administration&per_page=20&order=newest
```

Publisher: Federal Register; adapter: `federal-register`. Only the exact code-reviewed URL is fetched. User-entered citation URLs are displayed but never fetched by the server. Redirects, arbitrary destinations, oversized responses and long requests are rejected. Imported records retain the source publication date and default to unreviewed, low-confidence third-party claims, pending a human relevance assessment. `(source_url,title)` deduplication prevents duplicate imports. A disabled, blocked, or unavailable feed does not disable manual workflows.

A bounded, entity-rejecting RSS parser is included as an adapter building block, but no unverified RSS endpoints are enabled. To add one, confirm the publisher's public feed, register its exact URL in code, add parser tests, and obtain the environment's destination access. Do not scrape restricted sites.

Cloud outbound access needs `www.federalregister.gov`; the target Supabase project's actual hostname must also be permitted. The live public-feed operation was not verified against a configured project in this task.

## Optional AI drafts

Set server-only `SIONA_AI_API_KEY` and an explicitly selected `SIONA_AI_MODEL` available to your account to enable an OpenAI-compatible draft provider at `api.openai.com`. Nothing invokes it automatically. A writer must click *AI draft assistance* for a selected opportunity. Only linked signal titles, summaries, source URLs and classifications are sent, not supplier documents, contact records, or the whole database. Consider your organization's data-sharing policy before enabling it.

The provider contract returns a summary, hypotheses, competing explanations, evidence gaps, supplier questions, validation experiments and supplied citation IDs. Unknown citation IDs and invented URLs are rejected. All returned text is labeled **AI-GENERATED INTERPRETATION · HUMAN REVIEW REQUIRED**. Outputs are transient drafts, not automatically persisted facts, evaluations, stage transitions, supplier approvals, outreach, or purchase instructions. The model may still make unsupported statements in prose; users must verify claims before recording evidence. An absent/unavailable provider leaves every core workflow operational.

## Synthetic demonstration

An authenticated writer can load the small, explicitly labeled fictional dataset in the workspace footer. It has a per-user batch tag; repeat loading is blocked until that user's existing demo is removed. *Remove my demo data* removes only records tagged as synthetic and created by that user. Restrictive foreign keys atomically block removal if real records now reference demonstration data. It does not delete live records or clear the shared database. Audit history remains.

A separate **read-only design preview** is at `/workspace/intelligence/preview` in development only. It contains hard-coded fictional records, disables writes, and is a 404 in production. It never provides access to the actual database.

## Checks

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run test:db
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
npm run build
```

`test:db` requires a working **local** Docker daemon and the official `postgres:17-alpine` image. It starts a disposable PostgreSQL container bound to loopback on a random port with a randomly generated test password, bootstraps minimal test-only Auth/Storage schemas, applies the real migration, exercises the vertical data flow and RLS as distinct users, executes the rollback, and removes the container. It never connects to the real Supabase project. PostgreSQL tests validate SQL policies/functions; they do **not** establish that the hosted project's Auth, storage server, email, or network configuration is correct.

Browser tests cover the public navigation destinations and forms, animated/reduced-motion scientific graphics, unauthenticated workspace/API access, the synthetic read-only network preview, and accessibility. The public homepage assertions were updated to reflect the newer upstream homepage rather than its obsolete SIONA-only heading. Existing contact tests remain intact.

Next.js build and dev processes should be run sequentially when generating route types; simultaneous generation can create a temporary missing `.next/dev/types/routes.js` validation error. Stop only the server you started, finish the build, then restart development. This is a build-cache race, not a reason to disable type validation.

## Rollback

Before rollback, export required intelligence records and back up/download supplier documents. Remove bucket objects using the Storage API, **not** direct manipulation of object metadata; storage metadata deletion is not object deletion. Review `supabase/rollback/202611080001_evolution_engine.sql`, which drops only the newly introduced intelligence objects and policies. It does not drop or modify existing application/Auth tables. Rollback is destructive to Engine data and requires explicit operator approval in production. Test it on a copy first.

## MVP limitations / production review

- Hosted Supabase Auth, membership and Storage need connection and project-level validation; they have not been configured with real credentials in this task.
- The list endpoint returns up to 1,000 records per entity, newest first. This MVP needs server pagination/search and database-level aggregates before larger datasets; current overview counts describe the loaded records.
- One Siona workspace, not a multi-tenant SaaS. Admins manage membership in Supabase; no user-admin panel, MFA enrollment UI, password-recovery UI, or fine-grained per-record sharing is added.
- Document checks are format/size controls, not malware scanning. Signed URLs are short-lived bearer links.
- Opportunities retain their original hypothesis fields; later assumption changes are preserved in decision records rather than silently replacing the original hypothesis. No document OCR, autonomous monitoring scheduler, or queue workers are installed.
- Source and AI adapters require relevant outbound access and real provider configuration. Only manual intelligence workflows and the disposable database path can be validated without the hosted connection.
- No production deployment, main-branch merge, supplier approval, inventory purchase, or outbound contact is authorized by the software itself.
