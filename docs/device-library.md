# Sourced device library

The existing Device Guide now reads a local, typed research library in `src/lib/intelligence/device-library/`. This extends the existing content approach: no database, migration, ingestion service or separate app is added. Evo's business criteria and scores remain separate.

## Files and relationships

- `types.ts`: research depth, editorial status, evidence labels, subjects, sources, components, configurations, studies, safety notices and questions.
- `sources.ts`: canonical URLs, source kind, publication/revision information, individual check dates, access status and limitations. A check date is not a publication date or clinical endorsement.
- `components.ts`: the existing two exact identifier examples. Identity is located; labeling, materials, fixation, compatibility and safety review are not verified.
- `persona-content.ts`: existing Persona configuration/material/technology explanations moved out of JSX. Stable option IDs carry their own source, locator, evidence label and applicability; ordering does not determine evidence bindings.
- `records.ts`: two family records, options, supporting technologies, scoped claims, studies, historical notice, unresolved questions and a dated research session. Relations use stable IDs. The configuration collection is intentionally empty.
- `index.ts`: manufacturer-scoped selectors, claim/source lookups and authoring integrity checks. `device-profiles.ts` preserves the previous UI contract as a derived view, rather than a second manually maintained device record.

The existing Persona guide uses the library for its cards, source links, metrics, clinical finding, study metadata and historical notice. The generic research panel renders family/component/configuration status, claim-level provenance, scoped comparisons, source access and next research steps. It resets when the manufacturer changes. The existing comparison lanes, identifiers and 3D viewer remain available.

## Research depth and editorial readiness

These are independent authored fields. Neither source count nor completeness computes a quality/safety score or advances a status.

| Depth               | Minimum purpose                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discovery candidate | Name, manufacturer, category, geography if known, source and reason for inclusion. Not consumer-ready.                                            |
| Family overview     | Purpose, component context, major options, supporting technology, explanation, sources and unknowns.                                              |
| Verified component  | Exact identity plus applicable labeling, materials, fixation, compatibility and relevant safety information. An identifier alone is insufficient. |
| Evidence comparison | Defined configuration, population, comparator and outcome with design, sample, follow-up, findings, uncertainty, funding and limitations.         |

Persona reaches **family overview**, with two separately scoped study records. It does not reach verified-component or verified-assembly status. Triathlon remains a **discovery candidate** with portfolio context and a located femoral identity. Both need editorial review. The study records do not promote the family or assign comparative superiority.

Verified configurations require same-family component references, essential component roles, completed component checks and explicit compatibility citations. These are authoring checks, not a substitute for qualified review. Empty configurations are displayed as no verified assembly; no combination is inferred from a shared brand.

## Claim provenance

Each claim retains subject kind/ID, exact text, one of the six evidence labels, source IDs and useful passage/page locators, check date, geography/configuration applicability, limitations and editorial status. Material options stay scoped to their variant/family; the Ti-Nidium record does not identify the alloy of model 42-5026-066-02. AccessGUDID MRI fields are database observations, not scan instructions. Safety notices retain affected scope and whether a match to the research component is established.

Source links resolve through one canonical register. Unknowns may have no supporting citation and must remain labeled unknown. Verified facts and clinical findings cannot silently lose their citations. Searches and partial/inaccessible retrievals are recorded, with individual November 12 check dates retained for sources not re-opened November 13.

## November 13 research session

Starting pages and the two exact AccessGUDID records were re-opened, along with FDA K193223, FDA K234056 and the historical recall entry. Searches used `"42-5026-066-02" materials labeling` and `Persona NexGen randomized Mortensen 2025 funding`. Direct Persona trial full text returned a browser challenge; indexed primary-source text was accessible. Non-U.S. listing results were not adopted as U.S. exact-model material verification. The source register and session record contain URLs, dates and limitations.

This was a bounded manual search, not a systematic review, complete registry analysis, complete recall search or full IFU verification. Existing November 12 source reviews remain dated accordingly. No automated scraping, mirroring, manufacturer CAD copying or ingestion was added. Source consistency, licensing and maintenance requirements need review before automation.

## Next bounded step

Resolve the current U.S. IFU/material specification for Persona model 42-5026-066-02. Record document revision, geography, exact model applicability, MRI conditions and compatibility passages. Have the resulting claim set independently reviewed. Do not infer a compatible assembly, enumerate sizes for volume, introduce a hypoallergenic filter or advance editorial readiness from an identifier lookup.

## Validation

