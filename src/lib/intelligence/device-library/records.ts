import {
  choices,
  materials,
  technologies,
  sensorMetrics,
} from "./persona-content";
import {
  componentInvestigations,
  investigationClaims,
  investigationSessions,
} from "./component-investigations";
import { components } from "./components";
import { deviceSources, sourceById } from "./sources";
import type {
  DeviceClaim,
  DeviceFamily,
  ConfigurationRecord,
  StudyRecord,
  SafetyNotice,
  OpenQuestion,
  ResearchSession,
  Subject,
  EvidenceLabel,
} from "./types";

export const families: DeviceFamily[] = [
  {
    id: "persona",
    discovery: {
      aliases: [
        "Persona The Personalized Knee",
        "Persona Personalized Knee System",
      ],
      sourceId: "persona-professional",
      discoveredOn: "2026-11-12",
      availability: "unknown",
      availabilitySourceId: null,
      availabilityScope:
        "U.S. family education; local access, exact configurations and costs not established. A DI distribution listing does not establish availability of the whole family at a care site.",
      nextAction:
        "Retrieve current U.S. model-matched labeling for the identified femoral component before selecting other component identifiers.",
    },
    exampleComponentId: "persona-femoral",
    name: "Persona",
    manufacturer: "Zimmer Biomet",
    category: "Primary total knee replacement",
    geography: "U.S. educational context",
    reasonForInclusion:
      "First detailed example of a modular implant family and its supporting technologies.",
    purpose:
      "A modular knee replacement family for resurfacing the joint in applicable knee-replacement procedures.",
    summary:
      "Femoral, tibial and bearing choices sit alongside optional surgical assistance, recovery software and specific sensor-equipped configurations.",
    depth: "family-overview",
    editorialStatus: "needs-review",
    sourceId: "persona-professional",
    checkedOn: "2026-11-13",
    identityScope:
      "One femoral component identified. The other component models remain unspecified.",
  },
  {
    id: "triathlon",
    discovery: {
      aliases: ["Triathlon Knee System"],
      sourceId: "triathlon-professional",
      discoveredOn: "2026-11-12",
      availability: "unknown",
      availabilitySourceId: null,
      availabilityScope:
        "U.S. portfolio lead; exact configuration availability and local access have not been established.",
      nextAction:
        "Use 5510-F-401 / 07613327040272 to locate the current U.S. insert and model-specific compatibility evidence; keep the investigation bounded.",
    },
    exampleComponentId: "triathlon-femoral",
    name: "Triathlon",
    manufacturer: "Stryker",
    category: "Total knee replacement",
    geography: "U.S. educational context",
    reasonForInclusion:
      "Second manufacturer tests that research records and identifiers remain isolated.",
    purpose: "A knee replacement family with cemented and cementless options.",
    summary:
      "Portfolio context and one femoral identifier are located. A detailed family and technology review is still needed.",
    depth: "discovery-candidate",
    editorialStatus: "needs-review",
    sourceId: "triathlon-professional",
    checkedOn: "2026-11-13",
    identityScope:
      "One cruciate-retaining femoral component identified. The other component models remain unspecified.",
  },
];

export const configurationOptions = [...choices, ...materials];
export const supportingTechnologies = technologies;
// No assembly has been verified. An empty collection is not an inferred configuration.
export const configurations: ConfigurationRecord[] = [];

