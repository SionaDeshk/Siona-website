/** Curated source snapshots, not compatible assemblies or clinical recommendations. */
export const deviceProfiles = [
  {
    id: "persona",
    manufacturer: "Zimmer Biomet",
    family: "Persona",
    labeler: "Zimmer, Inc.",
    model: "42-5026-066-02",
    di: "00889024230408",
    size: "9",
    recordDate: "March 17, 2022",
    checkedDate: "November 12, 2026",
    identityUrl: "https://accessgudid.nlm.nih.gov/devices/00889024230408",
    manufacturerUrl:
      "https://www.zimmerbiomet.com/en/products-and-solutions/specialties/knee/persona-knee-system.html",
    scope:
      "One femoral component identified. The other component models remain unspecified.",
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
  },
  {
    id: "triathlon",
    manufacturer: "Stryker",
    family: "Triathlon",
    labeler: "Howmedica Osteonics Corp.",
    model: "5510-F-401",
    di: "07613327040272",
    size: "4 · left · CR, as listed",
    recordDate: "December 11, 2019",
    checkedDate: "November 12, 2026",
    identityUrl: "https://accessgudid.nlm.nih.gov/devices/07613327040272",
    manufacturerUrl:
      "https://www.stryker.com/us/en/portfolios/orthopaedics/joint-replacement/knee.html",
    scope:
      "One cruciate-retaining femoral component identified. The other component models remain unspecified.",
    regulatoryStatus: "Exact submission link unresolved",
    regulatoryNote:
      "This GUDID entry does not supply a premarket submission number. That omission does not establish that the device lacks clearance. No family-level submission has been assigned to this exact component here.",
    regulatoryLinks: [],
    gaps: "Exact materials, current U.S. instructions, MRI conditions, compatible component models, complete recall matching and applicable clinical outcomes remain unverified in this prototype.",
  },
] as const;