Run `npm test` for source/subject/reference integrity, manufacturer isolation and guards against premature component/configuration verification. Run the existing browser suite for desktop/mobile research disclosures, source access, keyboard accessibility, manufacturer isolation and preservation of guide/3D behavior. Run lint, typecheck and build; verify the existing protected Preview/Production access guards before a preview release. Private backups and credentials stay outside commits.

## Exact-component investigation — November 13, 2026

The existing development branch was clean at `4311ac0`; remote head matched. PR #16 remained open/draft against main, and the existing Vercel status was successful. This task makes local changes only: no push, preview deployment, main merge, migration or production writes.

`component-investigations.ts` adds a bounded, reusable six-topic checklist linked to the existing components and claims. Each topic records the outcome (identifier observation, partial or unresolved), claim IDs, searches/paths, access barrier, document needed, care-team question and check date. Claim provenance still lives in the existing claim/source relationship: title, URL, revision/date, locator, geography, applicability, limits and editorial status. No database or parallel record system is introduced. The integrity checker rejects missing topics, broken references and cross-manufacturer claims. Research outcomes do not set the component verification booleans.

### Persona 42-5026-066-02 / 00889024230408

| Topic                | Supported observation                                                                                                                                                                                                                                      | Remaining requirement                                                                                                                                                                                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity             | Exact GUDID model/DI, size 9, Zimmer Inc.; femoral role from GMDN classification. Record version March 17, 2022.                                                                                                                                           | Current U.S. label confirming constraint, profile and side. GUDID has no device description; non-U.S. CR/standard/right listing aliases were not adopted as U.S. labeling.                                                                                       |
| Materials            | No exact composition established. K142787 explicitly concerns other titanium femoral families (5050/5056/5070/5076).                                                                                                                                       | Model-matched alloy/constituent specification and surface-treatment labeling. No Ti-Nidium or CoCr assignment to the example.                                                                                                                                    |
| Fixation             | Linked K113369 historical U.S. system submission specifies cemented use only (PDF p2).                                                                                                                                                                     | Current model-matched U.S. fixation instructions. The family later added porous options; those do not change this component's labeling automatically.                                                                                                            |
| Compatibility        | Technique 3914.1-GLBL-en, August 2022, Appendix D (printed pp68–70; PDF pp70–72) contains CR/MC/UC and restricted NexGen charts.                                                                                                                           | Exact model-to-chart mapping, current U.S. revision and actual bearing/tibial identifiers. No pair or assembly is verified.                                                                                                                                      |
| MRI                  | Exact GUDID field remains MR Conditional.                                                                                                                                                                                                                  | Complete applicable U.S. conditions for every component: field strength, spatial gradient, RF/SAR or B1+rms, coil/position, duration/cooling and other restrictions where applicable. No numeric conditions are guessed or borrowed from a sensor configuration. |
| Regulatory / notices | DI links K113369 and K172524. K172524 PDF p3 contains a restricted KA indication, preserved as system-level. FDA Z-2578-2026 names a different model/DI (Revision augment 42-5572-066-10 / 00889024561014), so it is excluded as an exact-component match. | Retrievable exact-model/lot notice review, plus current labeling. A failed query and excluded family notice do not establish zero notices. Existing historical tibial notice remains separately scoped.                                                          |

The complete search terms and attempted source URLs are retained in the library and rendered in the research panel. New manual searches included the exact model and DI, exact model + IFU/material/recall, manufacturer-domain model/prefix searches, Persona MRI/IFU, and documented family technique/compatibility references. FDA K113369, K172524 and K142787 were opened directly. Non-U.S. listings and indexed titanium brochure leads were not substituted for current exact-model U.S. evidence.

Access barriers: Zimmer's electronic-labeling portal (`https://docs.zimmerbiomet.com/hcp`) exposed only a shell through the research tool; a direct environment HTTPS attempt returned CONNECT 403. No model-search result or IFU was obtained. Exact-model FDA recall query endpoint was inaccessible through the research tool. This is a retrieval limitation, not proof that documents/notices do not exist. No request-document form, email or other external communication was sent.

**Actual status remains family overview / needs editorial review.** The component has identifier evidence and partial scoped findings; all five verification booleans remain false. There is no verified assembly. Existing sources, study caveats, sensor-version distinctions and historical research sessions are preserved.

### Triathlon repeatability check

The existing `5510-F-401 / 07613327040272` example uses the identical checklist without new component roles, compatibility assumptions or a full dossier. Existing family/component IDs, claim labels/citations, source revision/access fields, open questions, configurations and independent depth/readiness all work unchanged.

