import {
  emptyData,
  readiness,
  today,
  transitions,
  type Operation,
  type OperationsData,
  type Practice,
  type Product,
} from "./model";
const id = (n: number) =>
  `80000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const future = () =>
  new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
export function demoData(): OperationsData {
  return {
    ...emptyData,
    portal_ready: true,
    practice_access: [
      {
        id: id(21),
        practice_id: id(1),
        email: "preview@example.com",
        role: "requester",
        active: true,
        revision: 1,
      },
    ],
    practices: [
      {
        id: id(1),
        legal_name: "Example Practice · fictional",
        state: "NY",
        business_email: "operations@example.com",
        website: "https://example.com",
        scope:
          "Fictional practice for exploring business supply coordination. No clinical service is offered.",
        status: "Ready",
        evidence_url: "https://example.com/demo-credentials",
        valid_until: future(),
        review_notes: "Fictional administrator review for demonstration only.",
        revision: 1,
      },
      {
        id: id(2),
        legal_name: "Example West · fictional",
        state: "CA",
        business_email: "west@example.com",
        website: "https://example.com",
        scope: "Fictional practice with incomplete onboarding requirements.",
        status: "Onboarding",
        evidence_url: "",
        valid_until: null,
        review_notes: "",
        revision: 1,
      },
    ],
    products: [
      {
        id: id(3),
        name: "Example sample container · fictional",
        sku: "DEMO-SUPPLY-01",
        supplier_id: id(5),
        kind: "Practice supplies",
        unit: "case of 100",
        description:
          "Fictional general practice supply; not a medication. No actual availability or price is represented.",
        revision: 1,
      },
      {
        id: id(4),
        name: "Peptide program review · fictional",
        sku: "DEMO-REVIEW-02",
        supplier_id: id(5),
        kind: "Prescription medicine",
        unit: "review record",
        description:
          "Illustrates the review boundary for a future licensed partner workflow. Coordination is blocked.",
        revision: 1,
      },
    ],
    suppliers: [
      {
        id: id(5),
        organization_id: id(6),
        stage: "Approved",
        verification: "Independently verified",
        demo_batch_id: null,
      },
    ],
    organizations: [
      { id: id(6), legal_name: "Example Supply Partner · fictional" },
    ],
    eligibility: [
      {
        id: id(7),
        product_id: id(3),
        product_revision: 1,
        state: "NY",
        channel: "Clinician",
        status: "Approved",
        evidence_url: "https://example.com/demo-scope",
        valid_until: future(),
        notes: "Fictional product/channel review for demonstration only.",
      },
    ],
    requests: [
      {
        id: id(8),
        practice_id: id(1),
        product_id: id(3),
        channel: "Clinician",
        state: "NY",
        quantity: 4,
        needed_on: future(),
        notes:
          "Fictional practice-supply request. Explore the handoff and lot-recording workflow.",
        stage: "Review",
        version: 1,
        handoff_reference: "",
        lot_reference: "",
        lot_expires_on: null,
        created_at: new Date().toISOString(),
      },
      {
        id: id(9),
        practice_id: null,
        product_id: id(3),
        channel: "Consumer",
        state: "CA",
        quantity: 1,
        needed_on: future(),
        notes:
          "Fictional consumer-channel planning request. Separate eligibility review is missing.",
        stage: "Hold",
        version: 1,
        handoff_reference: "",
        lot_reference: "",
        lot_expires_on: null,
        created_at: new Date().toISOString(),
      },
    ],
    events: [
      {
        id: id(10),
        entity_id: id(8),
        entity_type: "request",
        action: "request",
        notes: "Fictional request created for this preview.",
        actor_id: id(11),
        created_at: new Date().toISOString(),
      },
    ],
  };
}

/** Development-only rehearsal. This never calls an API or persists business records. */
export function rehearse(data: OperationsData, op: Operation): OperationsData {
  const next = structuredClone(data);
  const newId = crypto.randomUUID();
  let entityId: string = newId;
  if (op.action === "practice_access") {
    const old = next.practice_access.find((m) => m.id === op.id);
    const row = {
      ...op,
      id: old?.id || newId,
      revision: (old?.revision || 0) + 1,
    };
    next.practice_access = [
      row,
      ...next.practice_access.filter((m) => m.id !== row.id),
    ];
    entityId = row.id;
  } else if (op.action === "practice_offer") {
    const product = next.products.find((p) => p.id === op.product_id);
    const eligible = next.eligibility.find(
      (e) =>
        e.product_id === product?.id &&
        e.product_revision === product.revision &&
        e.state === op.state &&
        e.channel === "Clinician" &&
        e.status === "Approved" &&
        e.valid_until >= today(),
    );
    if (
      op.status === "Published" &&
      (!eligible ||
        !product ||
        ["Prescription medicine", "Research use only"].includes(product.kind) ||
        op.valid_until < today())
    )
      throw new Error(
        "Current supplier approval and clinician eligibility are required before publication.",
      );
    const old = next.practice_offers.find(
      (o) => o.product_id === op.product_id && o.state === op.state,
    );
    const row = {
      ...op,
      id: old?.id || newId,
      revision: (old?.revision || 0) + 1,
    };
    next.practice_offers = [
      row,
      ...next.practice_offers.filter((o) => o.id !== row.id),
    ];
    entityId = row.id;
  } else if (op.action === "practice_update") {
    next.practice_updates.unshift({
      id: newId,
      request_id: op.request_id,
      body: op.body,
      created_at: new Date().toISOString(),
    });
    entityId = op.request_id;
  } else if (op.action === "practice") {
    const old = next.practices.find((p) => p.id === op.id);
    const row: Practice = {
      ...op,
      id: old?.id || newId,
      status: "Onboarding",
      evidence_url: "",
      valid_until: null,
      review_notes: "",
      revision: (old?.revision || 0) + 1,
    };
    next.practices = [row, ...next.practices.filter((p) => p.id !== row.id)];
    entityId = row.id;
  } else if (op.action === "practice_review") {
    if (op.status === "Ready" && (!op.evidence_url || op.valid_until < today()))
      throw new Error(
        "Current dated evidence is required for practice readiness.",
      );
    next.practices = next.practices.map((p) =>
      p.id === op.id
        ? {
            ...p,
            status: op.status,
            evidence_url: op.evidence_url,
            valid_until: op.valid_until || null,
            review_notes: op.notes,
            revision: p.revision + 1,
          }
        : p,
    );
    entityId = op.id;
  } else if (op.action === "product") {
    const old = next.products.find((p) => p.id === op.id);
    if (next.products.some((p) => p.sku === op.sku && p.id !== old?.id))
      throw new Error("That SKU already exists.");
    const row: Product = {
      ...op,
      id: old?.id || newId,
      revision: (old?.revision || 0) + 1,
    };
    next.products = [row, ...next.products.filter((p) => p.id !== row.id)];
    entityId = row.id;
  } else if (op.action === "eligibility") {
    const product = next.products.find((p) => p.id === op.product_id);
    if (
      op.status === "Approved" &&
      (op.valid_until < today() ||
        !product ||
        ["Prescription medicine", "Research use only"].includes(product.kind))
    )
      throw new Error(
        "Current evidence and an enabled product classification are required.",
      );
    const old = next.eligibility.find(
      (e) =>
        e.product_id === op.product_id &&
        e.channel === op.channel &&
        e.state === op.state,
    );
    next.eligibility = [
      { ...op, id: old?.id || newId },
      ...next.eligibility.filter((e) => e.id !== old?.id),
    ];
    entityId = old?.id || newId;
  } else if (op.action === "request") {
    next.requests.unshift({
      ...op,
      id: newId,
      stage: "Draft",
      version: 1,
      handoff_reference: "",
      lot_reference: "",
      lot_expires_on: null,
      created_at: new Date().toISOString(),
    });
  } else {
    const request = next.requests.find((r) => r.id === op.id);
    if (
      !request ||
      request.version !== op.version ||
      !transitions[request.stage].includes(op.stage)
    )
      throw new Error("Refresh the request before changing its stage.");
    if (["Ready", "Coordinating", "Completed"].includes(op.stage)) {
      const reasons = readiness(request, next);
      if (reasons.length) throw new Error(reasons.join(" "));
    }
    if (
      ["Coordinating", "Completed"].includes(op.stage) &&
      op.handoff_reference.length < 3
    )
      throw new Error("Record the external partner handoff reference.");
    if (
      op.stage === "Completed" &&
      next.products.find((p) => p.id === request.product_id)?.kind ===
        "Practice supplies" &&
      (op.lot_reference.length < 2 ||
        !op.lot_expires_on ||
        op.lot_expires_on < today())
    )
      throw new Error(
        "Record the supplied lot and a current expiry date before completion.",
      );
    Object.assign(request, {
      stage: op.stage,
      version: request.version + 1,
      handoff_reference: op.handoff_reference,
      lot_reference: op.lot_reference,
      lot_expires_on: op.lot_expires_on || null,
    });
    entityId = request.id;
  }
  next.events.unshift({
    id: crypto.randomUUID(),
    entity_id: entityId,
    entity_type: op.action,
    action: op.action,
    notes: "notes" in op ? op.notes : "Fictional preview record saved.",
    actor_id: id(11),
    created_at: new Date().toISOString(),
  });
  return next;
}
