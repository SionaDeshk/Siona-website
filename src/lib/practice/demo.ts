import { canCancel, type PracticeData, type PracticeOperation } from "./model";
const id = (n: number) =>
  `90000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
export function practiceDemo(): PracticeData[] {
  const future = new Date(Date.now() + 90 * 86400000)
    .toISOString()
    .slice(0, 10);
  const practices = [
    {
      id: id(1),
      name: "Example Practice · fictional",
      state: "NY",
      status: "Ready",
      valid_until: future,
      role: "requester" as const,
    },
    {
      id: id(2),
      name: "Example West · fictional",
      state: "CA",
      status: "Ready",
      valid_until: future,
      role: "viewer" as const,
    },
  ];
  const datasets = practices.map(
    (p, i): PracticeData => ({
      practices,
      practice_id: p.id,
      role: p.role,
      offers: [
        {
          id: id(10 + i),
          title: i
            ? "Example west supply kit · fictional"
            : "Example sample container · fictional",
          summary:
            "Fictional practice supply for exploring catalog requests. No actual stock, price, or commercial relationship is represented.",
          unit: "case of 100",
          valid_until: future,
        },
      ],
      requests: [
        {
          id: id(20 + i),
          title: i
            ? "Example west supply kit · fictional"
            : "Example sample container · fictional",
          unit: "case of 100",
          quantity: 2,
          needed_on: future,
          stage: i ? "Hold" : "Coordinating",
          version: 3,
          reference: "DEMO-REF",
          message: "Fictional business supply coordination.",
          created_at: new Date().toISOString(),
        },
      ],
      updates: [
        {
          id: id(30 + i),
          request_id: id(20 + i),
          body: i
            ? "Coordination is on hold."
            : "Coordination with the external partner is in progress.",
          kind: "status",
          created_at: new Date().toISOString(),
        },
      ],
    }),
  );
  const first = datasets[0];
  first.commerce_ready = true;
  first.requests[0] = {
    ...first.requests[0],
    quote_required: true,
    accepted_quote_id: id(51),
    cancellable: false,
  };
  first.requests.push({
    id: id(40),
    title: "Example supply quote · fictional",
    unit: "case of 100",
    quantity: 2,
    needed_on: future,
    stage: "Review",
    version: 2,
    reference: "DEMO-QUOTE",
    message: "Fictional request awaiting a commercial decision.",
    created_at: new Date().toISOString(),
    quote_required: true,
    accepted_quote_id: null,
    cancellable: true,
  });
  const terms = {
    quantity: 2,
    unit: "case of 100",
    currency: "USD" as const,
    unit_minor: 1250,
    shipping_minor: 500,
    tax_minor: 0,
    total_minor: 3000,
    lead_days: 3,
    valid_until: future,
    delivery_terms:
      "Fictional delivery terms for the business supply rehearsal.",
    practice_summary:
      "Fictional reviewed quote. No actual price or supplier offer is represented.",
  };
  first.quotes = [
    { ...terms, id: id(50), request_id: id(40), status: "Shared", version: 2 },
    {
      ...terms,
      id: id(51),
      request_id: id(20),
      status: "Accepted",
      version: 3,
    },
  ];
  first.shipments = [
    {
      id: id(60),
      request_id: id(20),
      quantity: 2,
      carrier: "Fictional carrier",
      tracking_reference: "DEMO-TRACK",
      expected_on: future,
      status: "Dispatched",
    },
  ];
  first.lots = [
    {
      id: id(61),
      shipment_id: id(60),
      lot_code: "DEMO-LOT",
      expires_on: future,
      quantity: 2,
    },
  ];
  first.issues = [];
  return datasets;
}
export function rehearsePractice(
  data: PracticeData,
  operation: PracticeOperation,
): { data: PracticeData; id: string } {
  if (data.role !== "requester")
    throw new Error("This account has view-only access.");
  const next = structuredClone(data),
    target = crypto.randomUUID();
  if (operation.action === "quote_decision") {
    const quote = next.quotes?.find((q) => q.id === operation.quote_id);
    const request = next.requests.find((r) => r.id === quote?.request_id);
    if (
      !quote ||
      !request ||
      quote.status !== "Shared" ||
      quote.version !== operation.quote_version ||
      request.version !== operation.request_version ||
      request.accepted_quote_id
    )
      throw new Error("Quote or request changed. Refresh before deciding.");
    if (operation.decision === "Accept" && !operation.confirmed)
      throw new Error("Confirm the quoted terms before accepting.");
    quote.status = operation.decision === "Accept" ? "Accepted" : "Declined";
    quote.version++;
    if (operation.decision === "Accept") {
      request.accepted_quote_id = quote.id;
      request.version++;
    }
    next.updates.unshift({
      id: target,
      request_id: request.id,
      body:
        operation.decision === "Accept"
          ? "Quoted terms accepted for coordination."
          : "The quoted terms were declined.",
      kind: "message",
      created_at: new Date().toISOString(),
    });
    return { data: next, id: request.id };
  }
  if (operation.action === "submit") {
    const offer = data.offers.find((o) => o.id === operation.offer_id);
    if (!offer || operation.practice_id !== data.practice_id)
      throw new Error("This offer is not available for your practice.");
    next.requests.unshift({
      id: target,
      title: offer.title,
      unit: offer.unit,
      quantity: operation.quantity,
      needed_on: operation.needed_on,
      stage: "Review",
      version: 1,
      reference: operation.reference,
      message: operation.message,
      created_at: new Date().toISOString(),
    });
    next.updates.unshift({
      id: crypto.randomUUID(),
      request_id: target,
      body: "Submitted for coordination review.",
      kind: "status",
      created_at: new Date().toISOString(),
    });
    return { data: next, id: target };
  }
  const request = next.requests.find((r) => r.id === operation.request_id);
  if (
    !request ||
    !canCancel(request, data.role) ||
    request.version !== operation.version
  )
    throw new Error("This request can no longer be cancelled here.");
  request.stage = "Cancelled";
  request.version++;
  next.updates.unshift({
    id: target,
    request_id: request.id,
    body: operation.reason,
    kind: "message",
    created_at: new Date().toISOString(),
  });
  return { data: next, id: request.id };
}