GUDID confirms CR femoral, left, size 4 (record version December 11, 2019). Exact alloy/surface, current U.S. fixation and compatibility labeling remain unresolved. Its missing MRI safety information does not establish safe or unsafe status, and an unreleased submission number does not establish lack of clearance. GUDID lists both JWH and MBH codes; do not select fixation by that field alone.

Stryker's `ifu.stryker.com` redirects to `https://labeling.stryker.com/hcp`; the research tool exposed only the shell. The legacy strykermeded technique PDF redirected to the manufacturer homepage. Exact-model/DI recall searches and the FDA model-query endpoint were attempted; endpoint retrieval failed. Indexed manufacturer CDN protocol and mirrored catalog-pattern leads (`5510-F-X01`) were located; current U.S. applicability was not established, so they were not adopted as completed fixation or compatibility checks. No full Triathlon dossier was attempted. Status remains discovery candidate / needs editorial review; all component checks false, no verified configuration.

The only shared structural addition is the six-topic investigation relationship. The family selector now includes sources consulted in its own single-family research session, including unsuccessful retrievals; these sources are not evidence for a positive claim. This fixes visibility of access barriers without importing the other manufacturer's new sources.

### Next bounded action

Retrieve the current U.S. Persona Femoral Component package insert and model/material mapping through a usable public labeling interface, then resolve the exact model's composition, fixation and MRI scope. Review compatibility only after the relevant tibial and bearing model/DI labels are known. Independently review the resulting claim set before promoting research depth or editorial readiness. No deployment is part of this investigation.

### Validation for this investigation

- 41 unit tests passed, including six-topic completeness, claim ownership, source integrity, manufacturer isolation and prevention of premature verification.
- Lint, type checking and production build passed.
- All 18 desktop/mobile browser scenarios passed across the initial run and targeted reruns. Initial failures exposed an ambiguous new evidence-text selector and the existing five-second continuous-spin screenshot poll. The selector now targets its disclosure. Direct mobile inspection showed advancing frames and changing image hashes; the 3D test now waits for browser animation-frame boundaries before comparing pixels, rather than relying on the five-second poll. Application 3D code is unchanged. Both complete rotation/export checks then passed, as did the checklist checks in both viewports.
- Automated accessibility checks, manufacturer isolation, reduced motion, unsupported/context-lost fallback and GLB download assertions passed. Desktop/mobile checklist screenshots were manually inspected; screenshots and test logs remain outside the repository under `/workspace/work/device-information-prototype/` and `/workspace/work/`.
- Local built-server access smoke: production 404, preview 307 to the fixed login route, unconfigured 404. Empty credentials preserve the preview return intent and stop before contacting the authentication provider. No real sign-in, hosted authenticated review or database tests were performed; no database changes were made.
- Research retrieval limits remain as documented above. No independent clinical/editorial review or exhaustive safety review is claimed. No commit, push or deployment is part of this task.

## Research-to-education refinement — November 13, 2026

### Inspected state and preservation

The checkout was on `feature/device-information-prototype` at `4311ac0`. PR #16 was open/draft against main with the same head, and the remote branch matched. The preceding six-topic checklist, sources, tests and research notes were present as uncommitted work. They were preserved and incorporated into this iteration; the pre-iteration patch and untracked checklist copy were retained outside the repository under `/workspace/work/`. No unrelated application or private recovery files are included.

The existing cream-and-sage guide, manufacturer selector, exact identifiers, comparison lanes, Persona choice cards, sensor explanation and educational 3D interactions already existed. This iteration connects and hardens those structures rather than replacing them. There are still exactly two families and two identified component examples. Evo's commercial evaluation remains separate.

### Repeatable discovery and inclusion

Use this manual process for an existing candidate before adding another:

