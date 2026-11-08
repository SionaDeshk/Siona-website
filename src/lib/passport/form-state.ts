import type { ZodError } from "zod";
export type FormState = {
  key?: string;
  values?: Record<string, string>;
  fieldErrors?: Record<string, string>;
  error?: string;
  success?: boolean;
};
// Explicit allowlists: never reflect tokens, files, passwords, or ownership fields.
export function formValues(form: FormData, fields: readonly string[]) {
  return Object.fromEntries(
    fields.map((field) => [
      field,
      typeof form.get(field) === "string"
        ? String(form.get(field)).slice(0, 1000)
        : "",
    ]),
  );
}
export function validationErrors(error: ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const name = String(issue.path[0] || "");
    if (name && !fields[name]) fields[name] = issue.message;
  }
  return fields;
}
export const credentialFields = {
  licenses: [
    "jurisdiction",
    "license_type",
    "license_number",
    "issued_on",
    "expires_on",
    "status",
  ],
  ce_entries: ["title", "provider", "hours", "completed_on", "accreditation"],
  certifications: ["name", "issuer", "issued_on", "expires_on"],
} as const;
