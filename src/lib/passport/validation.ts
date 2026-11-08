import { z } from "zod";
const text = z.string().trim().min(1).max(200);
const optional = z
  .string()
  .trim()
  .max(200)
  .transform((v) => v || null);
const date = z.union([z.literal(""), z.iso.date()]).transform((v) => v || null);
const orderedDates = (value: {
  issued_on: string | null;
  expires_on: string | null;
}) =>
  !value.issued_on || !value.expires_on || value.issued_on <= value.expires_on;
export const schemas = {
  licenses: z
    .object({
      jurisdiction: text,
      license_type: text,
      license_number: optional,
      issued_on: date,
      expires_on: date,
      status: z.enum(["self_reported", "pending", "expired"]),
    })
    .refine(orderedDates, {
      message: "Expiry must be on or after issue date",
      path: ["expires_on"],
    }),
  ce_entries: z.object({
    title: text,
    provider: text,
    hours: z.coerce.number().positive().max(1000).multipleOf(0.01),
    completed_on: z.iso.date(),
    accreditation: optional,
  }),
  certifications: z
    .object({
      name: text,
      issuer: optional,
      issued_on: date,
      expires_on: date,
    })
    .refine(orderedDates, {
      message: "Expiry must be on or after issue date",
      path: ["expires_on"],
    }),
};
export const kindSchema = z.enum(["licenses", "ce_entries", "certifications"]);
export const idSchema = z.uuid();
export function ownsPath(userId: string, path: string) {
  return (
    path.startsWith(`${userId}/`) &&
    path.split("/").length === 2 &&
    !path.includes("..")
  );
}
export function validUpload(bytes: Uint8Array, type: string) {
  if (!bytes.length || bytes.length > 4194304) return false;
  if (type === "application/pdf")
    return Buffer.from(bytes.subarray(0, 5)).toString() === "%PDF-";
  if (type === "image/png")
    return Buffer.from(bytes.subarray(0, 8)).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );
  if (type === "image/jpeg")
    return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  return false;
}
export function ceTotal(
  entries: { hours: number | string; completed_on: string }[],
  from: string,
  to: string,
) {
  return (
    Math.round(
      entries
        .filter((e) => e.completed_on >= from && e.completed_on <= to)
        .reduce((sum, e) => sum + Number(e.hours), 0) * 100,
    ) / 100
  );
}
