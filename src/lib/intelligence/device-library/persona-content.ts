import { sourceById } from "./sources";

export const professional = sourceById("persona-professional").url;
export const consumer = sourceById("persona-consumer").url;
export const titanium = sourceById("fda-tinidium").url;
export const iqProfessional = sourceById("iq-professional").url;
export const iqPatient = sourceById("iq-patient").url;
export const iqShort = sourceById("fda-short-stem").url;
export const iqTechnique = sourceById("cse-technique").url;
export const iq = sourceById("fda-original-sensor").url;
export const trial = sourceById("persona-trial").url;

export const choices = [
  {
    id: "persona-fit",
    sourceId: "persona-professional",
    locator: "System Features / Femur",
    evidenceLabel: "Manufacturer claim" as const,
    applicability:
      "Family-level fit choices; not a custom-manufactured implant claim.",
    familyId: "persona",
    title: "Fit & sizing",
    label: "Manufacturer claim",
    summary: "Several sizes and shapes aim to fit different anatomies.",
    detail:
      "Standard and narrow femoral profiles are available. Choosing a catalog configuration does not establish that an implant was custom-manufactured for one person.",
    question: "Which sizes and profiles are proposed, and why?",
    href: professional,
  },
  {
    id: "persona-fixation",
    sourceId: "persona-professional",
    locator: "Philosophies / Cemented and cementless",
    evidenceLabel: "Manufacturer claim" as const,
    applicability:
      "Family portfolio; not permission to use every component either way.",
    familyId: "persona",
    title: "Fixation",
    label: "Manufacturer claim",
    summary: "The family includes cemented and cementless options.",
    detail:
      "A family-level option is not permission to use every component either way. Confirm the fixation and current instructions for each proposed model.",
    question: "How will each component be fixed to bone?",
    href: professional,
  },
  {
    id: "persona-bearing",
    sourceId: "persona-professional",
    locator: "System Features / Bearing Specs",
    evidenceLabel: "Manufacturer claim" as const,
    applicability: "Bearing strategy at family level; not a patient selection.",
    familyId: "persona",
    title: "Bearing & stability",
    label: "Manufacturer claim",
    summary:
      "Bearing options include cruciate-retaining and sacrificing strategies.",
    detail:
      "CR means cruciate retaining. A bearing choice addresses the configuration’s stability strategy; it is not a higher-is-better quality score.",
    question: "What ligament strategy and bearing are proposed?",
    href: professional,
  },
];
export const materials = [
  {
    id: "persona-tinidium",
    sourceId: "fda-tinidium",
    locator: "PDF page 5 / Purpose and Device Description",
    evidenceLabel: "Verified specification or regulatory fact" as const,
    applicability:
      "Ti-Nidium CR variants only; no match to the identified femoral model.",
    familyId: "persona",
    source: "FDA K193223 · January 24, 2020",
    title: "Femoral options",
    label: "Verified specification or regulatory fact",
    text: "FDA record K193223 describes Ti-Nidium CR femoral components: titanium alloy with a nitriding surface treatment.",
    gap: "This does not identify the alloy of our example model 42-5026-066-02. Its exact materials remain unverified.",
    href: titanium,
  },
  {
    id: "persona-tibial-material",
    sourceId: "persona-professional",
    locator: "System Features / Anatomic Tibia",
    evidenceLabel: "Manufacturer claim" as const,
    applicability: "A family-level tibial option; no tibial model selected.",
    familyId: "persona",
    source: "Manufacturer overview · revision not displayed",
    title: "Tibial option",
    label: "Manufacturer claim",
    text: "The professional overview describes a Tivanium-alloy tibial option.",
    gap: "No tibial model has been selected here. Do not apply this description to every tray or surface.",
    href: professional,
  },
  {
    id: "persona-polyethylene",
    sourceId: "persona-professional",
    locator: "Technology / Vivacit-E and Bearing Specs",
    evidenceLabel: "Manufacturer claim" as const,
    applicability:
      "Family bearing options; not evidence of longer implant survival.",
    familyId: "persona",
    source: "Manufacturer overview · revision not displayed",
    title: "Bearing options",
    label: "Manufacturer claim",
    text: "Conventional and vitamin-E polyethylene options are described. Vivacit-E is marketed for resistance to oxidation and wear.",
    gap: "A material-performance claim does not establish longer implant survival for a particular person.",
    href: professional,
  },
];
export const technologies = [
  {
    id: "rosa",
    familyId: "persona",
    title: "ROSA",
    category: "During surgery",
    summary: "Surgical assistance for planning and positioning.",
    label: "Manufacturer claim",
    claim: "The consumer site promotes precision and recovery benefits.",
    evidence:
      "A 77-patient, single-center, unblinded randomized trial compared ROSA-assisted with manual Persona surgery. At a minimum of one year, alignment improved while patient-reported improvements were similar.",
    limitation:
      "Short follow-up and one surgeon limit generalization; long-term survival was not established. Funding/conflict review is incomplete in this guide.",
    question:
      "What benefit do you expect from ROSA in this procedure, and is there an additional charge?",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC13418316/",
    source: "ROSA clinical study · published 2025, journal issue 2026",
  },
  {
    id: "mymobility",
    familyId: "persona",
    title: "mymobility",
    category: "Before & after surgery",
    summary: "An app for recovery guidance and care-team communication.",
    label: "Manufacturer claim",
    claim: "The site describes exercises, reminders and messaging.",
    evidence:
      "Manufacturer-described functionality, not a clinical-effectiveness assessment. Independent app-outcome evidence has not been assessed in this iteration.",
    limitation:
      "Access depends on the care team and technology requirements. Monitoring, response times, privacy terms and cost remain unresolved.",
    question:
      "Who reviews messages and progress, when do they respond, and what support is available without the app?",
    href: consumer,
    source: "Manufacturer consumer overview · page revision not displayed",
  },
  {
    id: "persona-iq",
    familyId: "persona",
    title: "Persona IQ",
    category: "Implanted sensing",
    summary: "A specific configuration adds movement sensing.",
    label: "Regulatory fact · original authorization",
    claim: "The manufacturer promotes additional recovery insight.",
    evidence:
      "FDA’s 2021 Canary/CHIRP authorization describes movement data as adjunct information. It states those data are not intended to support clinical decision-making and have not demonstrated clinical benefit.",
    limitation:
      "Different sensor-stem versions have different indications: the original Canturio Tibial Extension refers to at least 58 mm; the later Canturio Smart Extension to at least 30 mm. Confirm the proposed version and current labeling. This is not included in every Persona implant.",
    question:
      "Is a sensor actually proposed, why is it appropriate, and what happens to the data and long-term support?",
    href: iq,
    source: "FDA DEN200064 · August 27, 2021",
  },
];

export const sensorMetrics = [
  "Qualified step count",
  "Walking speed",
  "Cadence",
  "Stride length",
  "Distance traveled",
  "Functional range of motion",
];
