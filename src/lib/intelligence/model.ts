import { z } from "zod";

export const opportunityStages = [
  "Discovered",
  "Evaluating",
  "Validating",
  "Developing",
  "Active",
  "Rejected",
  "On Hold",
] as const;
export const supplierStages = [
  "Identified",
  "Contacted",
  "Responded",
  "Under Review",
  "Qualified",
  "Negotiating",
  "Approved",
  "Rejected",
] as const;
export const industries = [
  "Biotechnology",
  "Research supply",
  "Healthcare workforce",
  "Manufacturing",
  "AI & infrastructure",
  "Regulatory",
] as const;
export const criteria = [
  ["demand", "Customer demand"],
  ["market", "Market attractiveness"],
  ["differentiation", "Differentiation"],
  ["economics", "Potential economics"],
  ["feasibility", "Feasibility"],
  ["fit", "Strategic fit"],
  ["regulatory", "Regulatory manageability"],
  ["capital", "Capital efficiency"],
  ["evidence", "Evidence quality"],
] as const;
export const qualificationGates = [
  "identity",
  "classification",
  "quality",
  "traceability",
  "commercial",
  "pilot",
] as const;
const text = (max = 5000) => z.string().trim().max(max);
const required = (min = 2, max = 5000) => text(max).min(min);
const url = z
  .url()
  .refine(
    (value) => ["http:", "https:"].includes(new URL(value).protocol),
    "Use an HTTP(S) source URL.",
  );
const id = z.uuid();
const optionalId = id.nullable().optional();
const date = z.iso.date();

export const signalSchema = z.object({
  title: required(3, 220),
  summary: required(10),
  source_url: url,
  publisher: required(2, 200),
  published_on: date,
  industry: z.enum(industries),
  geography: required(2, 150),
  evidence_type: z.enum([
    "verified_fact",
    "third_party_claim",
    "ai_interpretation",
  ]),
  reliability: z.enum(["primary", "secondary", "unverified"]),
  reliability_notes: required(10),
  why_matters: required(10),
  siona_relevance: required(10),
  confidence: z.enum(["low", "medium", "high"]),
  source_id: optionalId,
});
export const opportunitySchema = z.object({
  title: required(3, 220),
  problem: required(10),
  affected: required(3),
  proposition: required(10),
  customers: required(3),
  partners: text(),
  revenue: text(),
  barriers: text(),
  assumptions: required(10),
  invalidation: required(10),
  signal_ids: z.array(id).min(1).max(30),
});
export const organizationSchema = z.object({
  legal_name: required(2, 220),
  kind: z.enum([
    "Research institution",
    "Manufacturer",
    "Procurement",
    "Healthcare organization",
    "Collaborator",
    "Strategic partner",
  ]),
  location: required(2, 200),
  website: z.union([url, z.literal("")]).optional(),
  notes: text(),
});
export const supplierSchema = z.object({
  organization_id: id,
  classification: z.enum(["Manufacturer", "Distributor", "Intermediary"]),
  manufacturing_locations: required(2),
  quality_documentation: text(),
  coa_available: z.boolean(),
  traceability: text(),
  moq_pricing: text(),
  lead_shipping: text(),
  verification: z.enum(["Unverified", "In progress", "Independently verified"]),
  outstanding: text(),
  next_action: required(3),
  owner_id: id,
  category_id: optionalId,
});
export const taskSchema = z.object({
  title: required(3, 220),
  details: text(),
  opportunity_id: optionalId,
  organization_id: optionalId,
  owner_id: id,
  due_on: date,
  kind: z.enum(["Validation", "Follow-up", "Documentation", "Research"]),
  success_criteria: required(5),
});
export const contactRecordSchema = z.object({
  organization_id: id,
  name: required(2, 180),
  role: text(200),
  email: z.union([z.email(), z.literal("")]),
  notes: text(),
});
export const decisionSchema = z.object({
  opportunity_id: id,
  stage: z.enum(opportunityStages),
  rationale: required(20),
  signal_ids: z.array(id).max(30),
  assumptions_changed: text(),
});
export const evaluationSchema = z.object({
  opportunity_id: id,
  scores: z
    .array(
      z.object({
        criterion: z.enum(criteria.map((c) => c[0])),
        score: z.number().int().min(0).max(5).nullable(),
        rationale: text().refine(
          (v) => v.length >= 10,
          "Explain the score or the missing information (10 characters minimum).",
        ),
      }),
    )
    .length(9)
    .refine(
      (rows) => new Set(rows.map((r) => r.criterion)).size === 9,
      "Every criterion must appear once.",
    ),
});
export const operationSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("signal"), data: signalSchema }),
  z.object({
    operation: z.literal("review_signal"),
    id,
    status: z.enum(["unreviewed", "reviewed", "dismissed"]),
    notes: required(10),
  }),
  z.object({ operation: z.literal("opportunity"), data: opportunitySchema }),
  z.object({ operation: z.literal("organization"), data: organizationSchema }),
  z.object({ operation: z.literal("contact"), data: contactRecordSchema }),
  z.object({ operation: z.literal("supplier"), data: supplierSchema }),
  z.object({
    operation: z.literal("update_supplier"),
    id,
    data: supplierSchema,
  }),
  z.object({
    operation: z.literal("source"),
    data: z.object({
      name: required(3, 200),
      url: z.url().refine((v) => v.startsWith("https://")),
      publisher: required(2, 200),
      adapter: z.enum(["manual", "federal-register"]),
      approved: z.boolean(),
    }),
  }),
  z.object({
    operation: z.literal("category"),
    data: z.object({ name: required(2, 200), intended_use: required(5) }),
  }),
  z.object({
    operation: z.literal("evidence"),
    data: z.object({
      opportunity_id: id,
      signal_id: id,
      interpretation: required(5),
    }),
  }),
  z.object({
    operation: z.literal("supplier_stage"),
    id,
    stage: z.enum(supplierStages),
    rationale: text(),
    gates: z.array(z.enum(qualificationGates)),
    human_reviewed: z.boolean(),
  }),
  z.object({
    operation: z.literal("verify_document"),
    id,
    notes: required(10),
  }),
  z.object({ operation: z.literal("task"), data: taskSchema }),
  z.object({
    operation: z.literal("task_status"),
    id,
    status: z.enum(["Open", "In progress", "Completed", "Cancelled"]),
    result: text(),
  }),
  z.object({ operation: z.literal("decision"), data: decisionSchema }),
  z.object({ operation: z.literal("evaluation"), data: evaluationSchema }),
  z
    .object({
      operation: z.literal("link"),
      opportunity_id: id,
      supplier_id: optionalId,
      organization_id: optionalId,
      rationale: required(5),
    })
    .refine(
      (v) => Number(!!v.supplier_id) + Number(!!v.organization_id) === 1,
      "Choose exactly one relationship.",
    ),
  z.object({
    operation: z.literal("note"),
    organization_id: id,
    opportunity_id: optionalId,
    body: required(5),
    next_action: text(),
    follow_up_on: date.nullable().optional(),
    owner_id: id,
  }),
  z.object({
    operation: z.literal("weights"),
    weights: z
      .array(
        z.object({
          criterion: z.enum(criteria.map((c) => c[0])),
          weight: z.number().min(0).max(100),
        }),
      )
      .length(9)
      .refine(
        (v) =>
          new Set(v.map((r) => r.criterion)).size === 9 &&
          v.some((r) => r.weight > 0),
        "Supply nine unique criteria and a positive total weight.",
      ),
  }),
  z.object({ operation: z.literal("ingest"), source_id: id }),
  z.object({ operation: z.literal("seed_demo") }),
  z.object({ operation: z.literal("clear_demo") }),
  z.object({ operation: z.literal("analyze"), opportunity_id: id }),
]);

