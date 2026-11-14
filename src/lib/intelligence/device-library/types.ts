/** Research scope and editorial readiness are independent, never quality scores. */
export type ResearchDepth =
  | "discovery-candidate"
  | "family-overview"
  | "verified-component"
  | "evidence-comparison";
export type EditorialStatus =
  | "draft"
  | "needs-review"
  | "reviewed"
  | "needs-reverification";
export interface EditorialReview {
  reference: string;
  reviewedOn: string;
  scope: string;
  independentClinicalReview: boolean;
}
export type ResearchGapState =
  | "unknown"
  | "not-searched"
  | "source-inaccessible"
  | "not-applicable"
  | "resolved";
export const evidenceLabels = [
  "Verified specification or regulatory fact",
  "Manufacturer claim",
  "Clinical finding",
  "Unknown or not yet verified",
  "Siona interpretation",
  "Business hypothesis",
] as const;
export type VerificationField =
  | "labeling"
  | "materials"
  | "fixation"
  | "compatibility"
  | "safetyReview";
export type EvidenceLabel =
  | "Verified specification or regulatory fact"
  | "Manufacturer claim"
  | "Clinical finding"
  | "Unknown or not yet verified"
  | "Siona interpretation"
  | "Business hypothesis";
export type Subject = {
  kind: "family" | "component" | "option" | "technology";
  id: string;
};
export interface ResearchSource {
  id: string;
  title: string;
  url: string;
  kind: "manufacturer" | "identifier" | "regulatory" | "study" | "safety";
  publicationOrRevision: string | null;
  dateNote: string;
  checkedOn: string;
  access: "read" | "partial" | "unavailable";
  limitation: string;
}
export interface Citation {
  sourceId: string;
  locator: string;
}
export interface DeviceClaim {
  editorialReview?: EditorialReview;
  relatedClaims?: {
    claimId: string;
    relationship: "scope-difference" | "conflicts-with";
    explanation: string;
  }[];
  id: string;
  familyId: string;
  subject: Subject;
  text: string;
  label: EvidenceLabel;
  citations: Citation[];
  checkedOn: string;
  geography: string;
  applicability: string;
  limitations: string;
  editorialStatus: EditorialStatus;
}
export interface DeviceFamily {
  editorialReview?: EditorialReview;
  discovery: {
    aliases: string[];
    sourceId: string;
    discoveredOn: string;
    availability: "unknown" | "documented";
    availabilitySourceId: string | null;
    availabilityScope: string;
    nextAction: string;
  };
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  geography: string;
  reasonForInclusion: string;
  purpose: string;
  summary: string;
  depth: ResearchDepth;
  editorialStatus: EditorialStatus;
  sourceId: string;
  checkedOn: string;
  identityScope: string;
  exampleComponentId: string | null;
}
export interface ComponentRecord {
  id: string;
  familyId: string;
  role: string;
  labeler: string;
  model: string;
  di: string;
  size: string;
  recordDate: string;
  checkedOn: string;
  sourceId: string;
  identification: "located";
  verificationEvidence?: Partial<Record<VerificationField, string[]>>;
  verification: {
    labeling: boolean;
    materials: boolean;
    fixation: boolean;
    compatibility: boolean;
    safetyReview: boolean;
  };
  regulatoryStatus: string;
  regulatoryNote: string;
  regulatoryLinks: { number: string; url: string }[];
  gaps: string;
}
export interface ConfigurationRecord {
  id: string;
  familyId: string;
  componentIds: string[];
  status: "unverified" | "verified";
  compatibilityCitations: Citation[];
}
export interface StudyRecord {
  editorialReview?: EditorialReview;
  id: string;
  familyId: string;
  claimId: string;
  sourceId: string;
  configuration: string;
  population: string;
  comparator: string;
  design: string;
  sampleSize: number;
  denominators?: { label: string; count: number }[];
  followUp: string;
  outcome: string;
  finding: string;
  uncertainty: string;
  funding: string;
  limitations: string;
  editorialStatus: EditorialStatus;
}
export interface SafetyNotice {
  id: string;
  familyId: string;
  sourceId: string;
  claimId: string;
  affectedScope: string;
  matchToExample: "not-established";
  status: string;
  limitation: string;
}
export interface OpenQuestion {
  id: string;
  familyId: string;
  subject: Subject;
  question: string;
  nextStep: string;
  priority: "identity-or-safety" | "interpretation" | "access";
}
export const investigationTopics = [
  "identity",
  "materials",
  "fixation",
  "compatibility",
  "mri",
  "regulatory-safety",
] as const;
export interface ComponentInvestigation {
  id: string;
  familyId: string;
  componentId: string;
  topic: (typeof investigationTopics)[number];
  outcome: "record-observation" | "partial" | "unresolved" | "supported";
  gapState: ResearchGapState;
  whyItMatters: string;
  nextRetrievalRoute: string;
  claimIds: string[];
  searched: string[];
  barrier: string;
  documentNeeded: string;
  careTeamQuestion: string;
  checkedOn: string;
}
export interface ResearchSession {
  id: string;
  date: string;
  familyIds: string[];
  terms: string[];
  openedSourceIds: string[];
  inaccessible: { sourceId: string; reason: string }[];
  limitations: string[];
}