function claim(
  id: string,
  familyId: string,
  subject: Subject,
  text: string,
  label: EvidenceLabel,
  sourceId: string | null,
  locator: string,
  applicability: string,
  limitations: string,
): DeviceClaim {
  return {
    id,
    familyId,
    subject,
    text,
    label,
    citations: sourceId ? [{ sourceId, locator }] : [],
    checkedOn: sourceId ? sourceById(sourceId).checkedOn : "2026-11-13",
    geography: "U.S. educational context",
    applicability,
    limitations,
    editorialStatus: "needs-review",
  };
}
export const claims: DeviceClaim[] = [
  ...investigationClaims,
  claim(
    "persona-consumer-material-scope",
    "persona",
    { kind: "family", id: "persona" },
    "The consumer overview broadly describes metal components using Tivanium Alloy Technology; the professional page specifically describes the tibial option that way.",
    "Manufacturer claim",
    "persona-consumer",
    "What is the Persona Knee implant made from?",
    "Consumer family description, not an alloy specification for 42-5026-066-02.",
    "Different source scopes are retained. The femoral model's exact alloy and surface treatment remain unresolved; do not inherit the tibial material.",
  ),
  claim(
    "iq-metrics",
    "persona",
    { kind: "technology", id: "persona-iq" },
    `The manufacturer describes these movement metrics: ${sensorMetrics.join(", ")}.`,
    "Manufacturer claim",
    "iq-professional",
    "Data Collection / metric headings",
    "Persona IQ sensing, not every Persona implant.",
    "Sampling criteria apply; no clinical benefit or watch-counter equivalence established.",
  ),
  claim(
    "iq-workflow",
    "persona",
    { kind: "technology", id: "persona-iq" },
    "The manufacturer describes overnight transfer through a Home Base Station to the mymobility platform for patient and care-team viewing.",
    "Manufacturer claim",
    "iq-patient",
    "How Persona IQ Works / Automatic Data Transmission and Review Data",
    "Persona IQ enrollment and connected recovery workflow.",
    "Availability, costs, monitoring responsibilities and response times need confirmation.",
  ),
  claim(
    "iq-data-access",
    "persona",
    { kind: "technology", id: "persona-iq" },
    "The patient FAQ says the implant does not track GPS location and describes access for care teams and authorized administrators.",
    "Manufacturer claim",
    "iq-patient",
    "FAQs / What types of data; Who has access to my data?",
    "Manufacturer-described data access, not a Siona privacy audit.",
    "Current consent, access and long-term support terms have not been assessed.",
  ),

  ...configurationOptions.map((option) =>
    claim(
      option.id,
      "persona",
      { kind: "option", id: option.id },
      "summary" in option ? option.summary : option.text,
      option.evidenceLabel,
      option.sourceId,
      option.locator,
      option.applicability,
      "detail" in option ? option.detail : option.gap,
    ),
  ),
  ...technologies.flatMap((technology) => [
    claim(
      `${technology.id}-purpose`,
      "persona",
      { kind: "technology", id: technology.id },
      technology.claim,
      "Manufacturer claim",
      technology.id === "persona-iq" ? "iq-patient" : "persona-consumer",
      technology.id === "rosa"
        ? "The ROSA Robotic System"
        : technology.id === "mymobility"
          ? "The mymobility app"
          : "How Persona IQ Works",
      "Supporting technology; inclusion in any proposed procedure is unknown.",
      technology.limitation,
    ),
    claim(
      `${technology.id}-evidence`,
      "persona",
      { kind: "technology", id: technology.id },
      technology.evidence,
      technology.id === "rosa"
        ? "Clinical finding"
        : technology.id === "mymobility"
          ? "Unknown or not yet verified"
          : "Verified specification or regulatory fact",
      technology.id === "rosa"
        ? "rosa-trial"
        : technology.id === "mymobility"
          ? null
          : "fda-original-sensor",
      technology.id === "rosa"
        ? "Abstract / Results and Methods"
        : "PDF page 1 / Indications for use",
      "Version/configuration and outcome-specific; not evidence that the technology is included.",
      technology.limitation,
    ),
  ]),
  ...components.flatMap((component) => [
    claim(
      `${component.id}-identity`,
      component.familyId,
      { kind: "component", id: component.id },
      `${component.labeler}: model ${component.model}, DI ${component.di}, listed size ${component.size}.`,
      "Verified specification or regulatory fact",
      component.sourceId,
      "Device Identifier Information; Device Sizes; Record History",
      "This component record only; not a complete knee assembly.",
      "Identification does not establish materials, current labeling, compatibility or complete safety coverage.",
    ),
    claim(
      `${component.id}-mri-record`,
      component.familyId,
      { kind: "component", id: component.id },
      component.familyId === "persona"
        ? "The AccessGUDID MRI field says MR Conditional. The actual scanning conditions have not been verified."
        : "The AccessGUDID MRI field says labeling does not contain MRI safety information. This does not establish safety or lack of safety.",
      "Verified specification or regulatory fact",
      component.sourceId,
      "Device Characteristics / What MRI safety information does the labeling contain?",
      "The database field for this model, not permission for an MRI scan.",
      "Obtain current exact-component labeling and conditions for the complete assembly.",
    ),
  ]),
  claim(
    "persona-design",
    "persona",
    { kind: "family", id: "persona" },
    "Multiple sizes and profiles aim to match anatomy; several bearing strategies are offered.",
    "Manufacturer claim",
    "persona-professional",
    "System Features / Femur and Bearings",
    "Family-level design description.",
    "Not an established patient-outcome advantage or a custom-manufacturing claim.",
  ),
  claim(
    "triathlon-design",
    "triathlon",
    { kind: "family", id: "triathlon" },
    "A single-radius design aims to support natural-like circular motion.",
    "Manufacturer claim",
    "triathlon-professional",
    "Designed to work with the body",
    "Family-level design description.",
    "No comparative clinical outcome established here.",
  ),
  claim(
    "triathlon-fixation",
    "triathlon",
    { kind: "family", id: "triathlon" },
    "Cemented and cementless options. Exact-component instructions still need review.",
    "Manufacturer claim",
    "triathlon-professional",
    "Implants / Triathlon Knee System",
    "Family portfolio, not every component.",
    "Fixation and compatibility of the research model remain unverified.",
  ),
  claim(
    "iq-short-version",
    "persona",
    { kind: "technology", id: "persona-iq" },
    "FDA K234056 covers the later Canturio Smart Extension for cemented knee replacement normally indicated for at least a 30 mm tibial stem extension.",
    "Verified specification or regulatory fact",
    "fda-short-stem",
    "PDF page 3 / Indications for Use",
    "Canturio Smart Extension with CHIRP; not the original 58 mm version or every Persona component.",
    "Current exact-system instructions and patient suitability need provider review.",
  ),
  claim(
    "persona-outcomes",
    "persona",
    { kind: "family", id: "persona" },
    "In the Persona CR versus NexGen CR trial, the two-year adjusted Oxford Knee Score difference was 0.1 points (95% CI −1.4 to 1.7).",
    "Clinical finding",
    "persona-trial",
    "Abstract / Results; Methods; Funding; Limitations",
    "The studied CR configurations and outcome, not every Persona variant or exact model.",
    "Short follow-up; uncommon complications and long-term survival unresolved.",
  ),
  claim(
    "persona-historical-recall",
    "persona",
    { kind: "family", id: "persona" },
    "FDA recall Z-1266-2015 concerned historical Persona Trabecular Metal tibial plates following complaints of loosening and radiolucent lines.",
    "Verified specification or regulatory fact",
    "persona-recall",
    "Product; Code Information; Manufacturer Reason; Recall Status",
    "Affected tibial plates, sizes C–J, left/right, all lots in that notice.",
    "Not matched to our femoral example; not an exhaustive recall review.",
  ),
  claim(
    "persona-interpretation",
    "persona",
    { kind: "family", id: "persona" },
    "A fit or precision claim needs outcome-specific evidence; the findings do not establish that every device performs identically.",
    "Siona interpretation",
    "persona-trial",
    "Discussion / Limitations",
    "Editorial interpretation of a defined clinical comparison.",
    "Not an implant recommendation or a universal ranking.",
  ),
];