export type Row = {
  id: string;
  created_at?: string;
  updated_at?: string;
  demo_batch_id?: string | null;
  [key: string]: unknown;
};
export type WorkspaceData = Record<string, Row[]> & {
  signals: Row[];
  opportunities: Row[];
  suppliers: Row[];
  organizations: Row[];
  tasks: Row[];
  evaluations: Row[];
  weights: Row[];
  decisions: Row[];
  evidence: Row[];
  links: Row[];
  documents: Row[];
  notes: Row[];
  activity: Row[];
  sources: Row[];
  members: Row[];
  contacts: Row[];
  categories: Row[];
};
export type Evaluation = {
  criterion: string;
  score: number | null;
  rationale?: string;
};

/** Unknown evidence contributes zero score and lowers confidence. No favorable imputation. */
export function scoreOpportunity(
  evaluations: Evaluation[],
  weights: { criterion: string; weight: number }[],
) {
  const total = weights.reduce(
    (sum, item) => sum + Math.max(0, Number(item.weight)),
    0,
  );
  if (!total) return { score: 0, confidence: 0, coverage: 0 };
  let earned = 0,
    known = 0;
  for (const weight of weights) {
    const entry = evaluations.find((row) => row.criterion === weight.criterion);
    if (
      entry?.score !== null &&
      entry?.score !== undefined &&
      entry.rationale &&
      entry.rationale.trim().length >= 10
    ) {
      const amount = Math.max(0, Number(weight.weight));
      earned += (Math.min(5, Math.max(0, entry.score)) / 5) * amount;
      known += amount;
    }
  }
  const evidence =
    evaluations.find((e) => e.criterion === "evidence")?.score ?? 0;
  return {
    score: Math.round((earned / total) * 100),
    coverage: Math.round((known / total) * 100),
    confidence: Math.round(
      (known / total) *
        (0.25 + (0.75 * Math.min(5, Math.max(0, evidence))) / 5) *
        100,
    ),
  };
}

export function textValue(row: Row | undefined, key: string): string {
  return row?.[key] == null ? "" : String(row[key]);
}
