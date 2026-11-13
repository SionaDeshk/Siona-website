import type { ComponentRecord } from "./types";

export const components: ComponentRecord[] = [
  {
    labeler: "Zimmer, Inc.",
    model: "42-5026-066-02",
    di: "00889024230408",
    size: "9",
    recordDate: "March 17, 2022",
    regulatoryStatus: "Linked submissions located",
    regulatoryNote:
      "The device record links K113369 and K172524. A linked 510(k) clearance is not evidence of comparative clinical performance; current exact-model labeling still needs review.",
    regulatoryLinks: [
      {
        number: "K113369",
        url: "https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K113369",
      },
      {
        number: "K172524",
        url: "https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K172524",
      },
    ],
    gaps: "Exact materials, current U.S. instructions, MRI conditions, compatible component models, complete recall matching and applicable clinical outcomes remain unverified in this prototype.",
    id: "persona-femoral",
    familyId: "persona",
    role: "Femoral component",
    sourceId: "persona-gudid",
    checkedOn: "2026-11-13",
    identification: "located",
    verification: {
      labeling: false,
      materials: false,
      fixation: false,
      compatibility: false,
      safetyReview: false,
    },
  },
  {
    labeler: "Howmedica Osteonics Corp.",
    model: "5510-F-401",
    di: "07613327040272",
    size: "4 \u00b7 left \u00b7 CR, as listed",
    recordDate: "December 11, 2019",
    regulatoryStatus: "Exact submission link unresolved",
    regulatoryNote:
      "This GUDID entry does not supply a premarket submission number. That omission does not establish that the device lacks clearance. No family-level submission has been assigned to this exact component here.",
    regulatoryLinks: [],
    gaps: "Exact materials, current U.S. instructions, MRI conditions, compatible component models, complete recall matching and applicable clinical outcomes remain unverified in this prototype.",
    id: "triathlon-femoral",
    familyId: "triathlon",
    role: "Femoral component",
    sourceId: "triathlon-gudid",
    checkedOn: "2026-11-13",
    identification: "located",
    verification: {
      labeling: false,
      materials: false,
      fixation: false,
      compatibility: false,
      safetyReview: false,
    },
  },
];