1. Start with the manufacturer portfolio and record the name, documented family aliases, manufacturer, clinical category, intended role, geography, discovery source/date, reason for inclusion and next verification action. The `DeviceFamily.discovery` fields supply the missing metadata; existing family fields supply identity, purpose and rationale. The exact example retains its own labeler, model, DI and source. No identifier is invented for a family-only candidate.
2. Prioritize research by relevance to knee replacement, a meaningful consumer choice, accessibility/applicability of evidence, and ability to exercise the shared structure. These are written inclusion reasons, not prevalence estimates, willingness-to-pay findings or Evo scores. Persona is the primary modular-family example; Triathlon tests generality without assumed Persona-like technologies.
3. Use portfolios, catalogs, surgical techniques and labeling to locate candidates; confirm identifiers with AccessGUDID and applicable FDA records. Use peer-reviewed studies and relevant registry reports for scoped outcomes, and model/lot-specific notices for safety history. Search snippets and mirrored catalogs remain retrieval leads. Registry review is a future research channel, not a review performed by this iteration.
4. Search exact model and DI first, then documented aliases. Record document title, URL, revision/date, page/section, geography, exact subject/configuration scope, access, check date and limitations using the existing source/claim relationships. An identifier listing does not establish current local availability of the family or an entire configuration. Both current family availability fields remain unknown with an explicit scope.
5. Apply the existing six-topic component checklist. For each required gap retain the searches, accessible sources, access/ambiguity barrier, exact missing document, why it matters and next feasible retrieval route. Use `gapState` to distinguish unknown, not searched, source inaccessible, not applicable and resolved. Do not use “not applicable” to waive a required verification check. The current examples have unknown or source-inaccessible gaps; no resolved or not-applicable finding is invented to demonstrate the type.
6. Stop repeated blocked retrievals after a bounded pass and name the next route. Only promote research depth when the actual evidence supports it. Route the resulting scoped claims for editorial review separately.

Automation is deferred: no scraper, ingestion service, ranking engine or broad catalog import. Before automating, establish stable primary-source access, document versioning, geography, licensing/redistribution permissions, source maintenance and a review process. This repository stores original explanations and references, not mirrored manufacturer documents or CAD.

### Status definitions and authoring guards

| User-facing distinction    | Existing representation and requirement                                                                                                                                                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discovery candidate        | Family `depth: discovery-candidate`; identity/source leads and next research action, not a full consumer dossier.                                                                                                                                                                                             |
| Family overview            | Family `depth: family-overview`; purpose, component choices, technologies, sources and explicit unknowns.                                                                                                                                                                                                     |
| Identified component       | Component `identification: located` with its exact model/DI source. This is separate from family depth; no redundant depth enum added.                                                                                                                                                                        |
| Verified component         | All five required verification checks, explicit exact-component claim references, accessible revisioned manufacturer/regulatory/safety evidence and all six required topic gaps resolved with supported findings. Family or identifier-only citations cannot satisfy technical checks.                        |
| Verified configuration     | Configuration `status: verified` with necessary verified component roles and explicit accessible, revisioned compatibility documentation. No configuration record exists for the current examples.                                                                                                            |
| Scoped clinical comparison | Existing study record with configuration, population, comparator, design, outcome, effect/uncertainty, follow-up, funding/conflicts and limitations; relevant participant/knee/outcome denominators are now explicit. Such a record does not automatically promote the family or establish an exact assembly. |

Editorial statuses remain independent. `draft` means draft; `needs-review` means awaiting editorial review of the stated scope, including its unknowns; `reviewed` requires a dated review reference, scope and explicit indication whether independent clinical review actually occurred. `needs-reverification` supports content requiring another evidence check. No actual record was promoted to reviewed. Self-checks and automated checks are not independent clinical review.

The shared validator now detects duplicate exact DIs and normalized labeler/model pairs as well as duplicate record IDs; validates evidence labels, disclosure metadata, source/claim relationships and discovery availability references; and rejects unsupported verification flags and undocumented review claims. Required gaps prevent component/configuration promotion even if flags are manually switched on. These are authoring safeguards; they cannot determine scientific applicability or truth from prose. A qualified human must still check the document's current market/model applicability and exact passages before setting verification evidence.

`relatedClaims` links retained assertions with a scope-difference or conflict explanation. It does not overwrite either assertion or automatically adjudicate a conflict. Source revisions and historical sessions remain intact. The family UI displays its single-family research logs only; earlier shared session details remain in maintainer history rather than leaking one manufacturer's searches into the other's consumer panel.

### Persona retrieval and useful scope distinction

After reviewing the earlier searches, one additional bounded pass searched `"42-5026-066-02" "package insert"`, `"00889024230408" "MRI"` and the manufacturer domain for Persona femoral instructions. The exact GUDID and both starting manufacturer pages were reopened. Zimmer's eIFU portal still exposed only a shell through the research tool; a direct HTTPS retry returned CONNECT 403. No document request or communication was submitted.

The professional overview links the accessible _Persona The Personalized Knee Story_ design rationale, `0890.2-GLBL-en`, issue April 2024. Its tibial material description is on PDF page 9 and issue/footer on page 32. Text searches for `cobalt` and `5026` did not establish the required exact-model mapping. This is family rationale, not a current U.S. femoral IFU, and an unsuccessful text search is not proof of absence. Technical verification remains unresolved.

