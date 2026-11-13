import type { ResearchSource } from "./types";

export const deviceSources: ResearchSource[] = [
  {
    id: "persona-professional",
    title: "Persona professional family overview",
    url: "https://www.zimmerbiomet.com/en/products-and-solutions/specialties/knee/persona-knee-system.html",
    kind: "manufacturer",
    publicationOrRevision: null,
    dateNote: "No controlled page revision displayed",
    checkedOn: "2026-11-13",
    access: "read",
    limitation: "Family information; not exact-model labeling.",
  },
  {
    id: "persona-consumer",
    title: "Personalized Knee consumer overview",
    url: "https://www.thepersonalizedknee.com/en/personalized-knee-system/overview.html",
    kind: "manufacturer",
    publicationOrRevision: null,
    dateNote: "Campaign code US--8387 01/26; not an IFU revision",
    checkedOn: "2026-11-13",
    access: "read",
    limitation: "Manufacturer education and promotional claims.",
  },
  {
    id: "fda-tinidium",
    title: "FDA K193223",
    url: "https://www.accessdata.fda.gov/cdrh_docs/pdf19/K193223.pdf",
    kind: "regulatory",
    publicationOrRevision: "2020-01-24",
    dateNote: "Clearance date",
    checkedOn: "2026-11-13",
    access: "read",
    limitation: "Ti-Nidium CR variants; no match to our exact femoral example.",
  },
  {
    id: "iq-professional",
    title: "Persona IQ professional overview",
    url: "https://www.zimmerbiomet.com/en/products-and-solutions/specialties/knee/persona-iq.html",
    kind: "manufacturer",
    publicationOrRevision: null,
    dateNote: "No controlled page revision displayed",
    checkedOn: "2026-11-12",
    access: "read",
    limitation:
      "Page mixes stem-version descriptions; use version-specific records.",
  },
  {
    id: "iq-patient",
    title: "Persona IQ patient overview and FAQs",
    url: "https://www.zimmerbiomet.com/en/patients-caregivers/knee-replacement-implants-technologies/Persona-IQ-smart-knee.html",
    kind: "manufacturer",
    publicationOrRevision: null,
    dateNote: "No controlled page revision displayed",
    checkedOn: "2026-11-12",
    access: "read",
    limitation:
      "Functionality and patient workflow, not proof of outcome benefit.",
  },
  {
    id: "fda-short-stem",
    title: "FDA K234056",
    url: "https://www.accessdata.fda.gov/cdrh_docs/pdf23/K234056.pdf",
    kind: "regulatory",
    publicationOrRevision: "2024-04-24",
    dateNote: "Clearance date",
    checkedOn: "2026-11-13",
    access: "read",
    limitation:
      "Canturio Smart Extension; confirm current exact-system labeling.",
  },
  {
    id: "cse-technique",
    title: "Canturio Smart Extension surgical technique",
    url: "https://www.zimmerbiomet.com/content/dam/zb-corporate/en/education-resources/surgical-techniques/specialties/knee/persona-iq/K05-STB-300005%20Rev.%20A%20CSE%20Surgical%20Technique.pdf",
    kind: "manufacturer",
    publicationOrRevision: null,
    dateNote: "K05-STB-300005, revision A; publication date not established",
    checkedOn: "2026-11-12",
    access: "read",
    limitation:
      "CSE with primary Persona only; not an assembly match for our example.",
  },
  {
    id: "fda-original-sensor",
    title: "FDA DEN200064",
    url: "https://www.accessdata.fda.gov/cdrh_docs/pdf20/DEN200064.pdf",
    kind: "regulatory",
    publicationOrRevision: "2021-08-27",
    dateNote: "De Novo authorization date",
    checkedOn: "2026-11-12",
    access: "read",
    limitation:
      "Original Canturio Tibial Extension, not every later sensor version.",
  },
  {
    id: "persona-trial",
    title: "Mortensen et al., Persona versus NexGen",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11862213/",
    kind: "study",
    publicationOrRevision: "2025-02-25",
    dateNote: "DOI 10.2340/17453674.2025.43004",
    checkedOn: "2026-11-13",
    access: "partial",
    limitation:
      "Full text returned a browser challenge today; indexed primary-source text accessible. Prior full-text review November 12.",
  },
  {
    id: "rosa-trial",
    title: "M\u00f6ller et al., ROSA randomized trial",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC13418316/",
    kind: "study",
    publicationOrRevision: "2025-12-01",
    dateNote: "Online publication; journal issue August 2026",
    checkedOn: "2026-11-12",
    access: "read",
    limitation:
      "Single-center unblinded trial; funding/conflict review incomplete.",
  },
  {
    id: "persona-recall",
    title: "FDA recall Z-1266-2015",
    url: "https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfRes/res.cfm?id=133978",
    kind: "safety",
    publicationOrRevision: "2015-03-12",
    dateNote: "FDA posting date; terminated March 13, 2018",
    checkedOn: "2026-11-13",
    access: "read",
    limitation: "Historical tibial plates only; not a complete recall search.",
  },
  {
    id: "persona-gudid",
    title: "AccessGUDID Persona 00889024230408",
    url: "https://accessgudid.nlm.nih.gov/devices/00889024230408",
    kind: "identifier",
    publicationOrRevision: "2022-03-17",
    dateNote: "Record version date",
    checkedOn: "2026-11-13",
    access: "read",
    limitation:
      "Identification record; generic GMDN material examples are not an alloy specification.",
  },
  {
    id: "triathlon-gudid",
    title: "AccessGUDID Triathlon 07613327040272",
    url: "https://accessgudid.nlm.nih.gov/devices/07613327040272",
    kind: "identifier",
    publicationOrRevision: "2019-12-11",
    dateNote: "Record version date",
    checkedOn: "2026-11-13",
    access: "read",
    limitation:
      "No premarket submission supplied; not proof of lack of clearance.",
  },
  {
    id: "triathlon-professional",
    title: "Stryker knee portfolio",
    url: "https://www.stryker.com/us/en/portfolios/orthopaedics/joint-replacement/knee.html",
    kind: "manufacturer",
    publicationOrRevision: null,
    dateNote: "No controlled page revision displayed",
    checkedOn: "2026-11-13",
    access: "read",
    limitation:
      "Portfolio context; no exact-component compatibility assessment.",
  },
];

export function sourceById(id: string): ResearchSource {
  const source = deviceSources.find((item) => item.id === id);
  if (!source) throw new Error(`Unknown device source: ${id}`);
  return source;
}
