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