claims.find(
  (item) => item.id === "persona-consumer-material-scope",
)!.relatedClaims = [
  {
    claimId: "persona-tibial-material",
    relationship: "scope-difference",
    explanation:
      "Broad consumer wording and component-specific professional wording have different scope; neither establishes the exact femoral composition.",
  },
  {
    claimId: "persona-material-check",
    relationship: "scope-difference",
    explanation:
      "The exact-component field stays unresolved despite family-level material descriptions.",
  },
];
claims
  .find((item) => item.id === "persona-consumer-material-scope")!
  .citations.push({
    sourceId: "persona-professional",
    locator: "System Features / Anatomic Tibia and Bearings",
  });

claims
  .find((item) => item.id === "iq-short-version")!
  .citations.push({
    sourceId: "cse-technique",
    locator: "PDF pages 3–4 / Introduction and Indications",
  });

export const studies: StudyRecord[] = [
  {
    id: "persona-nexgen-rct",
    familyId: "persona",
    claimId: "persona-outcomes",
    sourceId: "persona-trial",
    configuration: "Persona CR versus NexGen CR",
    population: "Primary knee osteoarthritis; multicenter Denmark",
    comparator: "NexGen CR",
    design: "Multicenter randomized controlled trial",
    sampleSize: 314,
    denominators: [
      { label: "Randomized participants", count: 314 },
      { label: "Participants with primary two-year outcome", count: 289 },
    ],
    followUp: "2 years; primary outcome available for 289 participants",
    outcome: "Oxford Knee Score",
    finding: claims.find((c) => c.id === "persona-outcomes")!.text,
    uncertainty: "95% confidence interval −1.4 to 1.7 points",
    funding:
      "Participating institutions received Zimmer Biomet funding; additional author relationships disclosed in the paper.",
    limitations:
      "Not powered for rare complications or long-term survival; introduction-era experience. Full text challenge on latest retrieval.",
    editorialStatus: "needs-review",
  },
  {
    id: "rosa-rct",
    familyId: "persona",
    claimId: "rosa-evidence",
    sourceId: "rosa-trial",
    configuration:
      "Cemented Persona with ROSA versus manual surgery; CR/PS bearings",
    population:
      "Single center, Germany; selected knee osteoarthritis population",
    comparator: "Manual Persona surgery",
    design: "Unblinded randomized trial; one surgeon",
    sampleSize: 77,
    denominators: [
      { label: "Patients", count: 77 },
      { label: "Knees", count: 78 },
    ],
    followUp: "At least 1 year",
    outcome: "Alignment, Oxford Knee Score and quality of life",
    finding: "Improved alignment; similar patient-reported improvements.",
    uncertainty:
      "Small selected cohort; no established long-term survival advantage.",
    funding:
      "Funding and conflict review incomplete; do not label independent.",
    limitations:
      "Short follow-up, unblinded single-center setting; not every robotic platform or configuration.",
    editorialStatus: "needs-review",
  },
];
export const safetyNotices: SafetyNotice[] = [
  {
    id: "z-1266-2015",
    familyId: "persona",
    sourceId: "persona-recall",
    claimId: "persona-historical-recall",
    affectedScope:
      "Historical Persona Trabecular Metal tibial plates, sizes C–J, left and right, all lots in that notice.",
    matchToExample: "not-established",
    status: "Initiated January 28, 2015; terminated March 13, 2018.",
    limitation:
      "Termination is not a safety finding for current components or a complete assembly.",
  },
];
export const openQuestions: OpenQuestion[] = families.flatMap((family) => [
  {
    id: `${family.id}-labeling`,
    familyId: family.id,
    subject: { kind: "component" as const, id: `${family.id}-femoral` },
    question:
      "Which current instructions, materials, fixation and MRI conditions apply to this exact model?",
    nextStep:
      "Obtain the current U.S. model-matched IFU/material specification and record its revision, relevant passages and compatibility scope.",
    priority: "identity-or-safety" as const,
  },
  {
    id: `${family.id}-assembly`,
    familyId: family.id,
    subject: { kind: "family" as const, id: family.id },
    question:
      "Which bearing, tibial and optional patellar identifiers form a documented compatible configuration?",
    nextStep:
      "Record candidate identifiers and manufacturer compatibility evidence before creating or verifying an assembly.",
    priority: "identity-or-safety" as const,
  },
  {
    id: `${family.id}-safety`,
    familyId: family.id,
    subject: { kind: "family" as const, id: family.id },
    question: "Which model- and lot-scoped safety notices apply?",
    nextStep:
      "Perform and document an exact-component safety-notice search; do not extrapolate a brand-level match.",
    priority: "identity-or-safety" as const,
  },
  {
    id: `${family.id}-access`,
    familyId: family.id,
    subject: { kind: "family" as const, id: family.id },
    question:
      "Which technologies, costs and support arrangements are actually available?",
    nextStep:
      "Verify geography, institution and exact-system availability separately from manufacturer feature descriptions.",
    priority: "access" as const,
  },
]);
openQuestions.push({
  id: "persona-technology-evidence",
  familyId: "persona",
  subject: { kind: "technology", id: "mymobility" },
  question:
    "What independent outcome evidence and support terms apply to the recovery platform?",
  nextStep:
    "Assess app-outcome studies and current support/consent terms without borrowing implant trial results.",
  priority: "interpretation",
});
openQuestions.push({
  id: "persona-rosa-review",
  familyId: "persona",
  subject: { kind: "technology", id: "rosa" },
  question: "What funding and conflicts apply to the ROSA comparison?",
  nextStep:
    "Complete the study funding/conflict review and independent editorial check before advancing editorial readiness.",
  priority: "interpretation",
});

