import { z } from "zod";

export const states =
  "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(
    " ",
  );
export const channels = ["Clinician", "Consumer"] as const;
export const productKinds = [
  "Practice supplies",
  "Partner service",
  "Prescription medicine",
  "Research use only",
] as const;
export const requestStages = [
  "Draft",
  "Review",
  "Ready",
  "Coordinating",
  "Completed",
  "Hold",
  "Cancelled",
] as const;
export type Stage = (typeof requestStages)[number];
export const transitions: Record<Stage, Stage[]> = {
  Draft: ["Review", "Cancelled"],
  Review: ["Ready", "Hold", "Cancelled"],
  Ready: ["Coordinating", "Hold", "Cancelled"],
  Coordinating: ["Completed", "Hold", "Cancelled"],
  Hold: ["Review", "Cancelled"],
  Completed: [],
  Cancelled: [],
};
const text = (min = 0, max = 2000) => z.string().trim().min(min).max(max);
const url = z
  .url()
  .refine((s) => s.startsWith("https://"), "Use an HTTPS evidence URL.")
  .max(2000);
const state = z.enum(states as [string, ...string[]]);
const uuid = z.uuid();
const version = z.number().int().positive();
export const operationSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("practice_access"),
      id: uuid.optional(),
      version: version.optional(),
      practice_id: uuid,
      email: z.email().max(254),
      role: z.enum(["requester", "viewer"]),
      active: z.boolean(),
    })
    .strict(),
  z
    .object({
      action: z.literal("practice_offer"),
      product_id: uuid,
      product_revision: version,
      expected_revision: z.number().int().min(0),
      state,
      status: z.enum(["Published", "Paused"]),
      title: text(3, 180),
      summary: text(10, 1000),
      valid_until: z.iso.date(),
      review_notes: text(20),
    })
    .strict(),
  z
    .object({
      action: z.literal("practice_update"),
      request_id: uuid,
      body: text(3, 1000),
    })
    .strict(),
  z
    .object({
      action: z.literal("practice"),
      id: uuid.optional(),
      version: version.optional(),
      legal_name: text(2, 180),
      state,
      business_email: z.email().max(254),
      website: z.union([url, z.literal("")]),
      scope: text(10),
    })
    .strict(),
  z
    .object({
      action: z.literal("practice_review"),
      id: uuid,
      version,
      status: z.enum(["Ready", "Hold", "Onboarding"]),
      evidence_url: z.union([url, z.literal("")]),
      valid_until: z.union([z.iso.date(), z.literal("")]),
      notes: text(20),
    })
    .strict(),
  z
    .object({
      action: z.literal("product"),
      id: uuid.optional(),
      version: version.optional(),
      name: text(3, 180),
      sku: text(2, 80),
      supplier_id: uuid,
      kind: z.enum(productKinds),
      unit: text(2, 60),
      description: text(10),
    })
    .strict(),
  z
    .object({
      action: z.literal("eligibility"),
      product_id: uuid,
      product_revision: version,
      state,
      channel: z.enum(channels),
      status: z.enum(["Approved", "Hold"]),
      evidence_url: url,
      valid_until: z.iso.date(),
      notes: text(20),
    })
    .strict(),
  z
    .object({
      action: z.literal("request"),
      practice_id: uuid.nullable(),
      product_id: uuid,
      channel: z.enum(channels),
      state,
      quantity: z.number().int().min(1).max(100000),
      needed_on: z.iso.date(),
      notes: text(10),
    })
    .strict()
    .refine((v) => v.channel !== "Clinician" || !!v.practice_id, {
      message: "Choose a practice for a clinician request.",
      path: ["practice_id"],
    })
    .refine((v) => v.channel !== "Consumer" || !v.practice_id, {
      message: "Consumer requests do not use a practice.",
      path: ["practice_id"],
    }),
  z
    .object({
      action: z.literal("transition"),
      id: uuid,
      version,
      stage: z.enum(requestStages),
      notes: text(10),
      handoff_reference: text(0, 180),
      lot_reference: text(0, 180),
      lot_expires_on: z.union([z.iso.date(), z.literal("")]),
    })
    .strict(),
]);
export type Operation = z.infer<typeof operationSchema>;
export type Practice = {
  id: string;
  legal_name: string;
  state: string;
  business_email: string;
  website: string;
  scope: string;
  status: "Onboarding" | "Ready" | "Hold";
  evidence_url: string;
  valid_until: string | null;
  review_notes: string;
  revision: number;
};
export type Product = {
  id: string;
  name: string;
  sku: string;
  supplier_id: string;
  kind: (typeof productKinds)[number];
  unit: string;
  description: string;
  revision: number;
};
export type Eligibility = {
  id: string;
  product_id: string;
  product_revision: number;
  state: string;
  channel: (typeof channels)[number];
  status: "Approved" | "Hold";
  evidence_url: string;
  valid_until: string;
  notes: string;
};
export type CoordinationRequest = {
  id: string;
  practice_id: string | null;
  product_id: string;
  channel: (typeof channels)[number];
  state: string;
  quantity: number;
  needed_on: string;
  notes: string;
  stage: Stage;
  version: number;
  handoff_reference: string;
  lot_reference: string;
  lot_expires_on: string | null;
  created_at: string;
  portal_offer_id?: string | null;
  portal_reference?: string;
  portal_message?: string;
};
export type Supplier = {
  id: string;
  organization_id: string;
  stage: string;
  verification: string;
  demo_batch_id: string | null;
};
export type Event = {
  id: string;
  entity_id: string;
  entity_type: string;
  action: string;
  notes: string;
  actor_id: string;
  created_at: string;
  details?: Record<string, unknown>;
};
export type OperationsData = {
  practices: Practice[];
  products: Product[];
  eligibility: Eligibility[];
  requests: CoordinationRequest[];
  events: Event[];
  suppliers: Supplier[];
  organizations: { id: string; legal_name: string }[];
  truncated?: boolean;
  portal_ready: boolean;
  practice_access: {
    id: string;
    practice_id: string;
    email: string;
    role: "requester" | "viewer";
    active: boolean;
    revision: number;
  }[];
  practice_offers: {
    id: string;
    product_id: string;
    product_revision: number;
    state: string;
    status: "Published" | "Paused";
    title: string;
    summary: string;
    valid_until: string;
    review_notes: string;
    revision: number;
  }[];
  practice_updates: {
    id: string;
    request_id: string;
    body: string;
    created_at: string;
  }[];
};
export const emptyData: OperationsData = {
  practices: [],
  products: [],
  eligibility: [],
  requests: [],
  events: [],
  suppliers: [],
  organizations: [],
  portal_ready: false,
  practice_access: [],
  practice_offers: [],
  practice_updates: [],
};
export const today = () => new Date().toISOString().slice(0, 10);

