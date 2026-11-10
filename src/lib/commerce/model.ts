import { z } from "zod";
export const currencies = ["USD", "CAD", "EUR", "GBP"] as const;
export type Currency = (typeof currencies)[number];
const id = z.uuid(),
  version = z.number().int().positive();
const text = (min = 0, max = 2000) => z.string().trim().min(min).max(max);
const money = z.number().int().min(0).max(999999999);
const url = z
  .url()
  .refine((s) => s.startsWith("https://"), "Use an HTTPS source URL.")
  .max(2000);
const date = z.iso.date();
export const commerceOperationSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("rfq"),
      request_id: id,
      request_version: version,
      reference: text(3, 180),
      due_on: date,
      notes: text(10),
    })
    .strict(),
  z
    .object({
      action: z.literal("quote"),
      rfq_id: id,
      supplier_reference: text(3, 180),
      source_url: url,
      currency: z.enum(currencies),
      unit_minor: money.min(1),
      shipping_minor: money,
      tax_minor: money,
      lead_days: z.number().int().min(0).max(365),
      valid_until: date,
      delivery_terms: text(10),
      practice_summary: text(10, 1000),
      internal_notes: text(),
    })
    .strict(),
  z
    .object({
      action: z.literal("quote_status"),
      quote_id: id,
      version,
      status: z.enum(["Shared", "Withdrawn"]),
      notes: text(20),
    })
    .strict(),
  z
    .object({
      action: z.literal("internal_accept"),
      quote_id: id,
      quote_version: version,
      request_version: version,
      confirmed: z.literal(true),
      notes: text(10),
    })
    .strict(),
  z
    .object({
      action: z.literal("handoff"),
      request_id: id,
      request_version: version,
      quantity: z.number().int().min(1).max(100000),
      partner_reference: text(3, 180),
      carrier: text(0, 100),
      tracking_reference: text(0, 180),
      expected_on: date,
      notes: text(10),
    })
    .strict(),
  z
    .object({
      action: z.literal("lot"),
      shipment_id: id,
      version,
      lot_code: text(2, 100),
      expires_on: date,
      quantity: z.number().int().min(1).max(100000),
    })
    .strict(),
  z
    .object({
      action: z.literal("shipment"),
      shipment_id: id,
      version,
      status: z.enum(["Dispatched", "Delivered", "Exception", "Cancelled"]),
      occurred_on: date,
      practice_message: text(10, 1000),
      internal_notes: text(),
    })
    .strict(),
  z
    .object({
      action: z.literal("resolve_issue"),
      issue_id: id,
      version,
      resolution: text(20),
      practice_message: text(10, 1000),
    })
    .strict(),
  z
    .object({
      action: z.literal("recall"),
      supplier_id: id,
      lot_code: text(2, 100),
      reference: text(3, 180),
      source_url: url,
      reason: text(20),
      practice_message: text(10, 1000),
    })
    .strict(),
  z
    .object({
      action: z.literal("close_recall"),
      recall_id: id,
      version,
      resolution: text(20),
    })
    .strict(),
  z
    .object({
      action: z.literal("resume"),
      request_id: id,
      request_version: version,
      notes: text(10),
    })
    .strict(),
  z
    .object({
      action: z.literal("ready"),
      request_id: id,
      request_version: version,
      notes: text(10),
    })
    .strict(),
  z
    .object({
      action: z.literal("complete"),
      request_id: id,
      request_version: version,
      notes: text(10),
    })
    .strict(),
]);
export type CommerceOperation = z.infer<typeof commerceOperationSchema>;
export type Rfq = {
  id: string;
  request_id: string;
  supplier_id: string;
  product_revision: number;
  quantity: number;
  unit: string;
  reference: string;
  due_on: string;
  notes: string;
  status: string;
  created_at: string;
};
export type Quote = {
  id: string;
  request_id: string;
  rfq_id: string;
  product_revision: number;
  supplier_id: string;
  supplier_reference: string;
  source_url: string;
  quantity: number;
  unit: string;
  currency: Currency;
  unit_minor: number;
  shipping_minor: number;
  tax_minor: number;
  total_minor: number;
  lead_days: number;
  valid_until: string;
  delivery_terms: string;
  practice_summary: string;
  internal_notes: string;
  status: "Draft" | "Shared" | "Accepted" | "Declined" | "Withdrawn";
  version: number;
  shared_at: string | null;
  created_at: string;
};
export type Shipment = {
  id: string;
  request_id: string;
  quantity: number;
  partner_reference: string;
  carrier: string;
  tracking_reference: string;
  expected_on: string;
  status: "Preparing" | "Dispatched" | "Delivered" | "Exception" | "Cancelled";
  version: number;
  created_at: string;
};
export type Lot = {
  id: string;
  shipment_id: string;
  supplier_id: string;
  lot_code: string;
  expires_on: string;
  quantity: number;
};
export type ShipmentEvent = {
  id: string;
  shipment_id: string;
  status: string;
  occurred_on: string;
  practice_message: string;
  internal_notes: string;
  created_at: string;
};
export type Issue = {
  id: string;
  request_id: string;
  shipment_id: string | null;
  recall_id: string | null;
  kind: "Delivery exception" | "Recall";
  practice_message: string;
  internal_details: string;
  status: "Open" | "Resolved";
  resolution: string;
  version: number;
  created_at: string;
};
export type Recall = {
  id: string;
  supplier_id: string;
  lot_code: string;
  reference: string;
  source_url: string;
  reason: string;
  practice_message: string;
  status: "Open" | "Closed";
  resolution: string;
  version: number;
  created_at: string;
};
export type CommerceRequest = {
  id: string;
  product_id: string;
  practice_id: string | null;
  portal_offer_id: string | null;
  stage: string;
  version: number;
  quantity: number;
  state: string;
  channel: string;
  quote_required: boolean;
  accepted_quote_id: string | null;
};
export type CommerceData = {
  rfqs: Rfq[];
  quotes: Quote[];
  shipments: Shipment[];
  lots: Lot[];
  shipment_events: ShipmentEvent[];
  issues: Issue[];
  recalls: Recall[];
  requests: CommerceRequest[];
  truncated?: boolean;
};
export function parseMinor(value: string): number {
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(value.trim()))
    throw new Error(
      "Enter a price with up to two decimal places. Enter 0 explicitly when a charge does not apply.",
    );
  const [whole, fraction = ""] = value.trim().split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
export function formatMoney(minor: number, currency: Currency) {
  if (!Number.isSafeInteger(minor)) throw new Error("Invalid monetary amount.");
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "code",
  }).format(minor / 100);
}
export function quoteTotal(
  unit: number,
  quantity: number,
  shipping: number,
  tax: number,
) {
  const total = unit * quantity + shipping + tax;
  if (
    ![unit, quantity, shipping, tax, total].every(Number.isSafeInteger) ||
    unit < 1 ||
    quantity < 1 ||
    shipping < 0 ||
    tax < 0
  )
    throw new Error(
      "Quote amounts must be nonnegative whole minor currency units.",
    );
  return total;
}
