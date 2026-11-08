import type { WorkspaceData } from "./model";
const uid = "00000000-0000-4000-8000-000000000001",
  batch = "00000000-0000-4000-8000-000000000002";
const base = {
  created_at: "2026-11-07T12:00:00Z",
  created_by: uid,
  demo_batch_id: batch,
};
export const previewData = {
  signals: [
    {
      ...base,
      id: "10000000-0000-4000-8000-000000000001",
      title: "SYNTHETIC · Documentation gaps in research procurement",
      summary:
        "A fictional institution reports delays obtaining lot-level documentation. This record demonstrates the workflow; it is not market evidence.",
      source_url: "https://example.com/synthetic-signal",
      publisher: "Synthetic demonstration",
      published_on: "2026-11-07",
      collected_at: "2026-11-07",
      industry: "Research supply",
      geography: "Demonstration only",
      evidence_type: "third_party_claim",
      reliability: "unverified",
      reliability_notes:
        "Fictional source. Not evidence for a real commercial decision.",
      why_matters:
        "Illustrates a proposed problem that requires buyer validation.",
      siona_relevance: "A documentation-service hypothesis to test.",
      confidence: "low",
      review_status: "unreviewed",
    },
  ],
  opportunities: [
    {
      ...base,
      id: "20000000-0000-4000-8000-000000000001",
      title: "SYNTHETIC · Research-supply continuity",
      problem:
        "Do procurement teams have an unmet need for reliable batch documentation?",
      affected: "Fictional laboratory procurement teams",
      proposition:
        "Evaluate a documented, traceable research-supply relationship.",
      customers: "No actual customers identified.",
      partners: "No actual partners identified.",
      revenue: "Unknown; willingness to pay is untested.",
      barriers: "Intended-use classification and supply diligence remain open.",
      assumptions:
        "Existing vendors do not adequately address the proposed problem.",
      invalidation:
        "Buyers report no unmet need, or the economics do not work.",
      stage: "Validating",
    },
    {
      ...base,
      id: "20000000-0000-4000-8000-000000000002",
      title: "SYNTHETIC · Workforce onboarding clarity",
      problem:
        "Investigate whether clearer institutional requirements would improve clinician onboarding.",
      stage: "Evaluating",
      assumptions: "The proposed problem exists.",
      invalidation: "Evidence shows current workflows already meet the need.",
    },
  ],
  organizations: [
    {
      ...base,
      id: "30000000-0000-4000-8000-000000000001",
      legal_name: "SYNTHETIC · Example Research Institute",
      kind: "Research institution",
      location: "Demonstration only",
      notes: "Fictional organization. No actual relationship exists.",
    },
  ],
  suppliers: [
    {
      ...base,
      id: "40000000-0000-4000-8000-000000000001",
      organization_id: "30000000-0000-4000-8000-000000000001",
      classification: "Intermediary",
      stage: "Under Review",
      manufacturing_locations: "Unknown",
      quality_documentation: "Documentation has not been received.",
      traceability: "Unknown",
      verification: "Unverified",
      outstanding:
        "Identity, COA, manufacturer traceability and independent review.",
      next_action: "Request supporting documentation.",
      owner_id: uid,
    },
  ],
  evidence: [
    {
      ...base,
      id: "50000000-0000-4000-8000-000000000001",
      opportunity_id: "20000000-0000-4000-8000-000000000001",
      signal_id: "10000000-0000-4000-8000-000000000001",
    },
  ],
  links: [
    {
      ...base,
      id: "60000000-0000-4000-8000-000000000001",
      opportunity_id: "20000000-0000-4000-8000-000000000001",
      supplier_id: "40000000-0000-4000-8000-000000000001",
      rationale:
        "Fictional supplier relationship used to demonstrate the network.",
    },
  ],
  tasks: [
    {
      ...base,
      id: "70000000-0000-4000-8000-000000000001",
      opportunity_id: "20000000-0000-4000-8000-000000000001",
      title: "SYNTHETIC · Interview prospective buyers",
      success_criteria:
        "Record whether the proposed documentation gap is a material unmet need.",
      owner_id: uid,
      due_on: "2026-11-14",
      kind: "Validation",
      status: "Open",
    },
  ],
  decisions: [
    {
      ...base,
      id: "80000000-0000-4000-8000-000000000001",
      opportunity_id: "20000000-0000-4000-8000-000000000001",
      stage: "Validating",
      rationale:
        "Synthetic decision: test the hypothesis before considering any commercial commitment.",
      assumptions_changed: "No real evidence has been collected.",
    },
  ],
  evaluations: [
    {
      ...base,
      id: "90000000-0000-4000-8000-000000000001",
      opportunity_id: "20000000-0000-4000-8000-000000000001",
      criterion: "fit",
      score: 3,
      rationale:
        "Synthetic illustration only; strategic fit remains an interpretation.",
    },
  ],
  weights: [
    "demand",
    "market",
    "differentiation",
    "economics",
    "feasibility",
    "fit",
    "regulatory",
    "capital",
    "evidence",
  ].map((criterion, i) => ({
    id: String(i),
    criterion,
    weight: criterion === "demand" || criterion === "evidence" ? 15 : 10,
  })),
  members: [
    {
      id: uid,
      user_id: uid,
      display_name: "Demonstration reviewer",
      role: "analyst",
    },
  ],
  sources: [],
  contacts: [],
  categories: [],
  documents: [],
  supplier_reviews: [],
  decision_evidence: [],
  notes: [],
  activity: [],
} as WorkspaceData;
export const previewUserId = uid;