/** Explain the same fail-closed checks enforced by the database at each handoff. */
export function readiness(
  request: CoordinationRequest,
  data: OperationsData,
  date = today(),
): string[] {
  const reasons: string[] = [];
  const product = data.products.find((p) => p.id === request.product_id);
  if (!product) return ["Product record is unavailable."];
  if (["Research use only", "Prescription medicine"].includes(product.kind))
    reasons.push(
      "This product needs a licensed partner workflow before coordination is enabled.",
    );
  const supplier = data.suppliers.find((s) => s.id === product.supplier_id);
  if (
    !supplier ||
    supplier.stage !== "Approved" ||
    supplier.verification !== "Independently verified" ||
    supplier.demo_batch_id
  )
    reasons.push(
      "Supplier needs current approval and independent verification in Evo.",
    );
  if (request.channel === "Clinician") {
    const practice = data.practices.find((p) => p.id === request.practice_id);
    if (
      !practice ||
      practice.status !== "Ready" ||
      !practice.valid_until ||
      practice.valid_until < date ||
      !practice.evidence_url
    )
      reasons.push("Practice onboarding needs a current administrator review.");
    if (practice && practice.state !== request.state)
      reasons.push("The request state must match the practice location.");
  }
  const approval = data.eligibility.find(
    (e) =>
      e.product_id === product.id &&
      e.state === request.state &&
      e.channel === request.channel,
  );
  if (
    !approval ||
    approval.status !== "Approved" ||
    approval.valid_until < date ||
    approval.product_revision !== product.revision
  )
    reasons.push(
      `Product needs a current ${request.state} / ${request.channel.toLowerCase()} eligibility review.`,
    );
  return reasons;
}
