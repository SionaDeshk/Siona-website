/** Research scope and editorial readiness are independent, never quality scores. */
export type ResearchDepth =
  | "discovery-candidate"
  | "family-overview"
  | "verified-component"
  | "evidence-comparison";
export type EditorialStatus = "draft" | "needs-review" | "reviewed";
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
  id: string;
  familyId: string;
  claimId: string;
  sourceId: string;
  configuration: string;
  population: string;
  comparator: string;
  design: string;
  sampleSize: number;
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
export interface ResearchSession {
  id: string;
  date: string;
  familyIds: string[];
  terms: string[];
  openedSourceIds: string[];
  inaccessible: { sourceId: string; reason: string }[];
  limitations: string[];
}