export const researchSessions: ResearchSession[] = [
  {
    id: "2026-11-13-persona-refinement",
    date: "2026-11-13",
    familyIds: ["persona"],
    terms: [
      '"42-5026-066-02" "package insert"',
      '"00889024230408" "MRI"',
      'site.zimmerbiomet.com "Persona" "instructions for use" femoral',
      "Manufacturer-linked Design Rationale: text searches cobalt, 5026, Tivanium and revision footer",
    ],
    openedSourceIds: [
      "persona-gudid",
      "persona-professional",
      "persona-consumer",
      "zimmer-labeling-portal",
      "persona-design-rationale",
    ],
    inaccessible: [
      {
        sourceId: "zimmer-labeling-portal",
        reason:
          "Portal shell only in research tool; direct HTTPS retry returned CONNECT 403. No model IFU or request submitted.",
      },
    ],
    limitations: [
      "One bounded retrieval pass after reviewing prior searches; no repeat search loop, manufacturer contact or document request.",
      "Design rationale 0890.2-GLBL-en (April 2024) is family marketing/design context, not current U.S. exact-model labeling. No match for 5026 in extracted text; this is not proof the document contains no relevant information.",
      "Required technical fields remain unresolved. Next route: use the public eIFU model/DI search from a browser with portal access, select United States, and capture document applicability, revision and relevant pages. No current numeric MRI conditions or compatibility relationship inferred.",
    ],
  },
  {
    id: "2026-11-13-triathlon-repeatability",
    date: "2026-11-13",
    familyIds: ["triathlon"],
    terms: [
      "Re-open exact AccessGUDID 07613327040272; inspect existing six-topic findings",
    ],
    openedSourceIds: ["triathlon-gudid"],
    inaccessible: [],
    limitations: [
      "Exact identifier rechecked; existing unresolved findings retained. No full dossier, new catalog or fresh exhaustive safety search.",
    ],
  },
  ...investigationSessions,
  {
    id: "2026-11-13-device-library",
    date: "2026-11-13",
    familyIds: ["persona", "triathlon"],
    terms: [
      '"42-5026-066-02" materials labeling',
      "Persona NexGen randomized Mortensen 2025 funding",
    ],
    openedSourceIds: [
      "persona-professional",
      "persona-consumer",
      "persona-gudid",
      "triathlon-gudid",
      "triathlon-professional",
      "fda-short-stem",
      "fda-tinidium",
      "persona-trial",
      "persona-recall",
    ],
    inaccessible: [
      {
        sourceId: "persona-trial",
        reason:
          "Direct full-text open returned a browser challenge; indexed primary-source text available.",
      },
    ],
    limitations: [
      "Manual bounded research; no automated ingestion or exhaustive catalog search.",
      "Non-U.S. listing results were not adopted as U.S. material/labeling verification.",
      "No current exact-model IFU/material/compatibility document established by these searches.",
      "No complete registry or safety-notice review; sources last checked November 12 retain that date.",
      "No independent clinical/editorial review completed; research depth does not imply release readiness.",
    ],
  },
];
export const deviceLibrary = {
  sources: deviceSources,
  families,
  components,
  options: configurationOptions,
  technologies: supportingTechnologies,
  claims,
  configurations,
  studies,
  safetyNotices,
  openQuestions,
  researchSessions,
  componentInvestigations,
};
export type DeviceLibrary = typeof deviceLibrary;
