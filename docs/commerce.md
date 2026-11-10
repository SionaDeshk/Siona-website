# Quotes, fulfillment and operational follow-ups

The supply desk at `/workspace/commerce` extends the existing Operations and practice portal in the same Next.js application and Supabase project. No new provider, credential or paid project is required. Open it from Operations' **Quotes and fulfillment** link, or from an individual request.

## Activate this upgrade

The Operations and practice portal migrations are prerequisites. For an existing installation, review and apply **only** `supabase/migrations/202611100003_commerce.sql` once through the normal migration process or SQL Editor as the database owner (`postgres`). The installer enables RLS on the new tables; leave those table protections enabled. It adds eight tables, quote/handoff gates, versioned RPCs and a limited practice projection. Its guard refuses a repeat installation.

The existing administrator and connection variables stay in place. Deploy the reviewed code after the migration. Until it is installed, the working Operations screens and practice portal remain available; the new supply desk shows an update message and practice reads fall back to the previous snapshot RPC.

Existing requests retain their previous workflow. Newly created requests require an accepted quote. Recording an RFQ opts an older Draft/Review/Hold request into the quote workflow and moves Draft into Review. Completed history is preserved.

## Commercial workflow

1. Create a real coordination request in Operations or the practice portal.
2. **Record supplier request** logs an actual contact/request reference and response date. It records coordination; it does not send an email or contact a supplier.
3. **Record quote** captures the original supplier reference, evidence URL, currency, unit price, explicit shipping/tax, validity, lead time, delivery terms, public summary and internal notes. Quote quantity and unit come from the original request; comparisons are for the same product and supplier scope. A different supplier needs its own reviewed product/eligibility route. No automatic currency conversion or market price is supplied.
4. An administrator uses **Review publication → Shared** with substantive review findings. Current supplier approval, product revision, intended use and state/channel eligibility are rechecked. Draft quotes and source evidence remain private.
5. A practice requester reviews the full charges and explicitly accepts or declines in the practice request detail. Viewers cannot decide. Internal staff cannot accept on behalf of a practice without explicit practice membership. Administrator acceptance of an internal channel planning request is separate from consumer consent or checkout.
6. Staff **Mark Ready** after acceptance and operating review, then record the partner handoff. Acceptance records a commercial decision for coordination; no payment, purchase, shipment booking or prescription is executed.

Money is stored as bounded integer minor units for USD/CAD/EUR/GBP, all using two decimal places. Missing shipping/tax is rejected; enter 0 explicitly if none. Published quote terms cannot be edited in place. Record a new quote for revised terms. Acceptance snapshots preserve the exact amounts and attributed decision. Retries by the same accepting user return the existing acceptance; concurrent alternatives can select only one quote.

Quotes expire for publication and acceptance. A quote accepted while valid retains its terms after the offer deadline. A changed source/product scope blocks a new handoff until reviewed. Accepted terms cannot be withdrawn after a partner handoff; record an operational follow-up instead.

## Fulfillment and traceability

- Record handoff quantities, an internal partner reference, optional practice-visible carrier/tracking and expected date. Active handoffs cannot exceed the accepted request quantity. This begins coordination; it does not book transport.
- Record every physical unit against a supplier lot and expiry before dispatch/delivery. Lot records are append-only; after dispatch, corrections require a documented exception. Cancel an incorrect preparing handoff and record its replacement rather than overwrite history.
- Record observed Dispatched, Delivered or Exception events with a date and explicit practice-visible business message. Future events and events preceding prior progress are rejected. These are operator-reported facts, not live carrier confirmations.
- A delivery exception creates an open follow-up and holds active coordination. Resolve it with internal findings and a public resolution, then explicitly resume. Practice self-cancellation is blocked once an active handoff exists, including when an exception puts the request on Hold.
- Completion requires accepted terms, recorded delivery of all requested units and resolved follow-ups. Commercial scope and product classification are captured in the quote. A later catalog edit does not rewrite the classification of goods already dispatched or prevent recording their actual outcome.

## Recall follow-ups

An administrator records source evidence, the exact supplier/lot identifier, internal findings and a deliberately written practice message. The database matches known shipment lots to affected requests, creates one follow-up per request and holds active coordination. Completed delivery history remains completed with a visible open follow-up.

Resolve every affected follow-up before closing the case. **Case closure does not release recalled stock:** a lot with any recorded recall remains blocked from dispatch, including after the case is closed. Use a cleared replacement lot and document the actual disposition. This is follow-up coordination, not regulatory clearance, automated recall surveillance, patient outreach, warehouse inventory or a returns system.

## Access and operational boundaries

All eight new tables use RLS with direct application writes revoked. Internal members can read. Writers capture RFQs/quotes, record handoffs and observed events, and resolve follow-ups. Administrators publish/withdraw terms, approve internal planning quotes and open/close recall cases. Database checks independently enforce these roles, dates, versions and scope even if HTTP routes are bypassed.

The practice snapshot first applies the existing location-membership check. It returns only shared quote terms, that practice's shipment/tracking/lot data and deliberately public follow-up messages. Supplier references, source URLs, internal pricing reviews, internal partner references and staff notes are excluded. Raw table reads remain denied to external accounts. No patient-specific fields, prescribing, dispensing, purchase execution, payment processing or automatic supplier outreach are added. Free text still requires business-only use; it is not a PHI filter.

Each mutation and its audit record commit together. Request, quote and shipment versions prevent stale saves. Same-lot allocation and recall changes serialize; changing one practice ID cannot authorize another practice. Publication/acceptance/handoff recheck readiness, while observed delivery/completion records preserve the accepted historical scope.

The pilot loads up to 500 records per category and reports truncation. There is no carrier sync, notification queue, pagination archive, external supplier login or background recall feed. Supplier quotes and event evidence must be obtained through the authorized partner process. Do not treat fictional preview amounts as commercial data.

## Preview, checks and rollback

Run `npm run dev`, then open `/workspace/commerce/preview` and `/practice/preview`. Rehearsals use fictional local state, send no live writes and reset on refresh. Both return 404 in production. Run the existing lint, typecheck, unit, database, browser and build scripts documented in the README.

The database suite applies this upgrade to a populated v2 installation, verifies legacy preservation, exact amounts, roles, cross-practice projections, acceptance races, lot allocation, exceptions, recall matching and reverse rollback. Browser checks exercise staff fulfillment and practice acceptance on desktop/mobile, plus accessibility.

Before live use, verify the hosted workflow with the intended internal administrator and two separate practice accounts. Local SQL and fictional browser checks do not establish the deployed account/configuration state.

Rollback is destructive to commercial records. Export them first and review `supabase/rollback/202611100003_commerce.sql` with explicit production approval. Roll Commerce back before Portal and Operations. Existing requests, memberships and the internal event audit remain; removed commercial records require their export for complete recovery.
