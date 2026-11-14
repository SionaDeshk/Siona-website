import type {
  ComponentInvestigation,
  DeviceClaim,
  ResearchSession,
} from "./types";

const checkedOn = "2026-11-13";
function finding(
  id: string,
  familyId: string,
  text: string,
  sourceId: string | null,
  locator: string,
  applicability: string,
  limitations: string,
  kind: "component" | "family" = "component",
): DeviceClaim {
  return {
    id,
    familyId,
    subject: {
      kind,
      id: kind === "component" ? `${familyId}-femoral` : familyId,
    },
    text,
    label: sourceId
      ? "Verified specification or regulatory fact"
      : "Unknown or not yet verified",
    citations: sourceId ? [{ sourceId, locator }] : [],
    checkedOn,
    geography: "U.S. investigation; source geography and limits stated below",
    applicability,
    limitations,
    editorialStatus: "needs-review",
  };
}
export const investigationClaims: DeviceClaim[] = [
  finding(
    "persona-role-check",
    "persona",
    "The exact DI is classified as an uncoated metallic femoral component; the record has no device description.",
    "persona-gudid",
    "Device Identifier Information; GMDN 32831",
    "42-5026-066-02 / 00889024230408; size 9 identifier record.",
    "The generic classification supports the role, not exact alloy or surface treatment. CR/standard/right aliases found in non-U.S. listings were not adopted as verified U.S. labeling.",
  ),
  finding(
    "persona-material-check",
    "persona",
    "Exact alloy, composition and surface treatments remain unresolved for this model.",
    null,
    "",
    "42-5026-066-02 only.",
    "Do not assign titanium, Ti-Nidium, cobalt-chromium composition or a coating from another variant or a generic classification.",
  ),
  finding(
    "persona-fixation-check",
    "persona",
    "The linked original K113369 system clearance specifies cemented use only.",
    "persona-fda-original",
    "PDF page 2 / Intended Use; PDF page 5 / clearance letter",
    "Historical U.S. system submission linked by this DI; not current exact-model instructions.",
    "Cemented context is supported, but current model-matched fixation labeling is still needed. Later porous-family options must not overwrite this distinction.",
  ),
  finding(
    "persona-compatibility-check",
    "persona",
    "The technique contains separate CR, MC and UC compatibility charts for Persona CR femurs, plus restricted NexGen charts.",
    "persona-technique",
    "Appendix D, printed pages 68–70 / PDF pages 70–72",
    "Global family technique 3914.1-GLBL-en, August 2022; family-level document observation.",
    "Exact model-to-chart applicability and current U.S. revision not established. No tibial or bearing model/DI is selected. Chart presence does not verify an assembly.",
    "family",
  ),
  finding(
    "persona-regulatory-check",
    "persona",
    "The exact identifier record links K113369 and K172524.",
    "persona-gudid",
    "FDA Premarket Submission",
    "Submission links for 42-5026-066-02 / 00889024230408.",
    "Linked clearances do not prove current labeling, all compatible models or clinical superiority.",
  ),
  finding(
    "persona-ka-scope-check",
    "persona",
    "K172524 restricts its kinematic-alignment route to specified CR femoral and CR/UC bearing combinations with nonporous cemented tibial components without a stem extension.",
    "persona-fda-ka",
    "PDF page 3 / Indications for Use",
    "U.S. 2018 system indication; not an individual treatment recommendation or model-level assembly match.",
    "Do not generalize the KA indication to every Persona configuration; current component inserts remain needed.",
    "family",
  ),
  finding(
    "persona-titanium-exclusion-check",
    "persona",
    "K142787 adds titanium-alloy femoral families 5050, 5056, 5070 and 5076 with a titanium-nitride surface treatment.",
    "persona-fda-titanium-history",
    "PDF pages 4–5 / Purpose and Device Description; PDF page 6 / MRI evaluation",
    "Those enumerated families; not model 42-5026-066-02.",
    "Neither these materials nor the MRI discussion establish this research model's composition or numeric scan conditions.",
    "family",
  ),
  finding(
    "persona-safety-search-check",
    "persona",
    "Component-specific safety-notice coverage remains unresolved after bounded model, DI and family searches.",
    null,
    "",
    "42-5026-066-02; lot not supplied.",
    "FDA query retrieval failed. Existing tibial notice remains separately scoped. The 2026 Revision augment notice names different identifiers; no absence-of-notices conclusion.",
  ),
  finding(
    "persona-excluded-notice-check",
    "persona",
    "The 2026 Revision augment notice identifies model 42-5572-066-10 and DI 00889024561014, different from this femoral example.",
    "persona-revision-excluded-notice",
    "Product; Code Information; Recall Status",
    "Excluded search lead Z-2578-2026; lot 66232947, not a match to the research component.",
    "Shared brand and size 9 are insufficient to match notices; this exclusion does not complete the safety search.",
    "family",
  ),
  finding(
    "triathlon-role-check",
    "triathlon",
    "The identifier describes a cruciate-retaining femoral component, size 4, left.",
    "triathlon-gudid",
    "Device Description; Clinically Relevant Size",
    "5510-F-401 / 07613327040272.",
    "Role and identifiers are supported; not a complete device or an exact material specification.",
  ),
  finding(
    "triathlon-material-check",
    "triathlon",
    "Exact alloy and surface treatment remain unresolved for the Triathlon example.",
    null,
    "",
    "5510-F-401 only.",
    "Generic uncoated-metal GMDN examples and other Triathlon variants do not establish composition.",
  ),
  finding(
    "triathlon-fixation-check",
    "triathlon",
    "Current U.S. model-matched fixation instructions have not been established.",
    null,
    "",
    "5510-F-401 only.",
    "GUDID lists both JWH and MBH product codes. Indexed catalog-pattern leads describe cemented 5510-F-X01, but a current applicable U.S. insert was not established; no verification upgrade.",
  ),
  finding(
    "triathlon-compatibility-check",
    "triathlon",
    "No model-specific tibial or bearing relationship is verified for this example.",
    null,
    "",
    "5510-F-401; other component identifiers unspecified.",
    "Matching size 4, shared brand or a catalog listing is not a compatibility instruction.",
  ),
  finding(
    "triathlon-safety-search-check",
    "triathlon",
    "The exact record does not release a premarket submission number; component-specific notice coverage is incomplete.",
    "triathlon-gudid",
    "FDA Premarket Submission",
    "5510-F-401 / 07613327040272.",
    "This is not evidence of missing clearance or zero recalls. FDA exact-model query retrieval failed; a model/lot-scoped review is still required.",
  ),
];

