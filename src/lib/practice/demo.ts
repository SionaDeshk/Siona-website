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
  return practices.map((p, i) => ({
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
  }));
}
export function rehearsePractice(
  data: PracticeData,
  operation: PracticeOperation,
): { data: PracticeData; id: string } {
  if (data.role !== "requester")
    throw new Error("This account has view-only access.");
  const next = structuredClone(data),
    target = crypto.randomUUID();
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