The [consumer overview](https://www.thepersonalizedknee.com/en/personalized-knee-system/overview.html) describes Tivanium broadly in its material section. The [professional overview](https://www.zimmerbiomet.com/en/products-and-solutions/specialties/knee/persona-knee-system.html) places that description on the tibial option. Both source scopes are retained in `persona-consumer-material-scope` and linked to the existing tibial material assertion and unresolved femoral composition. This is a scope difference, not proof of an erroneous manufacturer claim or proof that the exact femur is titanium. Current U.S. model-matched composition/surface treatment, fixation, compatibility, MRI conditions and complete model/lot notice review remain needed.

Next feasible route: open the public manufacturer eIFU portal from a browser with access, select United States and search the exact model/DI; retain document applicability, revision and relevant pages. Obtain the other component identifiers before resolving an assembly. The authoring checklist now records why each missing field matters and its retrieval route separately from the consumer's care-team question.

### Consumer experience and Triathlon

Persona now proceeds from configuration to materials, separate technologies and sensor detail, then scoped evidence. The full research panel follows the shared care-team checklist. A short family-versus-component explanation stays visible before the options: one identified femur, missing bearing/tibial/optional patellar identifiers, no verified assembly, technical gaps unresolved. The six-question care-team checklist covers identifiers, labeling/materials/MRI, fixation and bearing/ligament strategy, outcome evidence, optional technology/cost/data/support, and model/lot notices. Detailed internal searches remain available in the research panel rather than interrupting the main explanation. All original sensor content, sources, comparisons, controls and downloads are retained.

Triathlon's exact GUDID record was reopened. It retains its own CR/left/size-4 identity, unreleased submission field, missing MRI information and unresolved technical dossier. The same discovery metadata, gap states, evidence guards, family/component distinction and research panel work without adding technology cards, assumptions or another family. Its public content and logs remain isolated. This was a repeatability check, not a full dossier or exhaustive safety search.

**Actual readiness:** Persona remains family overview with one identified, unverified femoral example. Triathlon remains discovery candidate with one identified, unverified femoral example. Both await editorial review; no independent clinical review, verified configuration or overall performance rating is claimed.

### Next single bounded action

Retrieve and review the current U.S. Persona femoral package insert plus exact-model material mapping through a usable public labeling interface. This will determine whether the component's required technical fields can be supported for review or must remain explicitly unresolved; it does not authorize a configuration, patient selection or publication.

### Validation and review handoff for this refinement

- 46 unit tests passed, including duplicate identities, explicit evidence bindings, required gaps, inaccessible-source rejection, review provenance, claim relationships and unknown availability.
- All 20 desktop/mobile browser scenarios passed in one run (3.4 minutes): manufacturer isolation, main journey ordering, keyboard/disclosure behavior, accessible labels and automated WCAG AA checks, 3D rotation/drag/controls, isolation/exploded view, GLB exports, reduced motion and fallback behavior. No application 3D code was changed. The preceding frame-boundary test correction is preserved.
- Lint, explicit type checking and production build passed. The sole lint correction escaped an apostrophe without changing rendered meaning. Generated `next-env.d.ts` route-path changes were restored to their pre-task state after checks.
- Local built-server guard smoke passed: production and unconfigured modes return 404 without the prototype; preview returns 307 to the fixed login route. Empty credentials preserve return intent and stop before the authentication provider. Authentication/authorization/audit source files and Evo's criteria/workflow were not changed. No live signed-in hosted review, real-account role test, database test or production-data operation was performed.
- Desktop/mobile layouts were visually checked. Artifacts/logs stay outside Git under `/workspace/work/device-guide-refinement/` and `/workspace/work/refinement-*.log`. Long element screenshots can include an offscreen skip-link capture artifact; an actual mobile viewport capture and computed bounds confirmed that the unfocused skip link remains above the viewport. No global accessibility styling was changed.
- Changed file groups: library `types.ts`, `index.ts`, `records.ts`, `sources.ts`, `component-investigations.ts`; interface `device-explainer.tsx` and its stylesheet, `persona-guide.tsx`, `device-research.tsx` and its stylesheet; the two existing device-library/browser test files; this maintainer document. The local commit includes the preserved, related checklist work from the prior handoff. No private backups, credentials or unrelated files are included.
- PR #16 and the successful existing Vercel preview remain on remote `4311ac0`. Publication is separate: no push, merge, preview redeployment, production deployment, access change, migration or external message was made. The new local commit and final working-tree status are reported in the conversation handoff.
