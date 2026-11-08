import { z } from "zod";
import { ceTotal } from "./validation";
export type PlanningRow = Record<string, string | number | boolean | null>;
const title = z.string().trim().min(1).max(200);
export const goalSchema = z
  .object({
    title,
    target_hours: z.coerce.number().positive().max(10000).multipleOf(0.01),
    starts_on: z.iso.date(),
    ends_on: z.iso.date(),
  })
  .refine((value) => value.ends_on >= value.starts_on, {
    message: "End date must be on or after start date",
    path: ["ends_on"],
  });
export const renewalSchema = z.object({
  title,
  credential: z.string().refine((value) => {
    const parts = value.split(":");
    return (
      parts.length === 2 &&
      ["licenses", "certifications"].includes(parts[0]) &&
      z.uuid().safeParse(parts[1]).success
    );
  }, "Choose a license or certification"),
  notes: z
    .string()
    .trim()
    .max(1000)
    .transform((value) => value || null),
  due_on: z
    .union([z.literal(""), z.iso.date()])
    .transform((value) => value || null),
  estimated_fee: z
    .union([
      z.literal(""),
      z.coerce.number().nonnegative().max(1000000).multipleOf(0.01),
    ])
    .transform((value) => (value === "" ? null : value)),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Use a three-letter currency code, such as USD"),
});
export const planningFields = {
  ce_goals: ["title", "target_hours", "starts_on", "ends_on"],
  renewal_tasks: [
    "title",
    "credential",
    "notes",
    "due_on",
    "estimated_fee",
    "currency",
  ],
} as const;
export const planningKind = z.enum(["ce_goals", "renewal_tasks"]);
export function goalProgress(
  goal: PlanningRow,
  entries: { hours: string | number; completed_on: string }[],
  today: string,
) {
  const end = String(goal.ends_on) < today ? String(goal.ends_on) : today;
  const hours = ceTotal(entries, String(goal.starts_on), end);
  const target = Number(goal.target_hours);
  return {
    hours,
    target,
    remaining: Math.max(0, Math.round((target - hours) * 100) / 100),
    percent: target > 0 ? Math.min(100, Math.round((hours / target) * 100)) : 0,
  };
}
