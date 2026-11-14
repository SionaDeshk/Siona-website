# Evo opportunity validation — Phase 1

The Opportunities view now connects the original hypothesis, source evidence, nine-criterion scorecard, recorded barriers/assumptions, validation tasks and decision history. A six-step navigation and next-action summary help reviewers move through one opportunity without switching workspace tabs. Existing network exploration, score configuration, AI drafts, signal review, task outcomes and decision actions remain available.

## Review locally

Run the existing development server and open `/workspace/intelligence/preview`, then Opportunities. Select **Explore Device information case** or **Explore Supplier-direct Biologics case**. These are unvalidated planning cases, not real business records or approvals. The preview has no write capability and returns 404 in production. Sources are references from saved research, marked unreviewed; market demand, economics and product eligibility are not inferred from them. No scores, decisions, owners or deadlines are fabricated for the two cases.

In the authenticated workspace, the same starting-case cards prefill the existing New hypothesis form. Only writers can draft. A user must select relevant signals and explicitly save through the existing `opportunity` operation. Template IDs and preview records are never inserted automatically. Drafting does not copy preview evidence, experiments or decisions into the live workspace. After an authorized save, create the actual validation task through Assign validation and set an owner/date. This release performs no hosted writes itself.

## What changes, and what stays in place

- UI composition and static planning content only; no migration, new database table, endpoint or authentication change.
- Existing nine criteria, configured weights, conservative unknown handling, scoring function and confidence calculation remain unchanged.
- Assessment coverage is explicitly distinguished from verified evidence; confidence is labeled a heuristic rather than a success probability.
- Evidence shows original source, classification, source reliability, review status, dates, review notes and the opportunity-specific interpretation. Contradicting findings belong in that interpretation through the existing evidence form.
- The risks view displays the original barriers, assumptions and invalidation criteria, plus unknown assessment criteria. Missing barriers never imply clearance. Recorded decisions hold subsequent changes to assumptions; no structured risk register is introduced here.
- Experiments display all linked tasks, including completed outcomes and cancelled history. An outcome does not automatically pass a hypothesis or change its stage.
- Decisions display the existing rationale, author/date, changed assumptions and cited signals. Stage transitions still use the existing transactional, audited RPC.
- Existing role checks, Supabase RLS and audit mechanisms remain the authority for all writes. Viewer and preview actions remain disabled; weight changes remain administrator-only.

## Initial questions

**Device information:** Is exact-model, source-linked information useful beyond existing resources, and can a distinct professional payer support the cost of maintaining it? Start with one implant category. FDA identifiers and regulatory records are not comparative clinical-quality scores. Test usefulness and willingness to pay separately, with predefined thresholds and no patient records.

**Supplier-direct Biologics:** Can one exact product/intended-use/buyer/jurisdiction route be authorized and serve a real unmet buyer need at a defensible margin? Written supplier authorization, product-specific regulatory review, documentation and downside economics remain unresolved. A prospective supplier is not a partner; a non-response is missing evidence. No outreach, product offer, order or payment is automated.

## Limits and next review

Risk/assumption text, experiment criteria/outcomes and economics remain in the existing fields. Criterion-level evidence relations, versioned evaluations, structured experiment results and economics scenarios are deferred to a separately approved Phase 2. Existing workspace queries are bounded to 1,000 rows per table; this UI does not establish complete historical coverage beyond loaded records. Hosted authenticated workflows require a separate account-based review before release.

Review both cases locally on desktop and mobile before considering Phase 2 or any release. No production deployment, production-data mutation or migration is part of this implementation.
