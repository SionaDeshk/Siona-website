import { demoData } from "@/lib/operations/demo";
import {
  quoteTotal,
  type CommerceData,
  type CommerceOperation,
  type CommerceRequest,
  type Quote,
} from "./model";
const id = (n: number) =>
  "a0000000-0000-4000-8000-" + String(n).padStart(12, "0");
const now = () => new Date().toISOString();
const future = () =>
  new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
export function commerceDemo() {
  const core = demoData(),
    r = core.requests[0],
    p = core.products[0],
    vendor = core.suppliers[0];
  const current: CommerceRequest = {
    id: r.id,
    product_id: r.product_id,
    practice_id: r.practice_id,
    portal_offer_id: null,
    stage: "Review",
    version: 2,
    quantity: r.quantity,
    state: r.state,
    channel: r.channel,
    quote_required: true,
    accepted_quote_id: null,
  };
  const history: CommerceRequest = {
    ...current,
    id: id(20),
    stage: "Completed",
    version: 6,
    quantity: 2,
    accepted_quote_id: id(22),
  };
  const terms = {
    supplier_id: vendor.id,
    product_revision: p.revision,
    unit: p.unit,
    supplier_reference: "DEMO-SUPPLIER-QUOTE",
    source_url: "https://example.com/demo-quote",
    currency: "USD" as const,
    unit_minor: 6250,
    shipping_minor: 1000,
    tax_minor: 0,
    lead_days: 3,
    valid_until: future(),
    delivery_terms: "Fictional delivery to the practice business location.",
    practice_summary:
      "Fictional quoted terms. No actual supplier offer or price is represented.",
    internal_notes: "Fictional internal source notes.",
    created_at: now(),
  };
  const data: CommerceData = {
    requests: [current, history],
    rfqs: [
      {
        id: id(1),
        request_id: r.id,
        supplier_id: vendor.id,
        product_revision: 1,
        quantity: r.quantity,
        unit: p.unit,
        reference: "DEMO-RFQ-01",
        due_on: future(),
        notes: "Fictional supplier contact record.",
        status: "Responded",
        created_at: now(),
      },
    ],
    quotes: [
      {
        ...terms,
        id: id(2),
        request_id: r.id,
        rfq_id: id(1),
        quantity: r.quantity,
        total_minor: quoteTotal(
          terms.unit_minor,
          r.quantity,
          terms.shipping_minor,
          0,
        ),
        status: "Draft",
        version: 1,
        shared_at: null,
      },
      {
        ...terms,
        id: id(22),
        request_id: history.id,
        rfq_id: id(21),
        quantity: 2,
        total_minor: 13500,
        status: "Accepted",
        version: 3,
        shared_at: now(),
      },
    ],
    shipments: [
      {
        id: id(25),
        request_id: history.id,
        quantity: 2,
        partner_reference: "DEMO-PARTNER",
        carrier: "Fictional carrier",
        tracking_reference: "DEMO-TRACK",
        expected_on: future(),
        status: "Delivered",
        version: 3,
        created_at: now(),
      },
    ],
    lots: [
      {
        id: id(26),
        shipment_id: id(25),
        supplier_id: vendor.id,
        lot_code: "DEMO-RECALL-LOT",
        expires_on: future(),
        quantity: 2,
      },
    ],
    shipment_events: [],
    issues: [],
    recalls: [],
  };
  return { core, data };
}
export function rehearseCommerce(
  source: CommerceData,
  op: CommerceOperation,
): CommerceData {
  const d = structuredClone(source),
    key = crypto.randomUUID(),
    date = now().slice(0, 10);
  const request = (id: string) => {
    const r = d.requests.find((r) => r.id === id);
    if (!r) throw new Error("Request unavailable.");
    return r;
  };
  const quote = (id: string) => {
    const q = d.quotes.find((q) => q.id === id);
    if (!q) throw new Error("Quote unavailable.");
    return q;
  };
  const ship = (id: string) => {
    const s = d.shipments.find((s) => s.id === id);
    if (!s) throw new Error("Shipment unavailable.");
    return s;
  };
  const hasIssues = (id: string) =>
    d.issues.some((i) => i.request_id === id && i.status === "Open");
  if (op.action === "rfq") {
    const r = request(op.request_id);
    if (r.version !== op.request_version)
      throw new Error("Refresh the request.");
    const old = d.rfqs.find((f) => f.request_id === r.id) || d.rfqs[0];
    d.rfqs.unshift({
      ...old,
      id: key,
      request_id: r.id,
      quantity: r.quantity,
      reference: op.reference,
      due_on: op.due_on,
      notes: op.notes,
      status: "Requested",
      created_at: now(),
    });
    r.version++;
    r.quote_required = true;
    if (r.stage === "Draft") r.stage = "Review";
  } else if (op.action === "quote") {
    const f = d.rfqs.find((f) => f.id === op.rfq_id);
    if (!f) throw new Error("Choose a quote request.");
    const q: Quote = {
      ...op,
      id: key,
      request_id: f.request_id,
      rfq_id: f.id,
      product_revision: f.product_revision,
      supplier_id: f.supplier_id,
      quantity: f.quantity,
      unit: f.unit,
      total_minor: quoteTotal(
        op.unit_minor,
        f.quantity,
        op.shipping_minor,
        op.tax_minor,
      ),
      status: "Draft",
      version: 1,
      shared_at: null,
      created_at: now(),
    };
    d.quotes.unshift(q);
    f.status = "Responded";
  } else if (op.action === "quote_status") {
    const q = quote(op.quote_id),
      r = request(q.request_id);
    if (q.version !== op.version) throw new Error("Refresh the quote.");
    if (op.status === "Shared" && q.valid_until < date)
      throw new Error("The quote has expired.");
    if (op.status === "Withdrawn" && q.status === "Accepted") {
      if (
        d.shipments.some(
          (s) => s.request_id === r.id && s.status !== "Cancelled",
        )
      )
        throw new Error("Record a follow-up after partner handoff instead.");
      r.accepted_quote_id = null;
      r.stage = "Hold";
      r.version++;
    }
    q.status = op.status;
    q.version++;
    if (op.status === "Shared") q.shared_at = now();
  } else if (op.action === "internal_accept") {
    const q = quote(op.quote_id),
      r = request(q.request_id);
    if (
      q.status !== "Shared" ||
      r.portal_offer_id ||
      r.accepted_quote_id ||
      q.version !== op.quote_version ||
      r.version !== op.request_version
    )
      throw new Error("This quote is not awaiting internal acceptance.");
    q.status = "Accepted";
    q.version++;
    r.accepted_quote_id = q.id;
    r.version++;
  } else if (
    op.action === "ready" ||
    op.action === "resume" ||
    op.action === "complete"
  ) {
    const r = request(op.request_id);
    if (!r.accepted_quote_id || hasIssues(r.id))
      throw new Error(
        "An accepted quote and resolved follow-ups are required.",
      );
    if (
      op.action === "complete" &&
      d.shipments
        .filter((s) => s.request_id === r.id && s.status === "Delivered")
        .reduce((n, s) => n + s.quantity, 0) !== r.quantity
    )
      throw new Error("All units need recorded delivery before completion.");
    r.stage =
      op.action === "ready"
        ? "Ready"
        : op.action === "resume"
          ? "Coordinating"
          : "Completed";
    r.version++;
  } else if (op.action === "handoff") {
    const r = request(op.request_id);
    if (!r.accepted_quote_id || !["Ready", "Coordinating"].includes(r.stage))
      throw new Error("Mark the accepted request Ready before handoff.");
    if (
      d.shipments
        .filter((s) => s.request_id === r.id && s.status !== "Cancelled")
        .reduce((n, s) => n + s.quantity, 0) +
        op.quantity >
      r.quantity
    )
      throw new Error("Handoff quantities exceed the request.");
    d.shipments.unshift({
      ...op,
      id: key,
      request_id: r.id,
      status: "Preparing",
      version: 1,
      created_at: now(),
    });
    r.stage = "Coordinating";
    r.version++;
  } else if (op.action === "lot") {
    const s = ship(op.shipment_id),
      r = request(s.request_id),
      q = quote(r.accepted_quote_id || "");
    if (
      d.lots
        .filter((l) => l.shipment_id === s.id)
        .reduce((n, l) => n + l.quantity, 0) +
        op.quantity >
      s.quantity
    )
      throw new Error("Lot quantities exceed the shipment.");
    d.lots.unshift({
      id: key,
      shipment_id: s.id,
      supplier_id: q.supplier_id,
      lot_code: op.lot_code,
      expires_on: op.expires_on,
      quantity: op.quantity,
    });
    s.version++;
  } else if (op.action === "shipment") {
    const s = ship(op.shipment_id),
      r = request(s.request_id),
      lots = d.lots.filter((l) => l.shipment_id === s.id);
    if (
      ["Dispatched", "Delivered"].includes(op.status) &&
      lots.reduce((n, l) => n + l.quantity, 0) !== s.quantity
    )
      throw new Error("Allocate every physical unit to a lot first.");
    if (
      op.status === "Dispatched" &&
      (hasIssues(r.id) ||
        lots.some((l) =>
          d.recalls.some(
            (c) => c.supplier_id === l.supplier_id && c.lot_code === l.lot_code,
          ),
        ))
    )
      throw new Error("Resolve follow-ups and use a cleared replacement lot.");
    s.status = op.status;
    s.version++;
    d.shipment_events.unshift({
      id: key,
      shipment_id: s.id,
      status: op.status,
      occurred_on: op.occurred_on,
      practice_message: op.practice_message,
      internal_notes: op.internal_notes,
      created_at: now(),
    });
    if (op.status === "Exception") {
      d.issues.unshift({
        id: crypto.randomUUID(),
        request_id: r.id,
        shipment_id: s.id,
        recall_id: null,
        kind: "Delivery exception",
        practice_message: op.practice_message,
        internal_details: op.internal_notes,
        status: "Open",
        resolution: "",
        version: 1,
        created_at: now(),
      });
      r.stage = "Hold";
      r.version++;
    }
  } else if (op.action === "resolve_issue") {
    const i = d.issues.find((i) => i.id === op.issue_id);
    if (!i) throw new Error("Follow-up unavailable.");
    i.status = "Resolved";
    i.resolution = op.resolution;
    i.version++;
  } else if (op.action === "recall") {
    d.recalls.unshift({
      ...op,
      id: key,
      status: "Open",
      resolution: "",
      version: 1,
      created_at: now(),
    });
    const affected = new Set(
      d.lots
        .filter(
          (l) => l.supplier_id === op.supplier_id && l.lot_code === op.lot_code,
        )
        .map((l) => ship(l.shipment_id).request_id),
    );
    for (const requestId of affected) {
      const r = request(requestId);
      d.issues.unshift({
        id: crypto.randomUUID(),
        request_id: requestId,
        shipment_id: null,
        recall_id: key,
        kind: "Recall",
        practice_message: op.practice_message,
        internal_details: op.reason,
        status: "Open",
        resolution: "",
        version: 1,
        created_at: now(),
      });
      if (["Ready", "Coordinating"].includes(r.stage)) {
        r.stage = "Hold";
        r.version++;
      }
    }
  } else if (op.action === "close_recall") {
    const c = d.recalls.find((c) => c.id === op.recall_id);
    if (!c) throw new Error("Recall case unavailable.");
    if (d.issues.some((i) => i.recall_id === c.id && i.status === "Open"))
      throw new Error("Resolve every affected request follow-up first.");
    c.status = "Closed";
    c.resolution = op.resolution;
    c.version++;
  }
  return d;
}
