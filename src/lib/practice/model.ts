import { z } from "zod";
import type { Stage } from "@/lib/operations/model";
export const practiceOperationSchema = z.discriminatedUnion("action", [
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
  return role === "requester" && ["Review", "Hold"].includes(request.stage);
}