type Row = [
  ComponentInvestigation["topic"],
  ComponentInvestigation["outcome"],
  string[],
  string[],
  string,
  string,
  string,
];
function checklist(familyId: string, rows: Row[]): ComponentInvestigation[] {
  return rows.map(
    ([
      topic,
      outcome,
      claimIds,
      searched,
      barrier,
      documentNeeded,
      careTeamQuestion,
    ]) => ({
      id: `${familyId}-${topic}-investigation`,
      familyId,
      componentId: `${familyId}-femoral`,
      topic,
      outcome,
      claimIds,
      searched,
      barrier,
      documentNeeded,
      careTeamQuestion,
      checkedOn,
      gapState:
        topic === "identity" ||
        (familyId === "persona" && topic === "compatibility")
          ? "unknown"
          : "source-inaccessible",
      whyItMatters: {
        identity:
          "An identifier locates a part; current labeling still needs to establish its exact configuration and role.",
        materials:
          "Material choices cannot be explained reliably without the exact alloy and surface treatment; family colors and branding do not supply them.",
        fixation:
          "Family cemented/cementless options do not authorize either method for an individual component.",
        compatibility:
          "The bearing and tray must have their own identifiers and documented relationships; shared size or brand is insufficient.",
        mri: "A status word or empty database field cannot replace the conditions the MRI team needs for the entire implant assembly.",
        "regulatory-safety":
          "Notice scope depends on model and often lot; incomplete retrieval cannot establish absence of notices.",
      }[topic],
      nextRetrievalRoute:
        topic === "regulatory-safety"
          ? "Re-run the documented FDA recall query in a browser with database access, retain search coverage and notices, then match model/DI and lot without extrapolating from the brand."
          : `Use the public ${familyId === "persona" ? "Zimmer Biomet" : "Stryker"} labeling portal from a browser with access; select United States and search the exact model/DI. Record the insert revision and applicability before using technical fields. For compatibility, obtain the other component identifiers first.`,
    }),
  );
}
const personaPortal =
  "Zimmer labeling portal returned only a shell through the research tool; direct environment access was blocked by CONNECT 403. No model-matched IFU retrieved or document request sent.";
