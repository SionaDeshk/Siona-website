import { z } from "zod";
import type { Stage } from "@/lib/operations/model";
import type { Currency } from "@/lib/commerce/model";
export const practiceOperationSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("quote_decision"),
      quote_id: z.uuid(),
      quote_version: z.number().int().positive(),
      request_version: z.number().int().positive(),
      decision: z.enum(["Accept", "Decline"]),
      confirmed: z.boolean(),
      notes: z.string().trim().min(10).max(1000),
    })
    .strict()
    .refine((v) => v.decision !== "Accept" || v.confirmed, {
      message: "Confirm the quoted terms before accepting.",
      path: ["confirmed"],
    }),
  z
    .object({
      action: z.literal("submit"),
      practice_id: z.uuid(),
      offer_id: z.uuid(),
      submission_key: z.uuid(),
      quantity: z.number().int().min(1).max(100000),
      needed_on: z.iso.date(),
      reference: z.string().trim().max(80),
      message: z.string().trim().max(1000),
    })
    .strict(),
  z
    .object({
      action: z.literal("cancel"),
      request_id: z.uuid(),
      version: z.number().int().positive(),
      reason: z.string().trim().min(10).max(1000),
    })
    .strict(),
]);
export type PracticeOperation = z.infer<typeof practiceOperationSchema>;
export type PracticeLocation = {
  id: string;
  name: string;
  state: string;
  status: string;
  valid_until: string | null;
  role: "requester" | "viewer";
};
export type PracticeOffer = {
  id: string;
  title: string;
  summary: string;
  unit: string;
  valid_until: string;
};
export type PracticeRequest = {
  id: string;
  title: string;
  unit: string;
  quantity: number;
  needed_on: string;
  stage: Stage;
  version: number;
  reference: string;
  message: string;
  created_at: string;
  quote_required?: boolean;
  accepted_quote_id?: string | null;
  cancellable?: boolean;
};
export type PracticeUpdate = {
  id: string;
  request_id: string;
  body: string;
  kind: "status" | "message";
  created_at: string;
};
export type PracticeData = {
  practices: PracticeLocation[];
  practice_id: string;
  role: "requester" | "viewer";
  offers: PracticeOffer[];
  requests: PracticeRequest[];
  updates: PracticeUpdate[];
  truncated?: boolean;
  commerce_ready?: boolean;
  quotes?: PracticeQuote[];
  shipments?: PracticeShipment[];
  lots?: PracticeLot[];
  issues?: PracticeIssue[];
};
export type PracticeQuote = {
  id: string;
  request_id: string;
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
  status: string;
  version: number;
};
export type PracticeShipment = {
  id: string;
  request_id: string;
  quantity: number;
  carrier: string;
  tracking_reference: string;
  expected_on: string;
  status: string;
};
export type PracticeLot = {
  id: string;
  shipment_id: string;
  lot_code: string;
  expires_on: string;
  quantity: number;
};
export type PracticeIssue = {
  id: string;
  request_id: string;
  kind: string;
  practice_message: string;
  status: string;
};
export const stageLabel: Record<Stage, string> = {
  Draft: "Draft",
  Review: "Submitted",
  Ready: "Reviewed",
  Coordinating: "With partner",
  Completed: "Complete",
  Hold: "On hold",
  Cancelled: "Cancelled",
};
export function canCancel(request: PracticeRequest, role: string) {
  return (
    role === "requester" &&
    request.cancellable !== false &&
    ["Review", "Hold"].includes(request.stage)
  );
}