const strykerPortal =
  "Stryker IFU portal redirected to labeling.stryker.com/hcp and exposed only a shell. Legacy strykermeded PDF redirected to the homepage. Current U.S. document applicability not established.";
export const componentInvestigations: ComponentInvestigation[] = [
  ...checklist("persona", [
    [
      "identity",
      "record-observation",
      ["persona-femoral-identity", "persona-role-check"],
      ['"00889024230408"', '"42-5026-066-02" Zimmer material'],
      "Exact GUDID record accessible; no description or manufacturer model-matched U.S. catalog retrieved.",
      "Current U.S. package label/catalog mapping model, side, constraint and profile.",
      "Can you confirm the complete femoral model, side and profile on my implant label?",
    ],
    [
      "materials",
      "unresolved",
      ["persona-material-check", "persona-titanium-exclusion-check"],
      [
        '"42-5026-066-02" "IFU"',
        'site.zimmerbiomet.com "Persona" "Femoral" "CoCr"',
      ],
      personaPortal,
      "U.S. model-matched material specification and package insert, including alloy standard, constituents and surface treatment.",
      "Which alloy and surface treatments apply to this exact model, and where are they documented?",
    ],
    [
      "fixation",
      "partial",
      ["persona-fixation-check"],
      [
        'site.zimmerbiomet.com "42-5026" Persona',
        'Persona knee "42-5026" "Cemented" surgical technique',
      ],
      personaPortal,
      "Current U.S. femoral package insert explicitly covering 42-5026-066-02 and its fixation.",
      "Is this particular femoral component cemented, and can you show me its applicable instructions?",
    ],
    [
      "compatibility",
      "partial",
      ["persona-compatibility-check", "persona-ka-scope-check"],
      [
        'site.zimmerbiomet.com "Persona" "42-5026-066-02"',
        "Persona technique Appendix D compatibility",
      ],
      "Family charts accessible, but exact-model-to-chart mapping and current U.S. applicability not established.",
      "Current U.S. Persona Femoral Component package insert and compatibility table; exact tibial, bearing and optional patellar model/DI labels.",
      "Which exact bearing and tibial models are planned, and which table documents their compatibility?",
    ],
    [
      "mri",
      "unresolved",
      ["persona-femoral-mri-record"],
      [
        "site.zimmerbiomet.com Persona MRI conditions IFU femoral",
        "Persona knee MRI safety Zimmer IFU 87-6204",
      ],
      personaPortal +
        " Non-U.S. patient leaflet and sensor-system MRI leads were not substituted.",
      "Current U.S. MRI labeling mapped to this component and every part of the assembly: field strength, gradient, RF/SAR or B1+rms, coil/position limits, duration/cooling and other applicable restrictions.",
      "Can the MRI team check the complete implant list and exact conditions before a scan?",
    ],
    [
      "regulatory-safety",
      "partial",
      [
        "persona-regulatory-check",
        "persona-safety-search-check",
        "persona-excluded-notice-check",
      ],
      [
        '"42-5026-066-02" recall',
        'site.accessdata.fda.gov "Persona" "femoral" recall',
        "FDA recall database productdescriptiontxt=42-5026-066-02",
      ],
      "Exact-model FDA recall query inaccessible; family results included a different Revision augment. No exhaustive review or lot matching completed.",
      "Retrievable FDA/manufacturer model- and lot-scoped notices plus dated search coverage; current U.S. labeling.",
      "Have the exact model and lot for every implanted component been checked against applicable notices?",
    ],
  ]),
  ...checklist("triathlon", [
    [
      "identity",
      "record-observation",
      ["triathlon-femoral-identity", "triathlon-role-check"],
      ['"07613327040272"', '"5510-F-401" site:stryker.com'],
      "Exact GUDID record accessible; bounded check only.",
      "Current U.S. package label matching model/DI and side.",
      "Does the implant label confirm size 4, left, CR and this exact DI?",
    ],
    [
      "materials",
      "unresolved",
      ["triathlon-material-check"],
      ['Triathlon "5510-F-401" material'],
      strykerPortal,
      "Model-matched U.S. insert/material specification with alloy and surface treatment.",
      "Where is the material specification for this exact femoral component?",
    ],
    [
      "fixation",
      "unresolved",
      ["triathlon-fixation-check"],
      [
        'site.stryker.com "Triathlon" "5510" "cemented" surgical technique',
        'site.stryker.com "Triathlon" "surgical protocol" "5510-F-X01"',
      ],
      strykerPortal +
        " Indexed Stryker CDN protocol lead was opened, but current U.S. applicability was not established.",
      "Current U.S. 5510-F-401 package insert; manufacturer catalog mapping and revision.",
      "Can you confirm this component's fixation from its own insert?",
    ],
    [
      "compatibility",
      "unresolved",
      ["triathlon-compatibility-check"],
      ["5510-F-401 Triathlon CR catalog and surgical protocol references"],
      strykerPortal,
      "Current U.S. compatibility chart and exact tibial/bearing identifiers.",
      "Which component numbers form my assembly, and where is that relationship documented?",
    ],
    [
      "mri",
      "unresolved",
      ["triathlon-femoral-mri-record"],
      ["07613327040272 Device Characteristics; Stryker IFU portal"],
      strykerPortal,
      "Current exact-component and complete-assembly U.S. MRI labeling; record every applicable condition or explicit absence of testing.",
      "Can the MRI team obtain the applicable labeling rather than infer safety from an empty field?",
    ],
    [
      "regulatory-safety",
      "unresolved",
      ["triathlon-safety-search-check"],
      [
        '"5510-F-401" recall site:accessdata.fda.gov',
        '"07613327040272" recall',
        "FDA recall database productdescriptiontxt=5510-F-401",
      ],
      "Exact FDA query inaccessible; no submission number released by this DI record. Search results do not prove absence of a notice.",
      "Exact submission mapping and retrievable FDA/manufacturer model/lot notices with search date and coverage.",
      "Has the exact model and lot been checked, including the other assembly parts?",
    ],
  ]),
];
export const investigationSessions: ResearchSession[] = [
  "persona",
  "triathlon",
].map((familyId) => ({
  id: `2026-11-13-${familyId}-component-check`,
  date: checkedOn,
  familyIds: [familyId],
  terms: componentInvestigations
    .filter((row) => row.familyId === familyId)
    .flatMap((row) => row.searched),
  openedSourceIds:
    familyId === "persona"
      ? [
          "persona-gudid",
          "persona-technique",
          "persona-fda-original",
          "persona-fda-ka",
          "persona-fda-titanium-history",
          "zimmer-labeling-portal",
          "persona-exact-recall-search",
          "persona-revision-excluded-notice",
        ]
      : [
          "triathlon-gudid",
          "stryker-labeling-portal",
          "triathlon-exact-recall-search",
        ],
  inaccessible:
    familyId === "persona"
      ? [
          { sourceId: "zimmer-labeling-portal", reason: personaPortal },
          {
            sourceId: "persona-exact-recall-search",
            reason:
              "Exact-model query could not be retrieved; not a negative result.",
          },
        ]
      : [
          { sourceId: "stryker-labeling-portal", reason: strykerPortal },
          {
            sourceId: "triathlon-exact-recall-search",
            reason:
              "Exact-model query could not be retrieved; not a negative result.",
          },
        ],
  limitations: [
    "Bounded manual investigation; no exhaustive safety review, manufacturer contact or document request. No component verification or editorial promotion.",
    familyId === "persona"
      ? "Non-U.S. listings, titanium variants and sensor-system instructions not substituted for this model. Family compatibility charts preserved as family-level evidence."
      : "Repeatability check only. Indexed/mirrored catalog-pattern leads not adopted as current U.S. labeling; no full Triathlon dossier.",
  ],
}));
